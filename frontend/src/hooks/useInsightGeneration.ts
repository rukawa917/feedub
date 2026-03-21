/**
 * useInsightGeneration - Handles insight generation with SSE streaming
 * Includes validation, progress tracking, and abort capability
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuthStore } from '../stores/auth'
import { validateInsight, generateInsightFromIds } from '../services/insights-service'
import type {
  ValidationRequest,
  ValidationResponse,
  GenerationRequest,
  SSEEvent,
  SSEMetadataEvent,
  SSEErrorEvent,
} from '../types/insights'

export type GenerationStatus = 'idle' | 'validating' | 'generating' | 'completed' | 'error'

interface UseInsightGenerationReturn {
  status: GenerationStatus
  validation: ValidationResponse | null
  streamedContent: string
  metadata: SSEMetadataEvent | null
  error: SSEErrorEvent | null
  insightId: string | null
  progress: number
  messageCount: number | null
  channelCount: number | null
  validate: (request: ValidationRequest) => Promise<void>
  generate: (request: GenerationRequest) => Promise<void>
  cancel: () => void
  reset: () => void
}

export function useInsightGeneration(): UseInsightGenerationReturn {
  const token = useAuthStore((state) => state.token)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [validation, setValidation] = useState<ValidationResponse | null>(null)
  const [streamedContent, setStreamedContent] = useState('')
  const [metadata, setMetadata] = useState<SSEMetadataEvent | null>(null)
  const [error, setError] = useState<SSEErrorEvent | null>(null)
  const [insightId, setInsightId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [messageCount, setMessageCount] = useState<number | null>(null)
  const [channelCount, setChannelCount] = useState<number | null>(null)

  // CRITICAL: Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // Handle SSE events
  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'status':
        if (event.status === 'completed') {
          setStatus('completed')
          setProgress(100)
        } else if (event.status === 'generating') {
          setStatus('generating')
        }
        if (event.insight_id) {
          setInsightId(event.insight_id)
        }
        break

      case 'chunk':
        setStreamedContent((prev) => prev + event.content)
        // Estimate progress based on content length
        setProgress((prev) => Math.min(prev + 2, 95))
        if (event.insight_id) {
          setInsightId(event.insight_id)
        }
        break

      case 'metadata':
        setMetadata(event)
        break

      case 'error':
        setError(event)
        setStatus('error')
        break
    }
  }, [])

  // Validate request before generation
  const validate = useCallback(
    async (request: ValidationRequest) => {
      if (!token) return

      setStatus('validating')
      setError(null)

      try {
        const result = await validateInsight(request)
        setValidation(result)
        setMessageCount(result.message_count)
        setChannelCount(request.chat_ids.length)
        setStatus('idle')
      } catch (err) {
        console.error('Validation error:', err)
        // Don't block generation on validation errors - return to idle
        // Users can still try to generate; backend will handle actual errors
        setStatus('idle')
      }
    },
    [token]
  )

  // Generate insight with SSE streaming
  const generate = useCallback(
    async (request: GenerationRequest) => {
      if (!token) return

      // Abort any existing generation
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      // Reset state
      setStreamedContent('')
      setMetadata(null)
      setError(null)
      setInsightId(null)
      setProgress(0)
      setStatus('generating')
      setChannelCount(null)

      try {
        await generateInsightFromIds(
          {
            message_ids: request.message_ids,
            language: request.language,
          },
          handleEvent,
          abortControllerRef.current.signal
        )
      } catch (err) {
        // Handle abort (user cancelled)
        if (err instanceof DOMException && err.name === 'AbortError') {
          setStatus('idle')
          return
        }

        // Handle API errors
        if (err && typeof err === 'object' && 'data' in err) {
          const apiError = err as { status: number; data: SSEErrorEvent }
          setError({
            type: 'error',
            error: apiError.data.error || 'generation_failed',
            detail: apiError.data.detail || 'Failed to generate insight',
            reset_at: apiError.data.reset_at,
            suggested_filters: apiError.data.suggested_filters,
          })
        } else {
          setError({
            type: 'error',
            error: 'generation_failed',
            detail: err instanceof Error ? err.message : 'Failed to generate insight',
          })
        }
        setStatus('error')
      }
    },
    [token, handleEvent]
  )

  // Cancel current generation
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setStatus('idle')
    setProgress(0)
  }, [])

  // Reset all state
  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    setStatus('idle')
    setValidation(null)
    setStreamedContent('')
    setMetadata(null)
    setError(null)
    setInsightId(null)
    setProgress(0)
    setMessageCount(null)
    setChannelCount(null)
  }, [])

  return {
    status,
    validation,
    streamedContent,
    metadata,
    error,
    insightId,
    progress,
    messageCount,
    channelCount,
    validate,
    generate,
    cancel,
    reset,
  }
}
