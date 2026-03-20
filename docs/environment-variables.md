# Environment Variables Reference

Complete reference for all Feedub environment variables.

Both backend and frontend load variables from a single `.env` at the project root. Copy `.env.example` to `.env` and fill in your values to get started.

---

## Backend

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_API_ID` | Telegram API ID from [my.telegram.org](https://my.telegram.org/apps) | `12345678` |
| `TELEGRAM_API_HASH` | Telegram API hash | `a1b2c3d4e5f6...` |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/feedub.db` | SQLite connection string |

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `development` | Environment (`development`, `production`). |
| `DEBUG` | `false` | Enable debug mode |
| `API_VERSION` | `1.0.0` | API version string |

### LLM Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_MODEL` | `ollama/llama3.2` | LiteLLM model string. Examples: `gpt-4o`, `claude-sonnet-4-20250514`, `ollama/llama3.2`, `gemini/gemini-2.5-pro` |
| `LLM_API_KEY` | _(none)_ | API key for the LLM provider. Not needed for Ollama. |
| `LLM_API_BASE` | _(none)_ | Custom API base URL. For local Ollama: `http://localhost:11434/v1`. |
| `LLM_FALLBACK_MODEL` | _(none)_ | Fallback model if primary fails |
| `LLM_MAX_INPUT_TOKENS` | `64000` | Max input tokens for LLM context |
| `LLM_REQUEST_TIMEOUT_SECONDS` | `120` | LLM request timeout in seconds |
| `LLM_MAX_RETRIES` | `2` | Max retry attempts for failed LLM requests |

### Security

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET_KEY` | _(auto-generated)_ | Secret for JWT signing (min 32 chars). Auto-generated if not set, but sessions won't survive restarts. |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `JWT_EXPIRATION_HOURS` | `24` | JWT token expiration in hours |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:8000` | Comma-separated list of allowed CORS origins |

### Telegram Fetch

| Variable | Default | Description |
|----------|---------|-------------|
| `TELEGRAM_FETCH_CHANNEL_ONLY` | `false` | Only fetch channels (exclude groups and private chats) |
| `TELEGRAM_FETCH_DELAY_SECONDS` | `1.0` | Delay between fetching each dialog (avoid rate limits) |
| `TELEGRAM_FLOOD_SLEEP_THRESHOLD` | `60` | Auto-sleep seconds on FloodWaitError (`0` to disable) |
| `TELEGRAM_FETCH_LIMIT_PER_CHAT` | `1000` | Max messages to fetch per chat |
| `TELEGRAM_FETCH_MAX_AGE_DAYS` | `30` | Only fetch messages newer than this many days |

### Data Retention

| Variable | Default | Description |
|----------|---------|-------------|
| `MESSAGE_RETENTION_DAYS` | `7` | Days to retain messages before automatic deletion (1–365) |

### Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_DIR` | _(none)_ | Directory for log files. If unset, logs go to stdout only. |
| `LOG_FILE_NAME` | `feedub-api.log` | Log file name (used when `LOG_DIR` is set) |

---

## Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API URL. Must be set at build time (baked into the JS bundle). |

---

## CLI

| Variable | Default | Description |
|----------|---------|-------------|
| `FEEDUB_HOME` | `~/.feedub` | Directory for all Feedub data (config, database, backups, logs) |
