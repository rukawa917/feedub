"""
UserChannelFavorite model for persisting user's favorite channels.

Stores which Telegram channels/groups a user has marked as favorites,
allowing favorites to persist across sessions. Different from channel selections
which track which channels to sync - favorites are user-bookmarked channels.
"""

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import BIGINT, TIMESTAMP, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from src.models.user import User


class UserChannelFavorite(Base):
    """
    UserChannelFavorite entity for storing favorite channels.

    Each record represents a channel that a user has marked as a favorite
    for quick access. Favorites persist across sessions.
    """

    __tablename__ = "user_channel_favorites"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Foreign Keys
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Channel Information
    channel_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    channel_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    channel_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # channel, group, supergroup, private

    # Timestamps
    favorited_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="channel_favorites")

    # Constraints
    # Note: user_id index is already created via index=True on the column
    __table_args__ = (UniqueConstraint("user_id", "channel_id", name="uq_user_channel_favorite"),)

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"<UserChannelFavorite(id={self.id}, user_id={self.user_id}, "
            f"channel_id={self.channel_id}, channel_title={self.channel_title})>"
        )
