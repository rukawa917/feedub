"""
Retry utilities for handling transient failures in database and network operations.

This module provides:
- db_retry: Decorator for database operations with connection timeout handling
- network_retry: Decorator for external API calls (Telegram, LLM providers)
- Structured logging for all retry attempts

Configuration:
- Max attempts: 5
- Max wait time: 30 seconds total
- Backoff: Exponential with jitter to prevent thundering herd
"""

import logging
from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar

import httpx
from sqlalchemy.exc import OperationalError
from sqlalchemy.exc import TimeoutError as SQLAlchemyTimeoutError
from tenacity import (
    RetryCallState,
    retry,
    retry_if_exception,
    retry_if_exception_type,
    stop_after_attempt,
    stop_after_delay,
    wait_exponential_jitter,
)

logger = logging.getLogger(__name__)

# Type variable for preserving function signatures
F = TypeVar("F", bound=Callable[..., Any])

# Maximum retry configuration (reduced to minimize load amplification under DB stress)
MAX_ATTEMPTS = 2
MAX_DELAY_SECONDS = 15


def _log_retry_attempt(retry_state: RetryCallState) -> None:
    """
    Log structured information about retry attempts.

    Args:
        retry_state: Tenacity retry state containing attempt info.
    """
    exception = retry_state.outcome.exception() if retry_state.outcome else None
    func_name = getattr(retry_state.fn, "__name__", "unknown")

    logger.warning(
        "[RETRY] %s - attempt=%d/%d, wait=%.2fs, elapsed=%.2fs, error=%s: %s",
        func_name,
        retry_state.attempt_number,
        MAX_ATTEMPTS,
        retry_state.next_action.sleep if retry_state.next_action else 0,
        retry_state.seconds_since_start,
        type(exception).__name__ if exception else "None",
        str(exception)[:200] if exception else "None",
    )


def _log_after_retry(retry_state: RetryCallState) -> None:
    """
    Log after a retry attempt completes (success or final failure).

    Only logs exhaustion message on final failure.

    Args:
        retry_state: Tenacity retry state containing attempt info.
    """
    # Only log exhaustion if this is the final failure
    if retry_state.outcome and retry_state.outcome.failed:
        exception = retry_state.outcome.exception()
        func_name = getattr(retry_state.fn, "__name__", "unknown")

        # Check if we're at max attempts or max delay
        at_max_attempts = retry_state.attempt_number >= MAX_ATTEMPTS

        elapsed = retry_state.seconds_since_start or 0
        if at_max_attempts or elapsed >= MAX_DELAY_SECONDS:
            logger.error(
                "[RETRY EXHAUSTED] %s - attempts=%d, elapsed=%.2fs, final_error=%s: %s",
                func_name,
                retry_state.attempt_number,
                elapsed,
                type(exception).__name__ if exception else "None",
                str(exception)[:500] if exception else "None",
            )


# Database retry exceptions
DB_RETRY_EXCEPTIONS = (
    OperationalError,  # Connection failures, timeouts
    SQLAlchemyTimeoutError,  # SQLAlchemy timeout errors
    ConnectionError,  # Network connection errors
    TimeoutError,  # Python timeout errors
    OSError,  # Low-level connection errors (includes ConnectionRefusedError, etc.)
)


def db_retry(func: F) -> F:  # noqa: UP047
    """
    Decorator for retrying database operations on transient failures.

    Handles:
    - Connection timeouts (psycopg.errors.ConnectionTimeout)
    - Operational errors (connection drops, pool exhaustion)
    - Network-level connection errors

    Configuration:
    - Max 5 attempts OR 30 seconds total (whichever comes first)
    - Exponential backoff with jitter: 0.5s initial, max 8s between retries
    - Logs each retry attempt with timing and error info

    Usage:
        @db_retry
        async def get_user_by_id(self, user_id: str) -> User | None:
            ...
    """

    @retry(
        stop=(stop_after_attempt(MAX_ATTEMPTS) | stop_after_delay(MAX_DELAY_SECONDS)),
        wait=wait_exponential_jitter(initial=0.5, max=8, jitter=2),
        retry=retry_if_exception_type(DB_RETRY_EXCEPTIONS),
        before_sleep=_log_retry_attempt,
        after=_log_after_retry,
        reraise=True,
    )
    @wraps(func)
    async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
        return await func(*args, **kwargs)

    return async_wrapper  # type: ignore


# Network retry exceptions (for external APIs)
NETWORK_RETRY_EXCEPTIONS = (
    ConnectionError,
    TimeoutError,
    OSError,
)


def _is_retryable_http_error(exception: BaseException) -> bool:
    """Check if HTTP error is retryable (5xx server errors or 429 rate limit).

    Args:
        exception: The exception to check.

    Returns:
        True if this is an HTTP error that should trigger a retry.
    """
    if isinstance(exception, httpx.HTTPStatusError):
        status = exception.response.status_code
        # Retry on server errors (5xx) and rate limits (429)
        return status >= 500 or status == 429
    return False


def _is_retryable_network_exception(exception: BaseException) -> bool:
    """Check if exception should trigger network retry.

    Combines standard network exceptions with retryable HTTP status errors.

    Args:
        exception: The exception to check.

    Returns:
        True if this exception should trigger a retry.
    """
    if isinstance(exception, NETWORK_RETRY_EXCEPTIONS):
        return True
    return _is_retryable_http_error(exception)


def network_retry(func: F) -> F:  # noqa: UP047
    """
    Decorator for retrying network/external API operations on transient failures.

    Handles:
    - Connection timeouts
    - Network errors
    - Transient API failures
    - HTTP 5xx server errors (via httpx.HTTPStatusError)
    - HTTP 429 rate limit errors

    Configuration:
    - Max 5 attempts OR 30 seconds total (whichever comes first)
    - Exponential backoff with jitter: 1s initial, max 10s between retries
    - Logs each retry attempt with timing and error info

    Note:
    - Does NOT retry on HTTP 4xx client errors (except 429 rate limits)
    - Does NOT retry on FloodWaitError - those need special handling

    Usage:
        @network_retry
        async def call_external_api(self, data: dict) -> Response:
            ...
    """

    @retry(
        stop=(stop_after_attempt(MAX_ATTEMPTS) | stop_after_delay(MAX_DELAY_SECONDS)),
        wait=wait_exponential_jitter(initial=1, max=10, jitter=3),
        retry=retry_if_exception(_is_retryable_network_exception),
        before_sleep=_log_retry_attempt,
        after=_log_after_retry,
        reraise=True,
    )
    @wraps(func)
    async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
        return await func(*args, **kwargs)

    return async_wrapper  # type: ignore
