# E2E Testing Guide

This directory contains Playwright end-to-end tests for the Feedub frontend.

## Quick Start

```bash
# Terminal 1: Start the frontend dev server
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2e
```

## How It Works

### Dev Mode Authentication

E2E tests use **dev mode** to bypass real Telegram authentication:

- **Phone**: `+1000000000`
- **Code**: `12345`
- **Token**: `dev_mode_token_feedub_2024`

The `auth.setup.ts` file automatically logs in with these credentials before running any tests. The authenticated state is saved to `tests/.auth/user.json` and reused by all test projects.

### No Backend Required

When using dev mode credentials, all API calls return mock data from `src/mocks/dev-data.ts`. This includes:

- Mock messages (English + Korean)
- Mock chats/channels
- Mock user data
- Mock fetch operations

## Test Files

| File | Purpose |
|------|---------|
| `auth.setup.ts` | Global setup - authenticates with dev mode |
| `channel-filter.spec.ts` | Tests channel filtering functionality |
| `mobile-filter-drawer.spec.ts` | Tests mobile filter drawer UI |
| `deployment-smoke.spec.ts` | Production smoke tests (no auth needed) |

## npm Scripts

```bash
# Run all E2E tests (requires dev server running)
npm run test:e2e

# Run tests in headed browser mode (visible)
npm run test:e2e:headed

# Run with Playwright UI
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run only smoke tests (no auth, tests production)
npm run test:e2e:smoke

# Run only on Chromium
npm run test:e2e:chromium
```

## Writing New Tests

### Basic Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (auth state is pre-loaded)
    await page.goto('/dashboard')

    // Wait for page to be ready
    await expect(
      page.getByRole('button', { name: /open filters/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test('should do something', async ({ page }) => {
    // Your test logic here
  })
})
```

### Key Points

1. **Use relative URLs**: The `baseURL` is configured in `playwright.config.ts`
2. **Don't check auth**: Tests receive authenticated state via `storageState`
3. **Wait for content**: Use `expect(...).toBeVisible()` with timeouts
4. **Use accessible selectors**: Prefer `getByRole`, `getByLabel`, `getByText`

## Configuration

See `playwright.config.ts` for full configuration:

- **Local dev**: Base URL is `http://localhost:5173`
- **Production smoke**: Base URL is `https://your-domain.com`
- **Auth state**: Saved to `tests/.auth/user.json`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

## Troubleshooting

### Tests fail with "Navigation timeout"

Make sure the dev server is running:
```bash
npm run dev
```

### Tests fail with "Not authenticated"

Delete the auth state and re-run:
```bash
rm -rf tests/.auth/
npm run test:e2e
```

### Tests pass locally but fail in CI

Check if CI needs to:
1. Install Playwright browsers: `npx playwright install`
2. Have dev server running before tests
3. Use correct environment variables

### Mock data doesn't match expected

Check `src/mocks/dev-data.ts` for the mock data structure. Update selectors in tests if the UI has changed.

## Viewing Test Results

After running tests:
- **HTML Report**: `npx playwright show-report`
- **Screenshots**: Check `test-results/` on failure
- **Videos**: Check `test-results/` on failure
- **Traces**: Run with `--trace on` for step-by-step debugging
