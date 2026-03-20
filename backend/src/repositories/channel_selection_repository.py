"""ChannelSelection repository for database operations.

This module provides the data access layer for UserChannelSelection model operations.
"""

from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.retry import db_retry
from src.models.user_channel_selection import UserChannelSelection


class ChannelSelectionRepository:
    """Repository for UserChannelSelection database operations.

    Handles all database interactions for UserChannelSelection model following Repository pattern.
    """

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session.

        Args:
            session: SQLAlchemy async session for database operations.
        """
        self.session = session

    @db_retry
    async def get_selections_for_user(self, user_id: UUID) -> list[UserChannelSelection]:
        """Get all channel selections for a user.

        Args:
            user_id: UUID of the user.

        Returns:
            List of UserChannelSelection instances for the user.
        """
        stmt = (
            select(UserChannelSelection)
            .where(UserChannelSelection.user_id == user_id)
            .order_by(UserChannelSelection.selected_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    @db_retry
    async def get_selected_channel_ids(self, user_id: UUID) -> list[int]:
        """Get just the channel IDs for a user's selections.

        Args:
            user_id: UUID of the user.

        Returns:
            List of channel IDs (as integers).
        """
        stmt = select(UserChannelSelection.channel_id).where(
            UserChannelSelection.user_id == user_id
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    @db_retry
    async def bulk_replace_selections(
        self,
        user_id: UUID,
        channels: list[dict],
    ) -> list[UserChannelSelection]:
        """Replace all user's channel selections with new ones.

        This performs a bulk delete then insert for simplicity and atomicity.

        Args:
            user_id: UUID of the user.
            channels: List of channel dicts with keys: channel_id, channel_title, channel_type

        Returns:
            List of newly created UserChannelSelection instances.
        """
        # Delete existing selections
        await self.session.execute(
            delete(UserChannelSelection).where(UserChannelSelection.user_id == user_id)
        )

        # Insert new selections
        new_selections = []
        for channel in channels:
            selection = UserChannelSelection(
                user_id=user_id,
                channel_id=channel["channel_id"],
                channel_title=channel.get("channel_title"),
                channel_type=channel.get("channel_type"),
            )
            self.session.add(selection)
            new_selections.append(selection)

        await self.session.commit()

        # Refresh all selections to get their IDs
        for selection in new_selections:
            await self.session.refresh(selection)

        return new_selections

    @db_retry
    async def add_selection(
        self,
        user_id: UUID,
        channel_id: int,
        channel_title: str | None = None,
        channel_type: str | None = None,
    ) -> UserChannelSelection:
        """Add a single channel selection for a user.

        Args:
            user_id: UUID of the user.
            channel_id: Telegram channel ID.
            channel_title: Optional channel title.
            channel_type: Optional channel type (channel, group, etc.).

        Returns:
            Created UserChannelSelection instance.
        """
        selection = UserChannelSelection(
            user_id=user_id,
            channel_id=channel_id,
            channel_title=channel_title,
            channel_type=channel_type,
        )
        self.session.add(selection)
        await self.session.commit()
        await self.session.refresh(selection)
        return selection

    @db_retry
    async def remove_selection(self, user_id: UUID, channel_id: int) -> bool:
        """Remove a channel selection for a user.

        Args:
            user_id: UUID of the user.
            channel_id: Telegram channel ID to remove.

        Returns:
            True if a selection was removed, False if not found.
        """
        result = await self.session.execute(
            delete(UserChannelSelection).where(
                UserChannelSelection.user_id == user_id,
                UserChannelSelection.channel_id == channel_id,
            )
        )
        await self.session.commit()
        return result.rowcount is not None and result.rowcount > 0

    @db_retry
    async def clear_all_selections(self, user_id: UUID) -> int:
        """Clear all channel selections for a user.

        Args:
            user_id: UUID of the user.

        Returns:
            Number of selections removed.
        """
        result = await self.session.execute(
            delete(UserChannelSelection).where(UserChannelSelection.user_id == user_id)
        )
        await self.session.commit()
        return result.rowcount if result.rowcount is not None else 0
