"""
Unit tests for InsightsRepository.

Tests all database operations for insights and consent
with mocked AsyncSession.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.models.insight import Insight
from src.models.user import User
from src.repositories.insights_repository import InsightsRepository

pytestmark = pytest.mark.asyncio


class TestConsentOperations:
    """Test suite for simplified boolean consent operations."""

    @pytest.fixture
    def mock_session(self):
        """Create a mock async database session."""
        session = AsyncMock()
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        return session

    @pytest.fixture
    def repository(self, mock_session):
        """Create InsightsRepository with mocked session."""
        return InsightsRepository(mock_session)

    async def test_get_consent_returns_true_when_user_consented(self, repository, mock_session):
        """Test that get_consent returns True when user has given consent."""
        user_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = True
        mock_session.execute.return_value = mock_result

        result = await repository.get_consent(user_id)

        assert result is True
        mock_session.execute.assert_called_once()

    async def test_get_consent_returns_false_when_user_not_consented(
        self, repository, mock_session
    ):
        """Test that get_consent returns False when user has not consented."""
        user_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = False
        mock_session.execute.return_value = mock_result

        result = await repository.get_consent(user_id)

        assert result is False
        mock_session.execute.assert_called_once()

    async def test_get_consent_returns_false_when_user_not_found(self, repository, mock_session):
        """Test that get_consent returns False when user does not exist."""
        user_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        result = await repository.get_consent(user_id)

        assert result is False
        mock_session.execute.assert_called_once()

    async def test_set_consent_sets_value_true(self, repository, mock_session):
        """Test that set_consent sets llm_consent_given to True."""
        user_id = uuid4()
        user = MagicMock(spec=User)
        user.llm_consent_given = False

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_session.execute.return_value = mock_result

        await repository.set_consent(user_id, True)

        assert user.llm_consent_given is True
        mock_session.commit.assert_called_once()

    async def test_set_consent_sets_value_false(self, repository, mock_session):
        """Test that set_consent sets llm_consent_given to False."""
        user_id = uuid4()
        user = MagicMock(spec=User)
        user.llm_consent_given = True

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_session.execute.return_value = mock_result

        await repository.set_consent(user_id, False)

        assert user.llm_consent_given is False
        mock_session.commit.assert_called_once()

    async def test_set_consent_does_nothing_when_user_not_found(self, repository, mock_session):
        """Test that set_consent does nothing when user does not exist."""
        user_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        await repository.set_consent(user_id, True)

        mock_session.commit.assert_not_called()


class TestInsightOperations:
    """Test suite for insight CRUD operations."""

    @pytest.fixture
    def mock_session(self):
        """Create a mock async database session."""
        session = AsyncMock()
        session.execute = AsyncMock()
        session.add = MagicMock()
        session.commit = AsyncMock()
        session.delete = AsyncMock()
        return session

    @pytest.fixture
    def repository(self, mock_session):
        """Create InsightsRepository with mocked session."""
        return InsightsRepository(mock_session)

    async def test_create_insight_creates_with_pending_status(self, repository, mock_session):
        """Test that create_insight creates insight with pending status."""
        user_id = uuid4()
        chat_ids = [123, 456, 789]
        chat_titles = ["Chat 1", "Chat 2", "Chat 3"]
        start_date = datetime.now(UTC) - timedelta(days=7)
        end_date = datetime.now(UTC)
        message_count = 150
        model_used = "gpt-4"
        provider_used = "openai"

        # First execute call is get_existing_insight (returns None = no existing)
        mock_existing_result = MagicMock()
        mock_existing_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_existing_result

        result = await repository.create_insight(
            user_id=user_id,
            chat_ids=chat_ids,
            chat_titles=chat_titles,
            start_date=start_date,
            end_date=end_date,
            message_count=message_count,
            model_used=model_used,
            provider_used=provider_used,
        )

        assert isinstance(result, Insight)
        assert result.user_id == user_id
        assert result.chat_ids == chat_ids
        assert result.chat_titles == chat_titles
        assert result.start_date == start_date
        assert result.end_date == end_date
        assert result.message_count == message_count
        assert result.status == "pending"
        assert result.model_used == model_used
        assert result.provider_used == provider_used
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

    async def test_get_insight_by_id_returns_insight_for_correct_user(
        self, repository, mock_session
    ):
        """Test that get_insight_by_id returns insight for correct user."""
        insight_id = uuid4()
        user_id = uuid4()
        insight = Insight(
            id=insight_id,
            user_id=user_id,
            chat_ids=[123],
            start_date=datetime.now(UTC),
            end_date=datetime.now(UTC),
            message_count=10,
            status="completed",
            model_used="gpt-4",
            provider_used="openai",
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = insight
        mock_session.execute.return_value = mock_result

        result = await repository.get_insight_by_id(insight_id, user_id)

        assert result == insight
        assert result.id == insight_id
        assert result.user_id == user_id
        mock_session.execute.assert_called_once()

    async def test_get_insight_by_id_returns_none_for_wrong_user(self, repository, mock_session):
        """Test that get_insight_by_id returns None for wrong user."""
        insight_id = uuid4()
        wrong_user_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        result = await repository.get_insight_by_id(insight_id, wrong_user_id)

        assert result is None
        mock_session.execute.assert_called_once()

    async def test_list_insights_returns_paginated_results(self, repository, mock_session):
        """Test that list_insights returns paginated results with total count."""
        user_id = uuid4()
        insights = [
            Insight(
                id=uuid4(),
                user_id=user_id,
                chat_ids=[123],
                start_date=datetime.now(UTC),
                end_date=datetime.now(UTC),
                message_count=10,
                status="completed",
                model_used="gpt-4",
                provider_used="openai",
            )
            for _ in range(5)
        ]

        mock_count_result = MagicMock()
        mock_count_result.scalar_one.return_value = 25

        mock_list_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = insights
        mock_list_result.scalars.return_value = mock_scalars

        mock_session.execute.side_effect = [mock_count_result, mock_list_result]

        result_insights, total = await repository.list_insights(user_id, limit=5, offset=10)

        assert len(result_insights) == 5
        assert total == 25
        assert mock_session.execute.call_count == 2

    async def test_list_insights_default_pagination(self, repository, mock_session):
        """Test that list_insights uses default limit=10, offset=0."""
        user_id = uuid4()
        insights = [
            Insight(
                id=uuid4(),
                user_id=user_id,
                chat_ids=[123],
                start_date=datetime.now(UTC),
                end_date=datetime.now(UTC),
                message_count=10,
                status="completed",
                model_used="gpt-4",
                provider_used="openai",
            )
            for _ in range(10)
        ]

        mock_count_result = MagicMock()
        mock_count_result.scalar_one.return_value = 10

        mock_list_result = MagicMock()
        mock_scalars = MagicMock()
        mock_scalars.all.return_value = insights
        mock_list_result.scalars.return_value = mock_scalars

        mock_session.execute.side_effect = [mock_count_result, mock_list_result]

        result_insights, total = await repository.list_insights(user_id)

        assert len(result_insights) == 10
        assert total == 10

    async def test_update_insight_status_updates_status_field(self, repository, mock_session):
        """Test that update_insight_status updates the status field."""
        insight_id = uuid4()
        insight = Insight(
            id=insight_id,
            user_id=uuid4(),
            chat_ids=[123],
            start_date=datetime.now(UTC),
            end_date=datetime.now(UTC),
            message_count=10,
            status="pending",
            model_used="gpt-4",
            provider_used="openai",
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = insight
        mock_session.execute.return_value = mock_result

        await repository.update_insight_status(insight_id, "processing")

        assert insight.status == "processing"
        mock_session.commit.assert_called_once()

    async def test_update_insight_status_sets_completed_at_when_completed(
        self, repository, mock_session
    ):
        """Test that update_insight_status sets completed_at when status is completed."""
        insight_id = uuid4()
        insight = Insight(
            id=insight_id,
            user_id=uuid4(),
            chat_ids=[123],
            start_date=datetime.now(UTC),
            end_date=datetime.now(UTC),
            message_count=10,
            status="processing",
            model_used="gpt-4",
            provider_used="openai",
            completed_at=None,
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = insight
        mock_session.execute.return_value = mock_result

        before_update = datetime.now(UTC)
        await repository.update_insight_status(insight_id, "completed")
        after_update = datetime.now(UTC)

        assert insight.status == "completed"
        assert insight.completed_at is not None
        assert before_update <= insight.completed_at <= after_update
        mock_session.commit.assert_called_once()

    async def test_update_insight_status_sets_error_message_when_failed(
        self, repository, mock_session
    ):
        """Test that update_insight_status sets error_message when status is failed."""
        insight_id = uuid4()
        insight = Insight(
            id=insight_id,
            user_id=uuid4(),
            chat_ids=[123],
            start_date=datetime.now(UTC),
            end_date=datetime.now(UTC),
            message_count=10,
            status="processing",
            model_used="gpt-4",
            provider_used="openai",
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = insight
        mock_session.execute.return_value = mock_result

        error_msg = "API timeout occurred"
        await repository.update_insight_status(insight_id, "failed", error_msg)

        assert insight.status == "failed"
        assert insight.error_message == error_msg
        mock_session.commit.assert_called_once()

    async def test_update_insight_status_does_nothing_when_insight_not_found(
        self, repository, mock_session
    ):
        """Test that update_insight_status does nothing when insight not found."""
        insight_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        await repository.update_insight_status(insight_id, "completed")

        mock_session.commit.assert_not_called()

    async def test_update_insight_content_updates_all_fields(self, repository, mock_session):
        """Test that update_insight_content updates all provided fields."""
        insight_id = uuid4()
        insight = Insight(
            id=insight_id,
            user_id=uuid4(),
            chat_ids=[123],
            start_date=datetime.now(UTC),
            end_date=datetime.now(UTC),
            message_count=10,
            status="processing",
            model_used="gpt-4",
            provider_used="openai",
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = insight
        mock_session.execute.return_value = mock_result

        await repository.update_insight_content(
            insight_id=insight_id,
            summary="Generated summary text",
            input_tokens=1000,
            output_tokens=500,
            cost_usd=0.05,
            generation_time_ms=2500,
        )

        assert insight.summary == "Generated summary text"
        assert insight.input_tokens == 1000
        assert insight.output_tokens == 500
        assert insight.cost_usd == 0.05
        assert insight.generation_time_ms == 2500
        mock_session.commit.assert_called_once()

    async def test_update_insight_content_updates_only_provided_fields(
        self, repository, mock_session
    ):
        """Test that update_insight_content only updates fields that are provided."""
        insight_id = uuid4()
        insight = Insight(
            id=insight_id,
            user_id=uuid4(),
            chat_ids=[123],
            start_date=datetime.now(UTC),
            end_date=datetime.now(UTC),
            message_count=10,
            status="processing",
            model_used="gpt-4",
            provider_used="openai",
            summary="Old summary",
            input_tokens=100,
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = insight
        mock_session.execute.return_value = mock_result

        await repository.update_insight_content(
            insight_id=insight_id,
            summary="New summary",
        )

        assert insight.summary == "New summary"
        assert insight.input_tokens == 100  # Unchanged
        mock_session.commit.assert_called_once()

    async def test_update_insight_content_does_nothing_when_insight_not_found(
        self, repository, mock_session
    ):
        """Test that update_insight_content does nothing when insight not found."""
        insight_id = uuid4()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        await repository.update_insight_content(
            insight_id=insight_id,
            summary="New summary",
        )

        mock_session.commit.assert_not_called()
