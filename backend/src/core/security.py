"""
Security utilities for JWT token generation/validation.

This module provides cryptographic functions for:
- JWT token creation and verification for user authentication
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from jwt.exceptions import PyJWTError as JWTError  # ty: ignore[unresolved-import]

from src.core.config import get_settings


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Payload data to encode in the token (typically includes user_id).
        expires_delta: Optional custom expiration time. If None, uses default from settings.

    Returns:
        str: Encoded JWT token.
    """
    settings = get_settings()
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(hours=settings.jwt_expiration_hours)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )
    return encoded_jwt  # ty: ignore[invalid-return-type]  # PyJWT>=2.0 returns str


def verify_access_token(token: str) -> dict[str, Any]:
    """
    Verify and decode a JWT access token.

    Args:
        token: JWT token string to verify.

    Returns:
        dict: Decoded token payload containing user data.

    Raises:
        JWTError: If token is invalid, expired, or cannot be decoded.
    """
    settings = get_settings()
    try:
        payload: dict[str, Any] = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError as e:
        raise JWTError(f"Invalid or expired token: {str(e)}") from e
