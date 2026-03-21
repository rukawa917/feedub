"""
Configuration management for the Telegram Message Aggregation MVP.

This module loads environment variables from a .env file.
Copy .env.example to .env and fill in your values to get started.
"""

import logging
import secrets
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_config_logger = logging.getLogger(__name__)


def _find_repo_root() -> Path:
    """Walk up from this file to find the repo root (directory containing .git)."""
    current = Path(__file__).resolve().parent
    for parent in [current, *current.parents]:
        if (parent / ".git").exists():
            return parent
    # Fallback: assume backend/ is one level below root
    return Path(__file__).resolve().parents[3]


_ENV_FILE = _find_repo_root() / ".env"

# Stable defaults for local/personal use — auto-generated once at module load.
# These persist for the lifetime of the process. For multi-process deployments,
# set explicit values in .env.
_DEFAULT_JWT_SECRET = secrets.token_urlsafe(32)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database Configuration
    database_url: str = Field(
        default="sqlite+aiosqlite:///./data/feedub.db",
        description="SQLite database connection URL",
    )

    # Telegram API Configuration (required)
    telegram_api_id: int = Field(..., gt=0, description="Telegram API ID")
    telegram_api_hash: str = Field(..., min_length=1, description="Telegram API hash")

    # Security Configuration (auto-generated for local use)
    jwt_secret_key: str = Field(
        default=_DEFAULT_JWT_SECRET,
        min_length=32,
        description="Secret key for JWT token generation",
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    jwt_expiration_hours: int = Field(
        default=24, gt=0, description="JWT token expiration time in hours"
    )

    # Application Configuration
    app_env: str = Field(default="development", description="Application environment")
    debug: bool = Field(default=False, description="Enable debug mode")

    # Feature Toggles (for self-hosted deployments)
    llm_enabled: bool = Field(
        default=False,
        description="Enable LLM-powered AI insights (requires LLM provider configuration)",
    )
    api_version: str = Field(default="1.0.0", description="API version")

    # CORS Configuration
    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:8000"],
        description="Allowed CORS origins (set to your frontend URL in production)",
    )

    # Logging Configuration
    log_dir: str | None = Field(
        default=None, description="Directory for log files (if None, only console logging)"
    )
    log_file_name: str = Field(default="feedub-api.log", description="Log file name")

    # Telegram Fetch Configuration
    telegram_fetch_channel_only: bool = Field(
        default=False,
        description="Fetch only Telegram channels (exclude groups and private chats)",
    )
    telegram_fetch_delay_seconds: float = Field(
        default=1.0,
        ge=0.0,
        description="Delay in seconds between fetching each dialog/channel",
    )
    telegram_flood_sleep_threshold: int = Field(
        default=60,
        ge=0,
        description="Auto-sleep threshold for FloodWaitError (0 to disable)",
    )
    telegram_fetch_limit_per_chat: int = Field(
        default=1000,
        gt=0,
        description="Maximum messages to fetch per chat/channel",
    )
    telegram_fetch_max_age_days: int = Field(
        default=30,
        gt=0,
        description="Maximum age in days for messages to fetch (default: 30 days)",
    )

    # Data Retention Configuration
    message_retention_days: int = Field(
        default=7,
        ge=1,
        le=365,
        description="Number of days to retain messages before automatic deletion (based on fetched_at)",
    )

    # LLM Configuration
    llm_model: str = Field(
        default="ollama/llama3.2",
        description="LiteLLM model string (e.g. gpt-4o, claude-sonnet-4-20250514, ollama/llama3.2)",
    )
    llm_api_key: str | None = Field(
        default=None,
        description="LLM API key (not needed for Ollama)",
    )
    llm_api_base: str | None = Field(
        default=None,
        description="Custom LLM API base URL",
    )
    llm_fallback_model: str | None = Field(
        default=None,
        description="Fallback LLM model string",
    )
    llm_max_input_tokens: int = Field(
        default=64_000,
        gt=0,
        description="Max input tokens for LLM context",
    )
    llm_request_timeout_seconds: int = Field(
        default=120,
        gt=0,
        description="LLM request timeout",
    )
    llm_max_retries: int = Field(
        default=2,
        ge=0,
        description="Max retry attempts",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Get application settings (cached singleton).

    Returns:
        Settings: Application settings instance.
    """
    settings = Settings()
    if settings.jwt_secret_key == _DEFAULT_JWT_SECRET:
        _config_logger.warning(
            "[SECURITY] Using auto-generated JWT secret. Sessions will not survive "
            "restarts. Set JWT_SECRET_KEY in .env for production use."
        )
    return settings
