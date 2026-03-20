"""
Unit tests for Telegram channel-only fetch filtering functionality.

Tests the fetch_all_messages method with channel_only configuration enabled/disabled.
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.services.telegram_service import TelegramService


class TestTelegramFetchChannelOnly:
    """Test suite for TelegramService channel-only fetch filtering."""

    @pytest.fixture
    def mock_telegram_client_with_dialogs(self):
        """Create a mock TelegramClient with mixed dialog types."""
        with (
            patch("src.services.telegram_service.TelegramClient") as mock_client_class,
            patch("src.services.telegram_service.StringSession"),
        ):
            mock_client = AsyncMock()
            mock_client_class.return_value = mock_client

            # Create mock dialogs: 1 channel, 1 group, 1 private
            channel_dialog = MagicMock()
            channel_dialog.is_channel = True
            channel_dialog.is_group = False
            channel_dialog.id = 100
            channel_dialog.name = "Test Channel"

            group_dialog = MagicMock()
            group_dialog.is_channel = False
            group_dialog.is_group = True
            group_dialog.id = 200
            group_dialog.name = "Test Group"

            private_dialog = MagicMock()
            private_dialog.is_channel = False
            private_dialog.is_group = False
            private_dialog.id = 300
            private_dialog.name = "Test Private"

            # Create mock messages for each dialog
            channel_message = MagicMock()
            channel_message.id = 1
            channel_message.sender_id = 1001
            channel_message.text = "Channel message"
            channel_message.date = datetime.now(UTC)
            channel_message.media = None
            channel_message.is_reply = False
            channel_message.forward = None
            channel_message.message = "Channel message"

            group_message = MagicMock()
            group_message.id = 2
            group_message.sender_id = 1002
            group_message.text = "Group message"
            group_message.date = datetime.now(UTC)
            group_message.media = None
            group_message.is_reply = False
            group_message.forward = None
            group_message.message = "Group message"

            private_message = MagicMock()
            private_message.id = 3
            private_message.sender_id = 1003
            private_message.text = "Private message"
            private_message.date = datetime.now(UTC)
            private_message.media = None
            private_message.is_reply = False
            private_message.forward = None
            private_message.message = "Private message"

            # Setup async iterators
            async def mock_iter_dialogs():
                yield channel_dialog
                yield group_dialog
                yield private_dialog

            async def mock_iter_messages_channel(dialog, limit, min_id=0):
                yield channel_message

            async def mock_iter_messages_group(dialog, limit, min_id=0):
                yield group_message

            async def mock_iter_messages_private(dialog, limit, min_id=0):
                yield private_message

            # Map dialogs to their messages
            def mock_iter_messages(dialog, limit, min_id=0):
                if dialog.id == 100:  # Channel
                    return mock_iter_messages_channel(dialog, limit, min_id)
                elif dialog.id == 200:  # Group
                    return mock_iter_messages_group(dialog, limit, min_id)
                else:  # Private
                    return mock_iter_messages_private(dialog, limit, min_id)

            mock_client.iter_dialogs = mock_iter_dialogs
            mock_client.iter_messages = mock_iter_messages
            mock_client.is_user_authorized.return_value = True

            yield mock_client

    async def test_fetch_all_messages_channel_only_filters_non_channels(
        self, mock_telegram_client_with_dialogs
    ):
        """When channel_only=True, verify groups and private chats are skipped."""
        # Mock settings with channel_only=True
        mock_settings = MagicMock()
        mock_settings.telegram_fetch_channel_only = True
        mock_settings.telegram_api_id = 12345
        mock_settings.telegram_api_hash = "test_hash"
        mock_settings.telegram_fetch_delay_seconds = 1.0
        mock_settings.telegram_flood_sleep_threshold = 60
        mock_settings.telegram_fetch_limit_per_chat = 1000
        mock_settings.telegram_fetch_max_age_days = 30

        with patch("src.services.telegram_service.get_settings", return_value=mock_settings):
            # Create service AFTER patching to get mocked settings
            telegram_service = TelegramService()

            # Execute - collect all messages from async generator
            messages = []
            async for message in telegram_service.fetch_all_messages(
                session_string="test_session",
                limit_per_chat=1000,
            ):
                messages.append(message)

            # Assert: Only channel messages are returned
            assert len(messages) == 1
            assert messages[0]["chat_id"] == 100
            assert messages[0]["chat_type"] == "channel"
            assert messages[0]["chat_title"] == "Test Channel"

    async def test_fetch_all_messages_channel_only_disabled_fetches_all(
        self, mock_telegram_client_with_dialogs
    ):
        """When channel_only=False, verify all dialog types are fetched."""
        # Mock settings with channel_only=False
        mock_settings = MagicMock()
        mock_settings.telegram_fetch_channel_only = False
        mock_settings.telegram_api_id = 12345
        mock_settings.telegram_api_hash = "test_hash"
        mock_settings.telegram_fetch_delay_seconds = 1.0
        mock_settings.telegram_flood_sleep_threshold = 60
        mock_settings.telegram_fetch_limit_per_chat = 1000
        mock_settings.telegram_fetch_max_age_days = 30

        with patch("src.services.telegram_service.get_settings", return_value=mock_settings):
            # Create service AFTER patching to get mocked settings
            telegram_service = TelegramService()

            # Execute - collect all messages from async generator
            messages = []
            async for message in telegram_service.fetch_all_messages(
                session_string="test_session",
                limit_per_chat=1000,
            ):
                messages.append(message)

            # Assert: All dialog types are in results
            assert len(messages) == 3
            chat_types = {msg["chat_type"] for msg in messages}
            assert "channel" in chat_types
            assert "group" in chat_types
            assert "private" in chat_types

            # Verify specific messages
            chat_ids = {msg["chat_id"] for msg in messages}
            assert 100 in chat_ids  # Channel
            assert 200 in chat_ids  # Group
            assert 300 in chat_ids  # Private
