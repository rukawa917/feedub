"""
Custom exception classes for the Telegram Message Aggregation MVP.

These exceptions provide domain-specific error handling throughout the application.
They can be caught by middleware and converted to appropriate HTTP responses.
"""

from datetime import datetime


class FeedubBaseException(Exception):
    """Base exception for all application-specific errors."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        """
        Initialize base exception.

        Args:
            message: Human-readable error message.
            status_code: HTTP status code to return when this exception occurs.
        """
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AuthenticationError(FeedubBaseException):
    """Raised when user authentication fails."""

    def __init__(self, message: str = "Authentication failed") -> None:
        """Initialize authentication error with 401 status."""
        super().__init__(message, status_code=401)


class SessionExpiredError(AuthenticationError):
    """Raised when a Telegram session is no longer valid."""

    def __init__(
        self, message: str = "Telegram session has expired. Please re-authenticate."
    ) -> None:
        """Initialize session expired error with 401 status."""
        super().__init__(message)


class TelegramAPIError(FeedubBaseException):
    """Raised when Telegram API operations fail."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        """
        Initialize Telegram API error.

        Args:
            message: Error details from Telegram API.
            status_code: HTTP status code (default 500, can be overridden).
        """
        super().__init__(message, status_code=status_code)


class RateLimitError(TelegramAPIError):
    """Raised when Telegram rate limits are exceeded."""

    def __init__(self, message: str, retry_after: int) -> None:
        """
        Initialize rate limit error with 429 status.

        Args:
            message: Rate limit error details.
            retry_after: Number of seconds to wait before retrying.
        """
        super().__init__(message, status_code=429)
        self.retry_after = retry_after


# =============================================================================
# Insights Exceptions
# =============================================================================


class InsightGenerationError(FeedubBaseException):
    """Raised when LLM insight generation fails."""

    def __init__(self, message: str = "Failed to generate insight") -> None:
        """Initialize insight generation error with 500 status."""
        super().__init__(message, status_code=500)


class ConsentRequiredError(FeedubBaseException):
    """Raised when user has not given consent for LLM processing."""

    def __init__(
        self,
        message: str = "LLM consent required",
        requires_reconsent: bool = False,
    ) -> None:
        """
        Initialize consent required error with 403 status.

        Args:
            message: Error message.
            requires_reconsent: Whether user needs to re-consent due to version change.
        """
        super().__init__(message, status_code=403)
        self.requires_reconsent = requires_reconsent


class InsightRateLimitError(FeedubBaseException):
    """Raised when user exceeds daily insight generation limit."""

    def __init__(
        self,
        message: str = "Daily insight limit exceeded",
        reset_at: "datetime | None" = None,
    ) -> None:
        """
        Initialize insight rate limit error with 429 status.

        Args:
            message: Error message.
            reset_at: UTC datetime when the limit resets (midnight UTC).
        """
        super().__init__(message, status_code=429)
        self.reset_at = reset_at


class MessageLimitExceededError(FeedubBaseException):
    """Raised when insight request exceeds maximum message count."""

    def __init__(
        self,
        message: str = "Request exceeds maximum message limit",
        count: int = 0,
        limit: int = 1000,
        suggested_filters: dict | None = None,
    ) -> None:
        """
        Initialize message limit exceeded error with 400 status.

        Args:
            message: Error message.
            count: Actual message count in the request.
            limit: Maximum allowed message count.
            suggested_filters: Suggestions for narrowing the request.
        """
        super().__init__(message, status_code=400)
        self.count = count
        self.limit = limit
        self.suggested_filters = suggested_filters
