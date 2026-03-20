"""User insights usage model for rate limiting."""

from datetime import UTC, date, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from src.models.user import User


class UserInsightsUsage(Base):
    """
    Daily usage tracking for insights rate limiting.

    Tracks how many insights a user has generated per day.
    """

    __tablename__ = "user_insights_usage"

    # Primary Key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Foreign Keys
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Usage tracking
    date: Mapped[date] = mapped_column(
        Date, nullable=False, default=lambda: datetime.now(UTC).date()
    )
    request_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="insights_usages")

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<UserInsightsUsage(id={self.id}, user_id={self.user_id}, date={self.date}, count={self.request_count})>"
