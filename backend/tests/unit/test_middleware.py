"""
Unit tests for middleware module.

Tests token refresh middleware behavior.
"""

from datetime import timedelta
from unittest.mock import patch

import jwt
import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from src.core.middleware import TokenRefreshMiddleware


class TestTokenRefreshMiddleware:
    """Test suite for TokenRefreshMiddleware."""

    @pytest.fixture
    def mock_settings(self):
        """Create mock settings for JWT operations."""
        settings = type("Settings", (), {})()
        settings.jwt_secret_key = "test_secret_key"
        settings.jwt_algorithm = "HS256"
        settings.jwt_expiration_hours = 24
        return settings

    @pytest.fixture
    def app_with_middleware(self, mock_settings):
        """Create a test FastAPI app with the token refresh middleware."""
        app = FastAPI()
        app.add_middleware(TokenRefreshMiddleware)

        @app.get("/protected")
        async def protected_route(request: Request):
            return {"message": "success"}

        @app.get("/public")
        async def public_route():
            return {"message": "public"}

        @app.get("/error")
        async def error_route():
            from fastapi import HTTPException

            raise HTTPException(status_code=401, detail="Unauthorized")

        return app

    @pytest.fixture
    def create_token(self, mock_settings):
        """Helper to create valid JWT tokens."""

        def _create_token(user_id: str, expires_delta: timedelta | None = None):
            from datetime import UTC, datetime

            if expires_delta:
                expire = datetime.now(UTC) + expires_delta
            else:
                expire = datetime.now(UTC) + timedelta(hours=24)

            return jwt.encode(
                {"sub": user_id, "exp": expire},
                mock_settings.jwt_secret_key,
                algorithm=mock_settings.jwt_algorithm,
            )

        return _create_token

    @patch("src.core.middleware.verify_access_token")
    @patch("src.core.middleware.create_access_token")
    def test_refreshes_token_on_authenticated_request(
        self, mock_create_token, mock_verify_token, app_with_middleware
    ):
        """Test that middleware adds X-Refreshed-Token header for authenticated requests."""
        mock_verify_token.return_value = {"sub": "user-123"}
        mock_create_token.return_value = "new_refreshed_token"

        client = TestClient(app_with_middleware)
        response = client.get(
            "/protected",
            headers={"Authorization": "Bearer valid_token"},
        )

        assert response.status_code == 200
        assert "X-Refreshed-Token" in response.headers
        assert response.headers["X-Refreshed-Token"] == "new_refreshed_token"
        mock_create_token.assert_called_once_with({"sub": "user-123"})

    @patch("src.core.middleware.verify_access_token")
    @patch("src.core.middleware.create_access_token")
    def test_no_token_header_for_unauthenticated_request(
        self, mock_create_token, mock_verify_token, app_with_middleware
    ):
        """Test that no X-Refreshed-Token is added when no Authorization header."""
        client = TestClient(app_with_middleware)
        response = client.get("/public")

        assert response.status_code == 200
        assert "X-Refreshed-Token" not in response.headers
        mock_verify_token.assert_not_called()
        mock_create_token.assert_not_called()

    @patch("src.core.middleware.verify_access_token")
    @patch("src.core.middleware.create_access_token")
    def test_no_token_header_for_invalid_auth_format(
        self, mock_create_token, mock_verify_token, app_with_middleware
    ):
        """Test that no X-Refreshed-Token is added for non-Bearer auth."""
        client = TestClient(app_with_middleware)
        response = client.get(
            "/public",
            headers={"Authorization": "Basic dXNlcjpwYXNz"},
        )

        assert response.status_code == 200
        assert "X-Refreshed-Token" not in response.headers

    @patch("src.core.middleware.verify_access_token")
    @patch("src.core.middleware.create_access_token")
    def test_no_token_header_on_error_response(
        self, mock_create_token, mock_verify_token, app_with_middleware
    ):
        """Test that no X-Refreshed-Token is added on error responses."""
        mock_verify_token.return_value = {"sub": "user-123"}

        client = TestClient(app_with_middleware, raise_server_exceptions=False)
        response = client.get(
            "/error",
            headers={"Authorization": "Bearer valid_token"},
        )

        assert response.status_code == 401
        assert "X-Refreshed-Token" not in response.headers

    @patch("src.core.middleware.verify_access_token")
    @patch("src.core.middleware.create_access_token")
    def test_no_token_header_when_token_validation_fails(
        self, mock_create_token, mock_verify_token, app_with_middleware
    ):
        """Test that no X-Refreshed-Token is added when token validation fails."""
        from jwt.exceptions import PyJWTError  # ty: ignore[unresolved-import]

        mock_verify_token.side_effect = PyJWTError("Token expired")

        client = TestClient(app_with_middleware)
        response = client.get(
            "/protected",
            headers={"Authorization": "Bearer invalid_token"},
        )

        assert response.status_code == 200
        assert "X-Refreshed-Token" not in response.headers
        mock_create_token.assert_not_called()

    @patch("src.core.middleware.verify_access_token")
    @patch("src.core.middleware.create_access_token")
    def test_no_token_header_when_no_sub_in_payload(
        self, mock_create_token, mock_verify_token, app_with_middleware
    ):
        """Test that no X-Refreshed-Token is added when token has no sub claim."""
        mock_verify_token.return_value = {"user_id": "123"}  # No "sub" key

        client = TestClient(app_with_middleware)
        response = client.get(
            "/protected",
            headers={"Authorization": "Bearer valid_token"},
        )

        assert response.status_code == 200
        assert "X-Refreshed-Token" not in response.headers
        mock_create_token.assert_not_called()

    @patch("src.core.middleware.verify_access_token")
    @patch("src.core.middleware.create_access_token")
    def test_preserves_user_id_in_new_token(
        self, mock_create_token, mock_verify_token, app_with_middleware
    ):
        """Test that the user ID is preserved in the refreshed token."""
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        mock_verify_token.return_value = {"sub": user_id}
        mock_create_token.return_value = "new_token"

        client = TestClient(app_with_middleware)
        response = client.get(
            "/protected",
            headers={"Authorization": "Bearer original_token"},
        )

        assert response.status_code == 200
        mock_create_token.assert_called_once_with({"sub": user_id})
