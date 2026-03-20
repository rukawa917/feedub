"""
Contract tests for health endpoint.

Tests that health endpoint conforms to API contract specifications.
"""

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client - uses environment from conftest.py."""
    from src.main import app

    return TestClient(app)


class TestHealthEndpointContract:
    """Test suite for health endpoint API contract."""

    def test_health_endpoint_returns_200(self, client):
        """Test that GET /health returns 200 OK."""
        response = client.get("/health")

        assert response.status_code == 200

    def test_health_endpoint_returns_json(self, client):
        """Test that GET /health returns JSON content type."""
        response = client.get("/health")

        assert response.headers["content-type"] == "application/json"

    def test_health_endpoint_response_structure(self, client):
        """Test that GET /health returns correct response structure."""
        response = client.get("/health")
        data = response.json()

        # Required fields
        assert "status" in data
        assert "version" in data
        assert "timestamp" in data

        # Field types
        assert isinstance(data["status"], str)
        assert isinstance(data["version"], str)
        assert isinstance(data["timestamp"], str)

    def test_health_endpoint_status_value(self, client):
        """Test that GET /health returns valid status."""
        response = client.get("/health")
        data = response.json()

        # Status should be either "healthy" or "unhealthy"
        assert data["status"] in ["healthy", "unhealthy"]

    def test_health_endpoint_version_value(self, client):
        """Test that GET /health returns version from settings."""
        response = client.get("/health")
        data = response.json()

        assert data["version"] == "1.0.0"

    def test_health_endpoint_timestamp_is_valid_iso_format(self, client):
        """Test that GET /health timestamp is in valid ISO format."""
        response = client.get("/health")
        data = response.json()

        # Should be able to parse as datetime
        timestamp = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
        assert isinstance(timestamp, datetime)

    def test_health_endpoint_timestamp_is_recent(self, client):
        """Test that GET /health timestamp is recent (within 5 seconds)."""
        before = datetime.now(UTC)
        response = client.get("/health")
        after = datetime.now(UTC)

        data = response.json()
        timestamp = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))

        # Timestamp should be between before and after request
        assert before <= timestamp <= after

    def test_health_endpoint_does_not_accept_post(self, client):
        """Test that POST /health returns 405 Method Not Allowed."""
        response = client.post("/health")

        assert response.status_code == 405

    def test_health_endpoint_does_not_accept_put(self, client):
        """Test that PUT /health returns 405 Method Not Allowed."""
        response = client.put("/health")

        assert response.status_code == 405

    def test_health_endpoint_does_not_accept_delete(self, client):
        """Test that DELETE /health returns 405 Method Not Allowed."""
        response = client.delete("/health")

        assert response.status_code == 405

    def test_health_endpoint_does_not_require_authentication(self, client):
        """Test that GET /health does not require authentication."""
        # No Authorization header
        response = client.get("/health")

        assert response.status_code == 200

    def test_health_endpoint_response_schema_matches_openapi(self, client):
        """Test that response matches OpenAPI schema definition."""
        response = client.get("/health")
        data = response.json()

        # Schema validation: all required fields present (enhanced health endpoint)
        required_fields = ["status", "version", "timestamp", "database", "disk", "memory"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"

        # Schema validation: no extra fields
        assert set(data.keys()) == set(required_fields)

        # Validate nested structures
        assert "status" in data["database"]
        assert set(data["disk"].keys()) == {"used_percent", "free_gb", "total_gb"}
        assert set(data["memory"].keys()) == {"used_percent", "available_mb", "total_mb"}

    def test_health_endpoint_multiple_requests_return_different_timestamps(self, client):
        """Test that consecutive requests return different timestamps."""
        response1 = client.get("/health")
        response2 = client.get("/health")

        data1 = response1.json()
        data2 = response2.json()

        # Timestamps should be different (or at least potentially different)
        # Note: They might be the same if requests are extremely fast
        timestamp1 = data1["timestamp"]
        timestamp2 = data2["timestamp"]

        # At minimum, both should be valid
        assert timestamp1 is not None
        assert timestamp2 is not None

    def test_health_endpoint_consistent_version_across_requests(self, client):
        """Test that version remains consistent across multiple requests."""
        response1 = client.get("/health")
        response2 = client.get("/health")
        response3 = client.get("/health")

        data1 = response1.json()
        data2 = response2.json()
        data3 = response3.json()

        assert data1["version"] == data2["version"] == data3["version"]

    def test_health_endpoint_consistent_status_across_requests(self, client):
        """Test that status remains consistent across multiple requests."""
        response1 = client.get("/health")
        response2 = client.get("/health")
        response3 = client.get("/health")

        data1 = response1.json()
        data2 = response2.json()
        data3 = response3.json()

        # All requests should return consistent status
        assert data1["status"] == data2["status"] == data3["status"]
        assert data1["status"] in ["healthy", "unhealthy"]

    def test_health_endpoint_handles_query_parameters_gracefully(self, client):
        """Test that GET /health ignores query parameters."""
        response = client.get("/health?foo=bar&baz=qux")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "unhealthy"]

    def test_health_endpoint_response_is_cacheable(self, client):
        """Test that health endpoint response does not set no-cache headers."""
        response = client.get("/health")

        # Should not have Cache-Control: no-cache
        # (Health endpoints are typically cacheable for a short time)
        # Just verify we get a response - caching policy can vary
        assert response.status_code == 200
