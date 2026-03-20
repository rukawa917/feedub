---
title: System Overview
description: High-level architecture showing frontend, backend, and database communication
tags: [architecture, system, overview, data-flow]
---

# System Architecture

## Contents

- [Diagram](#system-architecture) - High-level system diagram
- [Components](#components) - Tech stack breakdown
- [Request Flow](#request-flow) - Common user flows
- [Security](#security) - Security measures by layer

---

```
┌─────────────────────────────────────────────────────────────┐
│                     SYSTEM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Browser ──HTTP──► Frontend Dev Server ──► React SPA        │
│     │              (localhost:5173)                           │
│     │                                                        │
│     └──HTTP──► FastAPI ──► SQLite                            │
│              (localhost:8000)  │                              │
│                                └──► Telegram API             │
│                                └──► LLM Provider (Ollama)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components

```
Frontend (localhost:5173)
├── React Router v7        SPA with client-side routing
├── TanStack Query         Server state management
└── Tailwind CSS           Styling

Backend (localhost:8000)
├── FastAPI                Python async API framework
├── Telethon               Telegram MTProto client
├── SQLAlchemy             Async ORM
└── LiteLLM                Multi-provider LLM integration

Database (local)
├── SQLite + aiosqlite     Local file-based database
├── FTS5                   Full-text search on messages
└── Alembic                Schema migrations
```

## Request Flow

```
1. User opens localhost:5173
   Browser ──► Vite Dev Server ──► React SPA

2. User logs in (phone + code)
   React ──► POST /auth/request-code ──► FastAPI ──► Telegram API
   React ──► POST /auth/verify-code ──► FastAPI ──► JWT returned

3. User views messages
   React ──► GET /messages?filters ──► FastAPI ──► SQLite
   (TanStack Query caches response)

4. User fetches new messages
   React ──► POST /messages/fetch ──► FastAPI ──► Telegram API ──► SQLite
   (Background task, status polling)

5. User requests AI insights
   React ──► POST /insights/generate ──► FastAPI ──► LLM Provider
   (SSE streaming response)
```

## Security

```
Frontend:
├── JWT stored in localStorage
├── Token auto-refresh on API activity
└── DOMPurify for LLM HTML output

Backend:
├── CORS restricted to configured origins
├── JWT with configurable expiry (default 24h)
├── Auto-generated JWT secret for local dev
└── Telegram session strings stored in SQLite

Database:
├── Local SQLite file (no network exposure)
├── Configurable data retention (auto-delete)
└── CASCADE deletes for user data cleanup
```

## Production Deployment (Optional)

For exposing Feedub beyond localhost, use a reverse proxy:

```
Browser ──HTTPS──► Caddy/Nginx ──► FastAPI (:8000)
                                ──► Frontend (static build)
```

See `docs/self-hosting.md` for reverse proxy configuration examples.
