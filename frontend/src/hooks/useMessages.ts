/**
 * T050: Message hooks using React Query
 * Wraps message service with TanStack Query for loading/error/abort handling
 * Source: specs/003-minimal-frontend-webapp/contracts/messages-contract.md
 */

import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import * as messageService from '../services/message-service'

/**
 * T050: useTriggerFetch hook
 * Direct API call for triggering a message fetch from Telegram
 *
 * Usage:
 * ```typescript
 * const triggerFetch = useTriggerFetch()
 *
 * // Fetch from saved selections
 * triggerFetch.mutate(undefined, {
 *   onSuccess: (data) => {
 *     setFetchId(data.fetch_id)
 *   },
 *   onError: (error) => {
 *     toast.error(error.message)
 *   }
 * })
 *
 * // Fetch from specific channels
 * triggerFetch.mutate({ channelIds: [123, 456] }, {
 *   onSuccess: (data) => {
 *     setFetchId(data.fetch_id)
 *   }
 * })
 * ```
 */
export function useTriggerFetch() {
  const mutation = useMutation({
    mutationFn: (params?: { channelIds?: number[] }) => {
      const token = useAuthStore.getState().token
      if (!token) throw new Error('No authentication token')
      return messageService.triggerFetch(token, params?.channelIds)
    },
  })

  return {
    mutate: (
      params?: { channelIds?: number[] },
      callbacks?: {
        onSuccess?: (data: { fetchId: string; status: string; message?: string }) => void
        onError?: (error: Error) => void
      }
    ) => {
      mutation.mutate(params, {
        onSuccess: callbacks?.onSuccess,
        onError: (err) => callbacks?.onError?.(err as Error),
      })
    },
    isPending: mutation.isPending,
    isLoading: mutation.isPending,
    error: mutation.error as Error | null,
  }
}

