"""FastAPI dependencies for dependency injection.

This module provides reusable dependencies for authentication and authorization.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import verify_access_token
from src.models.user import User
from src.repositories.user_repository import UserRepository

# HTTP Bearer token scheme for JWT authentication
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> User:
    """Extract and validate JWT token to get current user.

    This dependency:
    1. Extracts Bearer token from Authorization header
    2. Decodes and validates JWT token
    3. Retrieves user from database by ID from token payload
    4. Returns authenticated User instance

    Args:
        credentials: HTTP Authorization credentials with Bearer token.
        session: Database session from dependency.

    Returns:
        Authenticated User instance.

    Raises:
        HTTPException: 401 if token is invalid or user not found.
    """
    token = credentials.credentials

    # Decode JWT token to get user_id
    try:
        payload = verify_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = UUID(user_id_str)

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    # Retrieve user from database
    user_repository = UserRepository(session)
    user = await user_repository.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


# Optional bearer token scheme for endpoints that work with or without auth
optional_security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(optional_security)],
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> User | None:
    """Extract and validate JWT token to get current user (optional auth).

    Like get_current_user, but returns None if no token provided instead of raising.

    Args:
        credentials: Optional HTTP Authorization credentials with Bearer token.
        session: Database session from dependency.

    Returns:
        Authenticated User instance if valid token, None otherwise.
    """
    if credentials is None:
        return None

    token = credentials.credentials

    # Decode JWT token to get user_id
    try:
        payload = verify_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None

        user_id = UUID(user_id_str)

    except Exception:
        return None

    # Retrieve user from database
    user_repository = UserRepository(session)
    user = await user_repository.get_user_by_id(user_id)

    return user
