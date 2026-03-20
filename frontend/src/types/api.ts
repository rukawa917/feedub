/**
 * Generic API types for request/response handling
 */

export interface ApiErrorResponse {
  error: {
    /** Error code (e.g., "VALIDATION_ERROR", "UNAUTHORIZED") */
    code: string

    /** Human-readable error message */
    message: string

    /** Detailed error information (for debugging) */
    details?: Record<string, unknown>
  }
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// HTTP Client configuration
export interface ApiConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
}

// === Frontend UX Improvements: Query Params (T005) ===

import type { MessageType } from './filters'

/**
 * Query parameters for fetching messages
 * Maps to backend MessageFilterParams schema
 */
export interface MessageQueryParams {
  /** Full-text search query (minimum 1 character for multilingual support) */
  search?: string

  /** Filter by chat IDs (can specify multiple) */
  chat_ids?: string[]

  /** Filter messages after this date (ISO 8601) */
  start_date?: string

  /** Filter messages before this date (ISO 8601) */
  end_date?: string

  /** Filter by message type */
  message_type?: MessageType

  /** Filter by media presence */
  has_media?: boolean

  /** Number of messages to return (default: 50) */
  limit?: number

  /** Number of messages to skip (for pagination) */
  offset?: number
}
