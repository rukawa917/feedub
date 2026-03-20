"""
Integration tests for Korean text search in message repository.

Tests that Korean text search works correctly with real PostgreSQL database.
"""

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.message import Message
from src.models.user import User
from src.repositories.message_repository import MessageRepository


@pytest.mark.asyncio
class TestKoreanSearch:
    """Test suite for Korean text search functionality."""

    async def test_search_korean_text(self, async_session: AsyncSession):
        """Test that Korean text search returns matching messages."""
        # GIVEN: User and messages with Korean content
        user_id = uuid4()
        user = User(
            id=user_id,
            phone_number="+821012345678",
            session_string="test_session",
        )
        async_session.add(user)
        await async_session.commit()

        repo = MessageRepository(async_session)

        messages = [
            Message(
                id=uuid4(),
                user_id=user_id,
                telegram_message_id=1,
                chat_id=12345,
                chat_title="Test Chat",
                chat_type="private",
                sender_id=67890,
                sender_name="Test User",
                content="안녕하세요 반갑습니다",  # Korean: "Hello, nice to meet you"
                message_type="text",
                has_media=False,
                is_reply=False,
                is_forward=False,
                timestamp=datetime.now(UTC),
            ),
            Message(
                id=uuid4(),
                user_id=user_id,
                telegram_message_id=2,
                chat_id=12345,
                chat_title="Test Chat",
                chat_type="private",
                sender_id=67890,
                sender_name="Test User",
                content="오늘 날씨가 좋아요",  # Korean: "The weather is nice today"
                message_type="text",
                has_media=False,
                is_reply=False,
                is_forward=False,
                timestamp=datetime.now(UTC),
            ),
            Message(
                id=uuid4(),
                user_id=user_id,
                telegram_message_id=3,
                chat_id=12345,
                chat_title="Test Chat",
                chat_type="private",
                sender_id=67890,
                sender_name="Test User",
                content="Hello World",  # English for comparison
                message_type="text",
                has_media=False,
                is_reply=False,
                is_forward=False,
                timestamp=datetime.now(UTC),
            ),
        ]

        async_session.add_all(messages)
        await async_session.commit()

        # WHEN: Searching for Korean text "안녕"
        results = await repo.search_messages(
            user_id=user_id,
            search="안녕",
        )

        # THEN: Should return message containing "안녕"
        assert len(results) == 1
        assert results[0].content is not None
        assert "안녕하세요" in results[0].content

    async def test_search_korean_partial_match(self, async_session: AsyncSession):
        """Test that partial Korean text search works."""
        # GIVEN: User and message with Korean content
        user_id = uuid4()
        user = User(
            id=user_id,
            phone_number="+821012345679",
            session_string="test_session",
        )
        async_session.add(user)
        await async_session.commit()

        repo = MessageRepository(async_session)

        message = Message(
            id=uuid4(),
            user_id=user_id,
            telegram_message_id=1,
            chat_id=12345,
            chat_title="Test Chat",
            chat_type="private",
            sender_id=67890,
            sender_name="Test User",
            content="오늘은 정말 좋은 날씨입니다",  # "Today is really nice weather"
            message_type="text",
            has_media=False,
            is_reply=False,
            is_forward=False,
            timestamp=datetime.now(UTC),
        )

        async_session.add(message)
        await async_session.commit()

        # WHEN: Searching for partial Korean text
        results = await repo.search_messages(
            user_id=user_id,
            search="좋은 날씨",  # "nice weather"
        )

        # THEN: Should return message containing the phrase
        assert len(results) == 1
        assert results[0].content is not None
        assert "좋은 날씨" in results[0].content

    async def test_search_mixed_korean_english(self, async_session: AsyncSession):
        """Test that mixed Korean-English search works."""
        # GIVEN: User and messages with mixed Korean and English
        user_id = uuid4()
        user = User(
            id=user_id,
            phone_number="+821012345680",
            session_string="test_session",
        )
        async_session.add(user)
        await async_session.commit()

        repo = MessageRepository(async_session)

        messages = [
            Message(
                id=uuid4(),
                user_id=user_id,
                telegram_message_id=1,
                chat_id=12345,
                chat_title="Test Chat",
                chat_type="private",
                sender_id=67890,
                sender_name="Test User",
                content="Python 프로그래밍을 배우고 있어요",  # "I'm learning Python programming"
                message_type="text",
                has_media=False,
                is_reply=False,
                is_forward=False,
                timestamp=datetime.now(UTC),
            ),
            Message(
                id=uuid4(),
                user_id=user_id,
                telegram_message_id=2,
                chat_id=12345,
                chat_title="Test Chat",
                chat_type="private",
                sender_id=67890,
                sender_name="Test User",
                content="JavaScript는 재미있어요",  # "JavaScript is fun"
                message_type="text",
                has_media=False,
                is_reply=False,
                is_forward=False,
                timestamp=datetime.now(UTC),
            ),
        ]

        async_session.add_all(messages)
        await async_session.commit()

        # WHEN: Searching for English word in mixed content
        results = await repo.search_messages(
            user_id=user_id,
            search="Python",
        )

        # THEN: Should return message containing "Python"
        assert len(results) == 1
        assert results[0].content is not None
        assert "Python" in results[0].content

        # WHEN: Searching for Korean word in mixed content
        results = await repo.search_messages(
            user_id=user_id,
            search="프로그래밍",
        )

        # THEN: Should return message containing "프로그래밍"
        assert len(results) == 1
        assert results[0].content is not None
        assert "프로그래밍" in results[0].content

    async def test_search_korean_case_insensitive(self, async_session: AsyncSession):
        """Test that search is case-insensitive for English text."""
        # GIVEN: User and message with English content
        user_id = uuid4()
        user = User(
            id=user_id,
            phone_number="+821012345681",
            session_string="test_session",
        )
        async_session.add(user)
        await async_session.commit()

        repo = MessageRepository(async_session)

        message = Message(
            id=uuid4(),
            user_id=user_id,
            telegram_message_id=1,
            chat_id=12345,
            chat_title="Test Chat",
            chat_type="private",
            sender_id=67890,
            sender_name="Test User",
            content="Hello World from Python",
            message_type="text",
            has_media=False,
            is_reply=False,
            is_forward=False,
            timestamp=datetime.now(UTC),
        )

        async_session.add(message)
        await async_session.commit()

        # WHEN: Searching with different case
        results_lower = await repo.search_messages(
            user_id=user_id,
            search="hello",
        )
        results_upper = await repo.search_messages(
            user_id=user_id,
            search="HELLO",
        )
        results_mixed = await repo.search_messages(
            user_id=user_id,
            search="HeLLo",
        )

        # THEN: All should return the same message
        assert len(results_lower) == 1
        assert len(results_upper) == 1
        assert len(results_mixed) == 1
        assert results_lower[0].id == results_upper[0].id == results_mixed[0].id
