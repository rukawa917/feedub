# QA Test Scenarios

Comprehensive test scenarios for Feedub V2 in Given/When/Then format.

## Quick Start

1. Pick a feature area from the list below
2. Run through scenarios marked **Critical** first
3. Then cover **High** priority scenarios
4. Edge cases and error scenarios as time permits

## Test Scenario Files

| File | Coverage | Scenarios |
|------|----------|-----------|
| [01-authentication.md](./01-authentication.md) | Login, 2FA, tokens, logout | 15 |
| [02-channel-selection.md](./02-channel-selection.md) | Channel list, selections, persistence | 12 |
| [03-message-fetching.md](./03-message-fetching.md) | Sync, progress, cancel, errors | 15 |
| [04-message-filtering.md](./04-message-filtering.md) | Search, filters, combinations | 20 |
| [06-export.md](./06-export.md) | TXT/MD formats, limits | 10 |
| [07-cross-cutting.md](./07-cross-cutting.md) | Security, performance, a11y | 15 |

**Total: ~87 scenarios**

## Scenario Format

```markdown
### TS-XXX: [Scenario Name]
**Priority**: Critical | High | Medium | Low
**Type**: Happy Path | Edge Case | Error | Security | Performance | Accessibility

**Given** [precondition]
**When** [action]
**Then** [expected result]

**Notes**: [technical details, edge cases to watch]
```

## Priority Definitions

| Priority | Definition | When to Test |
|----------|------------|--------------|
| **Critical** | Core user flow, app unusable if broken | Every release |
| **High** | Important feature, degraded experience if broken | Every release |
| **Medium** | Edge case or secondary feature | Major releases |
| **Low** | Nice-to-have, cosmetic | As time permits |

## Type Definitions

| Type | Description |
|------|-------------|
| **Happy Path** | Normal expected user flow |
| **Edge Case** | Boundary conditions, unusual inputs |
| **Error** | Error handling, failure recovery |
| **Security** | Auth, XSS, injection, rate limiting |
| **Performance** | Load times, responsiveness, large data |
| **Accessibility** | Keyboard nav, screen readers, contrast |

## Test Environment

- **Production**: https://your-domain.com (frontend), https://api.your-domain.com (backend)
- **Local Dev**: http://localhost:5173 (frontend), http://localhost:8000 (backend)

## Prerequisites

1. Valid Telegram account with phone number
2. Access to Telegram app for verification codes
3. At least one Telegram channel/group membership
4. Browser DevTools for network/console inspection

## Running Tests

### Manual Testing
1. Open the app in browser
2. Follow scenarios step by step
3. Mark pass/fail in your tracking system

### Smoke Test (Critical Path)
Run these scenarios for quick validation:
- TS-AUTH-001: Successful login
- TS-CHAN-001: Channel selection on first login
- TS-FETCH-001: Initial message sync
- TS-FILTER-001: Basic text search
- TS-EXPORT-001: Export to TXT

## Reporting Issues

When a scenario fails, capture:
1. Scenario ID (e.g., TS-AUTH-003)
2. Steps taken
3. Expected vs actual result
4. Browser console errors
5. Network request/response (if applicable)
6. Screenshot or screen recording
