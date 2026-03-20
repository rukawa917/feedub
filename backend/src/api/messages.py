"""Messages API endpoints for message operations.

This module provides endpoints for:
- Triggering message fetch operations
- Checking fetch operation status
- Retrieving individual messages
- Listing messages with pagination
"""

import logging
from typing import Annotated, Literal, cast
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    Response,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.exceptions import RateLimitError, SessionExpiredError
from src.models.user import User
from src.repositories.channel_selection_repository import ChannelSelectionRepository
from src.repositories.message_fetch_repository import MessageFetchRepository
from src.repositories.message_repository import MessageRepository
from src.schemas.channel import FetchRequest
from src.schemas.message import (
    ChatFilterParams,
    ChatsResponse,
    FetchStartedResponse,
    FetchStatusResponse,
    MessageFilterParams,
    MessageIdsResponse,
    MessageResponse,
    MessagesResponse,
)
from src.services.message_service import create_message_service
from src.services.telegram_service import TelegramService

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/messages", tags=["Messages"])


async def _background_fetch_with_new_session(
    user_id: UUID,
    session_string: str,
    fetch_id: UUID,
    channel_ids: list[int] | None = None,
) -> None:
    """Wrapper to run fetch with a fresh database session.

    This ensures the background task has its own session that won't be
    affected by the API endpoint's session lifecycle.
    """
    from src.core.database import get_async_session_maker

    logger.info(
        f"[BACKGROUND] Starting background fetch - user_id={user_id}, fetch_id={fetch_id}, "
        f"channels={len(channel_ids) if channel_ids else 'all'}"
    )

    session_maker = get_async_session_maker()
    try:
        async with session_maker() as new_session:
            message_service = await create_message_service(new_session)
            await message_service.fetch_messages_async(
                user_id=user_id,
                session_string=session_string,
                fetch_id=fetch_id,
                channel_ids=channel_ids,
            )

        logger.info(
            f"[BACKGROUND] Background fetch completed successfully - "
            f"user_id={user_id}, fetch_id={fetch_id}"
        )

    except Exception as e:
        logger.error(
            f"[BACKGROUND] Background fetch failed - "
            f"user_id={user_id}, fetch_id={fetch_id}, error={str(e)}",
            exc_info=True,
        )


@router.post(
    "/fetch",
    response_model=FetchStartedResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger message fetch operation",
    description="Start fetching messages from the user's Telegram account (async operation)",
)
async def trigger_message_fetch(
    request: Request,
    background_tasks: BackgroundTasks,
    fetch_request: FetchRequest | None = None,
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> FetchStartedResponse:
    """Trigger async message fetch operation.

    Creates a fetch operation record and starts background task to:
    1. Fetch messages from Telegram (from selected channels only)
    2. Store messages in database
    3. Update fetch status

    Args:
        fetch_request: Optional request body with channel_ids to fetch.
            If not provided or channel_ids is None, fetches from user's saved selections.

    Returns:
        FetchStartedResponse with fetch_id to poll for status.

    Raises:
        HTTPException 409: If fetch operation already in progress.
        HTTPException 500: If failed to create fetch operation.
    """
    logger.info(
        f"[MESSAGES] POST /messages/fetch - "
        f"user_id={current_user.id}, telegram_user_id={current_user.telegram_user_id}"
    )

    fetch_repo = MessageFetchRepository(session)
    active_fetch = await fetch_repo.get_active_fetch(user_id=current_user.id, for_update=True)

    if active_fetch:
        logger.warning(
            f"[MESSAGES] Fetch already in progress - "
            f"user_id={current_user.id}, active_fetch_id={active_fetch.id}, "
            f"status={active_fetch.status}"
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Fetch operation already in progress (fetch_id: {active_fetch.id})",
        )

    # Determine which channels to fetch
    channel_ids = None
    if fetch_request and fetch_request.channel_ids:
        channel_ids = fetch_request.channel_ids
    else:
        # Use user's saved channel selections
        selection_repo = ChannelSelectionRepository(session)
        channel_ids = await selection_repo.get_selected_channel_ids(current_user.id)
        if not channel_ids:
            channel_ids = None  # Fetch all if no selections saved

    # Create new fetch operation with channel info
    fetch = await fetch_repo.create_fetch(
        user_id=current_user.id,
        status="pending",
        channel_ids=channel_ids,
        total_channels=len(channel_ids) if channel_ids else None,
    )

    logger.info(
        f"[MESSAGES] Created fetch operation - user_id={current_user.id}, fetch_id={fetch.id}, "
        f"channels={len(channel_ids) if channel_ids else 'all'}"
    )

    # Start background task with NEW independent session
    # This prevents session rollback issues from affecting status updates
    background_tasks.add_task(
        _background_fetch_with_new_session,
        user_id=current_user.id,
        session_string=current_user.session_string or "",
        fetch_id=fetch.id,
        channel_ids=channel_ids,
    )

    logger.info(
        f"[MESSAGES] Started background fetch task - user_id={current_user.id}, fetch_id={fetch.id}"
    )

    return FetchStartedResponse(
        fetch_id=fetch.id,
        status="pending",
        message="Message fetch started. Use fetch_id to check progress.",
    )


@router.get(
    "/fetch/active",
    response_model=FetchStatusResponse | None,
    summary="Get active fetch operation",
    description="Get the currently active (pending or in_progress) fetch operation for the user",
)
async def get_active_fetch(
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> FetchStatusResponse | None:
    """Get the currently active fetch operation for the user.

    Returns:
        FetchStatusResponse if an active fetch exists, None otherwise.
    """
    logger.info(f"[MESSAGES] GET /messages/fetch/active - user_id={current_user.id}")

    fetch_repo = MessageFetchRepository(session)
    fetch = await fetch_repo.get_active_fetch(user_id=current_user.id)

    if not fetch:
        logger.info(f"[MESSAGES] No active fetch found - user_id={current_user.id}")
        return None

    logger.info(
        f"[MESSAGES] Active fetch found - "
        f"user_id={current_user.id}, fetch_id={fetch.id}, "
        f"status={fetch.status}, messages_count={fetch.messages_count}"
    )

    return FetchStatusResponse(
        fetch_id=fetch.id,
        status=cast(Literal["pending", "in_progress", "completed", "failed"], fetch.status),
        current_phase=cast(
            Literal["fetching_messages", "completed"],
            fetch.current_phase,
        ),
        messages_count=fetch.messages_count,
        started_at=fetch.started_at,
        completed_at=fetch.completed_at,
        error_message=fetch.error_message,
        error_type=cast(
            Literal["session_expired", "rate_limited", "connection_error", "unknown"] | None,
            fetch.error_type,
        ),
    )


@router.get(
    "/fetch/{fetch_id}",
    response_model=FetchStatusResponse,
    summary="Get fetch operation status",
    description="Check the status of a message fetch operation",
)
async def get_fetch_status(
    fetch_id: UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> FetchStatusResponse:
    """Get status of a message fetch operation.

    Args:
        fetch_id: UUID of the fetch operation.

    Returns:
        FetchStatusResponse with current status and progress.

    Raises:
        HTTPException 404: If fetch operation not found.
    """
    logger.info(
        f"[MESSAGES] GET /messages/fetch/{fetch_id} - "
        f"user_id={current_user.id}, fetch_id={fetch_id}"
    )

    fetch_repo = MessageFetchRepository(session)
    fetch = await fetch_repo.get_fetch_by_id(
        fetch_id=fetch_id,
        user_id=current_user.id,
    )

    if not fetch:
        logger.warning(
            f"[MESSAGES] Fetch operation not found - user_id={current_user.id}, fetch_id={fetch_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fetch operation not found",
        )

    logger.info(
        f"[MESSAGES] Fetch status retrieved - "
        f"user_id={current_user.id}, fetch_id={fetch_id}, "
        f"status={fetch.status}, messages_count={fetch.messages_count}"
    )

    # Convert failed_channels to response format
    failed_channels_response = None
    if fetch.failed_channels:
        from src.schemas.message import FailedChannelInfo

        failed_channels_response = [
            FailedChannelInfo(
                channel_id=fc.get("channel_id", 0),
                title=fc.get("title"),
                error=fc.get("error", "Unknown error"),
            )
            for fc in fetch.failed_channels
        ]

    return FetchStatusResponse(
        fetch_id=fetch.id,
        status=cast(
            Literal["pending", "in_progress", "completed", "failed", "cancelled"], fetch.status
        ),
        current_phase=cast(
            Literal["fetching_messages", "completed"],
            fetch.current_phase,
        ),
        messages_count=fetch.messages_count,
        started_at=fetch.started_at,
        completed_at=fetch.completed_at,
        error_message=fetch.error_message,
        error_type=cast(
            Literal["session_expired", "rate_limited", "connection_error", "unknown"] | None,
            fetch.error_type,
        ),
        total_channels=fetch.total_channels,
        completed_channels=fetch.completed_channels,
        current_channel_title=fetch.current_channel_title,
        failed_channels=failed_channels_response,
        channel_ids=fetch.channel_ids,
    )


@router.post(
    "/fetch/{fetch_id}/cancel",
    response_model=FetchStatusResponse,
    summary="Cancel fetch operation",
    description="Cancel an in-progress message fetch operation and rollback",
)
async def cancel_fetch(
    fetch_id: UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> FetchStatusResponse:
    """Cancel an in-progress fetch operation.

    Sets the fetch status to 'cancelled' and deletes any messages
    that were inserted during this fetch operation.

    Args:
        fetch_id: UUID of the fetch operation to cancel.

    Returns:
        FetchStatusResponse with cancelled status.

    Raises:
        HTTPException 404: If fetch operation not found.
        HTTPException 400: If fetch is not in cancellable state.
    """
    logger.info(
        f"[MESSAGES] POST /messages/fetch/{fetch_id}/cancel - "
        f"user_id={current_user.id}, fetch_id={fetch_id}"
    )

    fetch_repo = MessageFetchRepository(session)
    fetch = await fetch_repo.get_fetch_by_id(
        fetch_id=fetch_id,
        user_id=current_user.id,
    )

    if not fetch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fetch operation not found",
        )

    if fetch.status not in ["pending", "in_progress"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel fetch with status '{fetch.status}'",
        )

    # Mark as cancelled
    await fetch_repo.update_fetch_status(
        fetch_id=fetch_id,
        status="cancelled",
    )

    # Rollback: delete messages inserted during this fetch
    message_repo = MessageRepository(session)
    deleted_count = await message_repo.delete_messages_by_fetch_id(fetch_id)

    logger.info(
        f"[MESSAGES] Fetch cancelled and rolled back - "
        f"user_id={current_user.id}, fetch_id={fetch_id}, messages_deleted={deleted_count}"
    )

    # Refresh fetch to get updated status
    fetch = await fetch_repo.get_fetch_by_id(fetch_id, current_user.id)

    return FetchStatusResponse(
        fetch_id=fetch.id,  # type: ignore
        status="cancelled",
        messages_count=0,
        started_at=fetch.started_at,  # type: ignore
        completed_at=fetch.completed_at,  # type: ignore
        error_message=None,
        error_type=None,
        total_channels=fetch.total_channels,  # type: ignore
        completed_channels=fetch.completed_channels,  # type: ignore
        current_channel_title=None,
        failed_channels=None,
        channel_ids=fetch.channel_ids,  # type: ignore
    )


@router.get(
    "/chats",
    response_model=ChatsResponse,
    summary="Get user's chat list",
    description="Retrieve paginated list of distinct chats with message counts",
)
async def get_user_chats(
    params: ChatFilterParams = Depends(),  # noqa: B008
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> ChatsResponse:
    logger.info(
        f"[MESSAGES] GET /messages/chats - user_id={current_user.id}, "
        f"search={params.search!r}, limit={params.limit}, offset={params.offset}"
    )

    message_repo = MessageRepository(session)

    chats = await message_repo.get_chats(
        user_id=current_user.id,
        search=params.search,
        limit=params.limit,
        offset=params.offset,
    )

    total = await message_repo.count_chats(user_id=current_user.id, search=params.search)
    has_more = (params.offset + len(chats)) < total

    logger.info(
        f"[MESSAGES] Retrieved chats - user_id={current_user.id}, "
        f"chats_count={len(chats)}, total={total}"
    )

    from src.schemas.message import ChatResponse

    return ChatsResponse(
        chats=[
            ChatResponse(
                chat_id=chat["chat_id"],
                title=chat["title"],
                type=chat["type"],
                message_count=chat["message_count"],
            )
            for chat in chats
        ],
        total=total,
        limit=params.limit,
        offset=params.offset,
        has_more=has_more,
    )


@router.get(
    "",
    response_model=MessagesResponse,
    summary="List and search messages",
    description="Retrieve messages with optional filtering by search, chat, date range, type, and media",
)
async def list_messages(
    filters: Annotated[MessageFilterParams, Query()],
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> MessagesResponse:
    """List and search messages with filtering and pagination.

    Supports filtering by:
    - Full-text search on message content (PostgreSQL tsvector)
    - Chat IDs (one or more specific chats/channels)
    - Date range (start_date and/or end_date)
    - Message type (text, photo, video, etc.)
    - Media presence (has_media true/false)

    All filters can be combined for powerful search capabilities.

    Args:
        filters: Query parameters for filtering (validated by Pydantic).

    Returns:
        MessagesResponse with matching messages and pagination info.
    """
    logger.info(
        f"[MESSAGES] GET /messages - "
        f"user_id={current_user.id}, "
        f"search={filters.search!r}, chat_ids={filters.chat_ids}, "
        f"start_date={filters.start_date}, end_date={filters.end_date}, "
        f"message_type={filters.message_type}, has_media={filters.has_media}, "
        f"limit={filters.limit}, offset={filters.offset}"
    )

    message_repo = MessageRepository(session)

    messages = await message_repo.search_messages(
        user_id=current_user.id,
        search=filters.search,
        chat_ids=filters.chat_ids,
        start_date=filters.start_date,
        end_date=filters.end_date,
        message_type=filters.message_type,
        has_media=filters.has_media,
        limit=filters.limit,
        offset=filters.offset,
    )

    # Count total messages matching filters (for pagination)
    total = await message_repo.count_messages_with_filters(
        user_id=current_user.id,
        search=filters.search,
        chat_ids=filters.chat_ids,
        start_date=filters.start_date,
        end_date=filters.end_date,
        message_type=filters.message_type,
        has_media=filters.has_media,
    )

    # Check if more results are available
    has_more = (filters.offset + len(messages)) < total

    logger.info(
        f"[MESSAGES] Retrieved messages - "
        f"user_id={current_user.id}, "
        f"results_count={len(messages)}, total={total}, has_more={has_more}"
    )

    return MessagesResponse(
        messages=[MessageResponse.model_validate(msg) for msg in messages],
        total=total,
        limit=filters.limit,
        offset=filters.offset,
        has_more=has_more,
        search_history_clamped=None,
    )


@router.get(
    "/ids",
    response_model=MessageIdsResponse,
    summary="Get message IDs only",
    description="Retrieve only message IDs matching filters (lightweight endpoint for insights)",
)
async def get_message_ids(
    filters: Annotated[MessageFilterParams, Query()],
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> MessageIdsResponse:
    """Get only message IDs matching filters (lightweight query).

    Returns only UUIDs without full message data, making this efficient
    for passing to insights generation. Maximum 10000 IDs returned.

    Supports the same filters as /messages:
    - Full-text search on message content
    - Chat IDs (one or more specific chats/channels)
    - Date range (start_date and/or end_date)
    - Message type (text, photo, video, etc.)
    - Media presence (has_media true/false)

    Args:
        filters: Query parameters for filtering (same as /messages).

    Returns:
        MessageIdsResponse with list of UUIDs and total count.
    """
    logger.info(
        f"[MESSAGES] GET /messages/ids - "
        f"user_id={current_user.id}, "
        f"search={filters.search!r}, chat_ids={filters.chat_ids}, "
        f"start_date={filters.start_date}, end_date={filters.end_date}"
    )

    message_repo = MessageRepository(session)

    # Get message IDs (capped at 10000; actual limit enforced by insights service per provider)
    message_ids = await message_repo.get_message_ids_with_filters(
        user_id=current_user.id,
        search=filters.search,
        chat_ids=filters.chat_ids,
        start_date=filters.start_date,
        end_date=filters.end_date,
        message_type=filters.message_type,
        has_media=filters.has_media,
        limit=10000,
    )

    # Get total count for informational purposes
    total = await message_repo.count_messages_with_filters(
        user_id=current_user.id,
        search=filters.search,
        chat_ids=filters.chat_ids,
        start_date=filters.start_date,
        end_date=filters.end_date,
        message_type=filters.message_type,
        has_media=filters.has_media,
    )

    logger.info(
        f"[MESSAGES] Retrieved message IDs - "
        f"user_id={current_user.id}, "
        f"ids_count={len(message_ids)}, total={total}"
    )

    return MessageIdsResponse(ids=message_ids, total=total, search_history_clamped=None)


@router.get(
    "/{message_id}",
    response_model=MessageResponse,
    summary="Get single message",
    description="Retrieve a specific message by ID",
)
async def get_message(
    message_id: UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> MessageResponse:
    """Get a single message by ID.

    Args:
        message_id: UUID of the message.

    Returns:
        MessageResponse with message details.

    Raises:
        HTTPException 404: If message not found.
    """
    logger.info(
        f"[MESSAGES] GET /messages/{message_id} - "
        f"user_id={current_user.id}, message_id={message_id}"
    )

    message_repo = MessageRepository(session)
    message = await message_repo.get_message_by_id(
        message_id=message_id,
        user_id=current_user.id,
    )

    if not message:
        logger.warning(
            f"[MESSAGES] Message not found - user_id={current_user.id}, message_id={message_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    logger.info(
        f"[MESSAGES] Retrieved message - "
        f"user_id={current_user.id}, message_id={message_id}, "
        f"chat_id={message.chat_id}, has_media={message.has_media}"
    )

    return MessageResponse.model_validate(message)


@router.get(
    "/{message_id}/media",
    summary="Download message media",
    description="Download media content (photo, video, etc.) from a message",
    responses={
        200: {
            "content": {"image/*": {}, "video/*": {}, "audio/*": {}, "application/*": {}},
            "description": "Media file content",
        },
        404: {"description": "Message not found or message has no media"},
    },
)
async def download_message_media(
    message_id: UUID,
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> Response:
    """Download media content from a message.

    Fetches the actual media file (photo, video, document, etc.) from Telegram
    on-demand and returns it as a downloadable file. Media is not stored locally;
    it's downloaded fresh each time from Telegram.

    Args:
        message_id: UUID of the message containing media.

    Returns:
        Response with media content and appropriate Content-Type header.

    Raises:
        HTTPException 404: If message not found or message has no media.
        HTTPException 500: If media download fails.
    """
    logger.info(
        f"[MESSAGES] GET /messages/{message_id}/media - "
        f"user_id={current_user.id}, message_id={message_id}"
    )

    # Get message metadata from database
    message_repo = MessageRepository(session)
    message = await message_repo.get_message_by_id(
        message_id=message_id,
        user_id=current_user.id,
    )

    if not message:
        logger.warning(
            f"[MESSAGES] Message not found for media download - "
            f"user_id={current_user.id}, message_id={message_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    if not message.has_media:
        logger.warning(
            f"[MESSAGES] Message has no media - user_id={current_user.id}, message_id={message_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message has no media content",
        )

    if not current_user.session_string:
        logger.error(
            f"[MESSAGES] No session string for media download - "
            f"user_id={current_user.id}, message_id={message_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Telegram session not found. Please re-authenticate.",
        )

    logger.info(
        f"[MESSAGES] Downloading media from Telegram - "
        f"user_id={current_user.id}, message_id={message_id}, "
        f"chat_id={message.chat_id}, telegram_message_id={message.telegram_message_id}, "
        f"mime_type={message.file_mime_type}, file_size={message.file_size}"
    )

    # Download media from Telegram
    telegram_service = TelegramService()
    try:
        media_bytes = await telegram_service.download_media_for_message(
            session_string=current_user.session_string,
            chat_id=message.chat_id,
            telegram_message_id=message.telegram_message_id,
        )

        if not media_bytes:
            logger.warning(
                f"[MESSAGES] Media not available from Telegram - "
                f"user_id={current_user.id}, message_id={message_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media not found or no longer available",
            )

        # Determine Content-Type from stored metadata
        media_type = message.file_mime_type or "application/octet-stream"

        logger.info(
            f"[MESSAGES] Successfully downloaded media - "
            f"user_id={current_user.id}, message_id={message_id}, "
            f"size_bytes={len(media_bytes)}, mime_type={media_type}"
        )

        # Sanitize filename to prevent Content-Disposition header injection
        import re

        safe_name = re.sub(r'["\\\r\n]', "_", message.file_name or "media")

        # Return media with appropriate headers
        return Response(
            content=media_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'inline; filename="{safe_name}"',
                "Content-Length": str(len(media_bytes)),
            },
        )

    except HTTPException:
        # Re-raise HTTPExceptions without wrapping
        raise

    except SessionExpiredError as e:
        logger.warning(
            f"[MESSAGES] Telegram session expired during media download - "
            f"user_id={current_user.id}, message_id={message_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Telegram session expired. Please re-authenticate.",
        ) from e

    except RateLimitError as e:
        logger.warning(
            f"[MESSAGES] Rate limited during media download - "
            f"user_id={current_user.id}, message_id={message_id}, retry_after={e.retry_after}s"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(e.retry_after)} if e.retry_after else {},
        ) from e

    except Exception as e:
        logger.error(
            f"[MESSAGES] Failed to download media - "
            f"user_id={current_user.id}, message_id={message_id}, "
            f"error={str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Media download failed. Please try again later.",
        ) from e
