/**
 * Message types based on backend API contracts
 * Source: specs/003-minimal-frontend-webapp/contracts/messages-contract.md
 */

/**
 * DEPRECATED: Backend returns flat file_* fields, not nested media object
 * Keeping for backwards compatibility with tests
 */
export interface MediaInfo {
  /** Media type: photo, video, document, audio, voice, etc. */
  type: 'photo' | 'video' | 'document' | 'audio' | 'voice' | 'video_note' | 'sticker'

  /** File name (for documents) */
  fileName?: string

  /** File size in bytes */
  fileSize?: number

  /** MIME type */
  mimeType?: string

  /** Image/video dimensions */
  dimensions?: {
    width: number
    height: number
  }

  /** Video/audio duration in seconds */
  duration?: number
}

export interface Message {
  /** Unique message ID (UUID) */
  id: string

  /** User ID who owns this message */
  userId: string

  /** Telegram message ID (for deduplication) */
  telegramMessageId: number

  /** Message text content (may be null for media-only messages) */
  content: string | null

  /** Sender information */
  sender: {
    /** Sender's Telegram user ID */
    telegramUserId: string

    /** Sender's display name */
    name: string
  }

  /** Chat/channel information */
  chat: {
    /** Chat ID */
    telegramChatId: string

    /** Chat title */
    title: string

    /** Chat type: private, group, supergroup, channel */
    type: 'private' | 'group' | 'supergroup' | 'channel'
  }

  /** Message timestamp (ISO 8601 format) */
  timestamp: string

  /** Message type (text, photo, video, document, etc.) */
  type: string

  /** Media metadata (if message contains media) */
  media: MediaInfo | null

  /** Is this message a reply to another message? */
  isReply: boolean

  /** Is this message forwarded from another chat? */
  isForwarded: boolean

  /** ISO timestamp when this message was fetched from Telegram */
  fetchedAt: string
}

export interface FetchOperation {
  /** Unique fetch operation ID (UUID) */
  id: string

  /** User ID who initiated the fetch */
  userId: string

  /** Fetch status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

  /** Current phase within the fetch operation */
  currentPhase?: 'fetching_messages' | 'processing_embeddings' | 'completed'

  /** Number of messages fetched so far */
  messageCount: number

  /** Error message (if status is 'failed') */
  error: string | null

  /** ISO timestamp when fetch was started */
  startedAt: string

  /** ISO timestamp when fetch completed/failed (null if still running) */
  completedAt: string | null

  /** Total number of channels to fetch from */
  totalChannels?: number

  /** Number of channels completed */
  completedChannels?: number

  /** Current channel being processed */
  currentChannelTitle?: string

  /** Failed channels with error details */
  failedChannels?: Array<{
    channel_id: number
    title: string | null
    error: string
  }>

  /** Channel IDs being fetched (if specified) */
  channelIds?: number[]
}

export interface MessageFilters {
  /** Text search query (searches message content) */
  search?: string

  /** Filter by specific chat ID */
  chatId?: string

  /** Filter by start date (ISO 8601 date string, e.g., "2025-01-01") */
  startDate?: string

  /** Filter by end date (ISO 8601 date string) */
  endDate?: string

  /** Filter by message type (e.g., "photo", "video") */
  type?: string

  /** Show only messages with media (true/false as string) */
  hasMedia?: string

  /** Current page number (for pagination) */
  page?: string

  /** Number of results per page (default: 50) */
  limit?: string
}

export interface PaginationMeta {
  /** Current page number (zero-indexed) */
  currentPage: number

  /** Number of items per page */
  pageSize: number

  /** Total number of items across all pages */
  totalItems: number

  /** Total number of pages */
  totalPages: number

  /** Is there a next page available? */
  hasNextPage: boolean

  /** Is there a previous page available? */
  hasPrevPage: boolean
}

// API response types (these are what the FRONTEND receives, converted from backend snake_case)
export interface TriggerFetchResponse {
  fetchId: string
  status: string
  message?: string
}

export interface FetchStatusResponse {
  fetch_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  current_phase?: 'fetching_messages' | 'processing_embeddings' | 'completed'
  messages_count: number
  error_message: string | null
  error_type?: 'session_expired' | 'rate_limited' | 'connection_error' | 'unknown' | null
  started_at: string
  completed_at: string | null
  total_channels?: number
  completed_channels?: number
  current_channel_title?: string
  failed_channels?: Array<{
    channel_id: number
    title: string | null
    error: string
  }>
  channel_ids?: number[]
}

export interface GetMessagesResponse {
  messages: Array<{
    id: string
    user_id: string
    telegram_message_id: number
    content: string | null
    sender_id: number | null
    sender_name: string | null
    chat_id: number
    chat_title: string
    chat_type: string
    timestamp: string
    message_type: string
    has_media: boolean
    // Flat file metadata fields (from backend MessageResponse schema)
    file_id: number | null
    file_name: string | null
    file_mime_type: string | null
    file_size: number | null
    file_duration: number | null
    file_width: number | null
    file_height: number | null
    is_reply: boolean
    is_forward: boolean
    fetched_at: string
  }>
  total: number
  offset: number
  limit: number
  has_more: boolean
}

export interface GetMessageDetailResponse {
  id: string
  user_id: string
  telegram_message_id: number
  content: string | null
  sender_id: number | null
  sender_name: string | null
  chat_id: number
  chat_title: string
  chat_type: string
  timestamp: string
  message_type: string
  has_media: boolean
  // Flat file metadata fields (from backend MessageResponse schema)
  file_id: number | null
  file_name: string | null
  file_mime_type: string | null
  file_size: number | null
  file_duration: number | null
  file_width: number | null
  file_height: number | null
  is_reply: boolean
  is_forward: boolean
  fetched_at: string
}

export interface MediaDownloadResponse {
  // Binary data - handled by browser download
  data: Blob
  filename: string
  mimeType: string
}

/**
 * Message loading state for UI indicators
 * Used by useMessages hook to determine which loading indicator to show
 */
export type MessageLoadingState =
  | 'idle' // No operation in progress
  | 'loading' // Initial load (show skeleton cards)
  | 'refreshing' // Manual refresh (show refresh spinner)
  | 'loadingMore' // Pagination (show button spinner)
  | 'error' // Error state (show error message)
