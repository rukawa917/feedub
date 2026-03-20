"""
Unit tests for database connection module.

Tests database engine creation, session management, and connection lifecycle.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import (
    Base,
    close_db_connections,
    get_async_engine,
    get_async_session_maker,
    get_db,
)


class TestBase:
    """Test suite for SQLAlchemy Base."""

    def test_base_exists(self):
        """Test that Base declarative base exists."""
        assert Base is not None

    def test_base_has_metadata(self):
        """Test that Base has metadata attribute."""
        assert hasattr(Base, "metadata")


class TestGetAsyncEngine:
    """Test suite for get_async_engine function."""

    @patch("src.core.database.get_settings")
    @patch("src.core.database.create_async_engine")
    def test_get_async_engine_creates_engine(self, mock_create_engine, mock_get_settings):
        """Test that get_async_engine creates an async engine."""
        import src.core.database

        src.core.database._async_engine = None

        mock_settings = MagicMock()
        mock_settings.database_url = "sqlite+aiosqlite:///./data/feedub.db"
        mock_settings.debug = False
        mock_get_settings.return_value = mock_settings

        mock_engine = MagicMock()
        mock_create_engine.return_value = mock_engine

        engine = get_async_engine()

        mock_create_engine.assert_called_once()
        call_args = mock_create_engine.call_args
        assert "sqlite+aiosqlite:///./data/feedub.db" in str(call_args[0][0])

        assert engine == mock_engine

    @patch("src.core.database.get_settings")
    @patch("src.core.database.create_async_engine")
    def test_get_async_engine_uses_check_same_thread(self, mock_create_engine, mock_get_settings):
        """Test that SQLite engine is created with check_same_thread=False."""
        import src.core.database

        src.core.database._async_engine = None

        mock_settings = MagicMock()
        mock_settings.database_url = "sqlite+aiosqlite:///./data/feedub.db"
        mock_settings.debug = False
        mock_get_settings.return_value = mock_settings

        mock_engine = MagicMock()
        mock_create_engine.return_value = mock_engine

        get_async_engine()

        call_kwargs = mock_create_engine.call_args[1]
        assert call_kwargs.get("connect_args") == {"check_same_thread": False}

    @patch("src.core.database.get_settings")
    @patch("src.core.database.create_async_engine")
    def test_get_async_engine_returns_cached_instance(self, mock_create_engine, mock_get_settings):
        """Test that get_async_engine returns the same instance (cached)."""
        import src.core.database

        src.core.database._async_engine = None

        mock_settings = MagicMock()
        mock_settings.database_url = "sqlite+aiosqlite:///./data/feedub.db"
        mock_settings.debug = False
        mock_get_settings.return_value = mock_settings

        mock_engine = MagicMock()
        mock_create_engine.return_value = mock_engine

        engine1 = get_async_engine()
        engine2 = get_async_engine()

        # create_async_engine should only be called once
        assert mock_create_engine.call_count == 1
        assert engine1 is engine2


class TestGetAsyncSessionMaker:
    """Test suite for get_async_session_maker function."""

    @patch("src.core.database.get_async_engine")
    @patch("src.core.database.async_sessionmaker")
    def test_get_async_session_maker_creates_session_maker(
        self, mock_async_sessionmaker, mock_get_engine
    ):
        """Test that get_async_session_maker creates a session maker."""
        import src.core.database

        src.core.database._async_session_maker = None

        mock_engine = MagicMock()
        mock_get_engine.return_value = mock_engine

        mock_session_maker = MagicMock()
        mock_async_sessionmaker.return_value = mock_session_maker

        session_maker = get_async_session_maker()

        mock_async_sessionmaker.assert_called_once()
        call_kwargs = mock_async_sessionmaker.call_args[1]
        assert call_kwargs["expire_on_commit"] is False
        assert call_kwargs["autoflush"] is False
        assert call_kwargs["autocommit"] is False
        assert call_kwargs["class_"] == AsyncSession

        assert session_maker == mock_session_maker

    @patch("src.core.database.get_async_engine")
    @patch("src.core.database.async_sessionmaker")
    def test_get_async_session_maker_returns_cached_instance(
        self, mock_async_sessionmaker, mock_get_engine
    ):
        """Test that get_async_session_maker returns the same instance (cached)."""
        import src.core.database

        src.core.database._async_session_maker = None

        mock_engine = MagicMock()
        mock_get_engine.return_value = mock_engine

        mock_session_maker = MagicMock()
        mock_async_sessionmaker.return_value = mock_session_maker

        maker1 = get_async_session_maker()
        maker2 = get_async_session_maker()

        # async_sessionmaker should only be called once
        assert mock_async_sessionmaker.call_count == 1
        assert maker1 is maker2


class TestGetDb:
    """Test suite for get_db dependency function."""

    @pytest.mark.asyncio
    @patch("src.core.database.get_async_session_maker")
    async def test_get_db_yields_session(self, mock_get_session_maker):
        """Test that get_db yields an async session."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_session.commit = AsyncMock()
        mock_session.rollback = AsyncMock()
        mock_session.close = AsyncMock()

        mock_session_maker = MagicMock()
        mock_session_maker.return_value.__aenter__.return_value = mock_session
        mock_session_maker.return_value.__aexit__.return_value = None

        mock_get_session_maker.return_value = mock_session_maker

        async for session in get_db():
            assert session == mock_session

        mock_session.commit.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("src.core.database.get_async_session_maker")
    async def test_get_db_rolls_back_on_exception(self, mock_get_session_maker):
        """Test that get_db rolls back session on exception."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_session.commit = AsyncMock()
        mock_session.rollback = AsyncMock()
        mock_session.close = AsyncMock()

        mock_session_maker = MagicMock()
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_session
        mock_context.__aexit__.return_value = None
        mock_session_maker.return_value = mock_context

        mock_get_session_maker.return_value = mock_session_maker

        gen = get_db()
        try:
            await gen.asend(None)
            with pytest.raises(ValueError):
                await gen.athrow(ValueError, ValueError("Test error"))
        finally:
            try:
                await gen.aclose()
            except StopAsyncIteration:
                pass

        mock_session.rollback.assert_awaited_once()
        mock_session.commit.assert_not_awaited()

    @pytest.mark.asyncio
    @patch("src.core.database.get_async_session_maker")
    async def test_get_db_closes_session(self, mock_get_session_maker):
        """Test that get_db closes session in finally block."""
        mock_session = AsyncMock(spec=AsyncSession)
        mock_session.commit = AsyncMock()
        mock_session.rollback = AsyncMock()
        mock_session.close = AsyncMock()

        mock_session_maker = MagicMock()
        mock_session_maker.return_value.__aenter__.return_value = mock_session
        mock_session_maker.return_value.__aexit__.return_value = None

        mock_get_session_maker.return_value = mock_session_maker

        async for _session in get_db():
            pass

        mock_session.close.assert_awaited_once()


class TestCloseDbConnections:
    """Test suite for close_db_connections function."""

    @pytest.mark.asyncio
    @patch("src.core.database._async_engine")
    async def test_close_db_connections_disposes_engine(self, mock_engine):
        """Test that close_db_connections disposes the engine."""
        mock_engine.dispose = AsyncMock()

        await close_db_connections()

        mock_engine.dispose.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_close_db_connections_when_engine_is_none(self):
        """Test that close_db_connections handles None engine gracefully."""
        import src.core.database

        src.core.database._async_engine = None

        # Should not raise
        await close_db_connections()
