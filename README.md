# Feedub

**Open-source, self-hostable Telegram message aggregator with AI-powered insights**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)](https://reactrouter.com/)
[![Database](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)](https://www.sqlite.org/)
[![LLM](https://img.shields.io/badge/LLM-LiteLLM-8B5CF6)](https://docs.litellm.ai/)

Feedub aggregates your Telegram messages into a searchable, filterable web interface with AI-generated insights. Self-host it with a single command — no Docker required.

---

## Quick Start (Self-Hosted)

```bash
# 1. Clone and install the CLI
git clone https://github.com/feeduby/feedub_v2.git
cd feedub_v2
pip install ./cli

# 2. Setup and run
feedub init    # Detects project root, generates config in ~/.feedub/
               # Edit ~/.feedub/.env with your Telegram API credentials
feedub run     # Starts backend (:8000) and frontend (:5173)
```

Visit `http://localhost:5173` to use Feedub. You'll need [Telegram API credentials](https://my.telegram.org/apps) (free).

The CLI manages the backend and frontend processes, backups, upgrades, and configuration. All data is stored in `~/.feedub/`.

| Command | Description |
|---------|-------------|
| `feedub init` | Interactive setup wizard |
| `feedub run` / `feedub stop` | Start/stop all services |
| `feedub status` | Show service health |
| `feedub logs [service]` | Tail logs |
| `feedub backup` / `feedub restore` | Database backup/restore |
| `feedub upgrade` | Upgrade to latest version |
| `feedub config` | Show or edit configuration |
| `feedub uninstall` | Complete removal |

**LLM providers**: Ollama (local), OpenAI, Anthropic, Google Gemini, or any [LiteLLM-compatible provider](https://docs.litellm.ai/docs/providers).

---

## Developer Setup

```bash
git clone https://github.com/feeduby/feedub_v2.git
cd feedub_v2

# One-command setup
make setup    # Installs deps, initializes SQLite DB, runs migrations

# Start development
make dev      # Backend on :8000, Frontend on :5173
```

Or manually:

```bash
# Configure environment
cp .env.example .env   # Edit with your Telegram API keys

# Backend
cd backend
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn src.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Full guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## Technology Stack

**Backend**: Python 3.12+, FastAPI, SQLAlchemy (async), aiosqlite, Alembic, Telethon, LiteLLM (100+ providers)

**Frontend**: React 19, TypeScript, Vite, TailwindCSS, React Router v7, Zustand, TanStack Query

**Database**: SQLite (via aiosqlite + FTS5 for full-text search)

---

## Architecture

```
┌─────────────────────────────────────┐
│  Frontend (React SPA)               │
│  - Full-text search & filters       │
│  - AI insight generation (SSE)      │
│  - Message export (TXT/Markdown)    │
└───────────────┬─────────────────────┘
                │ HTTPS
                ▼
┌─────────────────────────────────────┐
│  Backend (FastAPI)                  │
│  - Telegram auth & message sync     │
│  - LLM insights via LiteLLM        │
│  - RESTful API + Swagger docs       │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  SQLite                             │
│  - Full-text search (FTS5)          │
│  - Session & message storage         │
└─────────────────────────────────────┘
```

---

## Project Structure

```
feedub_v2/
├── backend/                # Python FastAPI backend
│   ├── src/
│   │   ├── api/            # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access layer
│   │   ├── models/         # SQLAlchemy ORM
│   │   ├── schemas/        # Pydantic contracts
│   │   ├── llm/            # LiteLLM provider + prompts
│   │   └── core/           # Config, security, middleware
│   └── tests/              # Unit, contract, integration
│
├── frontend/               # React TypeScript SPA
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # TanStack Query hooks
│   │   ├── services/       # API clients
│   │   └── stores/         # Zustand state
│   └── tests/              # Unit (~780), E2E (Playwright)
│
├── cli/                    # Self-hosted CLI (pip install feedub)
│   └── feedub/             # Typer-based CLI commands
│
└── docs/                   # Documentation
    ├── self-hosting.md     # Self-hosting guide
    ├── environment-variables.md  # Configuration reference
    ├── architecture/       # System design & ADRs
    └── qa/                 # QA test scenarios
```

---

## Testing

```bash
# Backend
cd backend
uv run pytest tests/unit/ -v       # Unit tests
uv run pytest tests/contract/ -v   # Contract tests
uv run pytest tests/ -v            # All tests

# Frontend
cd frontend
npm test                           # Unit tests (Vitest)
npm run test:e2e                   # E2E tests (Playwright)

# Everything
make test
```

---

## Features

- **Telegram Auth**: Phone-based login via Telegram (no passwords)
- **Message Sync**: Fetch and aggregate messages from selected channels
- **Full-Text Search**: SQLite FTS5 virtual tables
- **Advanced Filtering**: By chat, date range, media type
- **AI Insights**: LLM-powered analysis of your messages (any provider via LiteLLM)
- **Message Export**: TXT and Markdown formats
- **Responsive UI**: Mobile-first design with dark mode
- **Self-Hostable**: Single-command setup, no Docker required

---

## For AI Agents

> This section helps AI coding assistants (Claude Code, Cursor, GitHub Copilot, etc.) guide users through installing and running Feedub.

### Prerequisites

Before installation, verify the user has these installed:

| Dependency | Check | Install |
|------------|-------|---------|
| Python 3.11+ | `python3 --version` | [python.org](https://www.python.org/downloads/) |
| Node.js 18+ | `node --version` | [nodejs.org](https://nodejs.org/) |
| uv | `uv --version` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Git | `git --version` | [git-scm.com](https://git-scm.com/) |

The user also needs **Telegram API credentials** (free, no usage limits) from [my.telegram.org/apps](https://my.telegram.org/apps) — they'll need their API ID (a number) and API Hash (a hex string).

### Installation

```bash
git clone https://github.com/feeduby/feedub_v2.git
cd feedub_v2
pip install ./cli
feedub init      # Setup wizard — prompts for Telegram credentials and LLM provider
feedub run       # Starts backend (:8000) and frontend (:5173)
```

The app will be available at `http://localhost:5173`.

### LLM Configuration

Feedub uses [LiteLLM](https://docs.litellm.ai/docs/providers) for AI insights. Configure in `~/.feedub/config.yml`:

| Provider | Model string | API key required? |
|----------|-------------|-------------------|
| Ollama (local, free) | `ollama/llama3.2` | No — install from [ollama.com](https://ollama.com), run `ollama pull llama3.2` |
| OpenAI | `gpt-4o` | Yes |
| Anthropic | `claude-sonnet-4-20250514` | Yes |
| Google Gemini | `gemini/gemini-2.5-pro` | Yes |

Any [LiteLLM-compatible provider](https://docs.litellm.ai/docs/providers) works (100+ supported).

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `feedub: command not found` | Ensure pip's bin directory is in `PATH`, or run `python -m feedub` |
| Backend won't start | Run `feedub logs backend` — usually invalid Telegram credentials |
| Port already in use | Stop the other process on `:8000` or `:5173`, or change ports in `~/.feedub/config.yml` |
| LLM errors | For Ollama: ensure `ollama serve` is running and the model is pulled |
| Database locked | Run `feedub stop` first, then retry |

### Key Paths

| Path | Purpose |
|------|---------|
| `~/.feedub/` | All user data (config, database, backups) |
| `~/.feedub/.env` | Environment variables (Telegram keys, JWT secret) |
| `~/.feedub/config.yml` | CLI configuration |
| `~/.feedub/feedub.db` | SQLite database |

### Management Commands

```bash
feedub status              # Check service health
feedub stop                # Stop all services
feedub logs [backend|frontend]  # Tail logs
feedub backup              # Backup database
feedub restore <file>      # Restore from backup
feedub upgrade             # Upgrade to latest version
feedub uninstall           # Complete removal
```

For developer setup, see [CONTRIBUTING.md](./CONTRIBUTING.md). For production deployment (reverse proxy, HTTPS), see [docs/self-hosting.md](./docs/self-hosting.md). For all environment variables, see [docs/environment-variables.md](./docs/environment-variables.md).

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide, including:

- Development setup and prerequisites
- Branch naming and PR workflow
- Code style and quality gates
- Testing requirements

Architecture conventions are documented in [AGENTS.md](./AGENTS.md).

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

If you find Feedub useful, please give it a star on [GitHub](https://github.com/feeduby/feedub_v2) — it helps others discover the project!
