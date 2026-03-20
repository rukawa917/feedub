"""
FastAPI application initialization and configuration.

This module creates and configures the FastAPI application instance with:
- CORS middleware for cross-origin requests
- Database connection lifecycle management
- API router registration
"""

import logging
import sys
import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from src.core.config import get_settings
from src.core.database import close_db_connections, get_async_engine
from src.core.exceptions import (
    AuthenticationError,
    ConsentRequiredError,
    InsightGenerationError,
    InsightRateLimitError,
    MessageLimitExceededError,
    RateLimitError,
    SessionExpiredError,
    TelegramAPIError,
)
from src.core.middleware import TokenRefreshMiddleware

# Get settings first (needed for logging configuration)
settings = get_settings()

# Configure logging handlers
handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]

# Add file handler if log directory is configured
if settings.log_dir:
    log_dir = Path(settings.log_dir)

    # Create log directory if it doesn't exist
    try:
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / settings.log_file_name

        # Add rotating file handler (10MB max, keep 5 backups)
        from logging.handlers import RotatingFileHandler

        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
        )
        handlers.append(file_handler)

    except Exception as e:
        # If we can't create the log directory, just print warning and continue with console logging
        print(f"Warning: Could not create log directory {log_dir}: {e}", file=sys.stderr)

# Configure logging for the application
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=handlers,
)

logger = logging.getLogger(__name__)

async def check_database_connection() -> None:
    """
    Verify database connection is available.

    Raises:
        Exception: If database connection fails.
    """
    import asyncio

    logger.info("[STARTUP] Checking database connection...")
    start_time = time.time()

    try:
        engine = get_async_engine()

        # Add 10 second timeout to prevent hanging during startup
        async with asyncio.timeout(10):
            async with engine.connect() as conn:
                # Execute a simple query to verify connection
                await conn.execute(text("SELECT 1"))

        duration = time.time() - start_time
        logger.info(f"[STARTUP] ✓ Database connection successful (duration={duration:.3f}s)")

    except TimeoutError:
        duration = time.time() - start_time
        logger.error(
            f"[STARTUP] ✗ Database connection timeout after {duration:.3f}s - check database connectivity",
        )
        raise ConnectionError("Database connection timeout after 10 seconds") from None
    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            f"[STARTUP] ✗ Database connection failed (duration={duration:.3f}s): {str(e)}",
            exc_info=True,
        )
        raise


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager.

    Handles startup and shutdown events for the FastAPI application.
    Performs health checks on startup to verify all required resources are available.
    """
    # Startup: check required resources
    logger.info("[STARTUP] Starting application health checks...")

    try:
        # Check database connection (non-blocking - log warning if fails)
        try:
            await check_database_connection()
        except Exception as e:
            logger.warning(f"[STARTUP] ⚠ Database health check failed (non-fatal): {str(e)}")

        # Clean up orphaned fetches from previous crashes
        try:
            from src.core.database import get_async_session_maker
            from src.repositories.message_fetch_repository import MessageFetchRepository

            session_maker = get_async_session_maker()
            async with session_maker() as session:
                try:
                    fetch_repo = MessageFetchRepository(session)
                    stale_count = await fetch_repo.mark_stale_fetches_as_failed(
                        stale_threshold_minutes=30
                    )
                    if stale_count > 0:
                        logger.warning(
                            f"[STARTUP] Recovered {stale_count} orphaned fetch(es) from previous crash"
                        )
                    else:
                        logger.info("[STARTUP] No orphaned fetches found")
                except Exception:
                    await session.rollback()
                    raise
        except Exception as e:
            logger.warning(f"[STARTUP] ⚠ Stale fetch cleanup failed (non-fatal): {str(e)}")

        # Telegram API credentials are validated on first real use (fetch/auth),
        # avoiding a throwaway connection that wastes memory on each worker startup.

        logger.info(
            "[STARTUP] ✓ Startup complete - application ready (health checks may have warnings)"
        )

    except Exception as e:
        logger.critical(
            f"[STARTUP] ✗ Unexpected startup error: {str(e)}",
            exc_info=True,
        )
        raise

    yield

    # Shutdown: close database connections
    logger.info("[SHUTDOWN] Closing database connections...")
    await close_db_connections()
    logger.info("[SHUTDOWN] ✓ Database connections closed")


# Create FastAPI application
app = FastAPI(
    title="Feedub API",
    description="MVP Web API for Telegram Message Aggregation",
    version=settings.api_version,
    lifespan=lifespan,
)

# Custom exception handlers
@app.exception_handler(AuthenticationError)
async def authentication_error_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    """Handle authentication errors with 401 response."""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": "Authentication failed",
            "detail": str(exc),
        },
    )


@app.exception_handler(RateLimitError)
async def rate_limit_error_handler(request: Request, exc: RateLimitError) -> JSONResponse:
    """Handle rate limit errors with 429 response."""
    headers = {}
    if exc.retry_after:
        headers["Retry-After"] = str(exc.retry_after)

    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "Rate limit exceeded",
            "detail": str(exc),
        },
        headers=headers,
    )


@app.exception_handler(TelegramAPIError)
async def telegram_api_error_handler(request: Request, exc: TelegramAPIError) -> JSONResponse:
    """Handle Telegram API errors with 500 response."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Telegram API error",
            "detail": str(exc),
        },
    )


@app.exception_handler(SessionExpiredError)
async def session_expired_error_handler(request: Request, exc: SessionExpiredError) -> JSONResponse:
    """Handle session expired errors with 401 response."""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": "Session expired",
            "detail": str(exc),
        },
    )


# Insights exception handlers
@app.exception_handler(ConsentRequiredError)
async def consent_required_error_handler(
    request: Request, exc: ConsentRequiredError
) -> JSONResponse:
    """Handle consent required errors with 403 response."""
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "error": "consent_required",
            "detail": str(exc),
            "requires_reconsent": exc.requires_reconsent,
        },
    )


@app.exception_handler(InsightRateLimitError)
async def insight_rate_limit_error_handler(
    request: Request, exc: InsightRateLimitError
) -> JSONResponse:
    """Handle insight rate limit errors with 429 response."""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "insight_rate_limit_exceeded",
            "detail": str(exc),
            "reset_at": exc.reset_at.isoformat() if exc.reset_at else None,
        },
    )


@app.exception_handler(MessageLimitExceededError)
async def message_limit_error_handler(
    request: Request, exc: MessageLimitExceededError
) -> JSONResponse:
    """Handle message limit exceeded errors with 400 response."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "message_limit_exceeded",
            "detail": str(exc),
            "count": exc.count,
            "limit": exc.limit,
            "suggested_filters": exc.suggested_filters,
        },
    )


@app.exception_handler(InsightGenerationError)
async def insight_generation_error_handler(
    request: Request, exc: InsightGenerationError
) -> JSONResponse:
    """Handle insight generation errors with 500 response."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "insight_generation_failed",
            "detail": str(exc),
        },
    )


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests with timing information."""
    start_time = time.time()

    # Get client IP
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Skip logging for health checks (reduce noise from frequent polling)
    is_health = request.url.path.startswith("/health")

    # Log incoming request
    if not is_health:
        logger.info(f"[HTTP] --> {request.method} {request.url.path} client_ip={client_ip}")

    # Process request
    try:
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Log response (skip health checks to reduce noise)
        if not is_health:
            logger.info(
                f"[HTTP] <-- {request.method} {request.url.path} "
                f"status={response.status_code} duration={duration:.3f}s"
            )

        return response

    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            f"[HTTP] <-- {request.method} {request.url.path} "
            f"error={str(e)} duration={duration:.3f}s",
            exc_info=True,
        )
        raise


# Configure CORS middleware (handles preflight requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["X-Refreshed-Token"],
)

# Add security headers middleware
from starlette.middleware.base import BaseHTTPMiddleware as _BaseHTTPMiddleware  # noqa: E402


class SecurityHeadersMiddleware(_BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; connect-src 'self'"
        )
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# Add token refresh middleware (must be after CORS)
# This issues fresh JWT tokens on authenticated requests for sliding session management
app.add_middleware(TokenRefreshMiddleware)

# Register routers
from src.api import auth, channels, health, insights, messages  # noqa: E402

app.include_router(health.router, tags=["health"])
app.include_router(auth.router)
app.include_router(channels.router)
app.include_router(messages.router)
app.include_router(insights.router)
