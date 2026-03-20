"""Telegram service for Telethon client operations.

This module handles all Telegram API interactions using Telethon library.
"""

import asyncio
import json
import logging
import time
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from typing import Any

from telethon import TelegramClient
from telethon.errors import (
    AuthKeyUnregisteredError,
    AuthRestartError,
    FloodWaitError,
    PasswordHashInvalidError,
    PhoneCodeExpiredError,
    PhoneCodeInvalidError,
    PhoneNumberInvalidError,
    SessionPasswordNeededError,
)
from telethon.sessions import StringSession

from src.core.config import get_settings
from src.core.exceptions import (
    AuthenticationError,
    RateLimitError,
    SessionExpiredError,
    TelegramAPIError,
)
from src.core.telegram_formatting import entities_to_markdown

logger = logging.getLogger(__name__)


class TelegramService:
    """Service for Telegram API operations using Telethon.

    Handles authentication flow, session management, and message fetching.
    """

    def __init__(self) -> None:
        """Initialize service with configuration from settings."""
        self.settings = get_settings()
        self.api_id = self.settings.telegram_api_id
        self.api_hash = self.settings.telegram_api_hash

    async def send_code_request(
        self, phone_number: str, existing_session_string: str | None = None
    ) -> str:
        """Request verification code from Telegram.

        Creates a Telethon client (reusing existing session if available),
        requests verification code, and returns temporary session string for later use.

        Args:
            phone_number: Phone number in E.164 format.
            existing_session_string: Optional existing session string to reuse.
                If provided, reuses the same Telegram session instead of creating a new one.

        Returns:
            Temporary session string (unencrypted) to save in database.

        Raises:
            AuthenticationError: If phone number is invalid.
            RateLimitError: If rate limited by Telegram.
            TelegramAPIError: For other Telegram API errors.
        """
        start_time = time.time()
        phone_masked = f"{phone_number[:4]}***{phone_number[-4:]}"
        session_reused = "reused" if existing_session_string else "new"
        logger.info(
            f"[TELEGRAM] Sending code request to Telegram for phone={phone_masked}, session={session_reused}"
        )

        # Reuse existing session if available, otherwise create a new one
        session = (
            StringSession(existing_session_string) if existing_session_string else StringSession()
        )
        client = TelegramClient(
            session,
            self.api_id,
            self.api_hash,
        )

        try:
            # Connection state logging for debugging
            session_type = "existing" if existing_session_string else "new"
            logger.info(f"[TELEGRAM] Connecting - session={session_type}")
            await client.connect()
            logger.info(f"[TELEGRAM] Connected - is_connected={client.is_connected()}")

            # Send code request (Telegram sends SMS/app notification)
            sent_code = await client.send_code_request(phone_number)

            # Save temporary session AND phone_code_hash for later verification
            temp_data = {
                "session": str(client.session.save()),  # type: ignore[possibly-unbound-attribute]
                "phone_code_hash": sent_code.phone_code_hash,
            }
            temp_session: str = json.dumps(temp_data)

            duration = time.time() - start_time
            logger.info(
                f"[TELEGRAM] Code request sent successfully to Telegram "
                f"for phone={phone_masked}, duration={duration:.2f}s"
            )

            return temp_session

        except PhoneNumberInvalidError as e:
            duration = time.time() - start_time
            logger.warning(
                f"[TELEGRAM] Invalid phone number format: phone={phone_masked}, duration={duration:.2f}s"
            )
            raise AuthenticationError(
                "Invalid phone number format. Use E.164 format (e.g., +447911123456)"
            ) from e

        except FloodWaitError as e:
            duration = time.time() - start_time
            logger.warning(
                f"[TELEGRAM] Rate limited by Telegram for phone={phone_masked}, "
                f"retry_after={e.seconds}s, duration={duration:.2f}s"
            )
            raise RateLimitError(
                f"Rate limited by Telegram. Retry after {e.seconds} seconds",
                retry_after=e.seconds,
            ) from e

        except (AuthRestartError, AuthKeyUnregisteredError, ConnectionError) as e:
            # Session is invalid/expired - retry with fresh session
            # NOTE: ConnectionError is included because Telethon may internally catch
            # AuthRestartError, disconnect, then raise ConnectionError to our code
            if existing_session_string:
                duration = time.time() - start_time
                logger.warning(
                    f"[TELEGRAM] Session invalid ({type(e).__name__}), retrying with fresh session "
                    f"for phone={phone_masked}, duration={duration:.2f}s"
                )
                # NOTE: Do NOT call client.disconnect() here
                # Telethon already disconnected the client when raising AuthRestartError
                # Calling disconnect() again corrupts the client state and causes
                # "Cannot send requests while disconnected" in the recursive call
                # The finally block will handle cleanup for this client instance

                # Recursive retry with fresh session (no existing_session_string)
                return await self.send_code_request(phone_number, existing_session_string=None)
            # If already using fresh session and still getting auth error, raise
            duration = time.time() - start_time
            logger.error(
                f"[TELEGRAM] Auth error with fresh session for phone={phone_masked}, duration={duration:.2f}s"
            )
            raise TelegramAPIError(
                f"Authentication error: {str(e)}. Please try again or contact support."
            ) from e

        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"[TELEGRAM] Failed to request verification code for phone={phone_masked}, "
                f"duration={duration:.2f}s, error={str(e)}",
                exc_info=True,
            )
            raise TelegramAPIError(f"Failed to request verification code: {str(e)}") from e

        finally:
            # Connection state logging for debugging
            logger.info(f"[TELEGRAM] Disconnecting - is_connected={client.is_connected()}")
            await client.disconnect()
            logger.info(f"[TELEGRAM] Disconnected - is_connected={client.is_connected()}")

    async def sign_in(
        self,
        temp_session_string: str,
        phone_number: str,
        code: str,
        password: str | None = None,
    ) -> tuple[str, int]:
        """Sign in to Telegram using verification code.

        Restores client from temporary session, verifies code,
        and returns persistent session string and user ID.

        Args:
            temp_session_string: JSON string with session and phone_code_hash.
            phone_number: Phone number in E.164 format.
            code: Verification code from Telegram.
            password: Optional 2FA password if user has 2FA enabled.

        Returns:
            Tuple of (persistent_session_string, telegram_user_id).

        Raises:
            AuthenticationError: If code is invalid, expired, or 2FA required.
            RateLimitError: If rate limited by Telegram.
            TelegramAPIError: For other Telegram API errors.
        """
        start_time = time.time()
        has_2fa = "with_2fa" if password else "without_2fa"
        phone_masked = f"{phone_number[:4]}***{phone_number[-4:]}"
        logger.info(f"[TELEGRAM] Signing in to Telegram for phone={phone_masked}, mode={has_2fa}")

        # Parse temp session data
        temp_data = json.loads(temp_session_string)
        session_string = temp_data["session"]
        phone_code_hash = temp_data["phone_code_hash"]

        client = TelegramClient(
            StringSession(session_string),
            self.api_id,
            self.api_hash,
        )

        try:
            await client.connect()
            # Verify code (may raise SessionPasswordNeededError for 2FA)
            try:
                await client.sign_in(phone_number, code, phone_code_hash=phone_code_hash)
            except SessionPasswordNeededError:
                if not password:
                    logger.warning(
                        f"[TELEGRAM] 2FA required but no password provided for phone={phone_masked}"
                    )
                    raise AuthenticationError(
                        "Two-factor authentication required. Please provide password."
                    ) from None
                # Handle 2FA
                logger.info(f"[TELEGRAM] Handling 2FA sign-in for phone={phone_masked}")
                await client.sign_in(password=password)

            # Get user info
            me = await client.get_me()
            telegram_user_id: int = int(me.id)  # type: ignore[possibly-unbound-attribute]

            # Save persistent session
            persistent_session: str = str(client.session.save())  # type: ignore[possibly-unbound-attribute]

            duration = time.time() - start_time
            logger.info(
                f"[TELEGRAM] Sign-in successful for phone={phone_masked}, "
                f"telegram_user_id={telegram_user_id}, duration={duration:.2f}s"
            )

            return persistent_session, telegram_user_id

        except PhoneCodeInvalidError as e:
            duration = time.time() - start_time
            logger.warning(
                f"[TELEGRAM] Invalid verification code for phone={phone_masked}, duration={duration:.2f}s"
            )
            raise AuthenticationError(
                "Invalid verification code. Please check and try again."
            ) from e

        except PhoneCodeExpiredError as e:
            duration = time.time() - start_time
            logger.warning(
                f"[TELEGRAM] Expired verification code for phone={phone_masked}, duration={duration:.2f}s"
            )
            raise AuthenticationError(
                "Verification code has expired. Please request a new code."
            ) from e

        except FloodWaitError as e:
            duration = time.time() - start_time
            logger.warning(
                f"[TELEGRAM] Rate limited by Telegram during sign-in for phone={phone_masked}, "
                f"retry_after={e.seconds}s, duration={duration:.2f}s"
            )
            raise RateLimitError(
                f"Rate limited by Telegram. Retry after {e.seconds} seconds",
                retry_after=e.seconds,
            ) from e

        except PasswordHashInvalidError as e:
            duration = time.time() - start_time
            logger.warning(
                f"[TELEGRAM] Invalid 2FA password for phone={phone_masked}, duration={duration:.2f}s"
            )
            raise AuthenticationError(
                "Invalid 2FA password. Please check your password and try again."
            ) from e

        except AuthenticationError:
            # Re-raise our custom exceptions
            raise

        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"[TELEGRAM] Failed to sign in for phone={phone_masked}, "
                f"duration={duration:.2f}s, error={str(e)}",
                exc_info=True,
            )
            raise TelegramAPIError(f"Failed to sign in: {str(e)}") from e

        finally:
            await client.disconnect()

    async def revoke_session(self, session_string: str) -> bool:
        """Revoke a Telegram session (best-effort).

        Attempts to log out from Telegram to invalidate the session.
        This is best-effort - failures are logged but not raised.

        Args:
            session_string: Session string from database.

        Returns:
            True if session was successfully revoked, False otherwise.
        """
        try:
            client = TelegramClient(
                StringSession(session_string),
                self.api_id,
                self.api_hash,
            )

            await client.connect()

            # Check if session is still authorized
            if not await client.is_user_authorized():
                logger.info("[TELEGRAM] Session already unauthorized, skipping revoke")
                return True

            # Log out from Telegram to revoke the session
            await client.log_out()
            logger.info("[TELEGRAM] Successfully revoked Telegram session")
            return True

        except Exception as e:
            # Best-effort: log warning but don't fail the deletion
            logger.warning(f"[TELEGRAM] Failed to revoke Telegram session (best-effort): {str(e)}")
            return False

        finally:
            try:
                await client.disconnect()
            except Exception:
                pass

    def detect_message_type(self, message: Any) -> str:
        """Detect message type from Telethon message properties.

        Follows priority order from data-model.md to determine message type.
        Checks message properties in specific order to handle overlapping types.

        Args:
            message: Telethon Message object.

        Returns:
            Message type string: photo, video, video_note, gif, voice, audio,
            sticker, document, contact, game, geo, poll, venue, text, or other.
        """
        # Priority order from data-model.md (15 types)
        if message.photo:
            return "photo"
        if message.video:
            return "video"
        if message.video_note:
            return "video_note"
        if message.gif:
            return "gif"
        if message.voice:
            return "voice"
        if message.audio:
            return "audio"
        if message.sticker:
            return "sticker"
        if message.document:
            return "document"
        if message.contact:
            return "contact"
        if message.game:
            return "game"
        if message.geo:
            return "geo"
        if message.poll:
            return "poll"
        if message.venue:
            return "venue"
        if message.text:
            return "text"

        # Fallback for unknown types
        return "other"

    def extract_file_metadata(self, message: Any) -> dict[str, Any]:
        """Extract file metadata from Telethon message.

        Extracts file information if message contains media.
        Uses message.file helper which provides unified access to file metadata.
        Includes robust error handling for different media types.

        Args:
            message: Telethon Message object.

        Returns:
            Dictionary with file metadata fields:
            - file_id (int | None)
            - file_name (str | None)
            - file_mime_type (str | None)
            - file_size (int | None)
            - file_duration (int | None)
            - file_width (int | None)
            - file_height (int | None)
        """
        # Default empty metadata
        empty_metadata = {
            "file_id": None,
            "file_name": None,
            "file_mime_type": None,
            "file_size": None,
            "file_duration": None,
            "file_width": None,
            "file_height": None,
        }

        try:
            # Check if message has file attribute
            if not hasattr(message, "file") or not message.file:
                return empty_metadata

            # Extract metadata from message.file helper with safe attribute access
            file = message.file
            return {
                "file_id": int(file.id) if hasattr(file, "id") and file.id else None,
                "file_name": file.name if hasattr(file, "name") and file.name else None,
                "file_mime_type": (
                    file.mime_type if hasattr(file, "mime_type") and file.mime_type else None
                ),
                "file_size": int(file.size) if hasattr(file, "size") and file.size else None,
                "file_duration": (
                    int(file.duration) if hasattr(file, "duration") and file.duration else None
                ),
                "file_width": int(file.width) if hasattr(file, "width") and file.width else None,
                "file_height": (
                    int(file.height) if hasattr(file, "height") and file.height else None
                ),
            }
        except Exception:
            # If any error occurs during metadata extraction, return empty metadata
            # This ensures the message is still stored even if file metadata fails
            return empty_metadata

    async def fetch_all_messages(
        self,
        session_string: str,
        limit_per_chat: int | None = None,
        min_message_ids: dict[int, int] | None = None,
        max_message_age_days: int | None = None,
        channel_ids: list[int] | None = None,
        progress_callback: Any | None = None,
        check_cancelled: Any | None = None,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Fetch messages from user's Telegram account.

        Iterates through dialogs (optionally filtered by channel_ids) and
        fetches messages from each. Yields message data as dictionaries
        ready for database insertion.

        Supports rate limiting (delay between dialogs), continuation
        (only fetch messages newer than previously fetched), date limits,
        and selective channel fetching.

        Args:
            session_string: User's persistent Telethon session string.
            limit_per_chat: Maximum messages to fetch per chat.
                Defaults to settings.telegram_fetch_limit_per_chat.
            min_message_ids: Optional dict mapping chat_id -> min_message_id.
                If provided, only fetches messages with ID > min_id for each chat.
                Used for continuation/incremental fetching.
            max_message_age_days: Maximum age in days for messages to fetch.
                Defaults to settings.telegram_fetch_max_age_days (30 days).
                Messages older than this are skipped.
            channel_ids: Optional list of channel IDs to fetch from.
                If provided, only fetches from these channels.
                If None, fetches from all channels.
            progress_callback: Optional async callback(channel_id, channel_title, completed_count).
                Called after each channel completes.
            check_cancelled: Optional async callback() -> bool.
                If returns True, fetch is cancelled.

        Yields:
            Message dictionaries with all required fields for Message model.
        """
        # Use configured limit if not specified
        if limit_per_chat is None:
            limit_per_chat = self.settings.telegram_fetch_limit_per_chat

        # Use configured max age if not specified (default: 30 days)
        if max_message_age_days is None:
            max_message_age_days = self.settings.telegram_fetch_max_age_days

        # Calculate cutoff date for filtering old messages
        cutoff_date = None
        if max_message_age_days and max_message_age_days > 0:
            cutoff_date = datetime.now(UTC) - timedelta(days=max_message_age_days)

        client = TelegramClient(
            StringSession(session_string),
            self.api_id,
            self.api_hash,
        )

        # Set flood sleep threshold for auto-wait on rate limits
        client.flood_sleep_threshold = self.settings.telegram_flood_sleep_threshold

        dialogs_processed = 0
        total_yielded = 0

        try:
            await client.connect()

            # Validate session
            if not await client.is_user_authorized():
                raise AuthenticationError("Session expired or invalid. Please re-authenticate.")

            # Convert channel_ids to set for O(1) lookup
            channel_ids_set = set(channel_ids) if channel_ids else None

            # Log rate limiting configuration
            logger.info(
                f"[TELEGRAM] Fetching messages with rate limiting: "
                f"delay={self.settings.telegram_fetch_delay_seconds}s, "
                f"flood_threshold={self.settings.telegram_flood_sleep_threshold}s, "
                f"limit_per_chat={limit_per_chat}, "
                f"max_age_days={max_message_age_days}, "
                f"continuation_chats={len(min_message_ids) if min_message_ids else 0}, "
                f"selected_channels={len(channel_ids) if channel_ids else 'all'}"
            )

            # Iterate through all dialogs (chats, channels, groups)
            async for dialog in client.iter_dialogs():
                # Check if fetch was cancelled
                if check_cancelled and await check_cancelled():
                    logger.info("[TELEGRAM] Fetch cancelled by user")
                    break

                # Filter by selected channels if specified
                if channel_ids_set is not None and int(dialog.id) not in channel_ids_set:
                    continue

                # Filter: Skip non-channels if configured (only when not using channel_ids)
                if (
                    channel_ids_set is None
                    and self.settings.telegram_fetch_channel_only
                    and not dialog.is_channel
                ):
                    logger.debug(
                        f"[TELEGRAM] Skipping non-channel dialog - "
                        f"chat_id={dialog.id}, chat_title={dialog.name}, "
                        f"chat_type={'group' if dialog.is_group else 'private'}"
                    )
                    continue

                # Determine chat type
                chat_type = (
                    "channel" if dialog.is_channel else "group" if dialog.is_group else "private"
                )

                # Get min_id for continuation (only fetch newer messages)
                chat_id = int(dialog.id)
                min_id = min_message_ids.get(chat_id, 0) if min_message_ids else 0

                if min_id > 0:
                    logger.debug(
                        f"[TELEGRAM] Continuing fetch for chat_id={chat_id} from min_id={min_id}"
                    )

                # Fetch messages from this dialog with optional min_id
                async for message in client.iter_messages(
                    dialog, limit=limit_per_chat, min_id=min_id
                ):
                    # Date limit: stop when hitting messages older than cutoff
                    # Messages are returned newest-first, so we can break early
                    if cutoff_date and message.date:
                        msg_date = message.date
                        # Ensure timezone-aware comparison
                        if msg_date.tzinfo is None:
                            msg_date = msg_date.replace(tzinfo=UTC)
                        if msg_date < cutoff_date:
                            logger.debug(
                                f"[TELEGRAM] Reached date limit for chat_id={chat_id}, "
                                f"stopping fetch for this dialog"
                            )
                            break  # Stop fetching older messages for this dialog

                    # Skip service messages (e.g., "User joined group")
                    if not message.message and not message.media:
                        continue

                    # Detect message type
                    message_type = self.detect_message_type(message)

                    # Extract file metadata
                    file_metadata = self.extract_file_metadata(message)

                    # Extract chat_id and sender_id
                    # dialog.id gives the chat/channel ID (official Telethon examples use this)
                    chat_id = int(dialog.id)

                    # For sender_id:
                    # - If message.sender_id exists and is different from chat_id: it's a real user sender
                    # - If message.sender_id == chat_id: it's an anonymous channel broadcast (set to None)
                    # - If message.sender_id is None: already None
                    sender_id = None
                    if message.sender_id and int(message.sender_id) != chat_id:
                        sender_id = int(message.sender_id)

                    # Build message dictionary
                    message_dict = {
                        "telegram_message_id": int(message.id),
                        "chat_id": chat_id,
                        "chat_title": dialog.name if dialog.name else None,
                        "chat_type": chat_type,
                        "sender_id": sender_id,
                        "sender_name": None,
                        "content": entities_to_markdown(message.text, message.entities)
                        if message.text
                        else None,
                        "message_type": message_type,
                        "has_media": bool(message.media),
                        "is_reply": bool(message.is_reply),
                        "is_forward": bool(message.forward),
                        "timestamp": message.date,
                        "additional_metadata": None,  # Can store extra data here
                        **file_metadata,
                    }

                    yield message_dict
                    total_yielded += 1

                # Rate limiting: delay between dialogs to avoid overwhelming Telegram
                dialogs_processed += 1

                # Call progress callback if provided
                if progress_callback:
                    await progress_callback(chat_id, dialog.name, dialogs_processed)

                if self.settings.telegram_fetch_delay_seconds > 0:
                    logger.debug(
                        f"[TELEGRAM] Processed dialog {dialogs_processed} "
                        f"({dialog.name}), sleeping {self.settings.telegram_fetch_delay_seconds}s"
                    )
                    await asyncio.sleep(self.settings.telegram_fetch_delay_seconds)

            logger.info(
                f"[TELEGRAM] Fetch complete: {total_yielded} messages "
                f"from {dialogs_processed} dialogs"
            )

        except FloodWaitError as e:
            raise RateLimitError(
                f"Rate limited by Telegram. Retry after {e.seconds} seconds",
                retry_after=e.seconds,
            ) from e

        except AuthKeyUnregisteredError as e:
            # Session invalidated by Telegram - user must re-authenticate
            logger.warning(
                f"[TELEGRAM] Session expired during message fetch - AuthKeyUnregisteredError: {e}"
            )
            raise SessionExpiredError(
                "Your Telegram session has expired. Please log in again to continue."
            ) from e

        except AuthenticationError:
            # Re-raise our custom exceptions
            raise

        except Exception as e:
            raise TelegramAPIError(f"Failed to fetch messages: {str(e)}") from e

        finally:
            await client.disconnect()

    async def download_media_for_message(
        self,
        session_string: str,
        chat_id: int,
        telegram_message_id: int,
    ) -> bytes | None:
        """Download media from a specific Telegram message.

        Downloads media content on-demand from Telegram. Returns raw bytes
        that can be served directly to the client or stored temporarily.

        Args:
            session_string: User's persistent Telethon session string.
            chat_id: Telegram chat ID where the message exists.
            telegram_message_id: Telegram message ID containing media.

        Returns:
            Media data as bytes if message has media, None otherwise.

        Raises:
            AuthenticationError: If session is invalid or expired.
            RateLimitError: If rate limited by Telegram.
            TelegramAPIError: For other Telegram API errors.
        """
        client = TelegramClient(
            StringSession(session_string),
            self.api_id,
            self.api_hash,
        )

        try:
            await client.connect()

            # Validate session
            if not await client.is_user_authorized():
                raise AuthenticationError("Session expired or invalid. Please re-authenticate.")

            # Get specific message by ID
            message = await client.get_messages(chat_id, ids=telegram_message_id)

            if not message:
                return None

            if not message.media:  # type: ignore[possibly-unbound-attribute]
                return None

            # Download media to bytes (in-memory)
            media_bytes: bytes = await client.download_media(message, file=bytes)  # type: ignore[invalid-assignment]
            return media_bytes

        except FloodWaitError as e:
            raise RateLimitError(
                f"Rate limited by Telegram. Retry after {e.seconds} seconds",
                retry_after=e.seconds,
            ) from e

        except AuthenticationError:
            # Re-raise our custom exceptions
            raise

        except Exception as e:
            raise TelegramAPIError(f"Failed to download media: {str(e)}") from e

        finally:
            await client.disconnect()

    async def get_available_channels(
        self,
        session_string: str,
    ) -> list[dict[str, Any]]:
        """Get list of available channels/chats from user's Telegram account.

        Fetches all dialogs (channels, groups, private chats) and returns
        their metadata without fetching any messages.

        Args:
            session_string: User's persistent Telethon session string.

        Returns:
            List of channel dictionaries with:
                - channel_id: Telegram chat ID
                - title: Channel/chat title
                - type: 'channel', 'group', 'supergroup', or 'private'
                - member_count: Number of members (if available)
                - last_message_date: Date of last message (if available)

        Raises:
            AuthenticationError: If session is invalid or expired.
            RateLimitError: If rate limited by Telegram.
            TelegramAPIError: For other Telegram API errors.
        """
        client = TelegramClient(
            StringSession(session_string),
            self.api_id,
            self.api_hash,
        )

        # Set flood sleep threshold for auto-wait on rate limits
        client.flood_sleep_threshold = self.settings.telegram_flood_sleep_threshold

        channels: list[dict[str, Any]] = []

        try:
            await client.connect()

            # Validate session
            if not await client.is_user_authorized():
                raise AuthenticationError("Session expired or invalid. Please re-authenticate.")

            logger.info("[TELEGRAM] Fetching available channels/dialogs")

            # Iterate through all dialogs
            async for dialog in client.iter_dialogs():
                # Determine chat type
                if dialog.is_channel:
                    chat_type = "channel"
                elif dialog.is_group:
                    # Check if it's a supergroup (megagroup)
                    entity = dialog.entity
                    if hasattr(entity, "megagroup") and entity.megagroup:
                        chat_type = "supergroup"
                    else:
                        chat_type = "group"
                else:
                    chat_type = "private"

                # Get member count if available
                member_count = None
                entity = dialog.entity
                if hasattr(entity, "participants_count"):
                    member_count = entity.participants_count

                # Get last message date
                last_message_date = None
                if dialog.message and dialog.message.date:
                    last_message_date = dialog.message.date
                    # Ensure timezone-aware
                    if last_message_date.tzinfo is None:
                        last_message_date = last_message_date.replace(tzinfo=UTC)

                channels.append(
                    {
                        "channel_id": int(dialog.id),
                        "title": dialog.name or f"Chat {dialog.id}",
                        "type": chat_type,
                        "member_count": member_count,
                        "last_message_date": last_message_date,
                    }
                )

            logger.info(f"[TELEGRAM] Found {len(channels)} channels/dialogs")
            return channels

        except FloodWaitError as e:
            raise RateLimitError(
                f"Rate limited by Telegram. Retry after {e.seconds} seconds",
                retry_after=e.seconds,
            ) from e

        except AuthKeyUnregisteredError as e:
            logger.warning(f"[TELEGRAM] Session expired: {e}")
            raise SessionExpiredError(
                "Your Telegram session has expired. Please log in again to continue."
            ) from e

        except AuthenticationError:
            raise

        except Exception as e:
            raise TelegramAPIError(f"Failed to fetch channels: {str(e)}") from e

        finally:
            await client.disconnect()
