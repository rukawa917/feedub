"""Insights repository for database operations.

This module provides the data access layer for Insight model operations.
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.retry import db_retry
from src.models.insight import Insight
from src.models.user import User


class InsightsRepository:
    """Repository for insights-related database operations.

    Handles all database interactions for Insight model
    following Repository pattern.
    """

    def __init__(self, session: AsyncSession):
        """Initialize repository with database session.

        Args:
            session: SQLAlchemy async session for database operations.
        """
        self.session = session

    # =========================================================================
    # Consent Operations
    # =========================================================================

    @db_retry
    async def get_consent(self, user_id: UUID) -> bool:
        """Get user's LLM consent status.

        Args:
            user_id: UUID of the user.

        Returns:
            True if user has given consent, False otherwise.
        """
        stmt = select(User.llm_consent_given).where(User.id == user_id)
        result = await self.session.execute(stmt)
        value = result.scalar_one_or_none()
        return bool(value) if value is not None else False

    @db_retry
    async def set_consent(self, user_id: UUID, value: bool) -> None:
        """Set user's LLM consent status.

        Args:
            user_id: UUID of the user.
            value: True to give consent, False to revoke.
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.llm_consent_given = value
            await self.session.commit()

    # =========================================================================
    # Insight Operations
    # =========================================================================

    @db_retry
    async def get_existing_insight(
        self,
        user_id: UUID,
        chat_ids: list[int],
        start_date: datetime,
        end_date: datetime,
    ) -> Insight | None:
        """Get existing insight matching the same parameters.

        Args:
            user_id: UUID of the user.
            chat_ids: List of Telegram chat IDs included.
            start_date: Start of date range for messages.
            end_date: End of date range for messages.

        Returns:
            Insight instance if found, None otherwise.
        """
        stmt = (
            select(Insight)
            .where(Insight.user_id == user_id)
            .where(Insight.chat_ids == chat_ids)
            .where(Insight.start_date == start_date)
            .where(Insight.end_date == end_date)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    @db_retry
    async def create_insight(
        self,
        user_id: UUID,
        chat_ids: list[int],
        chat_titles: list[str] | None,
        start_date: datetime,
        end_date: datetime,
        message_count: int,
        model_used: str,
        provider_used: str,
    ) -> Insight:
        """Create a new insight record with pending status.

        Checks for existing insights with same parameters:
        - If completed: returns existing (cache hit)
        - If pending/processing/failed: deletes and creates new (allow regeneration)
        - If none exists: creates new

        Args:
            user_id: UUID of the user.
            chat_ids: List of Telegram chat IDs included.
            chat_titles: Optional list of chat titles.
            start_date: Start of date range for messages.
            end_date: End of date range for messages.
            message_count: Number of messages included.
            model_used: LLM model identifier.
            provider_used: LLM provider (openai, anthropic, etc.).

        Returns:
            Created Insight instance with status="pending".
        """
        # Check if an insight already exists with the same parameters
        existing = await self.get_existing_insight(user_id, chat_ids, start_date, end_date)

        if existing:
            # If completed, return it (cache hit)
            if existing.status == "completed":
                return existing

            # If pending/processing/failed, delete it and create a new one
            await self.session.delete(existing)
            await self.session.flush()

        # Create new insight
        insight = Insight(
            user_id=user_id,
            chat_ids=chat_ids,
            chat_titles=chat_titles,
            start_date=start_date,
            end_date=end_date,
            message_count=message_count,
            status="pending",
            model_used=model_used,
            provider_used=provider_used,
        )
        self.session.add(insight)
        await self.session.commit()
        return insight

    @db_retry
    async def get_insight_by_id(self, insight_id: UUID, user_id: UUID) -> Insight | None:
        """Get insight by ID for a specific user.

        Args:
            insight_id: UUID of the insight.
            user_id: UUID of the user (for access control).

        Returns:
            Insight instance if found and belongs to user, None otherwise.
        """
        stmt = select(Insight).where(Insight.id == insight_id).where(Insight.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    @db_retry
    async def list_insights(
        self,
        user_id: UUID,
        limit: int = 10,
        offset: int = 0,
    ) -> tuple[list[Insight], int]:
        """List user's insights with pagination.

        Args:
            user_id: UUID of the user.
            limit: Maximum number of insights to return (default: 10).
            offset: Number of insights to skip for pagination (default: 0).

        Returns:
            Tuple of (list of Insight instances, total count).
        """
        # Get total count
        count_stmt = select(func.count(Insight.id)).where(Insight.user_id == user_id)
        count_result = await self.session.execute(count_stmt)
        total = count_result.scalar_one()

        # Get paginated results
        stmt = (
            select(Insight)
            .where(Insight.user_id == user_id)
            .order_by(Insight.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        insights = list(result.scalars().all())

        return insights, total

    @db_retry
    async def update_insight_status(
        self,
        insight_id: UUID,
        status: str,
        error_message: str | None = None,
    ) -> None:
        """Update insight status.

        Sets completed_at if status is "completed".

        Args:
            insight_id: UUID of the insight.
            status: New status value (pending, processing, completed, failed).
            error_message: Optional error message if status is "failed".
        """
        stmt = select(Insight).where(Insight.id == insight_id)
        result = await self.session.execute(stmt)
        insight = result.scalar_one_or_none()

        if insight:
            insight.status = status
            if error_message:
                insight.error_message = error_message
            if status == "completed":
                insight.completed_at = datetime.now(UTC)
            await self.session.commit()

    @db_retry
    async def update_insight_content(
        self,
        insight_id: UUID,
        summary: str | None = None,
        input_tokens: int | None = None,
        output_tokens: int | None = None,
        cost_usd: float | None = None,
        generation_time_ms: int | None = None,
    ) -> None:
        """Update insight with generated content.

        Only updates fields that are provided (not None).

        Args:
            insight_id: UUID of the insight.
            summary: Generated summary text.
            input_tokens: LLM input token count.
            output_tokens: LLM output token count.
            cost_usd: Cost in USD.
            generation_time_ms: Generation time in milliseconds.
        """
        stmt = select(Insight).where(Insight.id == insight_id)
        result = await self.session.execute(stmt)
        insight = result.scalar_one_or_none()

        if insight:
            if summary is not None:
                insight.summary = summary
            if input_tokens is not None:
                insight.input_tokens = input_tokens
            if output_tokens is not None:
                insight.output_tokens = output_tokens
            if cost_usd is not None:
                insight.cost_usd = cost_usd
            if generation_time_ms is not None:
                insight.generation_time_ms = generation_time_ms

            await self.session.commit()
