/**
 * SyncManager component
 *
 * Manages the fetch/sync lifecycle:
 * - Tracks active fetch ID and polling via useFetchStatus
 * - Shows BlockingOperationModal with progress/cancel
 * - Exposes sync state and callbacks to parent via props
 */

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BlockingOperationModal } from '../common/BlockingOperationModal'
import { useFetchStatus } from '../../hooks/useFetchStatus'
import { useCancelFetch } from '../../hooks/useCancelFetch'
import { useBlockingOperation } from '../../hooks/useBlockingOperation'
import { queryKeys } from '../../hooks/query-keys'

// Local storage key for last sync time per channel
const CHANNEL_SYNC_TIMES_KEY = 'feedub_channel_sync_times'

function getChannelSyncTimes(): Record<number, string> {
  try {
    const stored = localStorage.getItem(CHANNEL_SYNC_TIMES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveChannelSyncTimes(times: Record<number, string>): void {
  localStorage.setItem(CHANNEL_SYNC_TIMES_KEY, JSON.stringify(times))
}

export interface SyncManagerState {
  /** Whether a fetch is currently pending or in_progress */
  isFetchInProgress: boolean
  /** Whether auto-sync is active */
  isAutoSyncing: boolean
  /** The active fetch ID being tracked */
  activeFetchId: string | null
  /** Force reset flag for SyncButton */
  forceSyncButtonReset: boolean
  /** Current channel sync times (per channel ID) */
  channelSyncTimes: Record<number, string>
  /** Call when a fetch has been started externally */
  onFetchStarted: (fetchId: string) => void
  /** Call when SyncButton reset is complete */
  onSyncButtonResetComplete: () => void
  /** New messages available from fetch polling */
  newMessagesAvailable: number
  /** Acknowledge new messages */
  acknowledgeNewMessages: () => void
}

interface SyncManagerProps {
  /** Render prop exposing sync state to parent */
  children: (state: SyncManagerState) => React.ReactNode
}

export function SyncManager({ children }: SyncManagerProps) {
  const queryClient = useQueryClient()
  const [activeFetchId, setActiveFetchId] = useState<string | null>(null)
  const [isAutoSyncing, setIsAutoSyncing] = useState(false)
  const [forceSyncButtonReset, setForceSyncButtonReset] = useState(false)
  const [channelSyncTimes, setChannelSyncTimes] =
    useState<Record<number, string>>(getChannelSyncTimes)

  const blocking = useBlockingOperation()
  const { cancelFetch } = useCancelFetch()

  const {
    data: fetchStatusData,
    error: fetchStatusError,
    newMessagesAvailable,
    acknowledgeNewMessages,
  } = useFetchStatus(activeFetchId)

  // Trigger re-renders every minute so relative time strings update
  const [, setTimeUpdateTick] = useState(0)
  useEffect(() => {
    const hasAnySyncTimes = Object.keys(channelSyncTimes).length > 0
    if (!hasAnySyncTimes) return
    const interval = setInterval(() => {
      setTimeUpdateTick((n) => n + 1)
    }, 60000)
    return () => clearInterval(interval)
  }, [channelSyncTimes])

  // Update blocking modal progress from fetch status
  useEffect(() => {
    if (!fetchStatusData || !blocking.isBlocking) return

    const { status, currentPhase, totalChannels, completedChannels } = fetchStatusData

    if (totalChannels && totalChannels > 0) {
      const progress = Math.round(((completedChannels || 0) / totalChannels) * 100)
      blocking.setProgress(progress)
    }

    if (status === 'pending') {
      blocking.setStatusText('Preparing for sync...')
    } else if (status === 'in_progress') {
      if (currentPhase === 'processing_embeddings') {
        blocking.setStatusText('Processing messages for insights...')
      } else {
        blocking.setStatusText('Fetching messages...')
      }
    }
  }, [fetchStatusData, blocking])

  // Reset sync state when fetch completes or fails
  useEffect(() => {
    if (fetchStatusData?.status === 'completed') {
      if (isAutoSyncing) setIsAutoSyncing(false)
      setActiveFetchId(null)
      if (blocking.status === 'running') {
        const totalChannels = fetchStatusData.totalChannels || 0
        blocking.complete(
          `Fetch complete from ${totalChannels} channel${totalChannels !== 1 ? 's' : ''}!`
        )
        const syncTime = new Date().toISOString()
        const syncedChannelIds = fetchStatusData.channelIds || []
        if (syncedChannelIds.length > 0) {
          const updatedTimes = { ...channelSyncTimes }
          syncedChannelIds.forEach((channelId) => {
            updatedTimes[channelId] = syncTime
          })
          saveChannelSyncTimes(updatedTimes)
          setChannelSyncTimes(updatedTimes)
        }
        // Invalidate messages cache so MessagePane refetches automatically
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.all })
      }
    } else if (fetchStatusData?.status === 'failed') {
      if (isAutoSyncing) setIsAutoSyncing(false)
      setActiveFetchId(null)
      if (blocking.status === 'running') {
        blocking.fail(fetchStatusData.error || 'Sync failed')
      }
    } else if (fetchStatusData?.status === 'cancelled') {
      if (isAutoSyncing) setIsAutoSyncing(false)
      setActiveFetchId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally depend only on status to prevent duplicate triggers
  }, [fetchStatusData?.status])

  // Handle fetch status errors
  useEffect(() => {
    if (fetchStatusError && activeFetchId) {
      setActiveFetchId(null)
      if (isAutoSyncing) setIsAutoSyncing(false)
    }
  }, [fetchStatusError, activeFetchId, isAutoSyncing])

  const isFetchInProgress =
    fetchStatusData?.status === 'pending' || fetchStatusData?.status === 'in_progress'

  const onFetchStarted = useCallback(
    (fetchId: string) => {
      setActiveFetchId(fetchId)
      blocking.start({
        title: 'Syncing Messages',
        initialStatusText: 'Preparing for sync...',
        onCancel: async () => {
          await cancelFetch(fetchId)
        },
      })
    },
    [blocking, cancelFetch]
  )

  const onSyncButtonResetComplete = useCallback(() => {
    setForceSyncButtonReset(false)
  }, [])

  const handleBlockingDismiss = useCallback(() => {
    blocking.dismiss()
    setForceSyncButtonReset(true)
  }, [blocking])

  const state: SyncManagerState = {
    isFetchInProgress,
    isAutoSyncing,
    activeFetchId,
    forceSyncButtonReset,
    channelSyncTimes,
    onFetchStarted,
    onSyncButtonResetComplete,
    newMessagesAvailable,
    acknowledgeNewMessages,
  }

  return (
    <>
      {children(state)}

      <BlockingOperationModal
        isOpen={blocking.status !== 'idle'}
        title={blocking.title}
        status={blocking.status}
        progress={blocking.progress}
        statusText={blocking.statusText}
        error={blocking.error}
        onCancel={blocking.requestCancel}
        onDismiss={handleBlockingDismiss}
        cancelConfirmMessage="Are you sure you want to cancel? The sync operation will be stopped and any partially fetched messages may be incomplete."
      />
    </>
  )
}
