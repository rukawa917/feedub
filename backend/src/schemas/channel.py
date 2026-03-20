"""
Channel-related Pydantic schemas for request/response validation.

This module defines schemas for channel operations including:
- Available channels from Telegram
- User's channel selections
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class AvailableChannelResponse(BaseModel):
    """Response schema for a single available channel from Telegram."""

    channel_id: int = Field(..., description="Telegram channel/chat ID")
    title: str = Field(..., description="Channel/chat title")
    type: Literal["channel", "group", "supergroup", "private"] = Field(
        ..., description="Type of chat"
    )
    member_count: int | None = Field(default=None, description="Number of members (if available)")
    last_message_date: datetime | None = Field(
        default=None, description="Date of the last message in the channel"
    )


class AvailableChannelsResponse(BaseModel):
    """Response schema for list of available channels from Telegram."""

    channels: list[AvailableChannelResponse] = Field(
        ..., description="List of available channels from user's Telegram account"
    )
    total: int = Field(..., description="Total number of channels")


class ChannelSelectionResponse(BaseModel):
    """Response schema for a saved channel selection."""

    id: UUID = Field(..., description="Selection record ID")
    channel_id: int = Field(..., description="Telegram channel/chat ID")
    channel_title: str | None = Field(
        default=None, description="Channel title at time of selection"
    )
    channel_type: str | None = Field(default=None, description="Channel type at time of selection")
    selected_at: datetime = Field(..., description="When this channel was selected")

    model_config = {"from_attributes": True}


class ChannelSelectionsResponse(BaseModel):
    """Response schema for user's saved channel selections."""

    selections: list[ChannelSelectionResponse] = Field(
        ..., description="List of user's selected channels"
    )
    total: int = Field(..., description="Total number of selected channels")


class ChannelSelectionItem(BaseModel):
    """Schema for a single channel selection in update request."""

    channel_id: int = Field(..., description="Telegram channel/chat ID")
    channel_title: str | None = Field(default=None, description="Channel title")
    channel_type: str | None = Field(default=None, description="Channel type")


class UpdateChannelSelectionsRequest(BaseModel):
    """Request schema for updating user's channel selections."""

    channels: list[ChannelSelectionItem] = Field(
        ..., description="List of channels to select (replaces existing selections)"
    )


class FetchRequest(BaseModel):
    """Request schema for triggering a selective message fetch."""

    channel_ids: list[int] | None = Field(
        default=None,
        description="Optional list of channel IDs to fetch from. "
        "If not provided, fetches from all user's selected channels.",
    )


# Channel Favorites schemas


class ChannelFavoriteResponse(BaseModel):
    """Response schema for a single channel favorite."""

    id: UUID = Field(..., description="Favorite record ID")
    channel_id: int = Field(..., description="Telegram channel/chat ID")
    channel_title: str | None = Field(
        default=None, description="Channel title at time of favoriting"
    )
    channel_type: str | None = Field(default=None, description="Channel type at time of favoriting")
    favorited_at: datetime = Field(..., description="When this channel was favorited")

    model_config = {"from_attributes": True}


class ChannelFavoritesResponse(BaseModel):
    """Response schema for user's favorite channels."""

    favorites: list[ChannelFavoriteResponse] = Field(
        ..., description="List of user's favorite channels"
    )
    total: int = Field(..., description="Total number of favorite channels")


class AddChannelFavoriteRequest(BaseModel):
    """Request schema for adding a channel to favorites."""

    channel_id: int = Field(..., description="Telegram channel/chat ID")
    channel_title: str | None = Field(default=None, description="Channel title")
    channel_type: str | None = Field(default=None, description="Channel type")


class ToggleFavoriteResponse(BaseModel):
    """Response schema for toggling a channel favorite."""

    is_favorite: bool = Field(..., description="Whether the channel is now a favorite")
    favorite: ChannelFavoriteResponse | None = Field(
        default=None, description="The favorite record if added, None if removed"
    )
