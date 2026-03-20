/**
 * Hook for fetching user's chat list
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { getChats } from '@/services/message-service'
import type { Chat } from '@/services/message-service'

export interface UseChatsReturn {
  data: Chat[] | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage user's chat list
 *
 * Automatically fetches chats on mount using authenticated token.
 * Provides a refetch function to manually refresh the chat list.
 *
 * @returns Chat list data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data: chats, isLoading, error, refetch } = useChats()
 *
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 *
 * // Refetch chats after message fetch completes
 * const handleFetchComplete = async () => {
 *   await refetch()
 * }
 *
 * return <ChatList chats={chats} />
 * ```
 */
export function useChats(): UseChatsReturn {
  // Get token imperatively to avoid re-renders on token refresh
  const getToken = () => useAuthStore.getState().token
  const [data, setData] = useState<Chat[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchChats = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const chats = await getChats(token)
      setData(chats)
    } catch (err) {
      console.error('[useChats] Error fetching chats:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch chats'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, isLoading, error, refetch: fetchChats }
}
