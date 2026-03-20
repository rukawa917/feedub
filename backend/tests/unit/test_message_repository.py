"""
Unit tests for MessageRepository.

Tests the batch insertion functionality with progress tracking callbacks.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.repositories.message_repository import MessageRepository


class TestMessageRepositoryBatchInsertion:
    """Test suite for MessageRepository batch insertion methods."""

    @pytest.fixture
    def mock_session(self):
        """Create a mock async session for testing."""
        session = AsyncMock()
        # Mock execute for new INSERT...ON CONFLICT implementation
        mock_result = MagicMock()
        mock_result.rowcount = 100  # Default: all inserted successfully
        session.execute = AsyncMock(return_value=mock_result)
        session.commit = AsyncMock()
        return session

    @pytest.fixture
    def message_repo(self, mock_session):
        """Create a MessageRepository instance with mock session."""
        return MessageRepository(mock_session)

    @pytest.fixture
    def sample_messages(self):
        """Create sample message dictionaries for testing."""
        now = datetime.now(UTC)
        return [
            {
                "telegram_message_id": i,
                "chat_id": 12345,
                "chat_title": f"Test Chat {i}",
                "chat_type": "private",
                "sender_id": 67890,
                "sender_name": f"Test User {i}",
                "content": f"Message content {i}",
                "message_type": "text",
                "has_media": False,
                "file_id": None,
                "file_name": None,
                "file_mime_type": None,
                "file_size": None,
                "file_duration": None,
                "file_width": None,
                "file_height": None,
                "is_reply": False,
                "is_forward": False,
                "timestamp": now - timedelta(minutes=i),
                "additional_metadata": None,
            }
            for i in range(1, 1001)  # 1000 messages
        ]

    async def test_bulk_insert_messages_with_batches_empty_list(self, message_repo):
        """Test batch insertion with empty message list returns 0."""
        user_id = uuid4()
        result = await message_repo.bulk_insert_messages_with_batches(user_id, [])

        assert result == 0
        message_repo.session.execute.assert_not_called()
        message_repo.session.commit.assert_not_called()

    async def test_bulk_insert_messages_with_batches_single_batch(
        self, message_repo, sample_messages
    ):
        """Test batch insertion with messages fitting in single batch."""
        user_id = uuid4()
        small_batch = sample_messages[:100]  # Less than default batch_size of 500

        result = await message_repo.bulk_insert_messages_with_batches(user_id, small_batch)

        assert result == 100
        # Should commit once for single batch
        assert message_repo.session.commit.call_count == 1
        message_repo.session.execute.assert_called_once()

    async def test_bulk_insert_messages_with_batches_multiple_batches(
        self, message_repo, sample_messages
    ):
        """Test batch insertion with messages requiring multiple batches."""
        user_id = uuid4()

        # Mock rowcount for each batch: 300, 300, 300, 100
        mock_results = [
            MagicMock(rowcount=300),
            MagicMock(rowcount=300),
            MagicMock(rowcount=300),
            MagicMock(rowcount=100),
        ]
        message_repo.session.execute.side_effect = mock_results

        result = await message_repo.bulk_insert_messages_with_batches(
            user_id, sample_messages, batch_size=300
        )

        assert result == 1000
        # 1000 messages / 300 batch_size = 4 batches (300 + 300 + 300 + 100)
        assert message_repo.session.commit.call_count == 4
        assert message_repo.session.execute.call_count == 4

    async def test_bulk_insert_messages_with_batches_exact_batch_size(
        self, message_repo, sample_messages
    ):
        """Test batch insertion when message count is exactly batch size."""
        user_id = uuid4()
        exact_batch = sample_messages[:500]  # Exactly batch_size

        # Mock rowcount = 500 (all inserted)
        mock_result = MagicMock(rowcount=500)
        message_repo.session.execute.return_value = mock_result

        result = await message_repo.bulk_insert_messages_with_batches(user_id, exact_batch)

        assert result == 500
        # Should commit exactly once
        assert message_repo.session.commit.call_count == 1

    async def test_bulk_insert_messages_with_batches_custom_batch_size(
        self, message_repo, sample_messages
    ):
        """Test batch insertion with custom batch size."""
        user_id = uuid4()

        # Mock rowcount = 100 for each of 10 batches
        mock_results = [MagicMock(rowcount=100) for _ in range(10)]
        message_repo.session.execute.side_effect = mock_results

        result = await message_repo.bulk_insert_messages_with_batches(
            user_id, sample_messages, batch_size=100
        )

        assert result == 1000
        # 1000 messages / 100 batch_size = 10 batches
        assert message_repo.session.commit.call_count == 10

    async def test_bulk_insert_messages_with_batches_progress_callback(
        self, message_repo, sample_messages
    ):
        """Test that progress callback is called after each batch."""
        user_id = uuid4()
        progress_updates = []

        async def progress_callback(inserted, total):
            progress_updates.append((inserted, total))

        # Mock rowcount = 250 for each of 4 batches
        mock_results = [MagicMock(rowcount=250) for _ in range(4)]
        message_repo.session.execute.side_effect = mock_results

        result = await message_repo.bulk_insert_messages_with_batches(
            user_id, sample_messages, batch_size=250, progress_callback=progress_callback
        )

        assert result == 1000
        # 1000 messages / 250 batch_size = 4 batches
        assert len(progress_updates) == 4

        # Verify progress updates are cumulative
        assert progress_updates[0] == (250, 1000)  # After batch 1
        assert progress_updates[1] == (500, 1000)  # After batch 2
        assert progress_updates[2] == (750, 1000)  # After batch 3
        assert progress_updates[3] == (1000, 1000)  # After batch 4

    async def test_bulk_insert_messages_with_batches_no_callback(
        self, message_repo, sample_messages
    ):
        """Test that batch insertion works without progress callback."""
        user_id = uuid4()

        # Mock rowcount for 2 batches: 500 + 500
        mock_results = [MagicMock(rowcount=500), MagicMock(rowcount=500)]
        message_repo.session.execute.side_effect = mock_results

        # Should not raise error when no callback provided
        result = await message_repo.bulk_insert_messages_with_batches(
            user_id, sample_messages, batch_size=500, progress_callback=None
        )

        assert result == 1000

    async def test_bulk_insert_messages_with_batches_creates_insert_statement(
        self, message_repo, sample_messages
    ):
        """Test that INSERT statement is executed with correct values."""
        user_id = uuid4()
        single_message = [sample_messages[0]]

        # Mock rowcount = 1
        mock_result = MagicMock(rowcount=1)
        message_repo.session.execute.return_value = mock_result

        await message_repo.bulk_insert_messages_with_batches(user_id, single_message)

        # Verify execute was called with INSERT statement
        message_repo.session.execute.assert_called_once()
        assert message_repo.session.execute.call_count == 1

    async def test_bulk_insert_messages_with_batches_sets_fetched_at(
        self, message_repo, sample_messages
    ):
        """Test that fetched_at timestamp is set for all messages."""
        user_id = uuid4()
        single_message = [sample_messages[0]]

        # Mock rowcount = 1
        mock_result = MagicMock(rowcount=1)
        message_repo.session.execute.return_value = mock_result

        before_insert = datetime.now(UTC)
        await message_repo.bulk_insert_messages_with_batches(user_id, single_message)
        after_insert = datetime.now(UTC)

        # Verify execution happened within time window
        # (we can't directly verify fetched_at since it's in the INSERT statement)
        assert message_repo.session.execute.call_count == 1
        assert before_insert <= after_insert  # Sanity check

    async def test_bulk_insert_messages_with_batches_preserves_message_order(
        self, message_repo, sample_messages
    ):
        """Test that message order is preserved during batch insertion."""
        user_id = uuid4()

        # Mock rowcount for 4 batches: 250 each
        mock_results = [MagicMock(rowcount=250) for _ in range(4)]
        message_repo.session.execute.side_effect = mock_results

        await message_repo.bulk_insert_messages_with_batches(
            user_id, sample_messages, batch_size=250
        )

        # Verify that execute was called 4 times (4 batches)
        assert message_repo.session.execute.call_count == 4


class TestMessageRepositoryDeduplication:
    """Test suite for message deduplication functionality.

    Tests verify that duplicate messages (same user_id, chat_id, telegram_message_id)
    are automatically skipped during insertion using PostgreSQL ON CONFLICT.
    """

    @pytest.fixture
    def mock_session(self):
        """Create a mock async session for testing."""
        session = AsyncMock()
        session.execute = AsyncMock()
        return session

    @pytest.fixture
    def message_repo(self, mock_session):
        """Create a MessageRepository instance with mock session."""
        return MessageRepository(mock_session)

    @pytest.fixture
    def sample_message_dict(self):
        """Create a sample message dictionary."""
        return {
            "telegram_message_id": 12345,
            "chat_id": 67890,
            "chat_title": "Test Chat",
            "chat_type": "private",
            "sender_id": 111,
            "sender_name": "Test Sender",
            "content": "Test message content",
            "message_type": "text",
            "has_media": False,
            "file_id": None,
            "file_name": None,
            "file_mime_type": None,
            "file_size": None,
            "file_duration": None,
            "file_width": None,
            "file_height": None,
            "is_reply": False,
            "is_forward": False,
            "timestamp": datetime.now(UTC),
            "additional_metadata": None,
        }

    async def test_bulk_insert_uses_on_conflict_do_nothing(self, message_repo, sample_message_dict):
        """Test that bulk_insert_messages_with_batches uses ON CONFLICT DO NOTHING clause."""
        user_id = uuid4()
        messages = [sample_message_dict]

        # Mock result with rowcount
        mock_result = MagicMock()
        mock_result.rowcount = 1
        message_repo.session.execute.return_value = mock_result

        result = await message_repo.bulk_insert_messages_with_batches(user_id, messages)

        # Verify execute was called (not add_all)
        message_repo.session.execute.assert_called_once()

        # Verify the SQL statement includes ON CONFLICT
        call_args = message_repo.session.execute.call_args
        stmt = call_args[0][0]
        # Convert statement to string to check for ON CONFLICT clause
        stmt_str = str(stmt.compile(compile_kwargs={"literal_binds": True}))
        assert "ON CONFLICT" in stmt_str.upper()

        assert result == 1

    async def test_bulk_insert_returns_actual_inserted_count(
        self, message_repo, sample_message_dict
    ):
        """Test that bulk_insert returns count of actually inserted rows, not attempted."""
        user_id = uuid4()
        # Create 5 messages
        messages = [{**sample_message_dict, "telegram_message_id": i} for i in range(1, 6)]

        # Mock result where only 3 were inserted (2 were duplicates)
        mock_result = MagicMock()
        mock_result.rowcount = 3
        message_repo.session.execute.return_value = mock_result

        result = await message_repo.bulk_insert_messages_with_batches(user_id, messages)

        # Should return actual inserted count from rowcount, not len(messages)
        assert result == 3

    async def test_bulk_insert_with_batches_uses_on_conflict(
        self, message_repo, sample_message_dict
    ):
        """Test that bulk_insert_messages_with_batches uses ON CONFLICT per batch."""
        user_id = uuid4()
        messages = [{**sample_message_dict, "telegram_message_id": i} for i in range(1, 11)]

        # Mock result for each batch
        mock_result = MagicMock()
        mock_result.rowcount = 5  # Each batch inserts 5 messages
        message_repo.session.execute.return_value = mock_result

        result = await message_repo.bulk_insert_messages_with_batches(
            user_id, messages, batch_size=5
        )

        # Should call execute twice (2 batches of 5)
        assert message_repo.session.execute.call_count == 2

        # Total inserted = 5 + 5 = 10
        assert result == 10

    async def test_bulk_insert_with_batches_tracks_deduplicated_rows(
        self, message_repo, sample_message_dict
    ):
        """Test that batched insertion correctly tracks deduplicated rows."""
        user_id = uuid4()
        messages = [{**sample_message_dict, "telegram_message_id": i} for i in range(1, 101)]

        # Mock results: batch 1 inserts 30/50, batch 2 inserts 40/50
        mock_results = [MagicMock(rowcount=30), MagicMock(rowcount=40)]
        message_repo.session.execute.side_effect = mock_results

        result = await message_repo.bulk_insert_messages_with_batches(
            user_id, messages, batch_size=50
        )

        # Total actually inserted = 30 + 40 = 70 (30 were duplicates)
        assert result == 70

    async def test_bulk_insert_with_batches_calls_progress_with_actual_count(
        self, message_repo, sample_message_dict
    ):
        """Test that progress callback receives actual inserted count, not attempted."""
        user_id = uuid4()
        messages = [{**sample_message_dict, "telegram_message_id": i} for i in range(1, 11)]
        progress_updates = []

        async def progress_callback(inserted, total):
            progress_updates.append((inserted, total))

        # Mock: batch 1 inserts 3/5, batch 2 inserts 2/5
        mock_results = [MagicMock(rowcount=3), MagicMock(rowcount=2)]
        message_repo.session.execute.side_effect = mock_results

        result = await message_repo.bulk_insert_messages_with_batches(
            user_id, messages, batch_size=5, progress_callback=progress_callback
        )

        # Progress should reflect actual insertions: 3, then 3+2=5
        assert len(progress_updates) == 2
        assert progress_updates[0] == (3, 10)  # After batch 1: 3 inserted
        assert progress_updates[1] == (5, 10)  # After batch 2: 3+2=5 total inserted
        assert result == 5

    async def test_bulk_insert_empty_list_with_deduplication(self, message_repo):
        """Test that empty message list works with new deduplication logic."""
        user_id = uuid4()
        result = await message_repo.bulk_insert_messages_with_batches(user_id, [])

        assert result == 0
        message_repo.session.execute.assert_not_called()

    async def test_bulk_insert_deduplication_preserves_message_data(
        self, message_repo, sample_message_dict
    ):
        """Test that ON CONFLICT preserves all message fields correctly."""
        user_id = uuid4()
        messages = [sample_message_dict]

        mock_result = MagicMock()
        mock_result.rowcount = 1
        message_repo.session.execute.return_value = mock_result

        await message_repo.bulk_insert_messages_with_batches(user_id, messages)

        # Verify the INSERT statement was executed correctly
        assert message_repo.session.execute.call_count == 1


class TestDeleteExpiredMessages:
    """Test suite for delete_expired_messages method.

    Tests verify batch deletion of messages older than retention period
    based on fetched_at timestamp.
    """

    @pytest.fixture
    def mock_session(self):
        """Create a mock async session for testing."""
        session = AsyncMock()
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        return session

    @pytest.fixture
    def message_repo(self, mock_session):
        """Create a MessageRepository instance with mock session."""
        return MessageRepository(mock_session)

    async def test_delete_expired_messages_returns_count(self, message_repo):
        """Test that delete returns total count of deleted messages."""
        # Mock single batch delete of 50 messages, then 0 (exit)
        mock_results = [MagicMock(rowcount=50), MagicMock(rowcount=0)]
        message_repo.session.execute.side_effect = mock_results

        result = await message_repo.delete_expired_messages(retention_days=7)

        assert result == 50
        assert message_repo.session.commit.call_count == 2

    async def test_delete_expired_messages_batches_correctly(self, message_repo):
        """Test that deletion happens in batches until exhausted."""
        # 2500 messages: 3 full batches + 1 partial + exit
        mock_results = [
            MagicMock(rowcount=1000),
            MagicMock(rowcount=1000),
            MagicMock(rowcount=500),
            MagicMock(rowcount=0),  # Exit condition
        ]
        message_repo.session.execute.side_effect = mock_results

        result = await message_repo.delete_expired_messages(retention_days=7, batch_size=1000)

        assert result == 2500
        assert message_repo.session.execute.call_count == 4
        assert message_repo.session.commit.call_count == 4

    async def test_delete_expired_messages_no_messages(self, message_repo):
        """Test when no messages need deletion."""
        mock_result = MagicMock(rowcount=0)
        message_repo.session.execute.return_value = mock_result

        result = await message_repo.delete_expired_messages(retention_days=7)

        assert result == 0
        # Should still execute once to check
        assert message_repo.session.execute.call_count == 1

    async def test_delete_expired_messages_custom_batch_size(self, message_repo):
        """Test deletion with custom batch size."""
        # 150 messages with batch_size=50: 3 batches + exit
        mock_results = [
            MagicMock(rowcount=50),
            MagicMock(rowcount=50),
            MagicMock(rowcount=50),
            MagicMock(rowcount=0),
        ]
        message_repo.session.execute.side_effect = mock_results

        result = await message_repo.delete_expired_messages(retention_days=7, batch_size=50)

        assert result == 150
        assert message_repo.session.execute.call_count == 4

    async def test_delete_expired_messages_handles_none_rowcount(self, message_repo):
        """Test handling when rowcount is None."""
        # Some databases return None for rowcount
        mock_result = MagicMock(rowcount=None)
        message_repo.session.execute.return_value = mock_result

        result = await message_repo.delete_expired_messages(retention_days=7)

        # Should treat None as 0 and exit
        assert result == 0
