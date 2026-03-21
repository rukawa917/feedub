"""Authentication API endpoints.

This module implements the authentication routes per OpenAPI specification.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.exceptions import (
    AuthenticationError,
    RateLimitError,
    TelegramAPIError,
)
from src.models.user import User
from src.repositories.message_fetch_repository import MessageFetchRepository
from src.repositories.message_repository import MessageRepository
from src.repositories.user_repository import UserRepository
from src.schemas.auth import (
    AuthResponse,
    LoginRequest,
    LoginResponse,
    UserResponse,
    VerifyRequest,
)
from src.services.auth_service import AuthService
from src.services.telegram_service import TelegramService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_auth_service(session: AsyncSession = Depends(get_db)) -> AuthService:  # noqa: B008
    """Dependency injection for AuthService.

    Args:
        session: Database session from dependency.

    Returns:
        Configured AuthService instance.
    """
    user_repository = UserRepository(session)
    telegram_service = TelegramService()
    return AuthService(user_repository, telegram_service)


@router.post(
    "/request-code",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Request verification code",
    description="Trigger Telegram to send a verification code to the user's phone",
)
async def request_code(
    request: Request,
    login_request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),  # noqa: B008
) -> LoginResponse:
    """Request verification code from Telegram.

    This endpoint:
    1. Creates a Telethon client
    2. Calls client.send_code_request() to trigger Telegram code delivery
    3. Stores temporary session in database
    4. Telegram sends SMS/app notification to user

    Args:
        request: Login request with phone number.
        auth_service: Authentication service from dependency.

    Returns:
        Success message with phone number.

    Raises:
        HTTPException: 400 for invalid phone, 429 for rate limit, 500 for errors.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    phone_masked = f"{login_request.phone_number[:4]}***{login_request.phone_number[-4:]}"

    logger.info(f"[AUTH] POST /auth/request-code - phone={phone_masked}, client_ip={client_ip}")

    try:
        message, phone_hash = await auth_service.request_verification_code(
            login_request.phone_number
        )

        logger.info(
            f"[AUTH] Successfully sent verification code - "
            f"phone={phone_masked}, phone_hash={phone_hash[:8]}..."
        )

        return LoginResponse(message=message, phone_hash=phone_hash)

    except AuthenticationError as e:
        logger.warning(
            f"[AUTH] Authentication error during request-code - "
            f"phone={phone_masked}, error={str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number or authentication failed. Please try again.",
        ) from e

    except RateLimitError as e:
        logger.warning(
            f"[AUTH] Rate limit exceeded for request-code - "
            f"phone={phone_masked}, retry_after={e.retry_after}s"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(e.retry_after)} if e.retry_after else {},
        ) from e

    except TelegramAPIError as e:
        logger.error(
            f"[AUTH] Telegram API error during request-code - phone={phone_masked}, error={str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service temporarily unavailable. Please try again later.",
        ) from e

    except Exception as e:
        logger.error(
            f"[AUTH] Unexpected error during request-code - phone={phone_masked}, error={str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        ) from e


@router.post(
    "/verify-code",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify code and authenticate",
    description="Verify the code sent via Telegram and receive JWT token",
)
async def verify_code(
    request: Request,
    verify_request: VerifyRequest,
    auth_service: AuthService = Depends(get_auth_service),  # noqa: B008
) -> AuthResponse:
    """Verify code and complete authentication.

    This endpoint:
    1. Restores Telethon client from temporary session
    2. Calls client.sign_in() with verification code
    3. Handles 2FA if password provided
    4. Stores persistent session in database
    5. Generates and returns JWT token

    Args:
        request: Verify request with phone, code, and optional password.
        auth_service: Authentication service from dependency.

    Returns:
        JWT token and user information.

    Raises:
        HTTPException: 400 for invalid code, 429 for rate limit, 500 for errors.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    phone_masked = f"{verify_request.phone_number[:4]}***{verify_request.phone_number[-4:]}"
    has_password = "with_2fa" if verify_request.password else "without_2fa"

    logger.info(
        f"[AUTH] POST /auth/verify-code - "
        f"phone={phone_masked}, mode={has_password}, client_ip={client_ip}"
    )

    try:
        access_token, user = await auth_service.verify_code_and_authenticate(
            phone_number=verify_request.phone_number,
            phone_code_hash=verify_request.phone_code_hash,
            code=verify_request.code,
            password=verify_request.password,
        )

        logger.info(
            f"[AUTH] Successfully verified code - "
            f"phone={phone_masked}, user_id={user.id}, telegram_user_id={user.telegram_user_id}"
        )

        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    except AuthenticationError as e:
        logger.warning(
            f"[AUTH] Authentication error during verify-code - phone={phone_masked}, error={str(e)}"
        )
        # Pass through the actual error message (especially for 2FA detection by frontend)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    except RateLimitError as e:
        logger.warning(
            f"[AUTH] Rate limit exceeded for verify-code - "
            f"phone={phone_masked}, retry_after={e.retry_after}s"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(e.retry_after)} if e.retry_after else {},
        ) from e

    except TelegramAPIError as e:
        logger.error(
            f"[AUTH] Telegram API error during verify-code - phone={phone_masked}, error={str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service temporarily unavailable. Please try again later.",
        ) from e

    except Exception as e:
        logger.error(
            f"[AUTH] Unexpected error during verify-code - phone={phone_masked}, error={str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        ) from e


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user info",
    description="Retrieve information about the authenticated user",
)
async def get_me(
    current_user: User = Depends(get_current_user),  # noqa: B008
) -> UserResponse:
    """Get current authenticated user information.

    Args:
        current_user: Authenticated user from JWT token.

    Returns:
        User information.

    Raises:
        HTTPException: 401 if token is invalid or missing.
    """
    logger.info(f"[AUTH] GET /auth/me - user_id={current_user.id}")
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout and clear data",
    description="Logout user, delete all messages, and clear Telegram session",
)
async def logout(
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    """Logout user and delete all their data.

    Deletes:
    - All messages
    - All fetch records
    - Telegram session (user must re-authenticate on next login)

    User record is preserved.

    Args:
        current_user: Authenticated user from JWT token.
        session: Database session.

    Returns:
        Success message with deletion count.
    """
    logger.info(f"[AUTH] POST /auth/logout - user_id={current_user.id}")

    # Delete all messages
    message_repo = MessageRepository(session)
    messages_deleted = await message_repo.delete_all_messages_for_user(current_user.id)

    # Delete all fetch records
    fetch_repo = MessageFetchRepository(session)
    fetches_deleted = await fetch_repo.delete_all_fetches_for_user(current_user.id)

    # Clear session
    user_repo = UserRepository(session)
    await user_repo.clear_user_session(current_user.id)

    logger.info(
        f"[AUTH] Logout complete - user_id={current_user.id}, "
        f"messages_deleted={messages_deleted}, fetches_deleted={fetches_deleted}"
    )

    return {
        "message": "Logged out successfully",
        "messages_deleted": messages_deleted,
    }


@router.delete(
    "/account",
    status_code=status.HTTP_200_OK,
    summary="Delete account",
    description="Permanently delete user account and all associated data",
)
async def delete_account(
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    """Delete user account and all associated data.

    This endpoint:
    1. Attempts to revoke Telegram session (best-effort)
    2. Deletes the user record from database
    3. SQLAlchemy cascade automatically deletes all related records:
       - messages
       - message_fetches
       - channel_selections
       - channel_favorites
       - llm_consents

       - insights
       - insights

    Args:
        current_user: Authenticated user from JWT token.
        session: Database session.

    Returns:
        Success message.
    """
    logger.info(f"[AUTH] DELETE /auth/account - user_id={current_user.id}")

    # Try to revoke Telegram session (best-effort, don't fail if it errors)
    if current_user.session_string:
        telegram_service = TelegramService()
        try:
            await telegram_service.revoke_session(current_user.session_string)
        except Exception as e:
            logger.warning(
                f"[AUTH] Failed to revoke Telegram session during account deletion "
                f"(continuing anyway) - user_id={current_user.id}, error={str(e)}"
            )

    # Delete the user (cascade will handle all related records)
    user_repo = UserRepository(session)
    deleted = await user_repo.delete_user(current_user.id)

    if not deleted:
        logger.error(f"[AUTH] User not found during deletion - user_id={current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    logger.info(f"[AUTH] Account deletion complete - user_id={current_user.id}")

    return {"message": "Account deleted successfully"}


@router.delete(
    "/data",
    status_code=status.HTTP_200_OK,
    summary="Delete all user data",
    description="Delete all user data but keep the account",
)
async def delete_data(
    current_user: User = Depends(get_current_user),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    """Delete all user data but keep the account.

    Deletes:
    - All messages
    - All message_fetches
    - All channel_selections
    - All channel_favorites
    - All llm_consents
    - All insights_usages
    - All insights

    Keeps:
    - User record

    Args:
        current_user: Authenticated user from JWT token.
        session: Database session.

    Returns:
        Success message with deletion count.
    """
    logger.info(f"[AUTH] DELETE /auth/data - user_id={current_user.id}")

    # Delete all user data except user record
    user_repo = UserRepository(session)
    records_deleted = await user_repo.delete_all_user_data(current_user.id)

    logger.info(
        f"[AUTH] Data deletion complete - user_id={current_user.id}, "
        f"records_deleted={records_deleted}"
    )

    return {
        "message": "All data deleted successfully",
        "records_deleted": records_deleted,
    }
