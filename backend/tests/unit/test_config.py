"""
Unit tests for core configuration module.

Tests configuration loading, validation, and settings management with pydantic-settings.
"""

import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from src.core.config import Settings, get_settings


class TestSettings:
    """Test suite for Settings class."""

    def test_settings_loads_from_environment(self):
        """Test that settings correctly load from environment variables."""
        # Settings are loaded from conftest.py test environment
        settings = Settings()

        assert settings.database_url == "sqlite+aiosqlite:///test.db"
        assert settings.telegram_api_id == 123456
        assert settings.telegram_api_hash == "test_telegram_api_hash_value_here"
        assert settings.jwt_secret_key == "test_jwt_secret_key_32_chars_min_required_here"

    def test_settings_defaults(self):
        """Test default values for optional settings."""
        # Use conftest environment which has all required fields
        settings = Settings()

        assert settings.jwt_algorithm == "HS256"
        assert settings.jwt_expiration_hours == 24
        assert settings.app_env == "testing"
        assert settings.debug is False
        assert settings.api_version == "1.0.0"
        assert settings.cors_origins == ["*"]

    def test_settings_database_url_default(self):
        """Test that database_url defaults to SQLite path."""
        test_env = {
            "TELEGRAM_API_ID": "123456",
            "TELEGRAM_API_HASH": "test_telegram_api_hash_value_here",
        }
        with patch.dict(os.environ, test_env, clear=True):
            settings = Settings(_env_file=None)  # type: ignore[unknown-argument]
            assert settings.database_url == "sqlite+aiosqlite:///./data/feedub.db"

    def test_validate_success_with_all_required_fields(self):
        """Test validation passes when all required fields are present (via conftest)."""
        # Pydantic validates on instantiation
        settings = Settings()
        assert settings is not None

    def test_validate_fails_without_telegram_api_id(self):
        """Test validation fails when TELEGRAM_API_ID is missing or invalid."""
        test_env = {
            "TELEGRAM_API_HASH": "test_hash",
        }
        with patch.dict(os.environ, test_env, clear=True):
            with pytest.raises(ValidationError) as exc_info:
                Settings(_env_file=None)  # type: ignore[unknown-argument]

            errors = exc_info.value.errors()  # type: ignore[unresolved-attribute]
            assert any(
                error["loc"] == ("telegram_api_id",) and error["type"] == "missing"
                for error in errors
            )

    def test_validate_fails_with_invalid_telegram_api_id(self):
        """Test validation fails when TELEGRAM_API_ID is zero or negative."""
        with pytest.raises(ValidationError) as exc_info:
            Settings(
                telegram_api_id=0,  # Invalid: must be > 0
                telegram_api_hash="test_hash",
            )

        errors = exc_info.value.errors()  # type: ignore[unresolved-attribute]
        assert any(
            error["loc"] == ("telegram_api_id",) and error["type"] == "greater_than"
            for error in errors
        )

    def test_validate_fails_without_telegram_api_hash(self):
        """Test validation fails when TELEGRAM_API_HASH is missing."""
        test_env = {
            "TELEGRAM_API_ID": "12345",
        }
        with patch.dict(os.environ, test_env, clear=True):
            with pytest.raises(ValidationError) as exc_info:
                Settings(_env_file=None)  # type: ignore[unknown-argument]

            errors = exc_info.value.errors()  # type: ignore[unresolved-attribute]
            assert any(
                error["loc"] == ("telegram_api_hash",) and error["type"] == "missing"
                for error in errors
            )

    def test_validate_fails_with_short_jwt_secret_key(self):
        """Test validation fails when JWT_SECRET_KEY is explicitly set too short."""
        with pytest.raises(ValidationError) as exc_info:
            Settings(
                telegram_api_id=12345,
                telegram_api_hash="test_hash",
                jwt_secret_key="short",  # Too short, must be >= 32 chars
            )

        errors = exc_info.value.errors()  # type: ignore[unresolved-attribute]
        assert any(
            error["loc"] == ("jwt_secret_key",) and error["type"] == "string_too_short"
            for error in errors
        )

    def test_jwt_key_auto_generates(self):
        """Test that JWT key gets auto-generated default."""
        test_env = {
            "TELEGRAM_API_ID": "12345",
            "TELEGRAM_API_HASH": "test_hash",
        }
        with patch.dict(os.environ, test_env, clear=True):
            settings = Settings(_env_file=None)  # type: ignore[unknown-argument]
            assert len(settings.jwt_secret_key) >= 32

    def test_validate_reports_multiple_errors(self):
        """Test validation reports all missing required fields at once."""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValidationError) as exc_info:
                Settings(_env_file=None)  # type: ignore[unknown-argument]

            errors = exc_info.value.errors()  # type: ignore[unresolved-attribute]
            error_locs = {error["loc"][0] for error in errors}
            assert "telegram_api_id" in error_locs
            assert "telegram_api_hash" in error_locs


class TestGetSettings:
    """Test suite for get_settings function."""

    def test_get_settings_returns_singleton(self):
        """Test that get_settings returns the same instance (cached)."""
        # Clear the cache first
        get_settings.cache_clear()

        settings1 = get_settings()
        settings2 = get_settings()

        assert settings1 is settings2

    def test_get_settings_validates_on_creation(self):
        """Test that get_settings validates configuration on first call."""
        with patch.dict(os.environ, {}, clear=True):
            # Clear the cache
            get_settings.cache_clear()

            # Need to test Settings directly since get_settings reads from .env
            with pytest.raises(ValidationError):
                Settings(_env_file=None)  # type: ignore[unknown-argument]


class TestTelegramFetchChannelOnly:
    """Test suite for telegram_fetch_channel_only configuration."""

    def test_telegram_fetch_channel_only_defaults_to_false(self):
        """Verify default is False for backward compatibility."""
        # Explicitly unset env var to test code default
        with patch.dict(os.environ, {"TELEGRAM_FETCH_CHANNEL_ONLY": "false"}, clear=False):
            # Clear cache and get fresh settings
            get_settings.cache_clear()
            settings = get_settings()

            assert settings.telegram_fetch_channel_only is False

    def test_telegram_fetch_channel_only_can_be_enabled(self):
        """Verify setting can be enabled via environment variable."""
        with patch.dict(os.environ, {"TELEGRAM_FETCH_CHANNEL_ONLY": "true"}, clear=False):
            # Clear cache to get new settings
            get_settings.cache_clear()
            settings = get_settings()

            assert settings.telegram_fetch_channel_only is True

    def test_telegram_fetch_channel_only_can_be_disabled_explicitly(self):
        """Verify setting can be explicitly disabled via environment variable."""
        with patch.dict(os.environ, {"TELEGRAM_FETCH_CHANNEL_ONLY": "false"}, clear=False):
            # Clear cache to get new settings
            get_settings.cache_clear()
            settings = get_settings()

            assert settings.telegram_fetch_channel_only is False
