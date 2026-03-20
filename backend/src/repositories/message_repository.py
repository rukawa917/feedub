"""Message repository for database operations.

This module provides the data access layer for Message model operations.
"""

import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.retry import db_retry
from src.models.message import Message

logger = logging.getLogger(__name__)


def _escape_ilike(value: str) -> str:
    """Escape SQL ILIKE/LIKE wildcard characters to prevent wildcard injection."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class MessageRepository:
    """Repository for Message database operations.

    Handles all database interactions for Message model following Repository pattern.
    """

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session.

        Args:
            session: SQLAlchemy async session for database operations.
        """
        self.session = session

    @db_retry
    async def bulk_insert_messages_with_batches(
        self,
        user_id: UUID,
        messages: list[dict[str, Any]],
        batch_size: int = 500,
        progress_callback: Callable[[int, int], Awaitable[None]] | None = None,
        fetch_id: UUID | None = None,
    ) -> int:
        """Bulk insert messages into the database with batch processing and deduplication.

        Inserts messages in batches to improve memory efficiency and allow
        progress tracking. Each batch is committed separately. Uses PostgreSQL
        ON CONFLICT DO NOTHING to automatically skip duplicates.

        Args:
            user_id: UUID of the user who owns these messages.
            messages: List of message dictionaries (same format as bulk_insert_messages).
            batch_size: Number of messages to insert per batch (default: 500).
            progress_callback: Optional async callback function called after each batch.
                              Receives (messages_actually_inserted, total_attempted_messages).
            fetch_id: Optional UUID of the fetch operation, for rollback support.

        Returns:
            Total number of messages actually inserted (excludes duplicates).
        """
        if not messages:
            return 0

        total_inserted = 0
        total_messages = len(messages)

        # Process messages in batches
        for i in range(0, total_messages, batch_size):
            batch = messages[i : i + batch_size]

            # Prepare message data for this batch
            fetched_at = datetime.now(UTC)
            batch_values = [
                {
                    "user_id": user_id,
                    "telegram_message_id": msg["telegram_message_id"],
                    "chat_id": msg["chat_id"],
                    "chat_title": msg.get("chat_title"),
                    "chat_type": msg["chat_type"],
                    "sender_id": msg.get("sender_id"),
                    "sender_name": msg.get("sender_name"),
                    "content": msg.get("content"),
                    "message_type": msg["message_type"],
                    "has_media": msg["has_media"],
                    "file_id": msg.get("file_id"),
                    "file_name": msg.get("file_name"),
                    "file_mime_type": msg.get("file_mime_type"),
                    "file_size": msg.get("file_size"),
                    "file_duration": msg.get("file_duration"),
                    "file_width": msg.get("file_width"),
                    "file_height": msg.get("file_height"),
                    "is_reply": msg["is_reply"],
                    "is_forward": msg["is_forward"],
                    "timestamp": msg["timestamp"],
                    "additional_metadata": msg.get("additional_metadata"),
                    "fetched_at": fetched_at,
                    "fetch_id": fetch_id,
                }
                for msg in batch
            ]

            # Use SQLite INSERT OR IGNORE for deduplication
            stmt = sqlite_insert(Message).values(batch_values)
            stmt = stmt.on_conflict_do_nothing(
                index_elements=["user_id", "chat_id", "telegram_message_id"]
            )

            # Execute and get actual row count for this batch
            result = await self.session.execute(stmt)
            await self.session.commit()

            # Track actual insertions for this batch (excludes skipped duplicates)
            batch_inserted = result.rowcount if result.rowcount is not None else 0
            total_inserted += batch_inserted

            # Call progress callback if provided (async)
            if progress_callback:
                await progress_callback(total_inserted, total_messages)

        return total_inserted

    @db_retry
    async def get_message_by_id(
        self,
        message_id: UUID,
        user_id: UUID,
    ) -> Message | None:
        """Retrieve a single message by ID.

        Args:
            message_id: UUID of the message.
            user_id: UUID of the user (for access control).

        Returns:
            Message instance if found and belongs to user, None otherwise.
        """
        stmt = select(Message).where(
            Message.id == message_id,
            Message.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    @db_retry
    async def get_messages_paginated(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Message]:
        """Retrieve messages with pagination.

        Args:
            user_id: UUID of the user.
            limit: Maximum number of messages to return (capped at 100).
            offset: Number of messages to skip.

        Returns:
            List of Message instances sorted by timestamp descending.
        """
        # Hard cap to prevent unbounded queries
        effective_limit = min(limit, 100)

        stmt = (
            select(Message)
            .where(Message.user_id == user_id)
            .order_by(Message.timestamp.desc())
            .limit(effective_limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    @db_retry
    async def count_messages(
        self,
        user_id: UUID,
    ) -> int:
        """Count total messages for a user.

        Args:
            user_id: UUID of the user.

        Returns:
            Total count of messages.
        """
        stmt = select(func.count(Message.id)).where(Message.user_id == user_id)
        result = await self.session.execute(stmt)
        count = result.scalar_one()
        return count if count is not None else 0

    def _apply_message_filters(
        self,
        stmt: Any,
        user_id: UUID,
        chat_ids: list[int] | None,
        start_date: datetime | None,
        end_date: datetime | None,
        message_type: str | None,
        has_media: bool | None,
    ) -> Any:
        """Apply common message filter conditions to a SQLAlchemy statement.

        Applies user ownership and all optional filters (chat, date range, type,
        media). Does NOT apply search (FTS/ILIKE) — callers handle that separately
        because search affects both the WHERE clause and the select target.

        Args:
            stmt: Base SQLAlchemy select statement to filter.
            user_id: UUID of the user (ownership filter, always applied).
            chat_ids: Optional list of chat IDs to filter by.
            start_date: Optional start date for date range filter (inclusive).
            end_date: Optional end date for date range filter (inclusive).
            message_type: Optional message type filter.
            has_media: Optional filter for messages with/without media.

        Returns:
            Statement with all applicable filters applied.
        """
        stmt = stmt.where(Message.user_id == user_id)

        if chat_ids:
            stmt = stmt.where(Message.chat_id.in_(chat_ids))
        if start_date is not None:
            stmt = stmt.where(Message.timestamp >= start_date)
        if end_date is not None:
            stmt = stmt.where(Message.timestamp <= end_date)
        if message_type is not None:
            stmt = stmt.where(Message.message_type == message_type)
        if has_media is not None:
            stmt = stmt.where(Message.has_media == has_media)

        return stmt

    @db_retry
    async def search_messages(
        self,
        user_id: UUID,
        search: str | None = None,
        chat_ids: list[int] | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        message_type: str | None = None,
        has_media: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Message]:
        """Search and filter messages with pagination.

        Supports filtering by search, chat, date range, type, and media.

        Args:
            user_id: UUID of the user.
            search: Optional search query for message content (ILIKE).
            chat_ids: Optional list of chat IDs to filter by (supports multiple chats).
            start_date: Optional start date for date range filter (inclusive).
            end_date: Optional end date for date range filter (inclusive).
            message_type: Optional message type filter (text, photo, video, etc.).
            has_media: Optional filter for messages with media (True) or without (False).
            limit: Maximum number of messages to return (default: 50, capped at 100).
            offset: Number of messages to skip for pagination (default: 0).

        Returns:
            List of Message instances matching filters, sorted by timestamp descending.
        """
        # Hard cap to prevent unbounded queries
        effective_limit = min(limit, 100)

        stmt = self._apply_message_filters(
            select(Message),
            user_id,
            chat_ids,
            start_date,
            end_date,
            message_type,
            has_media,
        )

        if search:
            stmt = stmt.where(Message.content.ilike(f"%{_escape_ilike(search)}%"))

        stmt = stmt.order_by(Message.timestamp.desc()).limit(effective_limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    @db_retry
    async def count_messages_with_filters(
        self,
        user_id: UUID,
        search: str | None = None,
        chat_ids: list[int] | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        message_type: str | None = None,
        has_media: bool | None = None,
    ) -> int:
        """Count messages matching filters.

        Uses the same filter logic as search_messages() to provide accurate
        counts for filtered result sets (for pagination).

        Args:
            user_id: UUID of the user.
            search: Optional search query for full-text search on message content.
            chat_ids: Optional list of chat IDs to filter by (supports multiple chats).
            start_date: Optional start date for date range filter (inclusive).
            end_date: Optional end date for date range filter (inclusive).
            message_type: Optional message type filter (text, photo, video, etc.).
            has_media: Optional filter for messages with media (True) or without (False).

        Returns:
            Total count of messages matching the filters.
        """

        stmt = self._apply_message_filters(
            select(func.count(Message.id)),
            user_id,
            chat_ids,
            start_date,
            end_date,
            message_type,
            has_media,
        )
        if search:
            stmt = stmt.where(Message.content.ilike(f"%{_escape_ilike(search)}%"))
        result = await self.session.execute(stmt)
        count = result.scalar_one()
        return count if count is not None else 0

    @db_retry
    async def get_message_ids_with_filters(
        self,
        user_id: UUID,
        search: str | None = None,
        chat_ids: list[int] | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        message_type: str | None = None,
        has_media: bool | None = None,
        limit: int = 10000,
    ) -> list[UUID]:
        """Get only message IDs matching filters (lightweight query).

        Returns only UUIDs without loading full message objects, making this
        much more efficient for passing to insights generation.

        Args:
            user_id: UUID of the user.
            search: Optional search query for full-text search on message content.
            chat_ids: Optional list of chat IDs to filter by (supports multiple chats).
            start_date: Optional start date for date range filter (inclusive).
            end_date: Optional end date for date range filter (inclusive).
            message_type: Optional message type filter (text, photo, video, etc.).
            has_media: Optional filter for messages with media (True) or without (False).
            limit: Maximum number of IDs to return (default: 10000).

        Returns:
            List of message UUIDs matching filters, sorted by timestamp descending.
        """
        # Cap to prevent unbounded queries; actual insight limit enforced by insights service per provider
        effective_limit = min(limit, 10000)

        stmt = self._apply_message_filters(
            select(Message.id),
            user_id,
            chat_ids,
            start_date,
            end_date,
            message_type,
            has_media,
        )

        if search:
            stmt = stmt.where(Message.content.ilike(f"%{_escape_ilike(search)}%"))

        stmt = stmt.order_by(Message.timestamp.desc()).limit(effective_limit)
        result = await self.session.execute(stmt)
        return [row[0] for row in result.all()]

    @db_retry
    async def get_chats(
        self,
        user_id: UUID,
        search: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        stmt = (
            select(
                Message.chat_id,
                Message.chat_title,
                Message.chat_type,
                func.count(Message.id).label("message_count"),
            )
            .where(Message.user_id == user_id)
            .group_by(Message.chat_id, Message.chat_title, Message.chat_type)
        )

        if search:
            stmt = stmt.having(Message.chat_title.ilike(f"%{_escape_ilike(search)}%"))

        stmt = stmt.order_by(func.count(Message.id).desc()).limit(limit).offset(offset)

        result = await self.session.execute(stmt)
        rows = result.all()

        return [
            {
                "chat_id": str(row.chat_id),
                "title": row.chat_title or "Unknown Chat",
                "type": row.chat_type,
                "message_count": row.message_count,
            }
            for row in rows
        ]

    @db_retry
    async def count_chats(self, user_id: UUID, search: str | None = None) -> int:
        subquery = (
            select(Message.chat_id)
            .where(Message.user_id == user_id)
            .group_by(Message.chat_id, Message.chat_title)
        )

        if search:
            subquery = subquery.having(Message.chat_title.ilike(f"%{_escape_ilike(search)}%"))

        stmt = select(func.count()).select_from(subquery.subquery())
        result = await self.session.execute(stmt)
        count = result.scalar_one()
        return count if count is not None else 0

    @db_retry
    async def get_max_message_ids_by_chat(self, user_id: UUID) -> dict[int, int]:
        """Get the maximum telegram_message_id per chat_id for a user.

        Used for continuation fetching - only fetch messages newer than
        the highest message ID we already have for each chat.

        Args:
            user_id: UUID of the user.

        Returns:
            Dict mapping chat_id (int) -> max_telegram_message_id (int).
            Empty dict if user has no messages.
        """
        stmt = (
            select(
                Message.chat_id,
                func.max(Message.telegram_message_id).label("max_message_id"),
            )
            .where(Message.user_id == user_id)
            .group_by(Message.chat_id)
        )

        result = await self.session.execute(stmt)
        rows = result.all()

        return {int(row.chat_id): int(row.max_message_id) for row in rows}

    @db_retry
    async def get_messages_for_insights(
        self,
        user_id: UUID,
        chat_ids: list[int],
        start_date: datetime,
        end_date: datetime,
        limit: int = 1000,
    ) -> list[Message]:
        """Get messages for insight generation within filters.

        Fetches messages matching the specified filters, ordered by timestamp.
        Used by InsightsService to gather messages for LLM summarization.

        Args:
            user_id: UUID of the user.
            chat_ids: List of Telegram chat IDs to include.
            start_date: Start of date range (inclusive).
            end_date: End of date range (inclusive).
            limit: Maximum messages to return (default 1000, hard cap).

        Returns:
            List of Message instances with content, sorted by timestamp ASC.
        """
        stmt = (
            select(Message)
            .where(Message.user_id == user_id)
            .where(Message.chat_id.in_(chat_ids))
            .where(Message.timestamp >= start_date)
            .where(Message.timestamp <= end_date)
            .where(Message.content.isnot(None))  # Skip media-only messages
            .order_by(Message.timestamp.asc())
            .limit(min(limit, 1000))  # Hard cap at 1000
        )

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    @db_retry
    async def get_messages_by_ids(
        self,
        user_id: UUID,
        message_ids: list[UUID],
    ) -> list[Message]:
        """Get messages by their IDs, verifying ownership.

        Args:
            user_id: UUID of the user.
            message_ids: List of message IDs to fetch.

        Returns:
            List of Message instances sorted by timestamp DESC (newest first).
        """
        stmt = (
            select(Message)
            .where(Message.user_id == user_id)
            .where(Message.id.in_(message_ids))
            .where(Message.content.isnot(None))
            .order_by(Message.timestamp.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    @db_retry
    async def delete_all_messages_for_user(self, user_id: UUID) -> int:
        """Delete all messages for a user.

        Used during logout to clear all user's message data.

        Args:
            user_id: UUID of the user.

        Returns:
            Number of messages deleted.
        """
        result = await self.session.execute(delete(Message).where(Message.user_id == user_id))
        await self.session.commit()
        return result.rowcount if result.rowcount is not None else 0

    @db_retry
    async def delete_expired_messages(
        self,
        retention_days: int,
        batch_size: int = 1000,
    ) -> int:
        """Delete messages older than retention_days based on fetched_at timestamp.

        Deletes in batches to avoid long-running transactions and reduce
        lock contention. Uses DELETE with LIMIT via subquery for PostgreSQL.

        Args:
            retention_days: Number of days to retain messages (delete older).
            batch_size: Number of messages to delete per batch (default: 1000).

        Returns:
            Total number of messages deleted across all batches.
        """
        cutoff_date = datetime.now(UTC) - timedelta(days=retention_days)
        total_deleted = 0

        while True:
            # Delete in batches using subquery with LIMIT
            subquery = select(Message.id).where(Message.fetched_at < cutoff_date).limit(batch_size)

            stmt = delete(Message).where(Message.id.in_(subquery))
            result = await self.session.execute(stmt)
            await self.session.commit()

            batch_deleted = result.rowcount if result.rowcount is not None else 0
            total_deleted += batch_deleted

            # Exit when no more rows to delete
            if batch_deleted == 0:
                break

        return total_deleted

    @db_retry
    async def delete_messages_by_fetch_id(self, fetch_id: UUID) -> int:
        """Delete all messages associated with a fetch operation.

        Used for rollback when a fetch is cancelled.

        Args:
            fetch_id: UUID of the fetch operation.

        Returns:
            Number of messages deleted.
        """
        stmt = delete(Message).where(Message.fetch_id == fetch_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount if result.rowcount is not None else 0
