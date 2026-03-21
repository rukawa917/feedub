"""Pydantic schemas for insights API."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

# ============================================================================
# Validation Schemas
# ============================================================================


class ValidateInsightRequest(BaseModel):
    """Request to validate insight parameters before generation."""

    chat_ids: list[str] = Field(..., description="List of chat IDs to include")
    start_date: datetime
    end_date: datetime


class ValidateInsightResponse(BaseModel):
    """Response for insight validation."""

    valid: bool
    message_count: int
    exceeds_limit: bool = False
    estimated_tokens: int | None = None
    max_messages: int | None = None
    suggested_filters: dict[str, Any] | None = None


# ============================================================================
# Generate Schemas
# ============================================================================

# Supported languages for insight generation
SUPPORTED_LANGUAGES = {
    "en": "English",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "ja": "Japanese",
    "ko": "Korean",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "ru": "Russian",
}

# Type-safe language code validation
SupportedLanguage = Literal["en", "zh-CN", "zh-TW", "ja", "ko", "es", "fr", "de", "pt", "ru"]


class GenerateInsightRequest(BaseModel):
    """Request to generate insights."""

    chat_ids: list[str] = Field(..., description="List of chat IDs to include")
    start_date: datetime
    end_date: datetime
    language: SupportedLanguage = Field(
        default="en", description="Language code for insight output"
    )


class GenerateInsightFromIdsRequest(BaseModel):
    """Request for generating an insight from specific message IDs."""

    message_ids: list[UUID]
    language: SupportedLanguage = "en"

    @field_validator("message_ids")
    @classmethod
    def validate_message_ids(cls, v):
        if len(v) == 0:
            raise ValueError("At least one message ID required")
        if len(v) > 10000:
            raise ValueError("Maximum 10000 message IDs per request")
        return v


# ============================================================================
# Insight Response Schemas
# ============================================================================


class InsightSummary(BaseModel):
    """Summary of an insight for list view."""

    id: UUID
    chat_ids: list[int]
    chat_titles: list[str] | None
    start_date: datetime
    end_date: datetime
    message_count: int
    status: str
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class InsightDetail(BaseModel):
    """Full insight detail."""

    id: UUID
    user_id: UUID
    chat_ids: list[int]
    chat_titles: list[str] | None
    start_date: datetime
    end_date: datetime
    message_count: int

    # Generated content
    summary: str | None

    # Status
    status: str
    error_message: str | None

    # Metadata
    model_used: str
    provider_used: str
    input_tokens: int | None
    output_tokens: int | None
    cost_usd: Decimal | None
    generation_time_ms: int | None

    # Timestamps
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class InsightListResponse(BaseModel):
    """Response for listing insights."""

    insights: list[InsightSummary]
    total: int


# ============================================================================
# Error Schemas
# ============================================================================
# All error handling done via FastAPI HTTPException
