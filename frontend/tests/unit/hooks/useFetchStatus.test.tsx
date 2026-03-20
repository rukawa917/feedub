import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFetchStatus } from '../../../src/hooks/useFetchStatus'
import { useAuthStore } from '../../../src/stores/auth'

// Mock auth store - only getState is needed since hook doesn't use selector pattern
vi.mock('../../../src/stores/auth', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}))

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useFetchStatus', () => {
  const mockToken = 'mock-jwt-token'

  beforeEach(() => {
    mockFetch.mockClear()
    // Set up auth store mock
    vi.mocked(useAuthStore.getState).mockReturnValue({
      token: mockToken,
      user: null,
      expiresAt: null,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
      isAuthenticated: vi.fn(() => true),
      updateToken: vi.fn(),
    })
  })

  afterEach(() => {
    // Don't use restoreAllMocks as it affects module mocks
    vi.clearAllMocks()
  })

  it('should poll fetch status every 2 seconds when status is pending', async () => {
    const fetchId = 'test-fetch-id-123'
    let callCount = 0

    mockFetch.mockImplementation(() => {
      callCount++
      return Promise.resolve({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          id: fetchId,
          userId: 'user-123',
          status: 'pending',
          messageCount: 0,
          error: null,
          startedAt: new Date().toISOString(),
          completedAt: null,
        }),
      })
    })

    const { result } = renderHook(() => useFetchStatus(fetchId))

    // Initial call
    await waitFor(() => expect(result.current.data?.status).toBe('pending'), { timeout: 3000 })
    expect(callCount).toBe(1)

    // Wait for second polling call (2 second interval from hook)
    await waitFor(() => expect(callCount).toBeGreaterThanOrEqual(2), {
      timeout: 5000,
    })

    expect(result.current.data?.status).toBe('pending')
  })

  it('should poll fetch status every 2 seconds when status is in_progress', async () => {
    const fetchId = 'test-fetch-id-456'
    let callCount = 0

    mockFetch.mockImplementation(() => {
      callCount++
      return Promise.resolve({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          id: fetchId,
          userId: 'user-123',
          status: 'in_progress',
          messageCount: 150,
          error: null,
          startedAt: new Date().toISOString(),
          completedAt: null,
        }),
      })
    })

    const { result } = renderHook(() => useFetchStatus(fetchId))

    // Wait for initial data to be loaded
    await waitFor(() => expect(result.current.data?.status).toBe('in_progress'), { timeout: 3000 })
    expect(callCount).toBe(1)

    // Wait for second polling call (2 second interval from hook)
    await waitFor(() => expect(callCount).toBeGreaterThanOrEqual(2), {
      timeout: 5000,
    })

    expect(result.current.data?.status).toBe('in_progress')
    expect(result.current.data?.messageCount).toBe(150)
  })

  it('should stop polling when status is completed', async () => {
    const fetchId = 'test-fetch-id-789'
    let callCount = 0

    mockFetch.mockImplementation(() => {
      callCount++
      return Promise.resolve({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          id: fetchId,
          userId: 'user-123',
          status: 'completed',
          messageCount: 500,
          error: null,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }),
      })
    })

    const { result } = renderHook(() => useFetchStatus(fetchId))

    // Wait for data to be loaded
    await waitFor(() => expect(result.current.data?.status).toBe('completed'), {
      timeout: 3000,
    })

    expect(callCount).toBe(1)

    // Wait to ensure no additional polling calls
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // Verify no additional calls were made (polling stopped)
    expect(callCount).toBe(1)
  })

  it('should stop polling when status is failed', async () => {
    const fetchId = 'test-fetch-id-error'
    let callCount = 0

    mockFetch.mockImplementation(() => {
      callCount++
      return Promise.resolve({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          id: fetchId,
          userId: 'user-123',
          status: 'failed',
          messageCount: 0,
          error: 'Network error occurred',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }),
      })
    })

    const { result } = renderHook(() => useFetchStatus(fetchId))

    // Wait for data to be loaded
    await waitFor(() => expect(result.current.data?.status).toBe('failed'), {
      timeout: 3000,
    })

    expect(callCount).toBe(1)

    // Wait to ensure no additional polling calls
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // Verify no additional calls were made (polling stopped)
    expect(callCount).toBe(1)
  })

  it('should not poll if fetchId is null or undefined', () => {
    const { result: resultNull } = renderHook(() => useFetchStatus(null))
    const { result: resultUndefined } = renderHook(() => useFetchStatus(undefined))

    expect(resultNull.current.data).toBeNull()
    expect(resultUndefined.current.data).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should provide loading and error states', async () => {
    const fetchId = 'test-fetch-id-loading'

    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          id: fetchId,
          userId: 'user-123',
          status: 'pending',
          messageCount: 0,
          error: null,
          startedAt: new Date().toISOString(),
          completedAt: null,
        }),
      })
    })

    const { result } = renderHook(() => useFetchStatus(fetchId))

    // Should start in loading state
    expect(result.current.isLoading).toBe(true)

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 3000,
    })
    expect(result.current.data).toBeDefined()
    expect(result.current.error).toBeNull()
  })
})
