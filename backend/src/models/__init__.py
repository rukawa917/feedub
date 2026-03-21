"""
Database models for the Telegram Message Aggregation MVP.

This module exports all SQLAlchemy models for use throughout the application
and ensures they are registered with the Base metadata for migrations.
"""

from src.models.insight import Insight
from src.models.message import Message
from src.models.message_fetch import MessageFetch
from src.models.user import User
from src.models.user_channel_favorite import UserChannelFavorite
from src.models.user_channel_selection import UserChannelSelection

__all__ = [
    "User",
    "Message",
    "MessageFetch",
    "UserChannelFavorite",
    "UserChannelSelection",
    "Insight",
]
