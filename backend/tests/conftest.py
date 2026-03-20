"""
Shared pytest fixtures for all tests.
"""

import os
from collections.abc import Generator

import pytest


@pytest.fixture(autouse=True)
def setup_test_env() -> Generator[None, None, None]:
    """
    Automatically set up test environment variables for all tests.

    This fixture ensures all tests have valid configuration values
    that meet pydantic-settings validation requirements.
    """
    # Store original environment
    original_env = os.environ.copy()

    # Set test environment variables with valid lengths
    test_env = {
        "DATABASE_URL": "sqlite+aiosqlite:///test.db",
        "TELEGRAM_API_ID": "123456",
        "TELEGRAM_API_HASH": "test_telegram_api_hash_value_here",
        "JWT_SECRET_KEY": "test_jwt_secret_key_32_chars_min_required_here",
        "JWT_ALGORITHM": "HS256",
        "JWT_EXPIRATION_HOURS": "24",
        "APP_ENV": "testing",
        "DEBUG": "false",
        "API_VERSION": "1.0.0",
        "CORS_ORIGINS": '["*"]',
    }

    os.environ.update(test_env)

    yield

    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)
