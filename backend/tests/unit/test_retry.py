"""Unit tests for retry decorators."""

import pytest
from sqlalchemy.exc import OperationalError

from src.core.retry import db_retry, network_retry


class TestDbRetry:
    """Tests for the db_retry decorator."""

    @pytest.mark.asyncio
    async def test_db_retry_succeeds_first_try(self):
        """Test that function succeeds on first try without retry."""
        call_count = 0

        @db_retry
        async def success_func():
            nonlocal call_count
            call_count += 1
            return "success"

        result = await success_func()

        assert result == "success"
        assert call_count == 1

    @pytest.mark.asyncio
    async def test_db_retry_succeeds_after_transient_failure(self):
        """Test that function succeeds after transient failure."""
        call_count = 0

        @db_retry
        async def flaky_func():
            nonlocal call_count
            call_count += 1
            if call_count < 2:  # Reduced: MAX_ATTEMPTS is now 2 to minimize load amplification
                raise ConnectionError("Transient connection error")
            return "success"

        result = await flaky_func()

        assert result == "success"
        assert call_count == 2

    @pytest.mark.asyncio
    async def test_db_retry_exhausted_after_max_attempts(self):
        """Test that retry gives up after max attempts."""
        call_count = 0

        @db_retry
        async def always_fails():
            nonlocal call_count
            call_count += 1
            raise ConnectionError("Persistent connection error")

        with pytest.raises(ConnectionError, match="Persistent connection error"):
            await always_fails()

        # Should have tried 2 times (MAX_ATTEMPTS reduced from 5 to minimize load amplification)
        assert call_count == 2

    @pytest.mark.asyncio
    async def test_db_retry_does_not_retry_non_retryable_errors(self):
        """Test that non-retryable errors are not retried."""
        call_count = 0

        @db_retry
        async def value_error_func():
            nonlocal call_count
            call_count += 1
            raise ValueError("Not a retryable error")

        with pytest.raises(ValueError, match="Not a retryable error"):
            await value_error_func()

        # Should only be called once (no retry for ValueError)
        assert call_count == 1

    @pytest.mark.asyncio
    async def test_db_retry_handles_operational_error(self):
        """Test that OperationalError is retried."""
        call_count = 0

        @db_retry
        async def operational_error_func():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                # Simulate SQLAlchemy OperationalError
                raise OperationalError("statement", {}, Exception("connection timeout"))
            return "recovered"

        result = await operational_error_func()

        assert result == "recovered"
        assert call_count == 2


class TestNetworkRetry:
    """Tests for the network_retry decorator."""

    @pytest.mark.asyncio
    async def test_network_retry_succeeds_first_try(self):
        """Test that function succeeds on first try without retry."""
        call_count = 0

        @network_retry
        async def success_func():
            nonlocal call_count
            call_count += 1
            return "network success"

        result = await success_func()

        assert result == "network success"
        assert call_count == 1

    @pytest.mark.asyncio
    async def test_network_retry_succeeds_after_timeout(self):
        """Test that function succeeds after timeout error."""
        call_count = 0

        @network_retry
        async def timeout_func():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise TimeoutError("Connection timed out")
            return "success after timeout"

        result = await timeout_func()

        assert result == "success after timeout"
        assert call_count == 2

    @pytest.mark.asyncio
    async def test_network_retry_exhausted_after_max_attempts(self):
        """Test that network retry gives up after max attempts."""
        call_count = 0

        @network_retry
        async def always_times_out():
            nonlocal call_count
            call_count += 1
            raise TimeoutError("Persistent timeout")

        with pytest.raises(TimeoutError, match="Persistent timeout"):
            await always_times_out()

        # Should have tried 2 times (MAX_ATTEMPTS reduced from 5 to minimize load amplification)
        assert call_count == 2

    @pytest.mark.asyncio
    async def test_network_retry_handles_oserror(self):
        """Test that OSError (includes ConnectionRefusedError) is retried."""
        call_count = 0

        @network_retry
        async def connection_refused_func():
            nonlocal call_count
            call_count += 1
            if call_count < 2:  # Reduced: MAX_ATTEMPTS is now 2 to minimize load amplification
                raise OSError("Connection refused")
            return "connected"

        result = await connection_refused_func()

        assert result == "connected"
        assert call_count == 2
