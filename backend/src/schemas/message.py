"""
Message-related Pydantic schemas for request/response validation.

This module defines schemas for message operations including:
- Message fetch operations (start, status)
- Message retrieval (single, list with filters)
- Media download

All schemas match the OpenAPI contract in specs/001-mvp-web-api/contracts/openapi.yaml
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from fastapi import Query
from pydantic import BaseModel, Field, field_validator


# Response schemas for message fetch operations
class FetchStartedResponse(BaseModel):
    """Response when a message fetch operation is initiated."""

    fetch_id: UUID = Field(..., description="Unique fetch operation identifier")
    status: Literal["pending", "in_progress"] = Field(
        ..., description="Initial status of fetch operation"
    )
    message: str = Field(
        ...,
        example="Message fetch started. Use fetch_id to check progress.",
        description="Human-readable message",
    )


class FailedChannelInfo(BaseModel):
    """Information about a channel that failed during fetch."""

    channel_id: int = Field(..., description="Telegram channel ID that failed")
    title: str | None = Field(default=None, description="Channel title")
    error: str = Field(..., description="Error message")


class FetchStatusResponse(BaseModel):
    """Response for fetch operation status queries."""

    fetch_id: UUID = Field(..., description="Unique fetch operation identifier")
    status: Literal["pending", "in_progress", "completed", "failed", "cancelled"] = Field(
        ..., description="Current status of fetch operation"
    )
    current_phase: Literal["fetching_messages", "completed"] = Field(
        default="fetching_messages",
        description="Current phase within the fetch operation",
    )
    messages_count: int = Field(default=0, description="Number of messages fetched so far")
    started_at: datetime = Field(..., description="When the fetch started")
    completed_at: datetime | None = Field(
        default=None, description="When the fetch completed (null if not completed)"
    )
    error_message: str | None = Field(
        default=None, description="Error details (only for failed status)"
    )
    error_type: Literal["session_expired", "rate_limited", "connection_error", "unknown"] | None = (
        Field(default=None, description="Error category (only for failed status)")
    )
    # Channel-level progress fields
    total_channels: int | None = Field(
        default=None, description="Total number of channels being fetched"
    )
    completed_channels: int = Field(default=0, description="Number of channels completed so far")
    current_channel_title: str | None = Field(
        default=None, description="Title of the channel currently being fetched"
    )
    failed_channels: list[FailedChannelInfo] | None = Field(
        default=None, description="List of channels that failed during fetch"
    )
    channel_ids: list[int] | None = Field(
        default=None, description="List of channel IDs being fetched"
    )


# Response schemas for message retrieval
class MessageResponse(BaseModel):
    """Response schema for a single message."""

    id: UUID = Field(..., description="Message unique identifier")
    telegram_message_id: int = Field(..., description="Original Telegram message ID")
    chat_id: int = Field(..., description="Telegram chat/channel ID")
    chat_title: str | None = Field(default=None, description="Chat/channel name")
    chat_type: Literal["channel", "group", "supergroup", "private"] = Field(
        ..., description="Type of chat"
    )
    sender_id: int | None = Field(default=None, description="Telegram user ID of sender")
    sender_name: str | None = Field(default=None, description="Display name of sender")
    content: str | None = Field(default=None, description="Message text content")
    message_type: Literal[
        "text",
        "photo",
        "video",
        "document",
        "audio",
        "voice",
        "video_note",
        "gif",
        "sticker",
        "contact",
        "game",
        "geo",
        "poll",
        "venue",
        "other",
    ] = Field(..., description="Message type detected from Telethon properties")
    has_media: bool = Field(
        ..., description="Whether message contains media (from bool(message.media))"
    )

    # File metadata (from message.file)
    file_id: int | None = Field(default=None, description="Telegram file ID (from message.file.id)")
    file_name: str | None = Field(
        default=None, description="Original filename (from message.file.name)"
    )
    file_mime_type: str | None = Field(
        default=None, description="MIME type (from message.file.mime_type)"
    )
    file_size: int | None = Field(
        default=None, description="File size in bytes (from message.file.size)"
    )
    file_duration: int | None = Field(
        default=None,
        description="Duration in seconds for audio/video (from message.file.duration)",
    )
    file_width: int | None = Field(
        default=None,
        description="Width in pixels for images/video (from message.file.width)",
    )
    file_height: int | None = Field(
        default=None,
        description="Height in pixels for images/video (from message.file.height)",
    )

    # Message flags
    is_reply: bool = Field(..., description="Whether message is a reply (from message.is_reply)")
    is_forward: bool = Field(
        ..., description="Whether message is forwarded (from bool(message.forward))"
    )

    # Timestamps
    timestamp: datetime = Field(..., description="Original message timestamp")
    fetched_at: datetime = Field(..., description="When message was fetched")

    model_config = {"from_attributes": True}


class MessagesResponse(BaseModel):
    """Response schema for paginated message list."""

    messages: list[MessageResponse] = Field(..., description="List of messages matching filters")
    total: int = Field(..., description="Total number of messages matching filters")
    limit: int = Field(..., description="Maximum number of results per page")
    offset: int = Field(..., description="Number of results skipped")
    has_more: bool = Field(..., description="Whether there are more results available")
    search_history_clamped: dict | None = Field(
        default=None,
        description="Present when search date was clamped to plan's history limit. Contains upgrade info.",
    )


# Query parameter schema for message filtering
class MessageFilterParams(BaseModel):
    """Query parameters for filtering and searching messages.

    Supports full-text search, chat filtering, date range, message type, and media filtering.
    All parameters are optional and can be combined.
    """

    search: str | None = Field(
        default=None,
        description="Full-text search query for message content",
        min_length=1,
        max_length=500,
    )
    chat_ids: list[int] | None = Query(
        default=None, description="Filter by specific chat IDs (can specify multiple)"
    )
    start_date: datetime | None = Field(
        default=None,
        description="Filter messages after this date (inclusive)",
    )
    end_date: datetime | None = Field(
        default=None,
        description="Filter messages before this date (inclusive)",
    )
    message_type: (
        Literal[
            "text",
            "photo",
            "video",
            "document",
            "audio",
            "voice",
            "video_note",
            "gif",
            "sticker",
            "contact",
            "game",
            "geo",
            "poll",
            "venue",
            "other",
        ]
        | None
    ) = Field(
        default=None,
        description="Filter by message type",
    )
    has_media: bool | None = Field(
        default=None,
        description="Filter by presence of media (true=media only, false=no media)",
    )
    limit: int = Field(
        default=50,
        ge=1,
        le=200,
        description="Maximum number of results (1-200)",
    )
    offset: int = Field(
        default=0,
        ge=0,
        description="Number of results to skip for pagination",
    )

    @field_validator("end_date")
    @classmethod
    def validate_date_range(cls, end_date: datetime | None, info) -> datetime | None:
        """Validate that end_date is after start_date if both are provided."""
        start_date = info.data.get("start_date")
        if start_date is not None and end_date is not None:
            if end_date < start_date:
                raise ValueError("end_date must be after or equal to start_date")
        return end_date


class ChatFilterParams(BaseModel):
    search: str | None = Field(default=None, max_length=100)
    limit: int = Field(default=200, ge=1, le=500)
    offset: int = Field(default=0, ge=0)


class ChatResponse(BaseModel):
    chat_id: str
    title: str
    type: Literal["channel", "group", "supergroup", "private"]
    message_count: int


class ChatsResponse(BaseModel):
    chats: list[ChatResponse]
    total: int
    limit: int
    offset: int
    has_more: bool


class MessageIdsResponse(BaseModel):
    """Response schema for message IDs only (lightweight endpoint)."""

    ids: list[UUID] = Field(..., description="List of message UUIDs matching filters")
    total: int = Field(..., description="Total number of messages matching filters")
    search_history_clamped: dict | None = Field(
        default=None,
        description="Present when search date was clamped to plan's history limit. Contains upgrade info.",
    )
