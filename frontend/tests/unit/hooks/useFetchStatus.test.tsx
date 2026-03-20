import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useFetchStatus } from '../../../src/hooks/useFetchStatus'
import { useAuthStore } from '../../../src/stores/auth'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// Mock auth store - hook uses useAuthStore((s) => s.token) selector pattern
vi.mock('../../../src/stores/auth', () => {
  const mockFn = vi.fn()
  mockFn.getState = vi.fn()
  return { useAuthStore: mockFn }
})

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useFetchStatus', () => {
  const mockToken = 'mock-jwt-token'

  beforeEach(() => {
    mockFetch.mockClear()
    const mockState = {
      token: mockToken,
      user: null,
      expiresAt: null,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
      isAuthenticated: vi.fn(() => true),
      updateToken: vi.fn(),
    }
    // Mock useAuthStore.getState() for imperative access (used by apiClient internally)
    vi.mocked(useAuthStore.getState).mockReturnValue(mockState)
    // Mock useAuthStore(selector) for hook selector pattern
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      return selector ? selector(mockState) : mockState
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
          fetch_id: fetchId,
          status: 'pending',
          current_phase: 'fetching',
          messages_count: 0,
          error_message: null,
          started_at: new Date().toISOString(),
          completed_at: null,
          total_channels: 1,
          completed_channels: 0,
        }),
      })
    })

    const { result } = renderHook(() => useFetchStatus(fetchId), { wrapper: createWrapper() })

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
          fetch_id: fetchId,
          status: 'in_progress',
          current_phase: 'fetching',
          messages_count: 150,
          error_message: null,
          started_at: new Date().toISOString(),
          completed_at: null,
          total_channels: 2,
          completed_channels: 1,
        }),
      })
    })

    const { result } = renderHook(() => useFetchStatus(fetchId), { wrapper: createWrapper() })

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
          fetch_id: fetchId,
          status: 'completed',
          current_phase: 'completed',
          messages_count: 500,
          error_message: null,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          total_channels: 2,
          completed_channels: 2,
        }),
      })
    })

    const { result } = renderHook(() => useFetchStatus(fetchId), { wrapper: createWrapper() })

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
          fetch_id: fetchId,
          status: 'failed',
          current_phase: 'failed',
          messages_count: 0,
          error_message: 'Network error occurred',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          total_channels: 1,
          completed_channels: 0,
        }),
      })
    })

    const { result } = renderHook(() => useFetchStatus(fetchId), { wrapper: createWrapper() })

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
    const { result: resultNull } = renderHook(() => useFetchStatus(null), { wrapper: createWrapper() })
    const { result: resultUndefined } = renderHook(() => useFetchStatus(undefined), { wrapper: createWrapper() })

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
          fetch_id: fetchId,
          status: 'pending',
          current_phase: 'fetching',
          messages_count: 0,
          error_message: null,
          started_at: new Date().toISOString(),
          completed_at: null,
          total_channels: 1,
          completed_channels: 0,
        }),
      })
    })

    const { result } = renderHook(() => useFetchStatus(fetchId), { wrapper: createWrapper() })

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
