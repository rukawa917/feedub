import '@testing-library/jest-dom'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup, act } from '@testing-library/react'
import { useAuthStore } from '../stores/auth'

// Initialize auth store with default test token for authenticated hooks
beforeEach(() => {
  // Use consistent token across all tests (unless test overrides it)
  const defaultToken = 'test-jwt-token-abc123'

  // Directly set auth state in the store (bypasses async hydration)
  // Wrap in act() to avoid React warnings
  act(() => {
    useAuthStore.setState({
      token: defaultToken,
      user: {
        phone: '+1234567890',
        telegramUserId: 'test-user-123',
        id: 'test-user-123',
      },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    })
  })

  // Also mock localStorage for tests that explicitly check it
  const mockAuthState = {
    state: {
      token: defaultToken,
      user: {
        phone: '+1234567890',
        telegramUserId: 'test-user-123',
        id: 'test-user-123',
      },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    },
    version: 1,
  }

  const storage: Record<string, string> = {
    'auth-storage': JSON.stringify(mockAuthState),
  }

  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
    return storage[key] || null
  })

  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
    storage[key] = value
  })

  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
    delete storage[key]
  })

  vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
    Object.keys(storage).forEach((key) => delete storage[key])
  })
})

// Cleanup after each test
afterEach(() => {
  // Clear auth store - wrap in act() to avoid React warnings
  act(() => {
    useAuthStore.setState({
      token: null,
      user: null,
      expiresAt: null,
    })
  })

  cleanup()
  vi.restoreAllMocks()
})
