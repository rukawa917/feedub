"""Service for generating AI-powered message insights."""

import logging
import time
from datetime import UTC, datetime
from uuid import UUID

from src.core.config import get_settings
from src.core.exceptions import (
    ConsentRequiredError,
    InsightGenerationError,
    InsightRateLimitError,
    MessageLimitExceededError,
)
from src.llm.prompts import format_messages_for_llm, get_insights_system_prompt
from src.llm.provider import complete as llm_complete
from src.models.insight import Insight
from src.repositories.insights_repository import InsightsRepository
from src.repositories.message_repository import MessageRepository
from src.schemas.insights import SUPPORTED_LANGUAGES

logger = logging.getLogger(__name__)

# Constants
TOKENS_PER_MESSAGE_ESTIMATE = 60  # Average tokens per message


class InsightsService:
    """Service for generating AI-powered message insights."""

    def __init__(
        self,
        message_repo: MessageRepository,
        insights_repo: InsightsRepository,
    ):
        self.message_repo = message_repo
        self.insights_repo = insights_repo

    @property
    def max_messages(self) -> int:
        """Derive max messages from llm_max_input_tokens setting."""
        return get_settings().llm_max_input_tokens // TOKENS_PER_MESSAGE_ESTIMATE

    # =========================================================================
    # Consent Management
    # =========================================================================

    async def give_consent(self, user_id: UUID) -> None:
        """Set llm_consent_given=True for the user."""
        await self.insights_repo.set_consent(user_id, True)

    async def revoke_consent(self, user_id: UUID) -> None:
        """Set llm_consent_given=False for the user."""
        await self.insights_repo.set_consent(user_id, False)

    async def check_consent(self, user_id: UUID) -> bool:
        """Check if user has given LLM consent."""
        return await self.insights_repo.get_consent(user_id)

    # =========================================================================
    # Usage Management
    # =========================================================================

    async def check_usage(self, user_id: UUID) -> tuple[int, int, int, datetime]:
        """Check user's usage for today.

        Returns:
            Tuple of (daily_limit, used_today, remaining_today, resets_at)
        """
        daily_limit = 1000000  # effectively unlimited for self-hosted

        used_today = await self.insights_repo.get_usage_count_today(user_id)
        remaining = max(0, daily_limit - used_today)

        # Calculate reset time (midnight UTC)
        now = datetime.now(UTC)
        tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0)
        if tomorrow <= now:
            from datetime import timedelta

            tomorrow += timedelta(days=1)

        return daily_limit, used_today, remaining, tomorrow

    async def can_generate(self, user_id: UUID) -> bool:
        """Check if user can generate more insights today."""
        _, _, remaining, _ = await self.check_usage(user_id)
        return remaining > 0

    # =========================================================================
    # Validation
    # =========================================================================

    async def validate_request(
        self,
        user_id: UUID,
        chat_ids: list[int],
        start_date: datetime,
        end_date: datetime,
    ) -> tuple[bool, int, bool, int | None, int, dict | None]:
        """Validate insight generation request.

        Returns:
            Tuple of (valid, message_count, exceeds_limit, estimated_tokens, max_messages, suggested_filters)
        """
        max_msgs = self.max_messages

        # Count messages for the filters
        messages = await self.message_repo.get_messages_for_insights(
            user_id=user_id,
            chat_ids=chat_ids,
            start_date=start_date,
            end_date=end_date,
            limit=max_msgs + 1,  # Fetch one extra to check if exceeds
        )

        message_count = len(messages)
        exceeds_limit = message_count > max_msgs
        estimated_tokens = min(message_count, max_msgs) * TOKENS_PER_MESSAGE_ESTIMATE

        suggested_filters = None
        if exceeds_limit:
            # Suggest narrower date range
            suggested_filters = {
                "suggestion": "Please narrow your date range or select fewer channels",
                "message_count": message_count,
                "max_allowed": max_msgs,
            }

        valid = not exceeds_limit and message_count > 0

        return valid, message_count, exceeds_limit, estimated_tokens, max_msgs, suggested_filters

    # =========================================================================
    # Generation
    # =========================================================================

    async def _generate_insight_core(
        self,
        user_id: UUID,
        messages: list,
        chat_ids: list[int],
        chat_titles: list[str] | None,
        start_date: datetime,
        end_date: datetime,
        language: str,
        log_prefix: str = "Generating insight",
    ) -> Insight:
        """Core insight generation logic shared by generate_insight and generate_insight_from_ids.

        Creates the insight record, formats messages, calls the LLM (with fallback),
        calculates cost, updates status, increments usage, and returns the completed insight.

        Callers are responsible for consent/usage validation and message fetching.
        """
        message_count = len(messages)

        settings = get_settings()

        # Create insight record
        insight = await self.insights_repo.create_insight(
            user_id=user_id,
            chat_ids=chat_ids,
            chat_titles=chat_titles,
            start_date=start_date,
            end_date=end_date,
            message_count=message_count,
            model_used=settings.llm_model,
            provider_used="litellm",
        )

        try:
            logger.info(f"{log_prefix} for user {user_id}: {len(messages)} messages")

            # Format for LLM (pass messages directly without cluster deduplication)
            user_content = format_messages_for_llm(messages)

            # Update status to generating
            await self.insights_repo.update_insight_status(insight.id, "generating")

            # Call LLM
            start_time = time.time()

            # Get language name for prompt
            language_name = SUPPORTED_LANGUAGES.get(language, "English")
            system_prompt = get_insights_system_prompt(language, language_name)

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ]
            response = await llm_complete(messages=messages, max_tokens=16384)

            # Update model info from response
            insight.model_used = response.model

            generation_time = int((time.time() - start_time) * 1000)

            input_tokens = response.usage.get("prompt_tokens", 0)
            output_tokens = response.usage.get("completion_tokens", 0)
            cost = (input_tokens * 0.15 + output_tokens * 0.60) / 1_000_000

            # Update insight with results
            await self.insights_repo.update_insight_content(
                insight_id=insight.id,
                summary=response.content,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost_usd=cost,
                generation_time_ms=generation_time,
            )

            # Mark as completed
            await self.insights_repo.update_insight_status(insight.id, "completed")

            # Increment usage
            await self.insights_repo.increment_usage(user_id)

            # Refresh and return
            return await self.insights_repo.get_insight_by_id(insight.id, user_id)

        except Exception as e:
            logger.error(f"Insight generation failed: {e}")
            await self.insights_repo.update_insight_status(insight.id, "failed", str(e))
            raise InsightGenerationError(f"Failed to generate insight: {e}") from e

    async def generate_insight(
        self,
        user_id: UUID,
        chat_ids: list[int],
        chat_titles: list[str] | None,
        start_date: datetime,
        end_date: datetime,
        language: str = "en",
    ) -> Insight:
        """Generate insight (non-streaming).

        This method:
        1. Validates consent and usage
        2. Fetches messages (single fetch, no double-fetch)
        3. Calls LLM for completion
        4. Stores and returns the result
        """
        # Check consent
        if not await self.check_consent(user_id):
            raise ConsentRequiredError("User consent required for insights")

        # Check usage limits
        if not await self.can_generate(user_id):
            _, _, _, reset_at = await self.check_usage(user_id)
            raise InsightRateLimitError("Daily insight limit exceeded", reset_at=reset_at)

        max_msgs = self.max_messages

        # Fetch messages ONCE (eliminates double-fetch from validate_request + generate)
        messages = await self.message_repo.get_messages_for_insights(
            user_id=user_id,
            chat_ids=chat_ids,
            start_date=start_date,
            end_date=end_date,
            limit=max_msgs + 1,  # Fetch one extra to check if exceeds limit
        )

        # Validate based on fetched messages
        message_count = len(messages)
        exceeds_limit = message_count > max_msgs

        if exceeds_limit:
            raise MessageLimitExceededError(
                f"Request exceeds {max_msgs} message limit",
                count=message_count,
                limit=max_msgs,
            )
        if message_count == 0:
            raise InsightGenerationError("No messages found for the specified filters")

        # Trim to max if we fetched the extra check message
        messages = messages[:max_msgs]

        return await self._generate_insight_core(
            user_id=user_id,
            messages=messages,
            chat_ids=chat_ids,
            chat_titles=chat_titles,
            start_date=start_date,
            end_date=end_date,
            language=language,
            log_prefix="Generating insight",
        )

    async def generate_insight_from_ids(
        self,
        user_id: UUID,
        message_ids: list[UUID],
        language: str = "en",
    ) -> Insight:
        """Generate insight from specific message IDs (non-streaming).

        This method:
        1. Validates consent and usage
        2. Fetches messages by IDs
        3. Extracts chat_ids and date range from fetched messages
        4. Calls LLM for completion
        5. Stores and returns the result
        """
        # Check consent
        if not await self.check_consent(user_id):
            raise ConsentRequiredError("User consent required for insights")

        # Check usage limits
        if not await self.can_generate(user_id):
            _, _, _, reset_at = await self.check_usage(user_id)
            raise InsightRateLimitError("Daily insight limit exceeded", reset_at=reset_at)

        # Fetch messages by IDs
        messages = await self.message_repo.get_messages_by_ids(
            user_id=user_id,
            message_ids=message_ids,
        )

        # Validate based on fetched messages
        max_msgs = self.max_messages
        message_count = len(messages)
        if message_count == 0:
            raise InsightGenerationError("No messages found for the specified IDs")
        if message_count > max_msgs:
            raise MessageLimitExceededError(
                f"Request exceeds {max_msgs} message limit",
                count=message_count,
                limit=max_msgs,
            )

        # Extract chat_ids and date range from fetched messages
        chat_ids = list({m.chat_id for m in messages})
        chat_titles = list({m.chat_title for m in messages if m.chat_title})
        start_date = min(m.timestamp for m in messages)
        end_date = max(m.timestamp for m in messages)

        return await self._generate_insight_core(
            user_id=user_id,
            messages=messages,
            chat_ids=chat_ids,
            chat_titles=chat_titles,
            start_date=start_date,
            end_date=end_date,
            language=language,
            log_prefix="Generating insight from IDs",
        )

    # =========================================================================
    # Retrieval
    # =========================================================================

    async def get_insight(self, insight_id: UUID, user_id: UUID) -> Insight | None:
        """Get a specific insight by ID."""
        return await self.insights_repo.get_insight_by_id(insight_id, user_id)

    async def list_insights(
        self, user_id: UUID, limit: int = 10, offset: int = 0
    ) -> tuple[list[Insight], int]:
        """List user's insights with pagination."""
        return await self.insights_repo.list_insights(user_id, limit, offset)
