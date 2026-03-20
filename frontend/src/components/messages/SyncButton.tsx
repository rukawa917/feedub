/**
 * SyncButton component
 * Compact button for syncing messages from Telegram
 * Shows spinning icon during sync, checkmark on completion
 */

import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Check } from 'lucide-react'
import { Button } from '../ui/button'
import { useTriggerFetch } from '../../hooks/useMessages'
import { useFetchStatus } from '../../hooks/useFetchStatus'

interface SyncButtonProps {
  /** Callback to refresh messages */
  onRefreshMessages?: () => void
  /** Callback when fetch starts, provides fetchId for tracking progress */
  onFetchStarted?: (fetchId: string) => void
  /** Disable the button externally */
  disabled?: boolean
  /** External auto-sync in progress (from Dashboard fresh login) */
  isAutoSyncing?: boolean
  /** Channel IDs to sync (if not provided, uses backend saved selections) */
  channelIds?: number[]
  /** Force reset the button state (e.g., when blocking modal is dismissed) */
  forceReset?: boolean
  /** Called when the button has been reset */
  onResetComplete?: () => void
}

type SyncState = 'idle' | 'syncing' | 'success'

export function SyncButton({
  onRefreshMessages,
  onFetchStarted,
  disabled,
  isAutoSyncing,
  channelIds,
  forceReset,
  onResetComplete,
}: SyncButtonProps) {
  const [fetchId, setFetchId] = useState<string | null>(null)
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const triggerFetch = useTriggerFetch()
  const { data: fetchStatus } = useFetchStatus(fetchId)

  // Use ref for timer to persist across renders
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // Track the last handled fetch ID to prevent duplicate handling
  const lastHandledFetchId = useRef<string | null>(null)

  // Handle fetch status changes
  useEffect(() => {
    // Only handle if we have a fetchId and haven't handled it yet
    if (fetchId && fetchStatus?.status === 'completed' && lastHandledFetchId.current !== fetchId) {
      lastHandledFetchId.current = fetchId
      setSyncState('success')
      onRefreshMessages?.()

      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      // Reset after 2 seconds
      timerRef.current = setTimeout(() => {
        setSyncState('idle')
        setFetchId(null)
      }, 2000)
    }

    if (fetchStatus?.status === 'failed') {
      setSyncState('idle')
      setFetchId(null)
      lastHandledFetchId.current = null
    }
  }, [fetchId, fetchStatus?.status, onRefreshMessages])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Handle force reset (e.g., when blocking modal is dismissed)
  useEffect(() => {
    if (forceReset) {
      // Clear any pending timers
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      // Reset all state
      setSyncState('idle')
      setFetchId(null)
      lastHandledFetchId.current = null
      // Notify parent that reset is complete
      onResetComplete?.()
    }
  }, [forceReset, onResetComplete])

  const handleClick = () => {
    // Reset tracking for new sync
    lastHandledFetchId.current = null
    setSyncState('syncing')

    // Pass channelIds if provided, otherwise backend uses saved selections
    const params = channelIds && channelIds.length > 0 ? { channelIds } : undefined
    triggerFetch.mutate(params, {
      onSuccess: (data) => {
        setFetchId(data.fetchId)
        onFetchStarted?.(data.fetchId)
      },
      onError: () => {
        setSyncState('idle')
      },
    })
  }

  const isSyncing =
    syncState === 'syncing' || (fetchId && fetchStatus?.status === 'in_progress') || isAutoSyncing
  const isSuccess = syncState === 'success'
  const isDisabled = disabled || isSyncing || isSuccess

  if (isSuccess) {
    return (
      <Button variant="secondary" size="sm" disabled className="gap-2 text-chat-private">
        <Check className="h-4 w-4" />
        Synced
      </Button>
    )
  }

  return (
    <Button
      variant="accent"
      size="sm"
      onClick={handleClick}
      disabled={isDisabled}
      className="gap-2"
    >
      {isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Sync
        </>
      )}
    </Button>
  )
}
