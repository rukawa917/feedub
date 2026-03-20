/**
 * T051: useFetchStatus hook
 * Polling for fetch operation status via React Query with refetchInterval.
 * Stops polling when status is 'completed', 'failed', or 'cancelled'.
 * Source: specs/003-minimal-frontend-webapp/contracts/messages-contract.md lines 156-191
 * Requirement: FR-008 (2-second polling interval)
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import * as messageService from '../services/message-service'
import type { FetchOperation, FetchStatusResponse } from '../types/message'
import { queryKeys } from './query-keys'

/** Map snake_case backend response to camelCase FetchOperation */
function selectFetchOperation(res: FetchStatusResponse): FetchOperation {
  return {
    id: res.fetch_id,
    userId: '',
    status: res.status,
    currentPhase: res.current_phase,
    messageCount: res.messages_count ?? 0,
    error: res.error_message,
    startedAt: res.started_at,
    completedAt: res.completed_at,
    totalChannels: res.total_channels,
    completedChannels: res.completed_channels,
    currentChannelTitle: res.current_channel_title,
    failedChannels: res.failed_channels,
    channelIds: res.channel_ids,
  }
}

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled'])

/**
 * Hook for polling fetch operation status
 * Polls every 2 seconds while status is pending or in_progress
 * Stops polling when status is completed or failed
 * Tracks new messages available since last refresh
 *
 * Usage:
 * ```typescript
 * const { data, isLoading, error, newMessagesAvailable, acknowledgeNewMessages } = useFetchStatus(fetchId)
 *
 * if (isLoading) return <LoadingSpinner />
 * if (error) return <ErrorMessage message={error.message} />
 * if (!data) return null
 *
 * return (
 *   <div>
 *     Status: {data.status}
 *     Messages: {data.messageCount}
 *     {newMessagesAvailable > 0 && (
 *       <button onClick={() => { acknowledgeNewMessages(); refreshMessages(); }}>
 *         {newMessagesAvailable} new messages
 *       </button>
 *     )}
 *   </div>
 * )
 * ```
 */
export function useFetchStatus(fetchId: string | null | undefined) {
  const token = useAuthStore((s) => s.token)
  const [acknowledgedCount, setAcknowledgedCount] = useState(0)

  // Reset acknowledged count when a new fetch starts
  useEffect(() => {
    if (fetchId) {
      setAcknowledgedCount(0)
    }
  }, [fetchId])

  const query = useQuery({
    queryKey: queryKeys.fetchStatus.byId(fetchId!),
    queryFn: () => messageService.getFetchStatus(token!, fetchId!),
    enabled: !!token && !!fetchId,
    select: selectFetchOperation,
    // Poll every 2 seconds while fetch is active; stop on terminal status
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 2000
      return TERMINAL_STATUSES.has(data.status) ? false : 2000
    },
    // Only show loading on initial fetch, subsequent polls are silent
    notifyOnChangeProps: ['data', 'error', 'status'],
  })

  const currentMessageCount = query.data?.messageCount ?? 0
  const newMessagesAvailable = Math.max(0, currentMessageCount - acknowledgedCount)

  const acknowledgeNewMessages = () => {
    setAcknowledgedCount(currentMessageCount)
  }

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    newMessagesAvailable,
    acknowledgeNewMessages,
  }
}
