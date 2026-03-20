"""MessageFetch repository for database operations.

This module provides the data access layer for MessageFetch model operations.
"""

import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.retry import db_retry
from src.models.message_fetch import MessageFetch

logger = logging.getLogger(__name__)


class MessageFetchRepository:
    """Repository for MessageFetch database operations.

    Handles all database interactions for MessageFetch model following Repository pattern.
    """

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session.

        Args:
            session: SQLAlchemy async session for database operations.
        """
        self.session = session

    @db_retry
    async def create_fetch(
        self,
        user_id: UUID,
        status: str = "pending",
        channel_ids: list[int] | None = None,
        total_channels: int | None = None,
    ) -> MessageFetch:
        """Create a new message fetch operation.

        Args:
            user_id: UUID of the user initiating the fetch.
            status: Initial status (default: "pending").
            channel_ids: Optional list of channel IDs being fetched.
            total_channels: Optional total number of channels to fetch.

        Returns:
            Created MessageFetch instance.
        """
        fetch = MessageFetch(
            user_id=user_id,
            status=status,
            messages_count=0,
            started_at=datetime.now(UTC),
            channel_ids=channel_ids,
            total_channels=total_channels,
            completed_channels=0,
        )
        self.session.add(fetch)
        await self.session.commit()
        await self.session.refresh(fetch)
        return fetch

    @db_retry
    async def update_fetch_status(
        self,
        fetch_id: UUID,
        status: str,
        messages_count: int = 0,
        error_message: str | None = None,
        error_type: str | None = None,
        current_phase: str | None = None,
    ) -> MessageFetch | None:
        """Update the status of a message fetch operation.

        Args:
            fetch_id: UUID of the fetch operation.
            status: New status ("in_progress", "completed", "failed").
            messages_count: Total number of messages fetched (for completed status).
            error_message: Error details (for failed status).
            error_type: Error category (for failed status): session_expired, rate_limited, connection_error, unknown.
            current_phase: Current phase of the operation (fetching_messages, processing_embeddings, completed).

        Returns:
            Updated MessageFetch instance if found, None otherwise.
        """
        stmt = select(MessageFetch).where(MessageFetch.id == fetch_id)
        result = await self.session.execute(stmt)
        fetch = result.scalar_one_or_none()

        if not fetch:
            return None

        # Update status
        fetch.status = status

        # Update current phase if provided
        if current_phase is not None:
            fetch.current_phase = current_phase

        # Update messages count (for both in_progress and completed statuses)
        if messages_count > 0:
            fetch.messages_count = messages_count

        # Mark completion timestamp for completed status
        if status == "completed":
            fetch.completed_at = datetime.now(UTC)

        # Update error message and type for failed status
        if status == "failed":
            fetch.error_message = error_message
            fetch.error_type = error_type
            fetch.completed_at = datetime.now(UTC)

        await self.session.commit()
        await self.session.refresh(fetch)
        return fetch

    @db_retry
    async def update_channel_progress(
        self,
        fetch_id: UUID,
        completed_channels: int,
        current_channel_title: str | None = None,
        messages_count: int | None = None,
        failed_channel: dict | None = None,
    ) -> MessageFetch | None:
        """Update channel-level progress for a fetch operation.

        Args:
            fetch_id: UUID of the fetch operation.
            completed_channels: Number of channels completed so far.
            current_channel_title: Title of the channel currently being fetched.
            messages_count: Total messages fetched so far.
            failed_channel: Optional dict with channel failure info {channel_id, title, error}.

        Returns:
            Updated MessageFetch instance if found, None otherwise.
        """
        stmt = select(MessageFetch).where(MessageFetch.id == fetch_id)
        result = await self.session.execute(stmt)
        fetch = result.scalar_one_or_none()

        if not fetch:
            return None

        fetch.completed_channels = completed_channels
        if current_channel_title is not None:
            fetch.current_channel_title = current_channel_title
        if messages_count is not None:
            fetch.messages_count = messages_count
        if failed_channel:
            if fetch.failed_channels is None:
                fetch.failed_channels = []
            fetch.failed_channels = [*fetch.failed_channels, failed_channel]

        await self.session.commit()
        await self.session.refresh(fetch)
        return fetch

    @db_retry
    async def get_fetch_by_id(
        self,
        fetch_id: UUID,
        user_id: UUID,
    ) -> MessageFetch | None:
        """Retrieve a message fetch operation by ID.

        Args:
            fetch_id: UUID of the fetch operation.
            user_id: UUID of the user (for access control).

        Returns:
            MessageFetch instance if found and belongs to user, None otherwise.
        """
        stmt = select(MessageFetch).where(
            MessageFetch.id == fetch_id,
            MessageFetch.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    @db_retry
    async def get_active_fetch(
        self,
        user_id: UUID,
        for_update: bool = False,
        stale_threshold_minutes: int = 30,
    ) -> MessageFetch | None:
        """Get currently active (pending or in_progress) fetch for a user.

        Automatically marks stale fetches (older than threshold) as failed
        to prevent zombie fetches from blocking new operations.

        Args:
            user_id: UUID of the user.
            for_update: If True, acquires row-level lock to prevent race conditions.
            stale_threshold_minutes: Minutes after which an active fetch is considered stale.

        Returns:
            MessageFetch instance if active fetch exists, None otherwise.
        """
        stmt = select(MessageFetch).where(
            MessageFetch.user_id == user_id,
            MessageFetch.status.in_(["pending", "in_progress"]),
        )
        if for_update:
            stmt = stmt.with_for_update(skip_locked=True)
        result = await self.session.execute(stmt)
        fetch = result.scalar_one_or_none()

        if fetch is None:
            return None

        # Auto-expire stale fetches from crashed background tasks
        cutoff_time = datetime.now(UTC) - timedelta(minutes=stale_threshold_minutes)
        if fetch.started_at and fetch.started_at < cutoff_time:
            logger.warning(
                f"[FETCH] Auto-expiring stale fetch - fetch_id={fetch.id}, "
                f"user_id={user_id}, started_at={fetch.started_at}, "
                f"age_minutes={(datetime.now(UTC) - fetch.started_at).total_seconds() / 60:.0f}"
            )
            fetch.status = "failed"
            fetch.error_message = (
                "Fetch timed out. The background task may have crashed. Please try again."
            )
            fetch.error_type = "timeout"
            fetch.completed_at = datetime.now(UTC)
            await self.session.commit()
            await self.session.refresh(fetch)
            return None

        return fetch

    @db_retry
    async def delete_all_fetches_for_user(self, user_id: UUID) -> int:
        """Delete all fetch records for a user.

        Used during logout to clear all user's fetch history.

        Args:
            user_id: UUID of the user.

        Returns:
            Number of fetch records deleted.
        """
        result = await self.session.execute(
            delete(MessageFetch).where(MessageFetch.user_id == user_id)
        )
        await self.session.commit()
        return result.rowcount if result.rowcount is not None else 0

    @db_retry
    async def mark_stale_fetches_as_failed(self, stale_threshold_minutes: int = 30) -> int:
        """Mark stale pending/in_progress fetches as failed.

        Detects orphaned fetch operations (e.g., from server crashes) by finding
        fetches that have been in pending/in_progress state longer than the threshold.
        Marks them as failed so the frontend stops polling and users can retry.

        Args:
            stale_threshold_minutes: Minutes after which a fetch is considered stale.

        Returns:
            Number of fetches marked as failed.
        """
        from sqlalchemy import update

        cutoff_time = datetime.now(UTC) - timedelta(minutes=stale_threshold_minutes)

        stmt = (
            update(MessageFetch)
            .where(
                MessageFetch.status.in_(["pending", "in_progress"]),
                MessageFetch.started_at < cutoff_time,
            )
            .values(
                status="failed",
                error_message="Server restarted during fetch. Please try again.",
                error_type="server_restart",
                completed_at=datetime.now(UTC),
            )
        )

        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount if result.rowcount is not None else 0
