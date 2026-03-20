<!-- Generated: 2026-02-21 | Updated: 2026-03-05 -->

# Feedub V2

Open-source, self-hostable Telegram message aggregation web app with AI-powered insights and full-text search.

---

## MANDATORY RULES

### Package Managers
- **Backend: `uv`** — NEVER use pip, poetry, or pip install. Always prefix with `uv run`.
- **Frontend: `npm`** — NEVER use yarn, pnpm, or bun.

### Backend Architecture (100% Async)
- Strict layered architecture — never skip layers:
  ```
  api/ (routes) -> services/ (logic) -> repositories/ (queries) -> models/ (ORM)
  ```
- API routes MUST delegate to services. No business logic in routes.
- Services MUST use repositories for DB access. No raw SQL in services.
- All DB operations, services, and handlers use `async/await`. No synchronous DB calls.
- Pydantic schemas in `schemas/` define API contracts. Validation lives there, not in routes or services.
- Phone numbers and session strings are stored in plaintext (self-hosted model — user owns the server and database).
- After model changes, always create migration: `uv run alembic revision --autogenerate -m "description"`

### Frontend Architecture
- **TailwindCSS utility classes only** — no CSS modules, no styled-components. Use `cn()` from `lib/utils.ts`.
- **Zustand** for client-only state (auth, theme) in `stores/`.
- **TanStack Query** for all server data (messages, channels, insights) in `hooks/`. Do NOT mix these.
- **shadcn/ui** (Radix + TailwindCSS) primitives in `components/ui/`. No other component libraries.
- API calls go through `services/`, called by hooks, never directly from components.
- HTML from LLM output must be sanitized with DOMPurify before rendering.

---

## Self-Hosted Deployment

```bash
pip install feedub
feedub init    # Interactive setup wizard
feedub run     # Start backend and frontend as local processes
```

All services (backend, frontend) run as local processes — no Docker required.
Data stored in `~/.feedub/` (SQLite database + config). See `cli/` for the CLI tool source.

---

## Quality Gates (run before every commit)

```bash
# Backend
cd backend
uv run ruff format .          # Format
uv run ruff check . --fix     # Lint
uv run ty check               # Type check

# Frontend
cd frontend
npm run format                # Prettier
npm run lint:fix              # ESLint
npm run type-check            # TypeScript

# Run all backend tests
cd backend && uv run pytest tests/ -v

# Run all frontend tests
cd frontend && npx vitest run
```

---

## Testing

```bash
# Backend
cd backend
uv run pytest tests/unit/ -v         # Unit (fast, mocked)
uv run pytest tests/contract/ -v     # Contract (API shape)
uv run pytest tests/integration/ -v  # Integration tests
uv run pytest tests/ -v              # All

# Frontend
cd frontend
npm test                              # Vitest (unit + component)
npm run test:e2e                      # Playwright (needs npm run dev)

# Full suite: run backend then frontend tests separately
```

- Backend: `pytest-asyncio` with `asyncio_mode = "auto"` (no `@pytest.mark.asyncio` needed)
- Frontend: `@testing-library/react` + `vitest`, setup in `src/test/`

---

## Tech Stack

**Backend:** Python 3.12+, FastAPI, SQLAlchemy (async) + aiosqlite, Alembic, Telethon, Pydantic, LiteLLM (100+ LLM providers)

**Frontend:** React 19, TypeScript 5.9, Vite 7, TailwindCSS 4, React Router v7, Zustand, TanStack Query, shadcn/ui (Radix), Zod, DOMPurify, Lucide icons

**Database:** SQLite (via aiosqlite, FTS5 for full-text search)

---

## Project Structure

```
feedub_v2/
├── backend/                         # Python FastAPI backend
│   ├── pyproject.toml               #   uv project config + ruff/ty/pytest settings
│   ├── alembic/                     #   DB migrations (env.py + versions/)
│   ├── src/
│   │   ├── main.py                  #   App factory, middleware, router mounting
│   │   ├── api/                     #   Route handlers: auth, channels, messages, insights, health
│   │   ├── services/                #   Business logic: auth, telegram, messages, insights
│   │   ├── repositories/            #   Data access: user, message, insights, channel repos
│   │   ├── models/                  #   SQLAlchemy ORM: user, message, message_fetch, insight, etc.
│   │   ├── schemas/                 #   Pydantic request/response: auth, message, channel, insights
│   │   ├── core/                    #   Config, database, security (AES-256), middleware, retry, dependencies
│   │   └── llm/                     #   LLM provider: LiteLLM integration (provider.py) + prompts
│   └── tests/
│       ├── unit/                    #   241 fast unit tests (mocked deps)
│       ├── contract/                #   API contract tests (httpx TestClient)
│       └── integration/             #   DB integration tests
│
├── frontend/                        # React TypeScript SPA
│   ├── package.json                 #   npm scripts + dependencies
│   ├── vite.config.ts               #   Build config
│   ├── src/
│   │   ├── main.tsx                 #   Entry point, providers
│   │   ├── App.tsx                  #   Root component
│   │   ├── router.tsx               #   React Router v7 routes
│   │   ├── components/
│   │   │   ├── ui/                  #     shadcn/ui primitives (button, dialog, form, input, card, etc.)
│   │   │   ├── auth/                #     LoginForm, VerifyCodeForm, LogoutButton
│   │   │   ├── messages/            #     MessageList, MessageCard, SearchBar, FilterPanel, ExportButton, SyncManager
│   │   │   ├── insights/            #     InsightGenerator, InsightStream (SSE), InsightCard, ConsentDialog, UsageIndicator
│   │   │   ├── channels/            #     ChannelSelector, ChannelFilter
│   │   │   ├── common/              #     Layout, ErrorBoundary, InfiniteScroll, LoadingSpinner, ThemeToggle
│   │   │   └── feedback/            #     FeedbackWidget, FeedbackForm
│   │   ├── hooks/                   #   TanStack Query hooks: useMessages, useChats, useInsight*, useAuth, etc.
│   │   ├── services/                #   API clients: auth, message, insights, feedback
│   │   │   └── api/                 #     Base HTTP client (client.ts), config, channels
│   │   ├── stores/                  #   Zustand: auth (JWT), theme (dark/light)
│   │   ├── pages/                   #   Dashboard, Login, VerifyCode, Insights, Privacy, Terms
│   │   ├── types/                   #   TS interfaces: api, auth, message, filters, insights
│   │   └── utils/                   #   Formatters, validation, linkify, export, route-protection, retry
│   └── tests/
│       ├── unit/                    #   Component + utility unit tests (Vitest)
│       ├── integration/             #   Component integration tests
│       ├── contract/                #   API contract tests
│       └── e2e/                     #   Playwright browser tests
│
├── cli/                             # Self-hosted CLI tool (pip install feedub)
│   ├── pyproject.toml               #   Package config
│   └── feedub/                      #   Typer CLI: init, run, stop, status, logs, backup, restore, upgrade, uninstall
│
├── docs/                            # Documentation
│   ├── self-hosting.md              #   Self-hosting deployment guide
│   ├── environment-variables.md     #   All configuration variables
│   ├── architecture/                #   System overview, data flows, ADRs (decisions/)
│   └── qa/                          #   QA scenarios: auth, channels, messages, filtering, export
│
└── CLAUDE.md                        # AI agent instructions
```

---

## Key Environment Variables

- **Backend** (`.env`): `DATABASE_URL` (SQLite path, e.g. `sqlite+aiosqlite:///./feedub.db`), `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `JWT_SECRET_KEY`, `LLM_MODEL` (LiteLLM format, e.g. `ollama/llama3.2`)
- **Frontend** (`.env`): `VITE_API_BASE_URL` (points to backend API)

---

## Backend Data Flow

```
HTTP Request
  -> api/<router>.py (route handler, auth via Depends)
    -> services/<service>.py (business logic)
      -> repositories/<repo>.py (async SQLAlchemy queries)
        -> models/<model>.py (ORM, FTS5 for search)
  <- schemas/<schema>.py (Pydantic response serialization)
```

Key services:
- `telegram_service.py` — Telethon client for fetching messages from Telegram
- `insights_service.py` — LLM-powered insight generation with SSE streaming (via LiteLLM)

## Frontend Data Flow

```
Pages -> Hooks (useMessages, useChats, useInsight*, etc.)
           ├── TanStack Query (cache, refetch, server state)
           ├── Services (HTTP calls via api/client.ts)
           └── Stores (Zustand: auth tokens, theme)
```

Key patterns:
- Cache keys centralized in `hooks/query-keys.ts`
- Server-side filtering (search, date, media) — NOT client-side
- SSE streaming for real-time insight generation (`InsightStream.tsx`)
- Infinite scroll via Intersection Observer (`InfiniteScroll.tsx`)
- Route guards in `utils/route-protection.ts`
