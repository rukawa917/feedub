import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useChats } from '@/hooks/useChats'
import * as messageService from '@/services/message-service'

vi.mock('@/services/message-service')

const mockChats = [
  { chatId: '1', title: 'Chat 1', type: 'group' as const, messageCount: 100 },
  { chatId: '2', title: 'Chat 2', type: 'private' as const, messageCount: 50 },
]

describe('useChats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch chats on mount', async () => {
    vi.mocked(messageService.getChats).mockResolvedValue(mockChats)

    const { result } = renderHook(() => useChats())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockChats)
    expect(messageService.getChats).toHaveBeenCalledTimes(1)
  })

  it('should handle errors', async () => {
    vi.mocked(messageService.getChats).mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => useChats())

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.data).toBeNull()
  })
})
