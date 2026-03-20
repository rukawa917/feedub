// frontend/src/hooks/useChannelFavorites.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useChannelFavorites } from './useChannelFavorites'
import * as channelsApi from '../services/api/channels'
import { useAuthStore } from '../stores/auth'

// Mock channels API
vi.mock('../services/api/channels')

// Mock auth store - need both hook function and getState method
vi.mock('../stores/auth', () => {
  const mockFn = vi.fn()
  mockFn.getState = vi.fn()
  return { useAuthStore: mockFn }
})

describe('useChannelFavorites', () => {
  const mockToken = 'mock-jwt-token'

  beforeEach(() => {
    vi.clearAllMocks()
    const mockState = {
      token: mockToken,
      user: null,
      expiresAt: null,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
      isAuthenticated: vi.fn(() => true),
      updateToken: vi.fn(),
    }
    // Mock useAuthStore.getState() for imperative access
    vi.mocked(useAuthStore.getState).mockReturnValue(mockState)
    // Mock useAuthStore(selector) for hook usage
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      return selector ? selector(mockState) : mockState
    })
  })

  const mockFavorites = [
    {
      id: 'fav-1',
      channel_id: 12345,
      channel_title: 'Tech News',
      channel_type: 'channel' as const,
      favorited_at: '2025-01-10T10:00:00Z',
    },
    {
      id: 'fav-2',
      channel_id: 67890,
      channel_title: 'Crypto Updates',
      channel_type: 'channel' as const,
      favorited_at: '2025-01-11T15:30:00Z',
    },
  ]

  describe('fetching favorites', () => {
    it('fetches favorites on mount', async () => {
      vi.mocked(channelsApi.getChannelFavorites).mockResolvedValue({
        favorites: mockFavorites,
        total: 2,
      })

      const { result } = renderHook(() => useChannelFavorites())

      // Initially loading
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have fetched favorites
      expect(channelsApi.getChannelFavorites).toHaveBeenCalledWith(mockToken)
      expect(result.current.favorites).toEqual(mockFavorites)
      expect(result.current.favoriteIds.size).toBe(2)
      expect(result.current.favoriteIds.has(12345)).toBe(true)
      expect(result.current.favoriteIds.has(67890)).toBe(true)
    })

    it('handles fetch error', async () => {
      const error = new Error('Failed to fetch favorites')
      vi.mocked(channelsApi.getChannelFavorites).mockRejectedValue(error)

      const { result } = renderHook(() => useChannelFavorites())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.favorites).toBe(null)
    })

    it('does not fetch if no token', async () => {
      // Mock with null token
      const nullTokenState = {
        token: null,
        user: null,
        expiresAt: null,
        setAuth: vi.fn(),
        clearAuth: vi.fn(),
        isAuthenticated: vi.fn(() => false),
        updateToken: vi.fn(),
      }
      vi.mocked(useAuthStore.getState).mockReturnValue(nullTokenState)
      vi.mocked(useAuthStore).mockImplementation((selector) => {
        return selector ? selector(nullTokenState) : nullTokenState
      })

      const { result } = renderHook(() => useChannelFavorites())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(channelsApi.getChannelFavorites).not.toHaveBeenCalled()
    })
  })

  describe('isFavorite helper', () => {
    it('returns true for favorited channels', async () => {
      vi.mocked(channelsApi.getChannelFavorites).mockResolvedValue({
        favorites: mockFavorites,
        total: 2,
      })

      const { result } = renderHook(() => useChannelFavorites())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isFavorite(12345)).toBe(true)
      expect(result.current.isFavorite(67890)).toBe(true)
    })

    it('returns false for non-favorited channels', async () => {
      vi.mocked(channelsApi.getChannelFavorites).mockResolvedValue({
        favorites: mockFavorites,
        total: 2,
      })

      const { result } = renderHook(() => useChannelFavorites())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isFavorite(99999)).toBe(false)
    })
  })

  describe('toggleFavorite', () => {
    it('adds a favorite when toggling unfavorited channel', async () => {
      vi.mocked(channelsApi.getChannelFavorites).mockResolvedValue({
        favorites: mockFavorites,
        total: 2,
      })

      const newFavorite = {
        id: 'fav-3',
        channel_id: 11111,
        channel_title: 'New Channel',
        channel_type: 'channel' as const,
        favorited_at: '2025-01-12T12:00:00Z',
      }

      vi.mocked(channelsApi.toggleChannelFavorite).mockResolvedValue({
        is_favorite: true,
        favorite: newFavorite,
      })

      const { result } = renderHook(() => useChannelFavorites())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Toggle to add
      let toggleResult: boolean | null = null
      await act(async () => {
        toggleResult = await result.current.toggleFavorite(11111, {
          channel_id: 11111,
          channel_title: 'New Channel',
          channel_type: 'channel',
        })
      })

      expect(toggleResult).toBe(true)
      expect(channelsApi.toggleChannelFavorite).toHaveBeenCalledWith(mockToken, 11111, {
        channel_id: 11111,
        channel_title: 'New Channel',
        channel_type: 'channel',
      })

      // Should update local state
      expect(result.current.favoriteIds.has(11111)).toBe(true)
      expect(result.current.favorites).toContainEqual(newFavorite)
    })

    it('removes a favorite when toggling favorited channel', async () => {
      vi.mocked(channelsApi.getChannelFavorites).mockResolvedValue({
        favorites: mockFavorites,
        total: 2,
      })

      vi.mocked(channelsApi.toggleChannelFavorite).mockResolvedValue({
        is_favorite: false,
        favorite: null,
      })

      const { result } = renderHook(() => useChannelFavorites())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify it's currently favorited
      expect(result.current.isFavorite(12345)).toBe(true)

      // Toggle to remove
      let toggleResult: boolean | null = null
      await act(async () => {
        toggleResult = await result.current.toggleFavorite(12345)
      })

      expect(toggleResult).toBe(false)
      expect(channelsApi.toggleChannelFavorite).toHaveBeenCalledWith(mockToken, 12345, undefined)

      // Should update local state
      expect(result.current.favoriteIds.has(12345)).toBe(false)
      expect(result.current.favorites?.find((f) => f.channel_id === 12345)).toBeUndefined()
    })

    it('handles toggle error', async () => {
      vi.mocked(channelsApi.getChannelFavorites).mockResolvedValue({
        favorites: mockFavorites,
        total: 2,
      })

      const error = new Error('Failed to toggle favorite')
      vi.mocked(channelsApi.toggleChannelFavorite).mockRejectedValue(error)

      const { result } = renderHook(() => useChannelFavorites())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Attempt toggle
      await act(async () => {
        try {
          await result.current.toggleFavorite(12345)
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.toggleError).toEqual(error)
    })

    it('returns null if no token', async () => {
      // Mock with null token
      const nullTokenState = {
        token: null,
        user: null,
        expiresAt: null,
        setAuth: vi.fn(),
        clearAuth: vi.fn(),
        isAuthenticated: vi.fn(() => false),
        updateToken: vi.fn(),
      }
      vi.mocked(useAuthStore.getState).mockReturnValue(nullTokenState)
      vi.mocked(useAuthStore).mockImplementation((selector) => {
        return selector ? selector(nullTokenState) : nullTokenState
      })

      const { result } = renderHook(() => useChannelFavorites())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let toggleResult: boolean | null = null
      await act(async () => {
        toggleResult = await result.current.toggleFavorite(12345)
      })

      expect(toggleResult).toBe(null)
      expect(channelsApi.toggleChannelFavorite).not.toHaveBeenCalled()
    })
  })

  describe('refetch', () => {
    it('refetches favorites', async () => {
      vi.mocked(channelsApi.getChannelFavorites).mockResolvedValue({
        favorites: mockFavorites,
        total: 2,
      })

      const { result } = renderHook(() => useChannelFavorites())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(channelsApi.getChannelFavorites).toHaveBeenCalledTimes(1)

      // Refetch
      await act(async () => {
        await result.current.refetch()
      })

      expect(channelsApi.getChannelFavorites).toHaveBeenCalledTimes(2)
    })
  })
})
