"""
Contract tests for insights API endpoints.

Tests that insights endpoints conform to API contract specifications.
These tests use mocked authentication and database dependencies.
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.models.user import User


@pytest.fixture
def mock_user():
    """Create a mock authenticated user."""
    user = MagicMock(spec=User)
    user.id = uuid4()
    user.telegram_user_id = 12345678
    user.phone_number = "+1234567890"
    user.session_string = "encrypted_session_string"
    return user


@pytest.fixture
def mock_insights_service():
    """Create mock insights service."""
    return AsyncMock()


@pytest.fixture
def authenticated_client(mock_user, mock_insights_service):
    """Create test client with mocked authentication and service."""
    from src.api.insights import get_insights_service
    from src.core.dependencies import get_current_user
    from src.main import app

    # Override both auth and service dependencies
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_insights_service] = lambda: mock_insights_service

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# =============================================================================
# Consent Endpoint Tests
# =============================================================================


class TestConsentStatusEndpoint:
    """Contract tests for GET /insights/consent/status."""

    def test_consent_status_requires_authentication(self):
        """Test that endpoint requires authentication."""
        from src.main import app

        client = TestClient(app)
        response = client.get("/insights/consent/status")

        assert response.status_code == 403  # No auth header

    def test_consent_status_returns_200(self, authenticated_client, mock_insights_service):
        """Test that GET /insights/consent/status returns 200."""
        mock_insights_service.check_consent.return_value = (
            True,
            "1.0",
            "1.0",
            False,
        )
        response = authenticated_client.get("/insights/consent/status")

        assert response.status_code == 200

    def test_consent_status_response_structure(self, authenticated_client, mock_insights_service):
        """Test response has required fields."""
        mock_insights_service.check_consent.return_value = (
            True,
            "1.0",
            "1.0",
            False,
        )
        response = authenticated_client.get("/insights/consent/status")
        data = response.json()

        assert "has_consent" in data
        assert "consent_version" in data
        assert "current_version" in data
        assert "requires_re_consent" in data

    def test_consent_status_field_types(self, authenticated_client, mock_insights_service):
        """Test response field types are correct."""
        mock_insights_service.check_consent.return_value = (
            True,
            "1.0",
            "1.0",
            False,
        )
        response = authenticated_client.get("/insights/consent/status")
        data = response.json()

        assert isinstance(data["has_consent"], bool)
        assert isinstance(data["current_version"], str)
        assert isinstance(data["requires_re_consent"], bool)


class TestGiveConsentEndpoint:
    """Contract tests for POST /insights/consent/give."""

    def test_give_consent_requires_authentication(self):
        """Test that endpoint requires authentication."""
        from src.main import app

        client = TestClient(app)
        response = client.post(
            "/insights/consent/give",
            json={"version": "1.0"},
        )

        assert response.status_code == 403

    def test_give_consent_requires_version(self, authenticated_client, mock_insights_service):
        """Test that version field is required."""
        response = authenticated_client.post(
            "/insights/consent/give",
            json={},  # Missing version
        )

        assert response.status_code == 422  # Validation error

    def test_give_consent_returns_201(self, authenticated_client, mock_insights_service):
        """Test that POST /insights/consent/give returns 201."""
        mock_insights_service.give_consent.return_value = None
        response = authenticated_client.post(
            "/insights/consent/give",
            json={"version": "1.0"},
        )

        assert response.status_code == 201

    def test_give_consent_response_structure(self, authenticated_client, mock_insights_service):
        """Test response has required fields."""
        mock_insights_service.give_consent.return_value = None
        response = authenticated_client.post(
            "/insights/consent/give",
            json={"version": "1.0"},
        )
        data = response.json()

        assert "success" in data
        assert "consent_version" in data
        assert data["success"] is True
        assert data["consent_version"] == "1.0"


class TestRevokeConsentEndpoint:
    """Contract tests for POST /insights/consent/revoke."""

    def test_revoke_consent_requires_authentication(self):
        """Test that endpoint requires authentication."""
        from src.main import app

        client = TestClient(app)
        response = client.post("/insights/consent/revoke")

        assert response.status_code == 403

    def test_revoke_consent_returns_200(self, authenticated_client, mock_insights_service):
        """Test that POST /insights/consent/revoke returns 200."""
        mock_insights_service.revoke_consent.return_value = datetime.now(UTC)
        response = authenticated_client.post("/insights/consent/revoke")

        assert response.status_code == 200

    def test_revoke_consent_returns_404_when_no_consent(
        self, authenticated_client, mock_insights_service
    ):
        """Test returns 404 when no active consent to revoke."""
        mock_insights_service.revoke_consent.return_value = None
        response = authenticated_client.post("/insights/consent/revoke")

        assert response.status_code == 404


# =============================================================================
# Validation Endpoint Tests
# =============================================================================


class TestValidateEndpoint:
    """Contract tests for POST /insights/validate."""

    def test_validate_requires_authentication(self):
        """Test that endpoint requires authentication."""
        from src.main import app

        client = TestClient(app)
        response = client.post(
            "/insights/validate",
            json={
                "chat_ids": ["123"],
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": "2024-01-31T00:00:00Z",
            },
        )

        assert response.status_code == 403

    def test_validate_requires_chat_ids(self, authenticated_client, mock_insights_service):
        """Test that chat_ids field is required."""
        response = authenticated_client.post(
            "/insights/validate",
            json={
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": "2024-01-31T00:00:00Z",
            },
        )

        assert response.status_code == 422

    def test_validate_returns_200(self, authenticated_client, mock_insights_service):
        """Test that POST /insights/validate returns 200."""
        mock_insights_service.validate_request.return_value = (
            True,
            100,
            False,
            6000,
            None,
        )
        response = authenticated_client.post(
            "/insights/validate",
            json={
                "chat_ids": ["123", "456"],
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": "2024-01-31T00:00:00Z",
            },
        )

        assert response.status_code == 200

    def test_validate_response_structure(self, authenticated_client, mock_insights_service):
        """Test response has required fields."""
        mock_insights_service.validate_request.return_value = (
            True,
            100,
            False,
            6000,
            None,
        )
        response = authenticated_client.post(
            "/insights/validate",
            json={
                "chat_ids": ["123"],
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": "2024-01-31T00:00:00Z",
            },
        )
        data = response.json()

        assert "valid" in data
        assert "message_count" in data
        assert "exceeds_limit" in data


# =============================================================================
# Generate Endpoint Tests
# =============================================================================


class TestGenerateEndpoint:
    """Contract tests for POST /insights/generate."""

    def test_generate_requires_authentication(self):
        """Test that endpoint requires authentication."""
        from src.main import app

        client = TestClient(app)
        response = client.post(
            "/insights/generate",
            json={
                "chat_ids": ["123"],
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": "2024-01-31T00:00:00Z",
            },
        )

        assert response.status_code == 403

    def test_generate_returns_streaming_response(self, authenticated_client, mock_insights_service):
        """Test that endpoint returns streaming response."""
        mock_insights_service.check_consent.return_value = (False, None, "1.0", False)
        response = authenticated_client.post(
            "/insights/generate",
            json={
                "chat_ids": ["123"],
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": "2024-01-31T00:00:00Z",
            },
        )

        assert response.headers["content-type"].startswith("text/event-stream")

    def test_generate_requires_chat_ids(self, authenticated_client, mock_insights_service):
        """Test that chat_ids field is required."""
        response = authenticated_client.post(
            "/insights/generate",
            json={
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": "2024-01-31T00:00:00Z",
            },
        )

        assert response.status_code == 422


# =============================================================================
# Retrieval Endpoint Tests
# =============================================================================


class TestGetInsightEndpoint:
    """Contract tests for GET /insights/{insight_id}."""

    def test_get_insight_requires_authentication(self):
        """Test that endpoint requires authentication."""
        from src.main import app

        client = TestClient(app)
        insight_id = str(uuid4())
        response = client.get(f"/insights/{insight_id}")

        assert response.status_code == 403

    def test_get_insight_returns_404_for_nonexistent(
        self, authenticated_client, mock_insights_service
    ):
        """Test returns 404 when insight not found."""
        mock_insights_service.get_insight.return_value = None
        insight_id = str(uuid4())
        response = authenticated_client.get(f"/insights/{insight_id}")

        assert response.status_code == 404


class TestListInsightsEndpoint:
    """Contract tests for GET /insights/."""

    def test_list_insights_requires_authentication(self):
        """Test that endpoint requires authentication."""
        from src.main import app

        client = TestClient(app)
        response = client.get("/insights/")

        assert response.status_code == 403

    def test_list_insights_returns_200(self, authenticated_client, mock_insights_service):
        """Test that GET /insights/ returns 200."""
        mock_insights_service.list_insights.return_value = ([], 0)
        response = authenticated_client.get("/insights/")

        assert response.status_code == 200

    def test_list_insights_response_structure(self, authenticated_client, mock_insights_service):
        """Test response has required fields."""
        mock_insights_service.list_insights.return_value = ([], 0)
        response = authenticated_client.get("/insights/")
        data = response.json()

        assert "insights" in data
        assert "total" in data
        assert isinstance(data["insights"], list)
        assert isinstance(data["total"], int)

    def test_list_insights_accepts_pagination_params(
        self, authenticated_client, mock_insights_service
    ):
        """Test endpoint accepts limit and offset parameters."""
        mock_insights_service.list_insights.return_value = ([], 0)
        response = authenticated_client.get("/insights/?limit=10&offset=5")

        assert response.status_code == 200

    def test_list_insights_validates_limit_bounds(
        self, authenticated_client, mock_insights_service
    ):
        """Test limit parameter validation (1-100)."""
        # Over max limit
        response = authenticated_client.get("/insights/?limit=200")
        assert response.status_code == 422

        # Under min limit
        response = authenticated_client.get("/insights/?limit=0")
        assert response.status_code == 422
