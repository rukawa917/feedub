---
title: Backend Data Flow
description: Request lifecycle through FastAPI layers (API → Service → Repository → DB)
tags: [backend, fastapi, data-flow, architecture]
---

# Backend Data Flow

## Contents

- [Layer Architecture](#layer-architecture) - Request flow diagram
- [Directory Mapping](#directory-mapping) - File structure
- [Example: GET /messages](#example-get-messages) - Read flow
- [Example: POST /auth/verify-code](#example-post-authverify-code) - Auth flow
- [Dependency Injection](#dependency-injection) - FastAPI DI

---

## Layer Architecture

```
Request ──► Router ──► Service ──► Repository ──► Database
              │           │
              │           └──► TelegramService ──► Telegram API
              │
              └──► Dependencies (auth, db session)
```

## Directory Mapping

```
backend/src/
├── api/           Router layer (HTTP routing, request/response)
│   ├── auth.py         POST /auth/request-code, /verify-code
│   ├── messages.py     GET /messages, POST /messages/fetch
│   └── health.py       GET /health
│
├── services/      Business logic layer
│   ├── auth_service.py      Coordinates auth flow
│   ├── message_service.py   Coordinates message fetching
│   └── telegram_service.py  Telethon client operations
│
├── repositories/  Data access layer
│   ├── user_repository.py          User CRUD
│   ├── message_repository.py       Message CRUD + search
│   └── message_fetch_repository.py Fetch status tracking
│
├── models/        SQLAlchemy ORM definitions
│   ├── user.py           Users table
│   ├── message.py        Messages table
│   └── message_fetch.py  Message fetches table
│
├── schemas/       Pydantic request/response models
│   ├── auth.py           Auth DTOs
│   └── message.py        Message DTOs
│
└── core/          Cross-cutting concerns
    ├── config.py         Environment variables
    ├── security.py       JWT token management
    ├── database.py       Async SQLAlchemy engine
    ├── dependencies.py   FastAPI DI (get_db, get_current_user)
    └── exceptions.py     Custom exceptions
```

## Example: GET /messages

```
1. Request hits Router
   GET /messages?chat_id=123&limit=50
   │
   ├── Dependency: get_current_user() validates JWT
   └── Dependency: get_db() provides session

2. Router calls Service
   message_service.list_messages(user_id, filters)

3. Service calls Repository
   message_repository.find_by_filters(user_id, chat_id, limit)

4. Repository executes SQL
   SELECT * FROM messages WHERE user_id = ? AND chat_id = ? LIMIT 50

5. Response flows back up
   Repository → Service → Router → JSON response
```

## Example: POST /auth/verify-code

```
1. Request hits Router
   POST /auth/verify-code { phone_number, code }

2. Router calls Service
   auth_service.verify_code(phone, code)

3. Service coordinates:
   ├── user_repository.get_by_phone(phone)
   ├── telegram_service.sign_in(code)
   ├── user_repository.update_session(encrypted_session)
   └── security.create_jwt(user_id)

4. Response
   { access_token, user }
```

## Dependency Injection

```python
# core/dependencies.py

async def get_db():
    async with AsyncSession() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    payload = decode_jwt(token)
    user = await user_repository.get_by_id(db, payload["sub"])
    return user
```
