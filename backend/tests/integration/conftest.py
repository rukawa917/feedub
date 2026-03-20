"""
Shared pytest fixtures for integration tests with real database.
"""

import os
from collections.abc import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from src.models.user import Base  # Import Base from user model which imports from database


@pytest.fixture(scope="function")
async def async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create async database session for each test.

    Scope is 'function' so each test gets a fresh session.
    Creates tables, runs test, cleans up data after.
    """
    # Load settings directly from .env file for integration tests
    # This bypasses the test environment setup that uses fake credentials
    from pathlib import Path

    from dotenv import load_dotenv

    # Walk up to repo root (directory containing .git) to find .env
    current = Path(__file__).resolve().parent
    repo_root = current
    for parent in [current, *current.parents]:
        if (parent / ".git").exists():
            repo_root = parent
            break
    load_dotenv(repo_root / ".env", override=True)

    # Get real database URL from environment
    database_url = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres"
    )

    # Ensure we're using psycopg driver for async operations
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    # Create engine for this test
    engine = create_async_engine(
        database_url,
        echo=False,
        pool_pre_ping=True,
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create and yield session
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session

    # Clean up: drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    # Dispose engine
    await engine.dispose()
