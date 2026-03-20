/**
 * T049: Message service
 * Provides API calls for message fetching and retrieval
 * Source: specs/003-minimal-frontend-webapp/contracts/messages-contract.md
 *
 * DEV MODE: Returns mock data when using dev token
 */

import { API_ENDPOINTS } from './api/config'
import { apiClient } from './api/client'
import { retryAsync } from '../utils/retry'
import type {
  TriggerFetchResponse,
  FetchStatusResponse,
  GetMessagesResponse,
  GetMessageDetailResponse,
} from '../types/message'
import { isDevToken, DEV_CHATS, DEV_MESSAGES, getDevMessages } from '../mocks/dev-data'

/**
 * Trigger a background message fetch operation from Telegram
 * POST /messages/fetch
 *
 * DEV MODE: Returns mock response immediately
 *
 * @param token - JWT access token
 * @param channelIds - Optional array of channel IDs to fetch from (if not provided, uses saved selections)
 * @returns Response with fetchId and status (converted to camelCase)
 * @throws Error with detail message from backend
 */
export async function triggerFetch(
  token: string,
  channelIds?: number[]
): Promise<TriggerFetchResponse> {
  // DEV MODE: Return mock response
  if (isDevToken(token)) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      fetchId: 'dev-fetch-001',
      status: 'completed',
      message: '[DEV MODE] Mock fetch completed instantly',
    }
  }

  const body = channelIds ? { channel_ids: channelIds } : {}
  const data = await apiClient.post<{
    fetch_id?: string
    fetchId?: string
    status: string
    message?: string
  }>(API_ENDPOINTS.messages.fetch, body)

  // Convert backend snake_case to frontend camelCase
  return {
    fetchId: data.fetch_id || data.fetchId,
    status: data.status,
    message: data.message,
  }
}

/**
 * Get the status of a fetch operation (for polling)
 * GET /messages/fetch/{fetch_id}
 *
 * DEV MODE: Returns completed status
 *
 * @param token - JWT access token
 * @param fetchId - UUID of the fetch operation
 * @returns Fetch operation status and progress (handles both snake_case and camelCase)
 * @throws Error if request fails
 */
export async function getFetchStatus(token: string, fetchId: string): Promise<FetchStatusResponse> {
  // DEV MODE: Return completed status
  if (isDevToken(token)) {
    return {
      fetch_id: fetchId,
      status: 'completed',
      current_phase: 'completed',
      messages_count: DEV_MESSAGES.length,
      error_message: null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      total_channels: DEV_CHATS.length,
      completed_channels: DEV_CHATS.length,
    } as FetchStatusResponse
  }

  return apiClient.get<FetchStatusResponse>(API_ENDPOINTS.messages.fetchStatus(fetchId))
}

/**
 * Cancel an in-progress fetch operation and rollback changes
 * POST /messages/fetch/{fetch_id}/cancel
 *
 * DEV MODE: Returns mock success response
 *
 * @param token - JWT access token
 * @param fetchId - UUID of the fetch operation to cancel
 * @returns Success message
 * @throws Error if request fails or fetch cannot be cancelled
 */
export async function cancelFetch(
  token: string,
  fetchId: string
): Promise<{ message: string; status: string }> {
  // DEV MODE: Return mock response
  if (isDevToken(token)) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return {
      message: '[DEV MODE] Fetch cancelled successfully',
      status: 'cancelled',
    }
  }

  return apiClient.post<{ message: string; status: string }>(
    API_ENDPOINTS.messages.cancelFetch(fetchId)
  )
}

/**
 * List and search messages with filters
 * GET /messages
 *
 * DEV MODE: Returns filtered mock messages
 *
 * @param token - JWT access token
 * @param params - Optional query parameters (search, filters, pagination)
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Paginated list of messages
 * @throws Error if request fails
 */
export async function getMessages(
  token: string,
  params?: {
    search?: string
    chat_ids?: string[]
    start_date?: string
    end_date?: string
    type?: string
    has_media?: boolean
    limit?: number
    offset?: number
  },
  signal?: AbortSignal
): Promise<GetMessagesResponse> {
  // DEV MODE: Return mock messages
  if (isDevToken(token)) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    const result = getDevMessages({
      offset: params?.offset,
      limit: params?.limit,
      search: params?.search,
      chatIds: params?.chat_ids,
    })

    return result
  }

  const queryParams = new URLSearchParams()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle arrays by appending each value separately (e.g., chat_ids=1&chat_ids=2)
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, String(v)))
        } else {
          queryParams.append(key, String(value))
        }
      }
    })
  }

  const path = `${API_ENDPOINTS.messages.list}${queryParams.toString() ? `?${queryParams}` : ''}`

  // Wrap with retry logic for transient failures
  // Retry 3 times with exponential backoff (1s, 2s, 4s) for 5xx errors
  return retryAsync(
    async () => {
      if (signal?.aborted) {
        throw new DOMException('Request aborted', 'AbortError')
      }

      try {
        return await apiClient.get<GetMessagesResponse>(path, { signal })
      } catch (err) {
        // Mark 4xx errors as non-retryable
        const status = (err as Error & { status?: number }).status
        if (status && status >= 400 && status < 500) {
          ;(err as Error & { nonRetryable: boolean }).nonRetryable = true
        }
        throw err
      }
    },
    {
      maxAttempts: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      onRetry: (attempt, delay, error) => {
        if (
          (error as Error & { nonRetryable?: boolean }).nonRetryable ||
          error.name === 'AbortError'
        ) {
          throw error
        }
      },
    }
  )
}

/**
 * Get details of a single message
 * GET /messages/{message_id}
 *
 * DEV MODE: Returns mock message if found
 *
 * @param token - JWT access token
 * @param messageId - UUID of the message
 * @returns Message details
 * @throws Error if request fails or message not found
 */
export async function getMessageDetail(
  token: string,
  messageId: string
): Promise<GetMessageDetailResponse> {
  // DEV MODE: Return mock message
  if (isDevToken(token)) {
    const message = DEV_MESSAGES.find((m) => m.id === messageId)
    if (!message) {
      throw new Error('Message not found')
    }
    return message
  }

  return apiClient.get<GetMessageDetailResponse>(API_ENDPOINTS.messages.detail(messageId))
}

/**
 * Download or view media content for a message
 * GET /messages/{message_id}/media
 *
 * DEV MODE: Returns placeholder blob
 *
 * @param token - JWT access token
 * @param messageId - UUID of the message
 * @returns Blob with media data
 * @throws Error if request fails or media not found
 */
export async function getMessageMedia(token: string, messageId: string): Promise<Blob> {
  // DEV MODE: Return placeholder
  if (isDevToken(token)) {
    throw new Error('[DEV MODE] Media download not available in dev mode')
  }

  return apiClient.getBlob(API_ENDPOINTS.messages.media(messageId))
}

/**
 * Chat representation from backend
 */
export interface Chat {
  chatId: string
  title: string
  type: 'private' | 'group' | 'supergroup' | 'channel'
  messageCount: number
}

/**
 * Get list of distinct chats for the current user
 * GET /messages/chats
 *
 * DEV MODE: Returns mock chats
 *
 * @param token - JWT access token
 * @returns List of chats with message counts
 * @throws Error if request fails
 */
export async function getChats(token: string): Promise<Chat[]> {
  // DEV MODE: Return mock chats
  if (isDevToken(token)) {
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Count messages per chat
    const chatMessageCounts: Record<string, number> = {}
    DEV_MESSAGES.forEach((msg) => {
      const chatId = msg.chat_id
      chatMessageCounts[chatId] = (chatMessageCounts[chatId] || 0) + 1
    })

    return DEV_CHATS.map((chat) => ({
      ...chat,
      messageCount: chatMessageCounts[chat.chatId] || 0,
    }))
  }

  const data = await apiClient.get<{
    chats: { chat_id: string; title: string; type: string; message_count: number }[]
  }>(API_ENDPOINTS.messages.chats)

  return data.chats.map((chat) => ({
    // IMPORTANT: Keep original chat_id for API filtering (don't normalize)
    // The backend stores original Telegram chat_ids (e.g., -1001234567890)
    // and filters must use the same format
    chatId: chat.chat_id,
    title: chat.title,
    type: chat.type,
    messageCount: chat.message_count,
  }))
}

/**
 * Response type for message IDs endpoint
 */
export interface GetMessageIdsResponse {
  ids: string[]
  total: number
}

/**
 * Get only message IDs matching filters (lightweight endpoint)
 * GET /messages/ids
 *
 * This is much more efficient than fetching full messages when you only
 * need the IDs (e.g., for passing to insights generation).
 * Maximum 10000 IDs returned (actual limit enforced by insights service per provider).
 *
 * DEV MODE: Returns mock message IDs
 *
 * @param token - JWT access token
 * @param params - Optional query parameters (same as getMessages)
 * @returns Object with ids array and total count
 * @throws Error if request fails
 */
export async function getMessageIds(
  token: string,
  params?: {
    search?: string
    chat_ids?: string[]
    start_date?: string
    end_date?: string
    message_type?: string
    has_media?: boolean
  }
): Promise<GetMessageIdsResponse> {
  // DEV MODE: Return mock message IDs
  if (isDevToken(token)) {
    await new Promise((resolve) => setTimeout(resolve, 200))

    const result = getDevMessages({
      search: params?.search,
      chatIds: params?.chat_ids,
      limit: 1000,
    })

    return {
      ids: result.messages.map((m) => m.id),
      total: result.total,
    }
  }

  const queryParams = new URLSearchParams()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle arrays by appending each value separately
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, String(v)))
        } else {
          queryParams.append(key, String(value))
        }
      }
    })
  }

  const path = `${API_ENDPOINTS.messages.ids}${queryParams.toString() ? `?${queryParams}` : ''}`
  return apiClient.get<GetMessageIdsResponse>(path)
}
