"""
Middleware for FastAPI application.

This module provides custom middleware for the application.
"""

import logging

from jwt.exceptions import PyJWTError as JWTError  # ty: ignore[unresolved-import]
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from src.core.security import create_access_token, verify_access_token

logger = logging.getLogger(__name__)


class TokenRefreshMiddleware(BaseHTTPMiddleware):
    """
    Middleware that silently refreshes JWT tokens on authenticated requests.

    On every successful authenticated request (2xx status), this middleware:
    1. Extracts the Bearer token from the Authorization header
    2. Validates the token and extracts the user ID
    3. Issues a fresh JWT token with a new 24-hour expiry
    4. Adds the new token to the response via X-Refreshed-Token header

    This enables "sliding window" session management where active users
    never experience session expiration.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and add refreshed token header for authenticated requests."""
        response = await call_next(request)

        # Only refresh tokens for successful responses (2xx)
        if not (200 <= response.status_code < 300):
            return response

        # Extract Bearer token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return response

        token = auth_header[7:]  # Remove "Bearer " prefix

        try:
            # Validate token and extract user ID
            payload = verify_access_token(token)
            user_id = payload.get("sub")

            if user_id:
                # Preserve all original claims (sub, phone, etc.) except exp
                refresh_data = {k: v for k, v in payload.items() if k not in ("exp", "iat")}
                new_token = create_access_token(refresh_data)
                response.headers["X-Refreshed-Token"] = new_token
                logger.debug(f"Refreshed token for user {user_id}")

        except JWTError:
            # Token validation failed - don't refresh, let the normal auth flow handle it
            pass

        return response
