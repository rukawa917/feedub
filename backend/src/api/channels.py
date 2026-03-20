"""Channel management API endpoints.

This module implements endpoints for:
- Fetching available channels from Telegram
- Managing user's channel selections for message fetching
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.exceptions import AuthenticationError, RateLimitError, SessionExpiredError
from src.models.user import User
from src.repositories.channel_favorite_repository import ChannelFavoriteRepository
from src.repositories.channel_selection_repository import ChannelSelectionRepository
from src.schemas.channel import (
    AddChannelFavoriteRequest,
    AvailableChannelResponse,
    AvailableChannelsResponse,
    ChannelFavoriteResponse,
    ChannelFavoritesResponse,
    ChannelSelectionResponse,
    ChannelSelectionsResponse,
    ToggleFavoriteResponse,
    UpdateChannelSelectionsRequest,
)
from src.services.telegram_service import TelegramService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/channels", tags=["Channels"])


def get_telegram_service() -> TelegramService:
    """Dependency injection for TelegramService."""
    return TelegramService()


def get_channel_selection_repository(
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> ChannelSelectionRepository:
    """Dependency injection for ChannelSelectionRepository."""
    return ChannelSelectionRepository(session)


def get_channel_favorite_repository(
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> ChannelFavoriteRepository:
    """Dependency injection for ChannelFavoriteRepository."""
    return ChannelFavoriteRepository(session)


@router.get(
    "/available",
    response_model=AvailableChannelsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get available channels",
    description="Fetch list of all channels/chats from user's Telegram account",
)
async def get_available_channels(
    current_user: User = Depends(get_current_user),  # noqa: B008
    telegram_service: TelegramService = Depends(get_telegram_service),  # noqa: B008
) -> AvailableChannelsResponse:
    """Get all available channels from user's Telegram account.

    This fetches fresh data from Telegram (not cached) and returns
    channel metadata including member count and last message date.

    Args:
        current_user: Authenticated user from token.
        telegram_service: Telegram service instance.

    Returns:
        List of available channels with metadata.

    Raises:
        HTTPException: If session expired or Telegram API error.
    """
    if not current_user.session_string:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active Telegram session. Please log in again.",
        )

    try:
        # Fetch channels from Telegram
        session_string = current_user.session_string
        channels_data = await telegram_service.get_available_channels(session_string)

        # Convert to response format
        channels = [
            AvailableChannelResponse(
                channel_id=ch["channel_id"],
                title=ch["title"],
                type=ch["type"],
                member_count=ch["member_count"],
                last_message_date=ch["last_message_date"],
            )
            for ch in channels_data
        ]

        return AvailableChannelsResponse(
            channels=channels,
            total=len(channels),
        )

    except SessionExpiredError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e

    except RateLimitError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        ) from e

    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.exception(f"Error fetching available channels: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch channels from Telegram",
        ) from e


@router.get(
    "/selections",
    response_model=ChannelSelectionsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get saved channel selections",
    description="Get user's saved channel selections for message fetching",
)
async def get_channel_selections(
    current_user: User = Depends(get_current_user),  # noqa: B008
    repo: ChannelSelectionRepository = Depends(get_channel_selection_repository),  # noqa: B008
) -> ChannelSelectionsResponse:
    """Get user's saved channel selections.

    Returns the list of channels the user has selected for message synchronization.

    Args:
        current_user: Authenticated user from token.
        repo: Channel selection repository.

    Returns:
        List of saved channel selections.
    """
    selections = await repo.get_selections_for_user(current_user.id)

    return ChannelSelectionsResponse(
        selections=[
            ChannelSelectionResponse(
                id=s.id,
                channel_id=s.channel_id,
                channel_title=s.channel_title,
                channel_type=s.channel_type,
                selected_at=s.selected_at,
            )
            for s in selections
        ],
        total=len(selections),
    )


@router.put(
    "/selections",
    response_model=ChannelSelectionsResponse,
    status_code=status.HTTP_200_OK,
    summary="Update channel selections",
    description="Replace all user's channel selections with new list",
)
async def update_channel_selections(
    request: UpdateChannelSelectionsRequest,
    current_user: User = Depends(get_current_user),  # noqa: B008
    repo: ChannelSelectionRepository = Depends(get_channel_selection_repository),  # noqa: B008
) -> ChannelSelectionsResponse:
    """Update user's channel selections.

    This replaces all existing selections with the new list.
    To add/remove individual channels, use the full list approach.

    Args:
        request: New channel selections.
        current_user: Authenticated user from token.
        repo: Channel selection repository.

    Returns:
        Updated list of channel selections.
    """
    # Convert request to channel dicts
    channels = [
        {
            "channel_id": ch.channel_id,
            "channel_title": ch.channel_title,
            "channel_type": ch.channel_type,
        }
        for ch in request.channels
    ]

    # Bulk replace selections
    new_selections = await repo.bulk_replace_selections(current_user.id, channels)

    return ChannelSelectionsResponse(
        selections=[
            ChannelSelectionResponse(
                id=s.id,
                channel_id=s.channel_id,
                channel_title=s.channel_title,
                channel_type=s.channel_type,
                selected_at=s.selected_at,
            )
            for s in new_selections
        ],
        total=len(new_selections),
    )


# =============================================================================
# Channel Favorites endpoints
# =============================================================================


@router.get(
    "/favorites",
    response_model=ChannelFavoritesResponse,
    status_code=status.HTTP_200_OK,
    summary="Get favorite channels",
    description="Get user's favorite channels (persisted across sessions)",
)
async def get_channel_favorites(
    current_user: User = Depends(get_current_user),  # noqa: B008
    repo: ChannelFavoriteRepository = Depends(get_channel_favorite_repository),  # noqa: B008
) -> ChannelFavoritesResponse:
    """Get user's favorite channels.

    Returns the list of channels the user has marked as favorites.

    Args:
        current_user: Authenticated user from token.
        repo: Channel favorite repository.

    Returns:
        List of favorite channels.
    """
    favorites = await repo.get_favorites_for_user(current_user.id)

    return ChannelFavoritesResponse(
        favorites=[
            ChannelFavoriteResponse(
                id=f.id,
                channel_id=f.channel_id,
                channel_title=f.channel_title,
                channel_type=f.channel_type,
                favorited_at=f.favorited_at,
            )
            for f in favorites
        ],
        total=len(favorites),
    )


@router.post(
    "/favorites",
    response_model=ChannelFavoriteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add channel to favorites",
    description="Add a channel to user's favorites",
)
async def add_channel_favorite(
    request: AddChannelFavoriteRequest,
    current_user: User = Depends(get_current_user),  # noqa: B008
    repo: ChannelFavoriteRepository = Depends(get_channel_favorite_repository),  # noqa: B008
) -> ChannelFavoriteResponse:
    """Add a channel to user's favorites.

    Args:
        request: Channel to add to favorites.
        current_user: Authenticated user from token.
        repo: Channel favorite repository.

    Returns:
        Created favorite record.

    Raises:
        HTTPException: If channel is already a favorite.
    """
    # Check if already favorited
    is_fav = await repo.is_favorite(current_user.id, request.channel_id)
    if is_fav:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Channel is already in favorites",
        )

    favorite = await repo.add_favorite(
        user_id=current_user.id,
        channel_id=request.channel_id,
        channel_title=request.channel_title,
        channel_type=request.channel_type,
    )

    return ChannelFavoriteResponse(
        id=favorite.id,
        channel_id=favorite.channel_id,
        channel_title=favorite.channel_title,
        channel_type=favorite.channel_type,
        favorited_at=favorite.favorited_at,
    )


@router.delete(
    "/favorites/{channel_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove channel from favorites",
    description="Remove a channel from user's favorites",
)
async def remove_channel_favorite(
    channel_id: int,
    current_user: User = Depends(get_current_user),  # noqa: B008
    repo: ChannelFavoriteRepository = Depends(get_channel_favorite_repository),  # noqa: B008
) -> None:
    """Remove a channel from user's favorites.

    Args:
        channel_id: Telegram channel ID to remove.
        current_user: Authenticated user from token.
        repo: Channel favorite repository.

    Raises:
        HTTPException: If channel is not in favorites.
    """
    removed = await repo.remove_favorite(current_user.id, channel_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found in favorites",
        )


@router.post(
    "/favorites/{channel_id}/toggle",
    response_model=ToggleFavoriteResponse,
    status_code=status.HTTP_200_OK,
    summary="Toggle channel favorite status",
    description="Toggle a channel's favorite status (add if not favorite, remove if favorite)",
)
async def toggle_channel_favorite(
    channel_id: int,
    request: AddChannelFavoriteRequest | None = None,
    current_user: User = Depends(get_current_user),  # noqa: B008
    repo: ChannelFavoriteRepository = Depends(get_channel_favorite_repository),  # noqa: B008
) -> ToggleFavoriteResponse:
    """Toggle a channel's favorite status.

    If the channel is already a favorite, it will be removed.
    If not, it will be added (using provided metadata).

    Args:
        channel_id: Telegram channel ID to toggle.
        request: Optional channel metadata for adding.
        current_user: Authenticated user from token.
        repo: Channel favorite repository.

    Returns:
        Toggle result with is_favorite flag and optional favorite record.
    """
    is_now_fav, favorite = await repo.toggle_favorite(
        user_id=current_user.id,
        channel_id=channel_id,
        channel_title=request.channel_title if request else None,
        channel_type=request.channel_type if request else None,
    )

    return ToggleFavoriteResponse(
        is_favorite=is_now_fav,
        favorite=ChannelFavoriteResponse(
            id=favorite.id,
            channel_id=favorite.channel_id,
            channel_title=favorite.channel_title,
            channel_type=favorite.channel_type,
            favorited_at=favorite.favorited_at,
        )
        if favorite
        else None,
    )
