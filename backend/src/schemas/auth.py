"""Authentication request and response schemas.

This module defines Pydantic schemas for authentication endpoints per OpenAPI spec.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


def validate_phone_format(v: str) -> str:
    """Validate phone number is in E.164 format."""
    if not v.startswith("+"):
        raise ValueError("Phone number must start with + (E.164 format)")
    if not v[1:].isdigit():
        raise ValueError("Phone number must contain only digits after +")
    return v


class LoginRequest(BaseModel):
    """Request schema for POST /auth/request-code.

    Triggers Telegram to send verification code to user's phone.
    """

    phone_number: str = Field(
        ...,
        description="Phone number in E.164 format (e.g., +447911123456)",
        examples=["+447911123456"],
        min_length=10,
        max_length=20,
    )

    @field_validator("phone_number")
    @classmethod
    def _validate_phone_format(cls, v: str) -> str:
        return validate_phone_format(v)


class LoginResponse(BaseModel):
    """Response schema for POST /auth/request-code.

    Indicates code was sent successfully by Telegram.
    """

    message: str = Field(
        ...,
        description="Success message",
        examples=["Verification code sent to your phone"],
    )
    phone_hash: str = Field(
        ...,
        description="Phone code hash from Telegram (required for verification step)",
        examples=["abc123def456..."],
    )


class VerifyRequest(BaseModel):
    """Request schema for POST /auth/verify-code.

    Verifies code sent by Telegram and optionally handles 2FA.
    """

    phone_number: str = Field(
        ...,
        description="Phone number in E.164 format",
        examples=["+447911123456"],
        min_length=10,
        max_length=20,
    )
    phone_code_hash: str = Field(
        ...,
        description="Phone code hash from /auth/request-code response",
        examples=["abc123def456..."],
    )
    code: str = Field(
        ...,
        description="Verification code received from Telegram (5-6 digits)",
        examples=["12345"],
        min_length=4,
        max_length=10,
    )
    password: str | None = Field(
        None,
        description="Two-factor authentication password (if 2FA enabled)",
        examples=["my2fapassword"],
        min_length=1,
    )

    @field_validator("phone_number")
    @classmethod
    def _validate_phone_format(cls, v: str) -> str:
        return validate_phone_format(v)

    @field_validator("code")
    @classmethod
    def validate_code_format(cls, v: str) -> str:
        """Validate code contains only digits."""
        if not v.isdigit():
            raise ValueError("Verification code must contain only digits")
        return v


class UserResponse(BaseModel):
    """Response schema for user information."""

    id: UUID = Field(..., description="Unique user identifier")
    phone: str = Field(..., description="User's phone number", validation_alias="phone_number")
    telegram_user_id: int | None = Field(
        None,
        description="Telegram user ID (null if never authenticated)",
    )
    created_at: datetime = Field(..., description="Account creation timestamp")
    last_login_at: datetime | None = Field(
        None,
        description="Last successful login timestamp",
    )

    model_config = {
        "from_attributes": True,  # Enable ORM mode for SQLAlchemy models
    }


class AuthResponse(BaseModel):
    """Response schema for POST /auth/verify-code.

    Returns JWT token and user information after successful authentication.
    """

    access_token: str = Field(
        ...,
        description="JWT access token (valid for 24 hours)",
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."],
    )
    token_type: str = Field(
        default="bearer",
        description="Token type (always 'bearer')",
    )
    user: UserResponse = Field(..., description="Authenticated user information")
