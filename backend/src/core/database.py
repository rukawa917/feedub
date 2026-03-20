"""
Database connection management using SQLAlchemy async engine.

This module provides:
- Async engine creation and configuration for SQLite
- Session management for database operations
- Dependency injection for FastAPI endpoints
"""

import logging
from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from src.core.config import get_settings

logger = logging.getLogger(__name__)

# SQLAlchemy declarative base for model definitions
Base: Any = declarative_base()

# Global async engine (initialized on first use)
_async_engine: AsyncEngine | None = None
_async_session_maker: async_sessionmaker[AsyncSession] | None = None


def get_async_engine() -> AsyncEngine:
    """
    Get or create the async database engine.

    Returns:
        AsyncEngine: SQLAlchemy async engine instance.
    """
    global _async_engine

    if _async_engine is None:
        settings = get_settings()
        database_url = settings.database_url

        _async_engine = create_async_engine(
            database_url,
            echo=settings.debug,
            connect_args={"check_same_thread": False},
        )
        logger.info("SQLite database engine created: %s", database_url)

    return _async_engine


def get_async_session_maker() -> async_sessionmaker[AsyncSession]:
    """
    Get or create the async session maker.

    Returns:
        async_sessionmaker: Factory for creating async database sessions.
    """
    global _async_session_maker

    if _async_session_maker is None:
        engine = get_async_engine()
        _async_session_maker = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )

    return _async_session_maker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI endpoints to get a database session.

    Yields:
        AsyncSession: Database session for the request.

    Example:
        @router.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
    """
    async_session_maker = get_async_session_maker()
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_db_connections() -> None:
    """
    Close all database connections (called on application shutdown).

    This should be registered as a shutdown event in the FastAPI app:
        @app.on_event("shutdown")
        async def shutdown():
            await close_db_connections()
    """
    global _async_engine

    if _async_engine is not None:
        await _async_engine.dispose()
        _async_engine = None
