---
title: Frontend Data Flow
description: State management and API integration in React Router v7
tags: [frontend, react, state, tanstack-query, data-flow]
---

# Frontend Data Flow

## Contents

- [State Architecture](#state-architecture) - Data flow diagram
- [Directory Mapping](#directory-mapping) - File structure
- [Routes](#routes) - URL to component mapping
- [Example: Loading Messages](#example-loading-messages) - Data fetch flow
- [Example: Authentication](#example-authentication) - Auth flow
- [Key Patterns](#key-patterns) - TanStack Query, AuthContext, API

---

## State Architecture

```
User Action ──► Component ──► TanStack Query ──► API Service ──► Backend
                    │              │
                    │              └── Cache (stale-while-revalidate)
                    │
                    └──► AuthContext (JWT token, user state)
```

## Directory Mapping

```
frontend/src/
├── pages/           Route components
│   ├── login.tsx         /login - Auth flow
│   ├── dashboard.tsx     /dashboard - Main view
│   └── messages.tsx      /messages - Message list
│
├── components/      UI components
│   ├── ui/               shadcn/ui primitives
│   ├── MessageCard.tsx   Message display
│   ├── FilterBar.tsx     Search/filter controls
│   └── ExportButton.tsx  Export dropdown
│
├── services/        API layer
│   └── api/
│       ├── config.ts     Base URL, axios instance
│       ├── auth.ts       requestCode(), verifyCode()
│       └── messages.ts   fetchMessages(), getMessages()
│
├── hooks/           Custom React hooks
│   ├── useMessages.ts    TanStack Query wrapper
│   └── useAuth.ts        Auth context consumer
│
├── contexts/        React contexts
│   └── AuthContext.tsx   JWT token, user state
│
└── types/           TypeScript definitions
    ├── auth.ts           Auth types
    └── message.ts        Message types
```

## Routes

```
/login     = Auth flow (phone → code → token)
/dashboard = Protected, loads messages
/messages  = Filter, search, export
```

## Example: Loading Messages

```
1. User navigates to /dashboard
   │
   ├── Route loader checks auth (AuthContext)
   └── If not authenticated → redirect /login

2. Dashboard renders MessageList
   │
   └── useMessages() hook called

3. TanStack Query executes
   │
   ├── Check cache (stale-while-revalidate)
   ├── If stale → background fetch
   └── If miss → fetch immediately

4. API Service called
   │
   └── GET /messages with filters

5. Data flows back
   │
   ├── Cache updated
   └── Component re-renders
```

## Example: Authentication

```
1. User enters phone, clicks "Send Code"
   │
   └── authService.requestCode(phone)
       │
       └── POST /auth/request-code

2. User enters code, clicks "Verify"
   │
   └── authService.verifyCode(phone, code)
       │
       └── POST /auth/verify-code
           │
           └── Returns { access_token, user }

3. AuthContext updated
   │
   ├── Token stored in memory
   ├── User state updated
   └── Redirect to /dashboard
```

## Key Patterns

```
TanStack Query
├── Automatic caching
├── Background refetching
├── Loading/error states
└── Optimistic updates (future)

AuthContext
├── JWT in memory (not localStorage)
├── User state
├── Logout clears state
└── Protected route HOC

API Service
├── Axios instance with interceptors
├── Auto-attach Authorization header
├── Error transformation
└── Type-safe responses
```
