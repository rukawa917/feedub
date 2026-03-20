---
title: "ADR-001: Message Export"
description: Decision to implement client-side message export (TXT/Markdown)
tags: [adr, export, frontend, decision]
status: accepted
date: 2025-01-16
---

# ADR-001: Client-Side Message Export

**Contents**: [Context](#context) · [Decision](#decision) · [Rationale](#rationale) · [Consequences](#consequences)

---

## Context

Users need to export filtered messages for AI analysis or offline reading.

## Decision

Implement **pure frontend export** with no backend changes:
- Export button in Dashboard header
- Paginate to fetch all filtered messages (max 1000)
- Format client-side using pure functions
- Download via blob URL

## Rationale

- No backend changes required (faster to implement)
- Reduces server load (processing happens in browser)
- Max 1000 messages keeps client responsive
- Pure functions are easy to test

## Consequences

- Limited to 1000 messages per export
- No media files included (text metadata only)
- Requires client-side processing power

## Implementation

See `frontend/src/utils/export-formatters.ts` for formatters.
