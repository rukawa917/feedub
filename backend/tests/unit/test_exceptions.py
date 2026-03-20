"""
Unit tests for custom exceptions module.

Tests custom exception classes and their properties.
"""

from src.core.exceptions import (
    AuthenticationError,
    FeedubBaseException,
    RateLimitError,
    SessionExpiredError,
    TelegramAPIError,
)


class TestFeedubBaseException:
    """Test suite for FeedubBaseException base class."""

    def test_base_exception_default_status_code(self):
        """Test that base exception has default status code 500."""
        exc = FeedubBaseException("Test error")

        assert exc.message == "Test error"
        assert exc.status_code == 500
        assert str(exc) == "Test error"

    def test_base_exception_custom_status_code(self):
        """Test that base exception accepts custom status code."""
        exc = FeedubBaseException("Test error", status_code=418)

        assert exc.message == "Test error"
        assert exc.status_code == 418


class TestAuthenticationError:
    """Test suite for AuthenticationError."""

    def test_authentication_error_default_message(self):
        """Test AuthenticationError with default message."""
        exc = AuthenticationError()

        assert exc.message == "Authentication failed"
        assert exc.status_code == 401

    def test_authentication_error_custom_message(self):
        """Test AuthenticationError with custom message."""
        exc = AuthenticationError("Invalid credentials")

        assert exc.message == "Invalid credentials"
        assert exc.status_code == 401


class TestSessionExpiredError:
    """Test suite for SessionExpiredError."""

    def test_session_expired_error_default_message(self):
        """Test SessionExpiredError with default message."""
        exc = SessionExpiredError()

        assert "session has expired" in exc.message.lower()
        assert "re-authenticate" in exc.message.lower()
        assert exc.status_code == 401

    def test_session_expired_error_custom_message(self):
        """Test SessionExpiredError with custom message."""
        exc = SessionExpiredError("Your session is no longer valid")

        assert exc.message == "Your session is no longer valid"
        assert exc.status_code == 401


class TestTelegramAPIError:
    """Test suite for TelegramAPIError."""

    def test_telegram_api_error_default_status_code(self):
        """Test TelegramAPIError with default status code."""
        exc = TelegramAPIError("Telegram API request failed")

        assert exc.message == "Telegram API request failed"
        assert exc.status_code == 500

    def test_telegram_api_error_custom_status_code(self):
        """Test TelegramAPIError with custom status code."""
        exc = TelegramAPIError("Bad request", status_code=400)

        assert exc.message == "Bad request"
        assert exc.status_code == 400


class TestRateLimitError:
    """Test suite for RateLimitError."""

    def test_rate_limit_error_sets_retry_after(self):
        """Test RateLimitError stores retry_after value."""
        exc = RateLimitError("Rate limit exceeded", retry_after=60)

        assert "rate limit" in exc.message.lower()
        assert exc.status_code == 429
        assert exc.retry_after == 60

    def test_rate_limit_error_with_custom_message_and_retry(self):
        """Test RateLimitError with custom values."""
        exc = RateLimitError("Too many requests. Try again in 120 seconds.", retry_after=120)

        assert exc.message == "Too many requests. Try again in 120 seconds."
        assert exc.status_code == 429
        assert exc.retry_after == 120


class TestExceptionInheritance:
    """Test suite for exception inheritance hierarchy."""

    def test_all_exceptions_inherit_from_base(self):
        """Test that all custom exceptions inherit from FeedubBaseException."""
        exceptions = [
            AuthenticationError(),
            SessionExpiredError(),
            TelegramAPIError("test"),
            RateLimitError("test", 60),
        ]

        for exc in exceptions:
            assert isinstance(exc, FeedubBaseException)
            assert isinstance(exc, Exception)

    def test_all_exceptions_have_status_code(self):
        """Test that all exceptions have a status_code attribute."""
        exceptions = [
            AuthenticationError(),
            SessionExpiredError(),
            TelegramAPIError("test"),
            RateLimitError("test", 60),
        ]

        for exc in exceptions:
            assert hasattr(exc, "status_code")
            assert isinstance(exc.status_code, int)
            assert 400 <= exc.status_code < 600

    def test_all_exceptions_have_message(self):
        """Test that all exceptions have a message attribute."""
        exceptions = [
            AuthenticationError(),
            SessionExpiredError(),
            TelegramAPIError("test"),
            RateLimitError("test", 60),
        ]

        for exc in exceptions:
            assert hasattr(exc, "message")
            assert isinstance(exc.message, str)
            assert len(exc.message) > 0
