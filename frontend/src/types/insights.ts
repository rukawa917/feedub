/**
 * LLM Insights Types
 * Types for consent management, usage tracking, SSE streaming, and insights
 */

// Validation types
// NOTE: chat_ids are strings (matching backend schema), dates are REQUIRED
export interface ValidationRequest {
  chat_ids: string[]
  start_date: string // ISO string, REQUIRED
  end_date: string // ISO string, REQUIRED
}

export interface ValidationResponse {
  valid: boolean
  message_count: number
  exceeds_limit: boolean
  estimated_tokens: number
  max_messages: number | null
  suggested_filters?: {
    narrower_date_range?: { start: string; end: string }
    fewer_channels?: string[]
  }
}

// Supported languages for insight generation
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ja: 'Japanese',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ru: 'Russian',
} as const

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES

// Generation types
export interface GenerationRequest {
  message_ids: string[]
  language?: SupportedLanguage // optional, defaults to 'en'
}

export type SSEEventType = 'status' | 'chunk' | 'metadata' | 'error'

export interface SSEStatusEvent {
  type: 'status'
  status: 'pending' | 'generating' | 'completed'
  insight_id?: string
}

export interface SSEChunkEvent {
  type: 'chunk'
  content: string
  insight_id: string
}

export interface SSEMetadataEvent {
  type: 'metadata'
  tokens_used: number
  input_tokens: number | null
  output_tokens: number | null
  cost: number | null
  provider: string
  model: string
  generation_time_ms: number | null
}

export interface SSEErrorEvent {
  type: 'error'
  error: string
  detail: string
  reset_at?: string
  suggested_filters?: ValidationResponse['suggested_filters']
}

export type SSEEvent = SSEStatusEvent | SSEChunkEvent | SSEMetadataEvent | SSEErrorEvent

// Utility for displaying costs
export function formatCost(costUsd: string | null): string {
  if (!costUsd) return 'Free (cached)'
  const value = parseFloat(costUsd)
  if (value === 0) return 'Free'
  if (value < 0.01) return '<$0.01'
  return `$${value.toFixed(4)}`
}

// Utility for displaying token counts
export function formatTokens(input: number | null, output: number | null): string {
  if (input === null && output === null) return 'N/A'
  const total = (input || 0) + (output || 0)
  return `${total.toLocaleString()} tokens`
}

// Insight types - matches backend schema
// NOTE: Response types use number[] for chat_ids (backend returns integers)
export interface InsightSummary {
  id: string
  created_at: string
  chat_ids: number[] // RESPONSE: integers from backend
  chat_titles: string[] | null
  start_date: string | null
  end_date: string | null
  message_count: number
  status: 'pending' | 'generating' | 'completed' | 'failed'
  completed_at: string | null
}

export interface InsightDetail extends InsightSummary {
  user_id: string
  summary: string | null // Full markdown content
  error_message: string | null
  model_used: string
  provider_used: string
  input_tokens: number | null
  output_tokens: number | null
  cost_usd: string | null // Decimal string
  generation_time_ms: number | null
}

export interface InsightListResponse {
  insights: InsightSummary[]
  total: number
}

// Error types
export type InsightErrorCode =
  | 'rate_limit_exceeded'
  | 'message_limit_exceeded'
  | 'generation_failed'

// Custom error class for insight API errors
export class InsightApiError extends Error {
  constructor(
    public status: number,
    public data: {
      detail?: string
      error?: string
      reset_at?: string
      suggested_filters?: ValidationResponse['suggested_filters']
    }
  ) {
    super(data.detail || data.error || 'Insight API error')
    this.name = 'InsightApiError'
  }
}
