# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.0.0] - 2026-03-11

### Added

- **Telegram Integration**: Phone-based authentication and message syncing via Telethon
- **Message Aggregation**: Fetch, store, and browse messages from selected Telegram channels
- **Full-Text Search**: SQLite FTS5 virtual tables for fast message search
- **Advanced Filtering**: Filter by channel, date range, media type, and keywords
- **AI Insights**: LLM-powered message analysis with SSE streaming, supporting 100+ providers via LiteLLM
- **Message Export**: Export messages in TXT and Markdown formats
- **Self-Hosted CLI**: `pip install feedub` for one-command deployment, no Docker required
- **Feature Toggles**: `MAX_USERS` for lightweight self-hosting
- **Responsive UI**: Mobile-first React SPA with dark mode support
- **Security**: AES-256 phone number encryption, JWT authentication, encrypted Telegram sessions
### Infrastructure

- SQLite database (aiosqlite + FTS5) — zero external infrastructure required
- Alembic database migrations
- Comprehensive test suite: 241+ backend unit tests, 780+ frontend tests, contract tests, E2E tests
