# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# User CLI (primary interface)
pip install ./cli        # Install the feedub CLI
feedub init              # Setup wizard: detect project root, generate config
feedub run               # Start backend (:8000) + frontend (:5173)
feedub stop              # Stop all services
feedub status            # Show service health
feedub logs [service]    # Tail logs

# Setup (development)
cd backend && uv sync --extra dev           # Install backend deps
cd backend && uv run alembic upgrade head   # Run database migrations
cd frontend && npm install                  # Install frontend deps

# Testing
cd backend && uv run pytest tests/unit/ -v              # Backend unit tests only
cd backend && uv run pytest tests/unit/test_foo.py -v   # Single backend test file
cd backend && uv run pytest tests/unit/test_foo.py::TestClass::test_name -v  # Single test
cd backend && uv run pytest tests/contract/ -v          # API contract tests
cd frontend && npx vitest run                             # Frontend unit tests (vitest)
cd frontend && npm run test:e2e                          # Playwright E2E (needs dev server)
# IMPORTANT: Always use `vitest run` (not `vitest`) to avoid watch mode.
# After running frontend tests, kill any lingering vitest processes:
# pkill -f vitest

# Linting & Formatting
cd backend && uv run ruff format . && uv run ruff check . --fix && uv run ty check
cd frontend && npm run format && npm run lint:fix && npm run type-check

# Database
cd backend && uv run alembic upgrade head                        # Run migrations
cd backend && uv run alembic revision --autogenerate -m "description"  # Create new migration
```

## Package Managers

- **Backend**: `uv` only. Always `uv run <command>`. Never pip/poetry.
- **Frontend**: `npm` only. Never yarn/pnpm/bun.

## Architecture

### Backend (Python FastAPI - 100% async)

Strict layered architecture — never skip layers:
```
api/ (routes) -> services/ (logic) -> repositories/ (queries) -> models/ (ORM)
```

- **Routes** (`api/`): HTTP handlers, auth via `Depends`, delegate to services. No business logic.
- **Services** (`services/`): Business logic. No raw SQL.
- **Repositories** (`repositories/`): Async SQLAlchemy queries. Single source of DB access.
- **Models** (`models/`): SQLAlchemy ORM with SQLite FTS5 for full-text search.
- **Schemas** (`schemas/`): Pydantic request/response contracts. Validation lives here.
- **Config** (`core/config.py`): Pydantic settings loaded from `.env.{APP_ENV}` files.
- **LLM** (`llm/`): LiteLLM integration supporting 100+ providers. Default: `ollama/llama3.2`.

Key services:
- `telegram_service.py` — Telethon client for Telegram message fetching
- `insights_service.py` — LLM insight generation with SSE streaming

Testing: `pytest-asyncio` with `asyncio_mode = "auto"` — no `@pytest.mark.asyncio` needed.

### Frontend (React TypeScript SPA)

- **TailwindCSS utility classes only** — use `cn()` from `lib/utils.ts`. No CSS modules.
- **Zustand** (`stores/`) for client state (auth, theme).
- **TanStack Query** (`hooks/`) for server state (messages, channels, insights). Don't mix these.
- **shadcn/ui** (Radix + Tailwind) for components in `components/ui/`. No other UI libraries.
- **API calls** go through `services/` -> called by hooks -> never directly from components.
- Cache keys centralized in `hooks/query-keys.ts`.
- SSE streaming for real-time insight generation (`InsightStream.tsx`).
- HTML from LLM output must be sanitized with DOMPurify before rendering.

Self-hosted mode runs with no ML dependencies, SQLite as the database, and any LLM provider.

### Security

- JWT auth with configurable expiration.
- Phone numbers and session strings stored in plaintext (self-hosted model).

## Key Files & Plans

- `docs/open-source-release-plan.md` — Master checklist for open-source release (6 phases).
- `AGENTS.md` — Full architecture conventions, project structure, data flows.

## Workflow Rule

After completing any feature, bugfix, or task:
1. Update this file if project structure, conventions, or key files changed.
2. Mark completed items in `docs/open-source-release-plan.md` with `[x]`.
