"""Unit tests for insights service."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from src.core.exceptions import (
    InsightGenerationError,
    MessageLimitExceededError,
)
from src.llm.provider import LLMResponse
from src.models.insight import Insight
from src.services.insights_service import (
    MAX_MESSAGES_DB_FETCH,
    InsightsService,
)

pytestmark = pytest.mark.asyncio


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def mock_message_repo():
    return AsyncMock()


@pytest.fixture
def mock_insights_repo():
    return AsyncMock()


@pytest.fixture
def mock_settings():
    """Patch get_settings used inside InsightsService."""
    settings = MagicMock()
    settings.llm_model = "test-model"
    with patch("src.services.insights_service.get_settings", return_value=settings):
        yield settings


@pytest.fixture
def insights_service(
    mock_message_repo,
    mock_insights_repo,
    mock_settings,
):
    return InsightsService(
        message_repo=mock_message_repo,
        insights_repo=mock_insights_repo,
    )


@pytest.fixture
def user_id():
    return uuid4()


# =============================================================================
# Test Custom Exceptions
# =============================================================================


class TestCustomExceptions:
    def test_insight_generation_error(self):
        error = InsightGenerationError("Test error message")
        assert str(error) == "Test error message"
        assert isinstance(error, Exception)

    def test_insight_generation_error_with_cause(self):
        cause = ValueError("Original error")
        error = InsightGenerationError("Wrapper error")
        try:
            raise error from cause
        except InsightGenerationError as e:
            assert str(e) == "Wrapper error"
            assert e.__cause__ == cause

    def test_message_limit_exceeded_error(self):
        error = MessageLimitExceededError("Too many messages")
        assert str(error) == "Too many messages"
        assert isinstance(error, Exception)


# =============================================================================
# Test Validation
# =============================================================================


class TestValidateRequest:
    async def test_returns_valid_for_acceptable_message_count(
        self, insights_service, mock_message_repo, user_id
    ):
        messages = [MagicMock(id=uuid4()) for _ in range(500)]
        mock_message_repo.get_messages_for_insights.return_value = messages

        (
            valid,
            message_count,
            exceeds_limit,
            estimated_tokens,
            suggested_filters,
        ) = await insights_service.validate_request(
            user_id,
            [1, 2, 3],
            datetime.now(UTC) - timedelta(days=7),
            datetime.now(UTC),
        )

        assert valid is True
        assert message_count == 500
        assert exceeds_limit is False
        assert estimated_tokens is None
        assert suggested_filters is None

    async def test_returns_invalid_when_exceeds_max_messages(
        self, insights_service, mock_message_repo, user_id
    ):
        messages = [MagicMock(id=uuid4()) for _ in range(MAX_MESSAGES_DB_FETCH + 1)]
        mock_message_repo.get_messages_for_insights.return_value = messages

        (
            valid,
            message_count,
            exceeds_limit,
            _,
            suggested_filters,
        ) = await insights_service.validate_request(
            user_id,
            [1, 2, 3],
            datetime.now(UTC) - timedelta(days=30),
            datetime.now(UTC),
        )

        assert valid is False
        assert message_count == MAX_MESSAGES_DB_FETCH + 1
        assert exceeds_limit is True
        assert suggested_filters is not None
        assert "suggestion" in suggested_filters
        assert suggested_filters["max_allowed"] == MAX_MESSAGES_DB_FETCH

    async def test_returns_invalid_when_no_messages_found(
        self, insights_service, mock_message_repo, user_id
    ):
        mock_message_repo.get_messages_for_insights.return_value = []

        valid, message_count, exceeds_limit, _, _ = await insights_service.validate_request(
            user_id,
            [1, 2, 3],
            datetime.now(UTC) - timedelta(days=7),
            datetime.now(UTC),
        )

        assert valid is False
        assert message_count == 0
        assert exceeds_limit is False


# =============================================================================
# Test Generate Insight
# =============================================================================


def _make_messages(count=100):
    messages = []
    for i in range(count):
        msg = MagicMock()
        msg.id = uuid4()
        msg.content = f"Message {i}"
        msg.chat_id = 1
        msg.chat_title = "Test Chat"
        msg.chat_type = "channel"
        msg.timestamp = datetime.now(UTC)
        msg.sender_name = "Test User"
        messages.append(msg)
    return messages


def _make_llm_response(content="Test insight summary", model="test-model"):
    return LLMResponse(
        content=content, model=model, usage={"prompt_tokens": 100, "completion_tokens": 50}
    )


class TestGenerateInsight:
    async def test_raises_error_when_no_messages_found(
        self, insights_service, mock_insights_repo, mock_message_repo, user_id
    ):
        mock_message_repo.get_messages_for_insights.return_value = []
        with pytest.raises(InsightGenerationError, match="No messages found"):
            await insights_service.generate_insight(
                user_id=user_id,
                chat_ids=[1, 2],
                chat_titles=["Chat 1", "Chat 2"],
                start_date=datetime.now(UTC) - timedelta(days=7),
                end_date=datetime.now(UTC),
            )

    async def test_creates_insight_and_calls_llm(
        self, insights_service, mock_insights_repo, mock_message_repo, user_id
    ):
        messages = _make_messages(100)
        mock_message_repo.get_messages_for_insights.return_value = messages

        insight_id = uuid4()
        created_insight = Insight(
            id=insight_id,
            user_id=user_id,
            chat_ids=[1, 2],
            chat_titles=["Chat 1", "Chat 2"],
            start_date=datetime.now(UTC) - timedelta(days=7),
            end_date=datetime.now(UTC),
            message_count=100,
            status="pending",
            model_used="test-model",
            provider_used="litellm",
        )
        mock_insights_repo.create_insight.return_value = created_insight
        completed_insight = created_insight
        completed_insight.status = "completed"
        completed_insight.summary = "Test insight summary"
        mock_insights_repo.get_insight_by_id.return_value = completed_insight

        with (
            patch(
                "src.services.insights_service.llm_complete",
                new_callable=AsyncMock,
                return_value=_make_llm_response(),
            ) as mock_llm,
            patch(
                "src.services.insights_service._get_model_max_input_tokens",
                return_value=128_000,
            ),
            patch(
                "src.services.insights_service.litellm.token_counter",
                return_value=5000,
            ),
        ):
            result = await insights_service.generate_insight(
                user_id=user_id,
                chat_ids=[1, 2],
                chat_titles=["Chat 1", "Chat 2"],
                start_date=datetime.now(UTC) - timedelta(days=7),
                end_date=datetime.now(UTC),
            )

        mock_insights_repo.create_insight.assert_called_once()
        mock_llm.assert_called_once()
        mock_insights_repo.update_insight_status.assert_any_call(insight_id, "generating")
        mock_insights_repo.update_insight_content.assert_called_once()
        mock_insights_repo.update_insight_status.assert_any_call(insight_id, "completed")
        assert result.status == "completed"

    async def test_marks_insight_failed_on_error(
        self, insights_service, mock_insights_repo, mock_message_repo, user_id
    ):
        messages = _make_messages(100)
        mock_message_repo.get_messages_for_insights.return_value = messages

        insight_id = uuid4()
        created_insight = Insight(
            id=insight_id,
            user_id=user_id,
            chat_ids=[1, 2],
            chat_titles=["Chat 1", "Chat 2"],
            start_date=datetime.now(UTC) - timedelta(days=7),
            end_date=datetime.now(UTC),
            message_count=100,
            status="pending",
            model_used="test-model",
            provider_used="litellm",
        )
        mock_insights_repo.create_insight.return_value = created_insight

        with (
            patch(
                "src.services.insights_service.llm_complete",
                new_callable=AsyncMock,
                side_effect=Exception("LLM failed"),
            ),
            patch(
                "src.services.insights_service._get_model_max_input_tokens",
                return_value=128_000,
            ),
            patch(
                "src.services.insights_service.litellm.token_counter",
                return_value=5000,
            ),
        ):
            with pytest.raises(InsightGenerationError, match="Failed to generate insight"):
                await insights_service.generate_insight(
                    user_id=user_id,
                    chat_ids=[1, 2],
                    chat_titles=["Chat 1", "Chat 2"],
                    start_date=datetime.now(UTC) - timedelta(days=7),
                    end_date=datetime.now(UTC),
                )

        mock_insights_repo.update_insight_status.assert_any_call(insight_id, "failed", "LLM failed")


# =============================================================================
# Test Retrieval
# =============================================================================


class TestGetInsight:
    async def test_gets_insight_by_id(self, insights_service, mock_insights_repo, user_id):
        insight_id = uuid4()
        await insights_service.get_insight(insight_id, user_id)
        mock_insights_repo.get_insight_by_id.assert_called_once_with(insight_id, user_id)


class TestListInsights:
    async def test_lists_insights_with_pagination(
        self, insights_service, mock_insights_repo, user_id
    ):
        await insights_service.list_insights(user_id, limit=10, offset=0)
        mock_insights_repo.list_insights.assert_called_once_with(user_id, 10, 0)
