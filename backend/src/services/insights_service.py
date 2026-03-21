"""Service for generating AI-powered message insights."""

import logging
import time
from datetime import datetime
from uuid import UUID

import litellm

from src.core.config import get_settings
from src.core.exceptions import (
    InsightGenerationError,
)
from src.llm.prompts import format_messages_for_llm, get_insights_system_prompt
from src.llm.provider import complete as llm_complete
from src.models.insight import Insight
from src.repositories.insights_repository import InsightsRepository
from src.repositories.message_repository import MessageRepository
from src.schemas.insights import SUPPORTED_LANGUAGES

logger = logging.getLogger(__name__)

# Hard cap on DB fetch to avoid loading unbounded rows.
# Real token-based truncation happens after formatting.
MAX_MESSAGES_DB_FETCH = 5000

DEFAULT_MAX_INPUT_TOKENS = 128_000
MAX_OUTPUT_TOKENS = 16384


def _get_model_max_input_tokens(model: str) -> int:
    """Get max input tokens for a model via litellm, with fallback."""
    try:
        info = litellm.get_model_info(model)
        max_input = info.get("max_input_tokens") or info.get("max_tokens")
        if max_input:
            return int(max_input)
    except Exception:
        logger.warning(
            f"Could not get model info for {model}, "
            f"using default {DEFAULT_MAX_INPUT_TOKENS} max input tokens"
        )
    return DEFAULT_MAX_INPUT_TOKENS


class InsightsService:
    """Service for generating AI-powered message insights."""

    def __init__(
        self,
        message_repo: MessageRepository,
        insights_repo: InsightsRepository,
    ):
        self.message_repo = message_repo
        self.insights_repo = insights_repo

    # =========================================================================
    # Validation
    # =========================================================================

    async def validate_request(
        self,
        user_id: UUID,
        chat_ids: list[int],
        start_date: datetime,
        end_date: datetime,
    ) -> tuple[bool, int, bool, int | None, dict | None]:
        """Validate insight generation request.

        Returns:
            Tuple of (valid, message_count, exceeds_limit, estimated_tokens, suggested_filters)
        """
        # Count messages for the filters
        messages = await self.message_repo.get_messages_for_insights(
            user_id=user_id,
            chat_ids=chat_ids,
            start_date=start_date,
            end_date=end_date,
            limit=MAX_MESSAGES_DB_FETCH + 1,
        )

        message_count = len(messages)
        exceeds_limit = message_count > MAX_MESSAGES_DB_FETCH

        suggested_filters = None
        if exceeds_limit:
            suggested_filters = {
                "suggestion": "Please narrow your date range or select fewer channels",
                "message_count": message_count,
                "max_allowed": MAX_MESSAGES_DB_FETCH,
            }

        valid = not exceeds_limit and message_count > 0

        return valid, message_count, exceeds_limit, None, suggested_filters

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

            # Update status to generating
            await self.insights_repo.update_insight_status(insight.id, "generating")

            # Get language name for prompt
            language_name = SUPPORTED_LANGUAGES.get(language, "English")
            system_prompt = get_insights_system_prompt(language, language_name)

            # Get model's context window from litellm
            model_max_input = _get_model_max_input_tokens(settings.llm_model)
            max_input = model_max_input - MAX_OUTPUT_TOKENS

            # Format messages and truncate to fit within token budget
            user_content = format_messages_for_llm(messages)
            llm_messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ]

            token_count = litellm.token_counter(model=settings.llm_model, messages=llm_messages)
            logger.info(
                f"{log_prefix}: estimated {token_count} input tokens "
                f"(limit {max_input}, model max {model_max_input}) "
                f"from {len(messages)} messages"
            )

            # Truncate oldest messages until we fit within the token budget
            while token_count > max_input and len(messages) > 10:
                # Drop the oldest 10% of messages
                drop = max(1, len(messages) // 10)
                messages = messages[drop:]
                user_content = format_messages_for_llm(messages)
                llm_messages[1]["content"] = user_content
                token_count = litellm.token_counter(model=settings.llm_model, messages=llm_messages)
                logger.info(
                    f"{log_prefix}: truncated to {len(messages)} messages, {token_count} tokens"
                )

            if token_count > max_input:
                raise InsightGenerationError(
                    f"Input too large even after truncation: "
                    f"{token_count} tokens exceeds {max_input} limit"
                )

            # Call LLM
            start_time = time.time()
            response = await llm_complete(messages=llm_messages, max_tokens=MAX_OUTPUT_TOKENS)

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
        1. Fetches messages (single fetch, no double-fetch)
        2. Calls LLM for completion (with auto-truncation to fit context window)
        3. Stores and returns the result
        """
        # Fetch messages ONCE
        messages = await self.message_repo.get_messages_for_insights(
            user_id=user_id,
            chat_ids=chat_ids,
            start_date=start_date,
            end_date=end_date,
            limit=MAX_MESSAGES_DB_FETCH,
        )

        if len(messages) == 0:
            raise InsightGenerationError("No messages found for the specified filters")

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
        1. Fetches messages by IDs
        2. Extracts chat_ids and date range from fetched messages
        3. Calls LLM for completion (with auto-truncation to fit context window)
        4. Stores and returns the result
        """
        # Fetch messages by IDs
        messages = await self.message_repo.get_messages_by_ids(
            user_id=user_id,
            message_ids=message_ids,
        )

        if len(messages) == 0:
            raise InsightGenerationError("No messages found for the specified IDs")

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
