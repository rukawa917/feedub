import { afterEach, beforeEach, vi } from 'vitest'

// Mock localStorage BEFORE any module imports (ES imports are hoisted).
// vi.hoisted() runs before import evaluation, so Zustand's persist middleware
// captures our mock instead of jsdom's localStorage.
const { storageData } = vi.hoisted(() => {
  const storageData: Record<string, string> = {}

  const localStorageMock = {
    getItem: (key: string) => storageData[key] ?? null,
    setItem: (key: string, value: string) => {
      storageData[key] = value
    },
    removeItem: (key: string) => {
      delete storageData[key]
    },
    clear: () => {
      Object.keys(storageData).forEach((key) => delete storageData[key])
    },
    get length() {
      return Object.keys(storageData).length
    },
    key: (index: number) => Object.keys(storageData)[index] ?? null,
  }

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  })

  return { storageData }
})

import '@testing-library/jest-dom'
import { cleanup, act } from '@testing-library/react'
import { useAuthStore } from '../stores/auth'

// Initialize auth store with default test token for authenticated hooks
beforeEach(() => {
  const defaultToken = 'test-jwt-token-abc123'

  // Seed localStorage with auth state
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
  storageData['auth-storage'] = JSON.stringify(mockAuthState)

  // Only set state on the real Zustand store. Test files that call
  // vi.mock('../stores/auth') replace useAuthStore with a plain vi.fn()
  // which has no .setState method — calling it would throw.
  if (typeof useAuthStore.setState === 'function') {
    act(() => {
      useAuthStore.setState({
        token: defaultToken,
        user: {
          phone: '+1234567890',
          telegramUserId: 'test-user-123',
          id: 'test-user-123',
        },
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      })
    })
  }
})

// Cleanup after each test
afterEach(() => {
  if (typeof useAuthStore.setState === 'function') {
    act(() => {
      useAuthStore.setState({
        token: null,
        user: null,
        expiresAt: null,
      })
    })
  }

  // Clear storage data
  Object.keys(storageData).forEach((key) => delete storageData[key])

  cleanup()
  vi.restoreAllMocks()
})
