"""User repository for database operations.

This module provides the data access layer for User model operations.
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.retry import db_retry
from src.models.user import User


class UserRepository:
    """Repository for User database operations.

    Handles all database interactions for User model following Repository pattern.
    """

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session.

        Args:
            session: SQLAlchemy async session for database operations.
        """
        self.session = session

    @db_retry
    async def create_user(
        self,
        phone_number: str,
        temp_session_string: str | None = None,
    ) -> User:
        """Create a new user with phone number and optional temp session.

        Args:
            phone_number: User's phone number in E.164 format.
            temp_session_string: Temporary Telethon session string.

        Returns:
            Created User instance.
        """
        user = User(
            phone_number=phone_number,
            temp_session_string=temp_session_string,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

        return user

    @db_retry
    async def _get_user_by_phone_internal(self, phone_number: str) -> User | None:
        """Internal method to retrieve user by phone number (remains attached to session).

        Args:
            phone_number: Phone number to search for.

        Returns:
            User instance (still attached to session), or None if not found.
        """
        stmt = select(User).where(User.phone_number == phone_number)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    @db_retry
    async def get_user_by_phone(self, phone_number: str) -> User | None:
        """Retrieve user by phone number.

        Args:
            phone_number: Phone number to search for.

        Returns:
            User instance if found, None otherwise.
        """
        return await self._get_user_by_phone_internal(phone_number)

    @db_retry
    async def get_user_by_id(self, user_id: UUID) -> User | None:
        """Retrieve user by ID.

        Args:
            user_id: User's UUID.

        Returns:
            User instance if found, None otherwise.
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    @db_retry
    async def update_session(
        self,
        phone_number: str,
        session_string: str,
        telegram_user_id: int | None = None,
    ) -> User | None:
        """Update user's persistent session after successful authentication.

        Args:
            phone_number: User's phone number.
            session_string: Persistent Telethon session string.
            telegram_user_id: Telegram user ID from client.get_me().

        Returns:
            Updated User instance if found, None otherwise.
        """
        user = await self._get_user_by_phone_internal(phone_number)
        if not user:
            return None

        user.session_string = session_string
        if telegram_user_id:
            user.telegram_user_id = telegram_user_id
        user.last_login_at = datetime.now(UTC)

        await self.session.commit()
        await self.session.refresh(user)

        return user

    @db_retry
    async def update_temp_session(
        self,
        phone_number: str,
        temp_session_string: str,
    ) -> User:
        """Update or create user with temporary session during auth flow.

        Args:
            phone_number: User's phone number.
            temp_session_string: Temporary Telethon session string.

        Returns:
            Updated or created User instance.
        """
        user = await self._get_user_by_phone_internal(phone_number)

        if user:
            user.temp_session_string = temp_session_string
            await self.session.commit()
            await self.session.refresh(user)

            return user
        else:
            return await self.create_user(
                phone_number=phone_number,
                temp_session_string=temp_session_string,
            )

    @db_retry
    async def clear_temp_session(self, phone_number: str) -> User | None:
        """Clear temporary session after successful authentication.

        Args:
            phone_number: User's phone number.

        Returns:
            Updated User instance if found, None otherwise.
        """
        user = await self._get_user_by_phone_internal(phone_number)
        if not user:
            return None

        user.temp_session_string = None
        await self.session.commit()
        await self.session.refresh(user)

        return user

    @db_retry
    async def clear_user_session(self, user_id: UUID) -> bool:
        """Clear user's Telegram session strings (for logout).

        Clears both session_string and temp_session_string.
        User must re-authenticate to use Telegram features again.

        Args:
            user_id: UUID of the user.

        Returns:
            True if user found and updated, False otherwise.
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            return False

        user.session_string = None
        user.temp_session_string = None
        await self.session.commit()
        return True

    @db_retry
    async def delete_user(self, user_id: UUID) -> bool:
        """Delete a user from the database.

        SQLAlchemy cascade will automatically delete all related records:
        - messages
        - message_fetches
        - channel_selections
        - channel_favorites
        - llm_consents
        - insights

        Args:
            user_id: UUID of the user to delete.

        Returns:
            True if user was found and deleted, False otherwise.
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            return False

        await self.session.delete(user)
        await self.session.commit()
        return True

    @db_retry
    async def delete_all_user_data(self, user_id: UUID) -> int:
        """Delete all user data except the user record.

        Deletes:
        - All messages
        - All message_fetches
        - All channel_selections
        - All channel_favorites
        - All llm_consents
        - All insights

        Keeps:
        - User record

        Args:
            user_id: UUID of the user.

        Returns:
            Total number of records deleted.
        """
        from sqlalchemy import delete

        from src.models.insight import Insight
        from src.models.message import Message
        from src.models.message_fetch import MessageFetch
        from src.models.user_channel_favorite import UserChannelFavorite
        from src.models.user_channel_selection import UserChannelSelection
        total_deleted = 0

        # Delete messages
        stmt = delete(Message).where(Message.user_id == user_id)
        result = await self.session.execute(stmt)
        total_deleted += result.rowcount or 0

        # Delete message fetches
        stmt = delete(MessageFetch).where(MessageFetch.user_id == user_id)
        result = await self.session.execute(stmt)
        total_deleted += result.rowcount or 0

        # Delete channel selections
        stmt = delete(UserChannelSelection).where(UserChannelSelection.user_id == user_id)
        result = await self.session.execute(stmt)
        total_deleted += result.rowcount or 0

        # Delete channel favorites
        stmt = delete(UserChannelFavorite).where(UserChannelFavorite.user_id == user_id)
        result = await self.session.execute(stmt)
        total_deleted += result.rowcount or 0

        # Delete insights
        stmt = delete(Insight).where(Insight.user_id == user_id)
        result = await self.session.execute(stmt)
        total_deleted += result.rowcount or 0

        await self.session.commit()
        return total_deleted
