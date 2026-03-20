"""
Message model for storing aggregated Telegram messages.

Stores messages from Telegram with comprehensive metadata including
file information, message type, and full-text search support.
"""

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

import sqlalchemy as sa
from sqlalchemy import (
    BIGINT,
    TIMESTAMP,
    Boolean,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from src.models.message_fetch import MessageFetch
    from src.models.user import User


class Message(Base):
    """
    Message entity representing an aggregated Telegram message.

    Stores comprehensive message data including text content, media metadata,
    and supports full-text search via generated tsvector column.
    """

    __tablename__ = "messages"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Foreign Keys
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Telegram Message Identity
    telegram_message_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    chat_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    chat_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    chat_type: Mapped[str] = mapped_column(String(20), nullable=False)  # channel, group, private

    # Sender Information
    sender_id: Mapped[int | None] = mapped_column(BIGINT, nullable=True)
    sender_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Message Content
    content: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Message Type and Media
    message_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # text, photo, video, document, audio, voice, video_note, gif, sticker, contact, game, geo, poll, venue, other
    has_media: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # File Metadata (for media messages)
    file_id: Mapped[int | None] = mapped_column(BIGINT, nullable=True)
    file_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int | None] = mapped_column(BIGINT, nullable=True)
    file_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # seconds
    file_width: Mapped[int | None] = mapped_column(Integer, nullable=True)  # pixels
    file_height: Mapped[int | None] = mapped_column(Integer, nullable=True)  # pixels

    # Message Flags
    is_reply: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_forward: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Additional Metadata (stored as JSON)
    additional_metadata: Mapped[dict[str, Any] | None] = mapped_column(sa.JSON, nullable=True)

    # Fetch tracking for rollback support
    fetch_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("message_fetches.id", ondelete="SET NULL", name="fk_messages_fetch_id"),
        nullable=True,
        index=True,
    )

    # Timestamps
    timestamp: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False
    )  # Original message timestamp
    fetched_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="messages")  # noqa: F821
    fetch: Mapped["MessageFetch | None"] = relationship(
        "MessageFetch", back_populates="messages", foreign_keys=[fetch_id]
    )

    # Indexes defined at class level
    __table_args__ = (
        # Unique constraint for deduplication (used by ON CONFLICT DO NOTHING)
        UniqueConstraint("user_id", "chat_id", "telegram_message_id", name="uq_message_identity"),
        # Index for chronological queries by user
        Index("idx_messages_user_time", "user_id", "timestamp"),
        # Index for per-chat chronological queries
        Index("idx_messages_user_chat_time", "user_id", "chat_id", "timestamp"),
        # Index for media queries
        Index("idx_messages_media", "user_id", "has_media"),
    )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"<Message(id={self.id}, user_id={self.user_id}, "
            f"telegram_message_id={self.telegram_message_id}, "
            f"chat_id={self.chat_id}, message_type={self.message_type})>"
        )
