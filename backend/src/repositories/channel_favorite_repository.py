"""ChannelFavorite repository for database operations.

This module provides the data access layer for UserChannelFavorite model operations.
"""

from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.retry import db_retry
from src.models.user_channel_favorite import UserChannelFavorite


class ChannelFavoriteRepository:
    """Repository for UserChannelFavorite database operations.

    Handles all database interactions for UserChannelFavorite model following Repository pattern.
    """

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session.

        Args:
            session: SQLAlchemy async session for database operations.
        """
        self.session = session

    @db_retry
    async def get_favorites_for_user(self, user_id: UUID) -> list[UserChannelFavorite]:
        """Get all favorite channels for a user.

        Args:
            user_id: UUID of the user.

        Returns:
            List of UserChannelFavorite instances for the user.
        """
        stmt = (
            select(UserChannelFavorite)
            .where(UserChannelFavorite.user_id == user_id)
            .order_by(UserChannelFavorite.favorited_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    @db_retry
    async def get_favorite_channel_ids(self, user_id: UUID) -> list[int]:
        """Get just the channel IDs for a user's favorites.

        Args:
            user_id: UUID of the user.

        Returns:
            List of channel IDs (as integers).
        """
        stmt = select(UserChannelFavorite.channel_id).where(UserChannelFavorite.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    @db_retry
    async def is_favorite(self, user_id: UUID, channel_id: int) -> bool:
        """Check if a channel is favorited by the user.

        Args:
            user_id: UUID of the user.
            channel_id: Telegram channel ID.

        Returns:
            True if the channel is favorited, False otherwise.
        """
        stmt = select(UserChannelFavorite.id).where(
            UserChannelFavorite.user_id == user_id,
            UserChannelFavorite.channel_id == channel_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    @db_retry
    async def add_favorite(
        self,
        user_id: UUID,
        channel_id: int,
        channel_title: str | None = None,
        channel_type: str | None = None,
    ) -> UserChannelFavorite:
        """Add a channel to user's favorites.

        Args:
            user_id: UUID of the user.
            channel_id: Telegram channel ID.
            channel_title: Optional channel title.
            channel_type: Optional channel type (channel, group, etc.).

        Returns:
            Created UserChannelFavorite instance.
        """
        favorite = UserChannelFavorite(
            user_id=user_id,
            channel_id=channel_id,
            channel_title=channel_title,
            channel_type=channel_type,
        )
        self.session.add(favorite)
        await self.session.commit()
        await self.session.refresh(favorite)
        return favorite

    @db_retry
    async def remove_favorite(self, user_id: UUID, channel_id: int) -> bool:
        """Remove a channel from user's favorites.

        Args:
            user_id: UUID of the user.
            channel_id: Telegram channel ID to remove.

        Returns:
            True if a favorite was removed, False if not found.
        """
        result = await self.session.execute(
            delete(UserChannelFavorite).where(
                UserChannelFavorite.user_id == user_id,
                UserChannelFavorite.channel_id == channel_id,
            )
        )
        await self.session.commit()
        return result.rowcount is not None and result.rowcount > 0

    @db_retry
    async def toggle_favorite(
        self,
        user_id: UUID,
        channel_id: int,
        channel_title: str | None = None,
        channel_type: str | None = None,
    ) -> tuple[bool, UserChannelFavorite | None]:
        """Toggle a channel's favorite status.

        If the channel is already favorited, remove it. Otherwise, add it.

        Args:
            user_id: UUID of the user.
            channel_id: Telegram channel ID.
            channel_title: Optional channel title (used if adding).
            channel_type: Optional channel type (used if adding).

        Returns:
            Tuple of (is_now_favorite, favorite_object_or_none).
        """
        # Check if already favorited
        is_fav = await self.is_favorite(user_id, channel_id)

        if is_fav:
            # Remove the favorite
            await self.remove_favorite(user_id, channel_id)
            return (False, None)
        else:
            # Add the favorite
            favorite = await self.add_favorite(user_id, channel_id, channel_title, channel_type)
            return (True, favorite)

    @db_retry
    async def clear_all_favorites(self, user_id: UUID) -> int:
        """Clear all favorites for a user.

        Args:
            user_id: UUID of the user.

        Returns:
            Number of favorites removed.
        """
        result = await self.session.execute(
            delete(UserChannelFavorite).where(UserChannelFavorite.user_id == user_id)
        )
        await self.session.commit()
        return result.rowcount if result.rowcount is not None else 0
