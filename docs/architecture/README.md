---
title: Architecture Documentation
description: System architecture, data flows, and decision records
tags: [architecture, adr, system-design]
---

# Architecture Documentation

## Contents

- [Documents](#documents) - All architecture docs
- [ADRs](#adrs) - Decision records

---

## Documents

| Doc | Jump to |
|-----|---------|
| [system-overview](./system-overview.md) | [Components](./system-overview.md#components) · [Request Flow](./system-overview.md#request-flow) · [Security](./system-overview.md#security) |
| [backend-data-flow](./backend-data-flow.md) | [Layers](./backend-data-flow.md#layer-architecture) · [Directory](./backend-data-flow.md#directory-mapping) · [Examples](./backend-data-flow.md#example-get-messages) |
| [frontend-data-flow](./frontend-data-flow.md) | [State](./frontend-data-flow.md#state-architecture) · [Routes](./frontend-data-flow.md#routes) · [Patterns](./frontend-data-flow.md#key-patterns) |

## ADRs

| Decision | Status |
|----------|--------|
| [ADR-001: Message Export](./decisions/adr-001-message-export.md) | Accepted |
| [ADR-002: Channel Filtering](./decisions/adr-002-channel-filtering.md) | Accepted |
| [ADR-003: Phone Encryption](./decisions/adr-003-phone-encryption.md) | Accepted |
| [ADR-004: Frontend Compliance](./decisions/adr-004-frontend-compliance.md) | Accepted |
