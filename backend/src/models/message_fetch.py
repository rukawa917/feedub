"""
MessageFetch model for tracking message fetch operations.

Tracks asynchronous message fetching operations including status,
progress, and error information for debugging and user feedback.
"""

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

import sqlalchemy as sa
from sqlalchemy import TIMESTAMP, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from src.models.message import Message
    from src.models.user import User


class MessageFetch(Base):
    """
    MessageFetch entity for tracking async message fetch operations.

    Tracks the lifecycle of message fetching operations from pending
    through in_progress to completed or failed states.
    """

    __tablename__ = "message_fetches"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Foreign Keys
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Fetch Status
    status: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # pending, in_progress, completed, failed

    # Progress Tracking
    messages_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Channel-level Progress Tracking
    total_channels: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completed_channels: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_channel_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    failed_channels: Mapped[list[dict[str, Any]] | None] = mapped_column(
        sa.JSON, nullable=True
    )  # [{channel_id, title, error}]
    channel_ids: Mapped[list[int] | None] = mapped_column(
        sa.JSON, nullable=True
    )  # Channels being fetched

    # Timestamps
    started_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    # Error Information
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_type: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )  # session_expired, rate_limited, connection_error, unknown

    # Phase Tracking (fetching_messages, completed)
    current_phase: Mapped[str] = mapped_column(
        String(30), nullable=False, default="fetching_messages"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="message_fetches")  # noqa: F821
    messages: Mapped[list["Message"]] = relationship(  # noqa: F821
        "Message", back_populates="fetch", foreign_keys="Message.fetch_id"
    )

    # Indexes
    __table_args__ = (
        # Index for fetching user's fetch history
        Index("idx_fetches_user_started", "user_id", "started_at"),
    )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"<MessageFetch(id={self.id}, user_id={self.user_id}, "
            f"status={self.status}, messages_count={self.messages_count}, "
            f"channels={self.completed_channels}/{self.total_channels})>"
        )
