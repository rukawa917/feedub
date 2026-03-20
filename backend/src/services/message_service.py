"""Message service for orchestrating message fetch operations.

This module coordinates between Telegram service, Message repository,
and MessageFetch repository to handle async message fetching.
"""

import logging
from typing import Any
from uuid import UUID

from sqlalchemy.exc import InterfaceError, OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import RateLimitError, SessionExpiredError
from src.repositories.message_fetch_repository import MessageFetchRepository
from src.repositories.message_repository import MessageRepository
from src.services.telegram_service import TelegramService

logger = logging.getLogger(__name__)


class MessageService:
    """Service for message operations and orchestration.

    Handles the complete message fetching workflow including:
    - Creating fetch operations
    - Fetching messages from Telegram
    - Storing messages in database
    - Updating fetch status
    """

    def __init__(
        self,
        telegram_service: TelegramService,
        message_repo: MessageRepository,
        fetch_repo: MessageFetchRepository,
    ):
        """Initialize service with dependencies.

        Args:
            telegram_service: Service for Telegram API operations.
            message_repo: Repository for message database operations.
            fetch_repo: Repository for fetch operation tracking.
        """
        self.telegram_service = telegram_service
        self.message_repo = message_repo
        self.fetch_repo = fetch_repo

    async def fetch_messages_async(
        self,
        user_id: UUID,
        session_string: str,
        fetch_id: UUID,
        limit_per_chat: int = 1000,
        batch_size: int = 500,
        channel_ids: list[int] | None = None,
    ) -> None:
        """Fetch messages from Telegram and store in database (async background task).

        This method should be run as a background task. It orchestrates:
        1. Update fetch status to "in_progress"
        2. Fetch messages from Telegram via telegram_service
        3. Progressively insert messages into database in batches with progress updates
        4. Update fetch status to "completed" or "failed"

        Args:
            user_id: UUID of the user.
            session_string: Telethon session string.
            fetch_id: UUID of the fetch operation to track progress.
            limit_per_chat: Maximum messages to fetch per chat.
            batch_size: Number of messages to insert per batch (default: 500).
            channel_ids: Optional list of channel IDs to fetch from.
                If None, fetches from all channels.

        Note:
            This method handles all errors internally and updates fetch status accordingly.
            Does not raise exceptions - errors are logged and stored in fetch record.
            Progress is updated after each batch insertion for user visibility.
        """
        try:
            # Update fetch status to in_progress
            await self.fetch_repo.update_fetch_status(
                fetch_id=fetch_id,
                status="in_progress",
            )
            logger.info(f"Started message fetch for user {user_id}, fetch_id={fetch_id}")

            # Get existing max message IDs per chat for continuation fetching
            # This allows us to only fetch NEW messages (messages with ID > max we have)
            min_message_ids = await self.message_repo.get_max_message_ids_by_chat(user_id)

            if min_message_ids:
                logger.info(
                    f"Continuing fetch for user {user_id}: "
                    f"{len(min_message_ids)} chats with existing messages"
                )

            # Track channel progress
            completed_channels = 0

            # Progress callback for channel-level tracking
            async def on_channel_complete(
                channel_id: int, channel_title: str, completed_count: int
            ) -> None:
                nonlocal completed_channels
                completed_channels = completed_count
                await self.fetch_repo.update_channel_progress(
                    fetch_id=fetch_id,
                    completed_channels=completed_count,
                    current_channel_title=channel_title,
                )

            # Check if fetch was cancelled
            async def check_cancelled() -> bool:
                fetch = await self.fetch_repo.get_fetch_by_id(fetch_id, user_id)
                return fetch is not None and fetch.status == "cancelled"

            # Fetch messages from Telegram as async generator (streaming)
            message_generator = self.telegram_service.fetch_all_messages(
                session_string=session_string,
                limit_per_chat=limit_per_chat,
                min_message_ids=min_message_ids,
                channel_ids=channel_ids,
                progress_callback=on_channel_complete,
                check_cancelled=check_cancelled,
            )

            # Consume generator in streaming batches to limit memory usage
            total_inserted = 0
            total_fetched = 0
            buffer: list[dict[str, Any]] = []

            async for message_dict in message_generator:
                buffer.append(message_dict)
                total_fetched += 1

                # When buffer is full, flush to database
                if len(buffer) >= batch_size:
                    batch_inserted = await self.message_repo.bulk_insert_messages_with_batches(
                        user_id=user_id,
                        messages=buffer,
                        batch_size=batch_size,
                        fetch_id=fetch_id,
                    )
                    total_inserted += batch_inserted
                    buffer.clear()

                    # Heartbeat: update progress after each batch insert
                    try:
                        await self.fetch_repo.update_fetch_status(
                            fetch_id=fetch_id,
                            status="in_progress",
                            messages_count=total_inserted,
                        )
                    except Exception as progress_error:
                        logger.warning(
                            f"Failed to update progress for fetch_id={fetch_id}: {str(progress_error)}"
                        )

            # Flush remaining messages in buffer
            if buffer:
                batch_inserted = await self.message_repo.bulk_insert_messages_with_batches(
                    user_id=user_id,
                    messages=buffer,
                    batch_size=batch_size,
                    fetch_id=fetch_id,
                )
                total_inserted += batch_inserted
                buffer.clear()

            # Check if cancelled after generator exhausted
            if await check_cancelled():
                logger.info(f"Fetch cancelled for user {user_id}, fetch_id={fetch_id}")
                return

            # Log deduplication metrics
            messages_count = total_inserted
            duplicates_skipped = total_fetched - messages_count
            if total_fetched > 0:
                dedup_percentage = duplicates_skipped / total_fetched * 100  # ty: ignore[division-by-zero]
            else:
                dedup_percentage = 0.0

            logger.info(f"Fetched {total_fetched} messages from Telegram for user {user_id}")
            if total_fetched > 0:
                logger.info(
                    f"Message insertion complete for user {user_id}: "
                    f"{messages_count} inserted, {duplicates_skipped} duplicates skipped "
                    f"({dedup_percentage:.1f}% deduplication rate)"
                )

            # Embeddings are computed by the scheduled clustering CLI job
            # (src/cli/clustering.py) to avoid loading PyTorch in web workers.
            # This saves ~300-500MB RAM per worker on the droplet.

            # Update fetch status to completed with phase=completed
            await self.fetch_repo.update_fetch_status(
                fetch_id=fetch_id,
                status="completed",
                messages_count=messages_count,
                current_phase="completed",
            )
            logger.info(f"Completed message fetch for user {user_id}, fetch_id={fetch_id}")

        except SessionExpiredError as e:
            # Session invalidated - user must re-authenticate
            logger.warning(f"Session expired for user {user_id}, fetch_id={fetch_id}: {str(e)}")
            await self._update_fetch_failed(
                fetch_id=fetch_id,
                error_message=str(e),
                error_type="session_expired",
            )

        except RateLimitError as e:
            # Rate limited by Telegram
            logger.warning(f"Rate limited for user {user_id}, fetch_id={fetch_id}: {str(e)}")
            await self._update_fetch_failed(
                fetch_id=fetch_id,
                error_message=str(e),
                error_type="rate_limited",
            )

        except (OperationalError, InterfaceError) as e:
            # Database connection error
            logger.error(
                f"Database connection error for user {user_id}, fetch_id={fetch_id}: {str(e)}",
                exc_info=True,
            )
            await self._update_fetch_failed(
                fetch_id=fetch_id,
                error_message="Database connection error. Please try again.",
                error_type="connection_error",
            )

        except Exception as e:
            # Unknown error
            logger.error(
                f"Failed to fetch messages for user {user_id}, fetch_id={fetch_id}: {str(e)}",
                exc_info=True,
            )
            await self._update_fetch_failed(
                fetch_id=fetch_id,
                error_message=str(e),
                error_type="unknown",
            )

    async def _update_fetch_failed(
        self,
        fetch_id: UUID,
        error_message: str,
        error_type: str,
    ) -> None:
        """Helper to update fetch status to failed with error details.

        CRITICAL: Uses a fresh database session to ensure the update succeeds
        even when the original session is in an invalid state (e.g., after
        connection errors like OperationalError or InterfaceError).

        Args:
            fetch_id: UUID of the fetch operation.
            error_message: Human-readable error message.
            error_type: Error category (session_expired, rate_limited, connection_error, unknown).
        """
        # Import here to avoid circular imports and ensure fresh session
        from src.core.database import get_async_session_maker
        from src.repositories.message_fetch_repository import MessageFetchRepository

        try:
            # Create a fresh, independent session - this is critical!
            # The original session (self.fetch_repo.session) may be broken
            session_maker = get_async_session_maker()
            async with session_maker() as fresh_session:
                try:
                    fresh_fetch_repo = MessageFetchRepository(fresh_session)
                    await fresh_fetch_repo.update_fetch_status(
                        fetch_id=fetch_id,
                        status="failed",
                        error_message=error_message,
                        error_type=error_type,
                    )
                    await fresh_session.commit()
                    logger.info(
                        f"Successfully updated fetch status to failed for "
                        f"fetch_id={fetch_id}, error_type={error_type}"
                    )
                except Exception:
                    await fresh_session.rollback()
                    raise
        except Exception as update_error:
            # Last resort: log critical error - manual intervention may be needed
            logger.critical(
                f"CRITICAL: Failed to update fetch status to failed for "
                f"fetch_id={fetch_id}. Error: {str(update_error)}. "
                f"Manual database intervention required to fix stuck fetch.",
                exc_info=True,
            )


async def create_message_service(session: AsyncSession) -> MessageService:
    """Factory function to create MessageService with dependencies.

    Args:
        session: SQLAlchemy async session for database operations.

    Returns:
        Configured MessageService instance.
    """
    telegram_service = TelegramService()
    message_repo = MessageRepository(session)
    fetch_repo = MessageFetchRepository(session)

    return MessageService(
        telegram_service=telegram_service,
        message_repo=message_repo,
        fetch_repo=fetch_repo,
    )
