"""
Unit tests for Telegram media download functionality.

Tests the download_media_for_message method in TelegramService.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.exceptions import AuthenticationError, RateLimitError, TelegramAPIError
from src.services.telegram_service import TelegramService


class TestTelegramMediaDownload:
    """Test suite for TelegramService media download functionality."""

    @pytest.fixture
    def telegram_service(self):
        """Create TelegramService instance for testing."""
        return TelegramService()

    @pytest.fixture
    def mock_telegram_client(self):
        """Create a mock TelegramClient."""
        with (
            patch("src.services.telegram_service.TelegramClient") as mock_client_class,
            patch("src.services.telegram_service.StringSession"),
        ):
            mock_client = AsyncMock()
            mock_client_class.return_value = mock_client
            yield mock_client

    async def test_download_media_success(self, telegram_service, mock_telegram_client):
        """Test successful media download."""
        # Setup
        session_string = "test_session"
        chat_id = 12345
        message_id = 67890
        expected_media = b"fake_image_data"

        # Mock message with media
        mock_message = MagicMock()
        mock_message.media = True
        mock_telegram_client.get_messages.return_value = mock_message
        mock_telegram_client.is_user_authorized.return_value = True
        mock_telegram_client.download_media.return_value = expected_media

        # Execute
        result = await telegram_service.download_media_for_message(
            session_string=session_string,
            chat_id=chat_id,
            telegram_message_id=message_id,
        )

        # Assert
        assert result == expected_media
        mock_telegram_client.connect.assert_awaited_once()
        mock_telegram_client.disconnect.assert_awaited_once()
        mock_telegram_client.get_messages.assert_awaited_once_with(chat_id, ids=message_id)
        mock_telegram_client.download_media.assert_awaited_once_with(mock_message, file=bytes)

    async def test_download_media_message_not_found(self, telegram_service, mock_telegram_client):
        """Test download when message doesn't exist."""
        session_string = "test_session"
        chat_id = 12345
        message_id = 67890

        mock_telegram_client.get_messages.return_value = None
        mock_telegram_client.is_user_authorized.return_value = True

        result = await telegram_service.download_media_for_message(
            session_string=session_string,
            chat_id=chat_id,
            telegram_message_id=message_id,
        )

        assert result is None
        mock_telegram_client.connect.assert_awaited_once()
        mock_telegram_client.disconnect.assert_awaited_once()

    async def test_download_media_no_media_in_message(self, telegram_service, mock_telegram_client):
        """Test download when message has no media."""
        session_string = "test_session"
        chat_id = 12345
        message_id = 67890

        # Mock message without media
        mock_message = MagicMock()
        mock_message.media = None
        mock_telegram_client.get_messages.return_value = mock_message
        mock_telegram_client.is_user_authorized.return_value = True

        result = await telegram_service.download_media_for_message(
            session_string=session_string,
            chat_id=chat_id,
            telegram_message_id=message_id,
        )

        assert result is None
        mock_telegram_client.download_media.assert_not_awaited()

    async def test_download_media_session_expired(self, telegram_service, mock_telegram_client):
        """Test download with expired session."""
        session_string = "expired_session"
        chat_id = 12345
        message_id = 67890

        mock_telegram_client.is_user_authorized.return_value = False

        with pytest.raises(AuthenticationError, match="Session expired or invalid"):
            await telegram_service.download_media_for_message(
                session_string=session_string,
                chat_id=chat_id,
                telegram_message_id=message_id,
            )

        mock_telegram_client.connect.assert_awaited_once()
        mock_telegram_client.disconnect.assert_awaited_once()

    async def test_download_media_rate_limit_error(self, telegram_service, mock_telegram_client):
        """Test download with rate limiting."""
        from telethon.errors import FloodWaitError

        session_string = "test_session"
        chat_id = 12345
        message_id = 67890

        # Create FloodWaitError with request parameter (required by Telethon)
        flood_error = FloodWaitError(request=MagicMock())
        flood_error.seconds = 300

        mock_telegram_client.is_user_authorized.return_value = True
        mock_telegram_client.get_messages.side_effect = flood_error

        with pytest.raises(RateLimitError, match="Rate limited by Telegram"):
            await telegram_service.download_media_for_message(
                session_string=session_string,
                chat_id=chat_id,
                telegram_message_id=message_id,
            )

        mock_telegram_client.disconnect.assert_awaited_once()

    async def test_download_media_telegram_api_error(self, telegram_service, mock_telegram_client):
        """Test download with generic Telegram API error."""
        session_string = "test_session"
        chat_id = 12345
        message_id = 67890

        mock_telegram_client.is_user_authorized.return_value = True
        mock_telegram_client.get_messages.side_effect = Exception("Network error")

        with pytest.raises(TelegramAPIError, match="Failed to download media"):
            await telegram_service.download_media_for_message(
                session_string=session_string,
                chat_id=chat_id,
                telegram_message_id=message_id,
            )

        mock_telegram_client.disconnect.assert_awaited_once()

    async def test_download_media_large_file(self, telegram_service, mock_telegram_client):
        """Test download of large media file."""
        session_string = "test_session"
        chat_id = 12345
        message_id = 67890
        # Simulate 10MB file
        large_media = b"x" * (10 * 1024 * 1024)

        mock_message = MagicMock()
        mock_message.media = True
        mock_telegram_client.get_messages.return_value = mock_message
        mock_telegram_client.is_user_authorized.return_value = True
        mock_telegram_client.download_media.return_value = large_media

        result = await telegram_service.download_media_for_message(
            session_string=session_string,
            chat_id=chat_id,
            telegram_message_id=message_id,
        )

        assert result == large_media
        assert len(result) == 10 * 1024 * 1024

    async def test_download_media_disconnect_on_error(self, telegram_service, mock_telegram_client):
        """Test that client disconnects even when errors occur."""
        session_string = "test_session"
        chat_id = 12345
        message_id = 67890

        mock_telegram_client.is_user_authorized.return_value = True
        mock_telegram_client.get_messages.side_effect = Exception("Test error")

        with pytest.raises(TelegramAPIError):
            await telegram_service.download_media_for_message(
                session_string=session_string,
                chat_id=chat_id,
                telegram_message_id=message_id,
            )

        # Ensure disconnect was called despite error
        mock_telegram_client.disconnect.assert_awaited_once()
