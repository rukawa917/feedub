---
title: "ADR-004: Frontend Constitutional Compliance"
description: Decision to remove caching infrastructure from frontend MVP
tags: [adr, frontend, caching, constitution, decision]
status: accepted
date: 2025-11-04
---

# ADR-004: Remove Caching from Frontend MVP

**Contents**: [Context](#context) · [Decision](#decision) · [Rationale](#rationale) · [Consequences](#consequences)

---

## Context

Constitution principle states "NO Caching in MVP: Direct API calls only". Frontend was using TanStack Query and LRU cache service.

## Decision

Remove all caching infrastructure:
- Replace TanStack Query with direct `useState` + `useEffect`
- Remove LRU cache service
- Remove auto-loading hooks
- Maintain same user experience

## Rationale

- Constitution compliance is non-negotiable
- Simpler data fetching layer
- Easier to debug and reason about
- Caching can be added post-MVP when needed

## Consequences

- More API calls (no caching/deduplication)
- Slightly slower repeat page loads
- Simpler codebase to maintain

## Implementation

Removed `frontend/src/services/cache.ts` and refactored hooks to use direct fetch patterns.
