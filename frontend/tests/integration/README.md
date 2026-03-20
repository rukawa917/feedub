# Integration Tests

This directory contains integration tests that require more complex setup than unit tests, including:
- Real API mocking with React Query mutations
- Actual polling/refetch behavior
- Component interaction with external services
- Race condition testing (rapid submissions, etc.)

## Test Categories

### Auth Integration Tests
- **LoginForm**: Tests actual API submission flow with success/error callbacks
- **VerifyCodeForm**: Tests rapid submission prevention and 2FA flow

### Messages Integration Tests
- **FetchStatus**: Tests React Query polling behavior with dynamic updates

## Running Integration Tests

```bash
# Run all integration tests
npm test -- tests/integration

# Run specific integration test file
npm test -- tests/integration/components/auth/LoginForm.integration.test.tsx

# Run with increased timeout (for polling tests)
npm test -- tests/integration --testTimeout=15000
```

## Why Separate from Unit Tests?

These tests were moved from unit tests because they:

1. **Require API mocking**: Need actual `fetch` mocking with React Query context
2. **Test timing/polling**: Need real `setTimeout` behavior for polling
3. **Test race conditions**: Need to simulate rapid user actions
4. **Are slower**: Take longer to run due to real timing behavior

Unit tests focus on component rendering and validation logic without external dependencies.

## Test Structure

Each integration test:
1. Sets up QueryClient with proper configuration
2. Mocks global `fetch` with realistic responses
3. Simulates user interactions
4. Waits for async operations (API calls, polling, etc.)
5. Verifies callbacks and state changes

## Common Issues

**Tests timing out?**
- Increase timeout with third parameter: `it('test', async () => { ... }, 10000)`
- Check that React Query polling is configured correctly
- Ensure `fetch` mock returns expected data structure

**Polling not working?**
- Verify `refetchInterval` is set in QueryClient options
- Check that status changes trigger polling stop (completed/failed)
- Use `waitFor` with adequate timeout for polling cycles

## Future Improvements

- [ ] Add E2E tests with real backend API
- [ ] Add visual regression tests
- [ ] Add performance/load testing
- [ ] Mock WebSocket connections for real-time updates
