/**
 * Hook for cancelling an in-progress fetch operation
 */

import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import * as messageService from '../services/message-service'

export interface UseCancelFetchReturn {
  cancelFetch: (fetchId: string) => Promise<void>
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to cancel an in-progress fetch operation
 *
 * Provides a function to cancel a fetch and rollback changes.
 *
 * @returns cancelFetch function, loading state, and error
 *
 * @example
 * ```tsx
 * const { cancelFetch, isLoading: isCancelling } = useCancelFetch()
 *
 * const handleCancel = async () => {
 *   try {
 *     await cancelFetch(fetchId)
 *     // Fetch cancelled successfully
 *   } catch (err) {
 *     // Handle error
 *   }
 * }
 *
 * return (
 *   <button onClick={handleCancel} disabled={isCancelling}>
 *     {isCancelling ? 'Cancelling...' : 'Cancel Fetch'}
 *   </button>
 * )
 * ```
 */
export function useCancelFetch(): UseCancelFetchReturn {
  const mutation = useMutation({
    mutationFn: (fetchId: string) => {
      const token = useAuthStore.getState().token
      if (!token) throw new Error('No authentication token')
      return messageService.cancelFetch(token, fetchId)
    },
  })

  const cancelFetch = async (fetchId: string): Promise<void> => {
    await mutation.mutateAsync(fetchId)
  }

  return {
    cancelFetch,
    isLoading: mutation.isPending,
    error: mutation.error as Error | null,
  }
}
