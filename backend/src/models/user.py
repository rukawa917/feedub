"""
User model for phone-based authentication and Telegram session management.

Represents authenticated users identified by phone number, storing
Telegram session strings for message fetching operations.
"""

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import BIGINT, TIMESTAMP, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from src.models.insight import Insight
    from src.models.message import Message
    from src.models.message_fetch import MessageFetch
    from src.models.user_channel_favorite import UserChannelFavorite
    from src.models.user_channel_selection import UserChannelSelection
    from src.models.user_insights_usage import UserInsightsUsage


class User(Base):
    """
    User entity for authentication and session management.

    Users authenticate via phone number + Telegram verification code.
    Session strings are stored and used to fetch messages.
    """

    __tablename__ = "users"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Authentication Fields
    phone_number: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    telegram_user_id: Mapped[int | None] = mapped_column(
        BIGINT, unique=True, nullable=True, index=True
    )

    # Session Management
    session_string: Mapped[str | None] = mapped_column(Text, nullable=True)
    temp_session_string: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    last_login_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    # Consent
    llm_consent_given: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    messages: Mapped[list["Message"]] = relationship(  # noqa: F821
        "Message", back_populates="user", cascade="all, delete-orphan"
    )
    message_fetches: Mapped[list["MessageFetch"]] = relationship(  # noqa: F821
        "MessageFetch", back_populates="user", cascade="all, delete-orphan"
    )
    channel_selections: Mapped[list["UserChannelSelection"]] = relationship(  # noqa: F821
        "UserChannelSelection", back_populates="user", cascade="all, delete-orphan"
    )
    channel_favorites: Mapped[list["UserChannelFavorite"]] = relationship(  # noqa: F821
        "UserChannelFavorite", back_populates="user", cascade="all, delete-orphan"
    )
    insights_usages: Mapped[list["UserInsightsUsage"]] = relationship(  # noqa: F821
        "UserInsightsUsage", back_populates="user", cascade="all, delete-orphan"
    )
    insights: Mapped[list["Insight"]] = relationship(  # noqa: F821
        "Insight", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation for debugging (phone masked)."""
        masked = f"{self.phone_number[:4]}***{self.phone_number[-4:]}" if self.phone_number and len(self.phone_number) > 8 else "***"
        return f"<User(id={self.id}, phone={masked})>"
