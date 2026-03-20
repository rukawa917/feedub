/**
 * Insights Service
 * API calls for LLM insights including consent, usage, validation, and generation
 */

import { API_ENDPOINTS } from './api/config'
import { apiClient } from './api/client'
import type {
  ConsentStatus,
  ConsentResponse,
  RevokeConsentResponse,
  UsageStatus,
  ValidationRequest,
  ValidationResponse,
  SSEEvent,
  InsightListResponse,
  InsightDetail,
} from '../types/insights'

/**
 * Creates a buffered SSE parser that handles:
 * - Partial chunks (JSON split across network packets)
 * - Multiple events in a single chunk
 * - Malformed data gracefully
 */
function createSSEParser(onEvent: (event: SSEEvent) => void) {
  let buffer = ''

  return (chunk: string) => {
    buffer += chunk

    // SSE events are separated by double newlines
    const events = buffer.split('\n\n')
    buffer = events.pop() || '' // Keep incomplete event in buffer

    for (const eventBlock of events) {
      if (!eventBlock.trim()) continue

      const dataLine = eventBlock.split('\n').find((line) => line.startsWith('data: '))
      if (dataLine) {
        try {
          const event = JSON.parse(dataLine.slice(6)) as SSEEvent
          onEvent(event)
        } catch (e) {
          console.error('SSE parse error:', e, 'Data:', dataLine)
        }
      }
    }
  }
}

/**
 * Get consent status for current user
 */
export async function getConsentStatus(): Promise<ConsentStatus> {
  return apiClient.get<ConsentStatus>(API_ENDPOINTS.insights.consentStatus)
}

/**
 * Give consent for LLM insights
 */
export async function giveConsent(version: string): Promise<ConsentResponse> {
  return apiClient.post<ConsentResponse>(API_ENDPOINTS.insights.giveConsent, { version })
}

/**
 * Revoke consent for LLM insights
 */
export async function revokeConsent(): Promise<RevokeConsentResponse> {
  return apiClient.post<RevokeConsentResponse>(API_ENDPOINTS.insights.revokeConsent)
}

/**
 * Get usage status (daily limit, remaining, reset time)
 */
export async function getUsage(): Promise<UsageStatus> {
  return apiClient.get<UsageStatus>(API_ENDPOINTS.insights.usage)
}

/**
 * Validate insight request (check message count, token estimate)
 */
export async function validateInsight(request: ValidationRequest): Promise<ValidationResponse> {
  return apiClient.post<ValidationResponse>(API_ENDPOINTS.insights.validate, request)
}

/**
 * Shared SSE streaming request handler.
 * Handles error responses, reader setup, decoding, and SSE parsing.
 */
async function streamSSERequest(
  url: string,
  body: unknown,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await apiClient.stream(url, body, {
    headers: { Accept: 'text/event-stream' },
    signal,
  })

  if (!response.ok) {
    let error
    try {
      error = await response.json()
    } catch {
      error = {
        detail:
          response.status >= 500
            ? 'Service temporarily unavailable. Please try again later.'
            : 'Request failed. Please check your input and try again.',
      }
    }
    const { InsightApiError } = await import('../types/insights')
    throw new InsightApiError(response.status, error)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  const parseSSE = createSSEParser(onEvent)

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      parseSSE(chunk)
    }
    // Flush any remaining buffer
    const remaining = decoder.decode()
    if (remaining) parseSSE(remaining + '\n\n')
  } finally {
    reader.releaseLock()
  }
}

/**
 * Generate insight from specific message IDs.
 * Uses SSE streaming for real-time content updates.
 */
export async function generateInsightFromIds(
  request: { message_ids: string[]; language?: string },
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  return streamSSERequest(
    API_ENDPOINTS.insights.generateFromIds,
    { message_ids: request.message_ids, language: request.language || 'en' },
    onEvent,
    signal
  )
}

/**
 * Get paginated insight history
 */
export async function getInsightHistory(
  limit: number = 20,
  offset: number = 0
): Promise<InsightListResponse> {
  return apiClient.get<InsightListResponse>(
    `${API_ENDPOINTS.insights.list}?limit=${limit}&offset=${offset}`
  )
}

/**
 * Get single insight detail
 */
export async function getInsightDetail(insightId: string): Promise<InsightDetail> {
  return apiClient.get<InsightDetail>(API_ENDPOINTS.insights.detail(insightId))
}
