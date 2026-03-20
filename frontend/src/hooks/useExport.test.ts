// frontend/src/hooks/useExport.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useExport } from './useExport'
import * as messageService from '../services/message-service'
import { useAuthStore } from '../stores/auth'
import type { GetMessagesResponse } from '../types/message'
import type { FilterState } from '../types/filters'

// Mock message service
vi.mock('../services/message-service')

// Mock auth store - need both hook function and getState method
vi.mock('../stores/auth', () => {
  const mockFn = vi.fn()
  mockFn.getState = vi.fn()
  return { useAuthStore: mockFn }
})

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock document.createElement('a').click()
const mockClick = vi.fn()
const originalCreateElement = document.createElement.bind(document)
document.createElement = vi.fn((tag: string) => {
  if (tag === 'a') {
    return {
      href: '',
      download: '',
      click: mockClick,
      style: {},
    } as unknown as HTMLElement
  }
  return originalCreateElement(tag)
})

describe('useExport', () => {
  const mockToken = 'mock-jwt-token'

  beforeEach(() => {
    vi.clearAllMocks()
    const mockState = {
      token: mockToken,
      user: null,
      expiresAt: null,
      setAuth: vi.fn(),
      updateToken: vi.fn(),
      clearAuth: vi.fn(),
      isAuthenticated: vi.fn(() => true),
    }
    // Mock useAuthStore.getState() for imperative access
    vi.mocked(useAuthStore.getState).mockReturnValue(mockState)
    // Mock useAuthStore(selector) for hook usage
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      return selector ? selector(mockState) : mockState
    })
  })

  const mockFilters: FilterState = {
    searchQuery: '',
    quickFilter: 'all',
    advanced: {
      chatIds: [],
      messageTypes: [],
      hasMedia: null,
      dateRange: null,
    },
  }

  const mockResponse: GetMessagesResponse = {
    messages: [
      {
        id: '1',
        user_id: 'user1',
        telegram_message_id: 123,
        content: 'Test message',
        sender_id: 1001,
        sender_name: 'John Doe',
        chat_id: 1001,
        chat_title: 'Test Chat',
        chat_type: 'channel',
        timestamp: '2025-01-15T14:30:22Z',
        message_type: 'text',
        has_media: false,
        file_id: null,
        file_name: null,
        file_mime_type: null,
        file_size: null,
        file_duration: null,
        file_width: null,
        file_height: null,
        is_reply: false,
        is_forward: false,
        fetched_at: '2025-01-16T10:00:00Z',
      },
    ],
    total: 1,
    offset: 0,
    limit: 200,
    has_more: false,
  }

  it('should export messages as TXT', async () => {
    vi.mocked(messageService.getMessages).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useExport(mockFilters))

    expect(result.current.isExporting).toBe(false)

    await act(async () => {
      await result.current.exportMessages('txt')
    })

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false)
    })

    expect(messageService.getMessages).toHaveBeenCalledWith(mockToken, {
      limit: 100,
      offset: 0,
    })
    expect(mockClick).toHaveBeenCalled()
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(global.URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('should export messages as Markdown', async () => {
    vi.mocked(messageService.getMessages).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useExport(mockFilters))

    await act(async () => {
      await result.current.exportMessages('md')
    })

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false)
    })

    expect(mockClick).toHaveBeenCalled()
  })

  it('should fetch multiple pages up to 1000 messages', async () => {
    const page1: GetMessagesResponse = {
      messages: Array(200).fill(mockResponse.messages[0]),
      total: 1000,
      skip: 0,
      limit: 200,
    }

    const page2: GetMessagesResponse = {
      messages: Array(200).fill(mockResponse.messages[0]),
      total: 1000,
      skip: 200,
      limit: 200,
    }

    const page3: GetMessagesResponse = {
      messages: Array(200).fill(mockResponse.messages[0]),
      total: 1000,
      skip: 400,
      limit: 200,
    }

    const page4: GetMessagesResponse = {
      messages: Array(200).fill(mockResponse.messages[0]),
      total: 1000,
      skip: 600,
      limit: 200,
    }

    const page5: GetMessagesResponse = {
      messages: Array(200).fill(mockResponse.messages[0]),
      total: 1000,
      skip: 800,
      limit: 200,
    }

    vi.mocked(messageService.getMessages)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2)
      .mockResolvedValueOnce(page3)
      .mockResolvedValueOnce(page4)
      .mockResolvedValueOnce(page5)

    const { result } = renderHook(() => useExport(mockFilters))

    await act(async () => {
      await result.current.exportMessages('txt')
    })

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false)
    })

    expect(messageService.getMessages).toHaveBeenCalledTimes(5)
  })

  it('should handle API errors', async () => {
    const error = new Error('API failure')
    vi.mocked(messageService.getMessages).mockRejectedValue(error)

    const { result } = renderHook(() => useExport(mockFilters))

    await act(async () => {
      await result.current.exportMessages('txt')
    })

    await waitFor(() => {
      expect(result.current.error).toEqual(error)
      expect(result.current.isExporting).toBe(false)
    })

    expect(mockClick).not.toHaveBeenCalled()
  })

  it('should respect filter parameters', async () => {
    vi.mocked(messageService.getMessages).mockResolvedValue(mockResponse)

    const filters: FilterState = {
      searchQuery: 'test',
      quickFilter: 'all',
      advanced: {
        chatIds: ['chat1'],
        messageTypes: ['text'],
        hasMedia: true,
        dateRange: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
        },
      },
    }

    const { result } = renderHook(() => useExport(filters))

    await act(async () => {
      await result.current.exportMessages('txt')
    })

    await waitFor(() => {
      expect(result.current.isExporting).toBe(false)
    })

    expect(messageService.getMessages).toHaveBeenCalledWith(mockToken, {
      search: 'test',
      chat_ids: ['chat1'],
      start_date: new Date('2025-01-01').toISOString(),
      end_date: new Date('2025-01-31').toISOString(),
      message_type: 'text',
      has_media: true,
      limit: 100,
      offset: 0,
    })
  })
})
