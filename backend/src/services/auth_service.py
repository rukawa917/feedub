"""Authentication service orchestrating Telegram and User repository.

This module provides high-level authentication operations by coordinating
between TelegramService (API calls) and UserRepository (persistence).
"""

import logging
import time

from src.core.exceptions import AuthenticationError
from src.core.security import create_access_token
from src.models.user import User
from src.repositories.user_repository import UserRepository
from src.services.telegram_service import TelegramService

logger = logging.getLogger(__name__)


def _mask_phone(phone: str) -> str:
    """Mask phone number for logging: +447***3456."""
    if len(phone) > 8:
        return f"{phone[:4]}***{phone[-4:]}"
    return "***"


class AuthService:
    """Service for authentication operations.

    Orchestrates authentication flow between Telegram API and database.
    """

    def __init__(
        self,
        user_repository: UserRepository,
        telegram_service: TelegramService,
    ):
        """Initialize service with dependencies.

        Args:
            user_repository: Repository for user database operations.
            telegram_service: Service for Telegram API operations.
        """
        self.user_repository = user_repository
        self.telegram_service = telegram_service

    async def request_verification_code(self, phone_number: str) -> tuple[str, str]:
        """Request verification code from Telegram.

        This creates or updates a user record with a temporary session string
        that will be used later during code verification.

        If user already has a persistent session, reuses it to avoid creating
        a new Telegram session on every login.

        Args:
            phone_number: User's phone number in E.164 format.

        Returns:
            Tuple of (success_message, phone_code_hash).

        Raises:
            AuthenticationError: If code request fails.
            RateLimitError: If rate limited by Telegram.
            TelegramAPIError: For other Telegram API errors.
        """
        start_time = time.time()
        logger.info(f"Starting verification code request for phone={_mask_phone(phone_number)}")

        try:
            # Check if user already exists and has a persistent session
            existing_user = await self.user_repository.get_user_by_phone(phone_number)
            existing_session = None
            if existing_user and existing_user.session_string:
                existing_session = existing_user.session_string
                logger.info(
                    f"Attempting to reuse existing session for phone={_mask_phone(phone_number)}"
                )
                # NOTE: Removed validate_session() call - it creates a race condition
                # Session can become invalid between validation and use
                # Let send_code_request() detect and handle invalid sessions (it has retry logic)

            # Request code from Telegram (returns JSON with session + phone_code_hash)
            # If session is invalid, send_code_request will detect and retry with fresh session
            temp_session = await self.telegram_service.send_code_request(
                phone_number, existing_session
            )

            # Parse temp_session to extract phone_code_hash
            import json

            temp_data = json.loads(temp_session)
            phone_code_hash = temp_data["phone_code_hash"]

            # Store temp session in database
            await self.user_repository.update_temp_session(
                phone_number=phone_number,
                temp_session_string=temp_session,
            )

            duration = time.time() - start_time
            logger.info(
                f"Verification code request completed successfully "
                f"for phone={_mask_phone(phone_number)}, duration={duration:.2f}s"
            )

            return "Verification code sent to your phone", phone_code_hash

        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"Verification code request failed for phone={_mask_phone(phone_number)}, "
                f"duration={duration:.2f}s, error={str(e)}",
                exc_info=True,
            )
            raise

    async def verify_code_and_authenticate(
        self,
        phone_number: str,
        phone_code_hash: str,
        code: str,
        password: str | None = None,
    ) -> tuple[str, User]:
        """Verify code and complete authentication.

        Restores temporary session, verifies code with Telegram,
        stores persistent session, and generates JWT token.

        Args:
            phone_number: User's phone number in E.164 format.
            phone_code_hash: Phone code hash from /auth/request-code response.
            code: Verification code from Telegram.
            password: Optional 2FA password.

        Returns:
            Tuple of (jwt_token, authenticated_user).

        Raises:
            AuthenticationError: If verification fails or user not found.
            RateLimitError: If rate limited by Telegram.
            TelegramAPIError: For other Telegram API errors.
        """
        start_time = time.time()
        has_2fa = "with_2fa" if password else "without_2fa"
        logger.info(
            f"Starting code verification for phone={_mask_phone(phone_number)}, mode={has_2fa}"
        )

        try:
            # Retrieve user with temporary session
            user = await self.user_repository.get_user_by_phone(phone_number)
            if not user or not user.temp_session_string:
                raise AuthenticationError(
                    "No verification request found. Please request a code first."
                )

            # Parse temp_session and validate phone_code_hash
            temp_session = user.temp_session_string
            import json

            temp_data = json.loads(temp_session)
            stored_hash = temp_data["phone_code_hash"]

            if stored_hash != phone_code_hash:
                raise AuthenticationError("Invalid phone code hash. Please request a new code.")

            # Sign in to Telegram using temporary session
            persistent_session, telegram_user_id = await self.telegram_service.sign_in(
                temp_session_string=temp_session,
                phone_number=phone_number,
                code=code,
                password=password,
            )

            # Update user with persistent session and clear temp session
            user = await self.user_repository.update_session(
                phone_number=phone_number,
                session_string=persistent_session,
                telegram_user_id=telegram_user_id,
            )

            if not user:
                raise AuthenticationError("Failed to update user session")

            await self.user_repository.clear_temp_session(phone_number)

            # Generate JWT token with phone number for frontend display
            # Phone is included in token so frontend can show it without DB lookup
            access_token = create_access_token(
                {
                    "sub": str(user.id),
                    "phone": phone_number,
                }
            )

            duration = time.time() - start_time
            logger.info(
                f"Code verification completed successfully "
                f"for phone={_mask_phone(phone_number)}, user_id={user.id}, "
                f"telegram_user_id={telegram_user_id}, duration={duration:.2f}s"
            )

            return access_token, user

        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"Code verification failed for phone={_mask_phone(phone_number)}, "
                f"duration={duration:.2f}s, error={str(e)}",
                exc_info=True,
            )
            raise
