/**
 * useBlockingOperation hook
 * Manages state for blocking operations that prevent user interruption.
 * Provides progress tracking, beforeunload warning, and operation lifecycle.
 *
 * Usage:
 * ```typescript
 * const blocking = useBlockingOperation()
 *
 * // Start an operation
 * blocking.start({ title: 'Syncing Messages', onCancel: handleCancel })
 *
 * // Update progress during operation
 * blocking.setProgress(50)
 * blocking.setStatusText('Processing channel 2 of 4...')
 *
 * // Complete or fail
 * blocking.complete('Successfully synced 150 messages')
 * blocking.fail('Network error occurred')
 *
 * // Dismiss after complete/fail
 * blocking.dismiss()
 * ```
 */

import { useState, useCallback, useEffect } from 'react'

export type BlockingOperationStatus = 'idle' | 'running' | 'cancelling' | 'completed' | 'failed'

export interface BlockingOperationConfig {
  /** Title shown in the modal header */
  title: string
  /** Optional callback when user confirms cancel */
  onCancel?: () => Promise<void>
  /** Optional initial status text */
  initialStatusText?: string
}

export interface BlockingOperationState {
  // Status
  status: BlockingOperationStatus
  isBlocking: boolean

  // Progress
  progress: number
  statusText: string
  error: string | null

  // Config
  title: string
  onCancel: (() => Promise<void>) | null

  // Actions
  start: (config: BlockingOperationConfig) => void
  setProgress: (value: number) => void
  setStatusText: (text: string) => void
  complete: (successMessage?: string) => void
  fail: (errorMessage: string) => void
  dismiss: () => void
  requestCancel: () => Promise<void>
}

export function useBlockingOperation(): BlockingOperationState {
  const [status, setStatus] = useState<BlockingOperationStatus>('idle')
  const [progress, setProgressValue] = useState(0)
  const [statusText, setStatusTextValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [onCancelCallback, setOnCancelCallback] = useState<(() => Promise<void>) | null>(null)

  const isBlocking = status === 'running' || status === 'cancelling'

  // beforeunload handler - warn user before closing tab during operation
  useEffect(() => {
    if (!isBlocking) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Modern browsers ignore custom messages but require returnValue
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isBlocking])

  const start = useCallback((config: BlockingOperationConfig) => {
    setStatus('running')
    setProgressValue(0)
    setStatusTextValue(config.initialStatusText || 'Starting...')
    setError(null)
    setTitle(config.title)
    // Wrap in function to avoid immediate invocation
    setOnCancelCallback(() => config.onCancel || null)
  }, [])

  const setProgress = useCallback((value: number) => {
    setProgressValue(Math.max(0, Math.min(100, value)))
  }, [])

  const setStatusText = useCallback((text: string) => {
    setStatusTextValue(text)
  }, [])

  const complete = useCallback((successMessage?: string) => {
    setStatus('completed')
    setProgressValue(100)
    if (successMessage) {
      setStatusTextValue(successMessage)
    }
  }, [])

  const fail = useCallback((errorMessage: string) => {
    setStatus('failed')
    setError(errorMessage)
  }, [])

  const dismiss = useCallback(() => {
    setStatus('idle')
    setProgressValue(0)
    setStatusTextValue('')
    setError(null)
    setTitle('')
    setOnCancelCallback(null)
  }, [])

  const requestCancel = useCallback(async () => {
    if (status !== 'running') return

    setStatus('cancelling')
    setStatusTextValue('Cancelling...')

    try {
      if (onCancelCallback) {
        await onCancelCallback()
      }
      // After cancel completes, dismiss the modal
      dismiss()
    } catch (err) {
      // If cancel fails, show error but keep modal open
      const message = err instanceof Error ? err.message : 'Failed to cancel operation'
      setStatus('failed')
      setError(message)
    }
  }, [status, onCancelCallback, dismiss])

  return {
    status,
    isBlocking,
    progress,
    statusText,
    error,
    title,
    onCancel: onCancelCallback,
    start,
    setProgress,
    setStatusText,
    complete,
    fail,
    dismiss,
    requestCancel,
  }
}
