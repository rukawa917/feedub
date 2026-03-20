---
title: "ADR-002: Channel-Only Filtering"
description: Decision to filter Telegram fetching to channels only
tags: [adr, telegram, filtering, backend, decision]
status: accepted
date: 2025-01-16
---

# ADR-002: Channel-Only Message Filtering

**Contents**: [Context](#context) · [Decision](#decision) · [Rationale](#rationale) · [Consequences](#consequences)

---

## Context

Users want to reduce data volume. Telegram channels contain 70-90% of total messages despite being only 10-30% of dialogs.

## Decision

Add **environment variable** to filter fetching to channels only:
- `TELEGRAM_FETCH_CHANNEL_ONLY=true`
- Filter during fetch (not at API response time)
- Preserve existing data (no deletion)
- Backend-only (frontend displays whatever backend returns)

## Rationale

- Reduces API calls by 50-80%
- Reduces database size by 10-30%
- Preserves 70-90% of message volume
- Backward compatible (default: false)

## Consequences

- Groups and private chats excluded when enabled
- Per-user configuration requires future work
- Only affects new fetches

## Implementation

See `backend/src/core/config.py` for `telegram_fetch_channel_only` setting.
