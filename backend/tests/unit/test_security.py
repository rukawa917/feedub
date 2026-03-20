"""
Unit tests for security utilities module.

Tests JWT token generation/validation.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
from jwt.exceptions import PyJWTError as JWTError  # ty: ignore[unresolved-import]

from src.core.security import (
    create_access_token,
    verify_access_token,
)


class TestJWTTokens:
    """Test suite for JWT token operations."""

    @patch("src.core.security.get_settings")
    def test_create_access_token_with_default_expiration(self, mock_get_settings):
        """Test creating JWT token with default expiration time."""
        # Mock settings
        mock_settings = type("Settings", (), {})()
        mock_settings.jwt_secret_key = "test_secret_key"
        mock_settings.jwt_algorithm = "HS256"
        mock_settings.jwt_expiration_hours = 24
        mock_get_settings.return_value = mock_settings

        data = {"user_id": "123e4567-e89b-12d3-a456-426614174000"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        # Verify token can be decoded
        payload = verify_access_token(token)
        assert payload["user_id"] == "123e4567-e89b-12d3-a456-426614174000"
        assert "exp" in payload

    @patch("src.core.security.get_settings")
    def test_create_access_token_with_custom_expiration(self, mock_get_settings):
        """Test creating JWT token with custom expiration time."""
        # Mock settings
        mock_settings = type("Settings", (), {})()
        mock_settings.jwt_secret_key = "test_secret_key"
        mock_settings.jwt_algorithm = "HS256"
        mock_get_settings.return_value = mock_settings

        data = {"user_id": "123"}
        custom_expiration = timedelta(minutes=30)
        token = create_access_token(data, expires_delta=custom_expiration)

        payload = verify_access_token(token)
        assert payload["user_id"] == "123"

        # Check expiration is approximately 30 minutes from now
        exp_timestamp = payload["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=UTC)
        now = datetime.now(UTC)
        time_diff = (exp_datetime - now).total_seconds()

        # Should be close to 30 minutes (1800 seconds), allow 5 second tolerance
        assert 1795 < time_diff < 1805

    @patch("src.core.security.get_settings")
    def test_create_access_token_preserves_data(self, mock_get_settings):
        """Test that JWT token preserves all data fields."""
        mock_settings = type("Settings", (), {})()
        mock_settings.jwt_secret_key = "test_secret_key"
        mock_settings.jwt_algorithm = "HS256"
        mock_settings.jwt_expiration_hours = 24
        mock_get_settings.return_value = mock_settings

        data = {"user_id": "123", "phone_number": "+1234567890", "role": "user"}
        token = create_access_token(data)

        payload = verify_access_token(token)
        assert payload["user_id"] == "123"
        assert payload["phone_number"] == "+1234567890"
        assert payload["role"] == "user"

    @patch("src.core.security.get_settings")
    def test_verify_access_token_success(self, mock_get_settings):
        """Test verifying a valid JWT token."""
        mock_settings = type("Settings", (), {})()
        mock_settings.jwt_secret_key = "test_secret_key"
        mock_settings.jwt_algorithm = "HS256"
        mock_settings.jwt_expiration_hours = 24
        mock_get_settings.return_value = mock_settings

        data = {"user_id": "123"}
        token = create_access_token(data)
        payload = verify_access_token(token)

        assert payload["user_id"] == "123"

    @patch("src.core.security.get_settings")
    def test_verify_access_token_invalid_token(self, mock_get_settings):
        """Test that invalid token raises JWTError."""
        mock_settings = type("Settings", (), {})()
        mock_settings.jwt_secret_key = "test_secret_key"
        mock_settings.jwt_algorithm = "HS256"
        mock_get_settings.return_value = mock_settings

        with pytest.raises(JWTError, match="Invalid or expired token"):
            verify_access_token("invalid.token.here")

    @patch("src.core.security.get_settings")
    def test_verify_access_token_expired_token(self, mock_get_settings):
        """Test that expired token raises JWTError."""
        mock_settings = type("Settings", (), {})()
        mock_settings.jwt_secret_key = "test_secret_key"
        mock_settings.jwt_algorithm = "HS256"
        mock_get_settings.return_value = mock_settings

        data = {"user_id": "123"}
        # Create token that expires immediately
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))

        with pytest.raises(JWTError, match="Invalid or expired token"):
            verify_access_token(token)

    @patch("src.core.security.get_settings")
    def test_verify_access_token_wrong_secret(self, mock_get_settings):
        """Test that token signed with different secret fails verification."""
        # Create token with one secret
        mock_settings = type("Settings", (), {})()
        mock_settings.jwt_secret_key = "secret_key_1"
        mock_settings.jwt_algorithm = "HS256"
        mock_settings.jwt_expiration_hours = 24
        mock_get_settings.return_value = mock_settings

        data = {"user_id": "123"}
        token = create_access_token(data)

        # Try to verify with different secret
        mock_settings.jwt_secret_key = "secret_key_2"

        with pytest.raises(JWTError, match="Invalid or expired token"):
            verify_access_token(token)
