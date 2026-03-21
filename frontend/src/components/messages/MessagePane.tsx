/**
 * MessagePane component
 *
 * Renders the main message content area including:
 * - Header with message count, sync button, and export button
 * - Message list with pagination
 * - Onboarding guide when no channels selected
 * - New messages badge during active fetch
 * - AI Insights navigation
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Sparkles } from 'lucide-react'
import { MessageList } from './MessageList'
import { OnboardingGuide } from './OnboardingGuide'
import { NewMessagesBadge } from './NewMessagesBadge'
import { SyncButton } from './SyncButton'
import { ExportButton } from './ExportButton'
import {
  useServerFilteredMessages,
  convertFiltersToApiParams,
} from '../../hooks/useServerFilteredMessages'
import { getMessageIds } from '../../services/message-service'
import { useAuthStore } from '../../stores/auth'
import type { FilterState, InsightsLocationState } from '../../types/filters'
import type { Message } from '../../types/message'
import type { AvailableChannel } from '../../services/api/channels'
import { useLlmEnabled } from '../../hooks/useLlmEnabled'

/** Extract date range from messages for display */
function getMessageDateRange(messages: Message[]) {
  if (messages.length === 0) return undefined
  const sorted = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return {
    start: formatLocalDate(new Date(sorted[0].timestamp)),
    end: formatLocalDate(new Date(sorted[sorted.length - 1].timestamp)),
  }
}

/** Get unique channel titles from messages */
function getChannelTitles(messages: Message[], channels: AvailableChannel[] | undefined) {
  if (!channels) return []
  const chatIds = new Set(messages.map((m) => m.chat.telegramChatId))
  return channels.filter((ch) => chatIds.has(ch.channel_id)).map((ch) => ch.title)
}

export interface MessagePaneProps {
  filters: FilterState
  hasExplicitChannelSelection: boolean
  selectedChannelIds: number[]
  isMobile: boolean
  onOpenFilters: () => void
  /** Sync state from SyncManager */
  isFetchInProgress: boolean
  isAutoSyncing: boolean
  forceSyncButtonReset: boolean
  onSyncButtonResetComplete: () => void
  onFetchStarted: (fetchId: string) => void
  newMessagesAvailable: number
  onAcknowledgeNewMessages: () => void
  /** Available channels (for insights metadata) */
  availableChannels: AvailableChannel[] | null
}

export function MessagePane({
  filters,
  hasExplicitChannelSelection,
  selectedChannelIds,
  isMobile,
  onOpenFilters,
  isFetchInProgress,
  isAutoSyncing,
  forceSyncButtonReset,
  onSyncButtonResetComplete,
  onFetchStarted,
  newMessagesAvailable,
  onAcknowledgeNewMessages,
  availableChannels,
}: MessagePaneProps) {
  const navigate = useNavigate()
  const llmEnabled = useLlmEnabled()
  const [isFetchingAllIds, setIsFetchingAllIds] = useState(false)

  const {
    messages,
    pagination,
    loadMore,
    isLoading,
    isLoadingMore,
    error,
    totalFiltered,
    refetch: refetchMessages,
  } = useServerFilteredMessages({ filters, hasExplicitChannelSelection })

  const handleMessageClick = (message: Message) => {
    navigate(`/messages/${message.id}`)
  }

  const handleRefreshMessages = useCallback(() => {
    refetchMessages()
  }, [refetchMessages])

  const handleNewMessagesClick = useCallback(() => {
    onAcknowledgeNewMessages()
    refetchMessages()
  }, [onAcknowledgeNewMessages, refetchMessages])

  const handleInsightsClick = async () => {
    if (totalFiltered <= messages.length) {
      const state: InsightsLocationState = {
        messageIds: messages.map((m) => m.id),
        dateRange: getMessageDateRange(messages),
        channelTitles: getChannelTitles(messages, availableChannels ?? undefined),
      }
      navigate('/insights', { state })
      return
    }

    setIsFetchingAllIds(true)
    try {
      const token = useAuthStore.getState().token
      if (!token) {
        console.error('No auth token available')
        return
      }
      const apiParams = convertFiltersToApiParams(filters)
      const response = await getMessageIds(token, apiParams)
      const state: InsightsLocationState = {
        messageIds: response.ids,
        dateRange: getMessageDateRange(messages),
        channelTitles: getChannelTitles(messages, availableChannels ?? undefined),
      }
      navigate('/insights', { state })
    } catch (err) {
      console.error('Failed to fetch message IDs:', err)
      const state: InsightsLocationState = {
        messageIds: messages.map((m) => m.id),
        dateRange: getMessageDateRange(messages),
        channelTitles: getChannelTitles(messages, availableChannels ?? undefined),
      }
      navigate('/insights', { state })
    } finally {
      setIsFetchingAllIds(false)
    }
  }

  return (
    <div className="gradient-border animate-fade-in-up">
      <div className="relative rounded-xl bg-card">
        {/* Header with count and actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Messages</h2>
              <p className="text-sm text-foreground-muted">
                {totalFiltered.toLocaleString()} total
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Insights button (hidden when LLM is disabled) */}
            {llmEnabled && (
              <button
                onClick={handleInsightsClick}
                disabled={messages.length === 0 || isFetchingAllIds}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="AI Insights"
              >
                {isFetchingAllIds ? (
                  <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                <span className="hidden sm:inline text-sm font-medium text-primary">
                  {isFetchingAllIds
                    ? 'Loading...'
                    : totalFiltered > 0
                      ? `Analyze ${totalFiltered.toLocaleString()}`
                      : 'Insights'}
                </span>
              </button>
            )}

            <SyncButton
              onRefreshMessages={handleRefreshMessages}
              onFetchStarted={onFetchStarted}
              isAutoSyncing={isAutoSyncing || isFetchInProgress}
              channelIds={selectedChannelIds}
              forceReset={forceSyncButtonReset}
              onResetComplete={onSyncButtonResetComplete}
            />
            <ExportButton filters={filters} totalCount={totalFiltered} />
          </div>
        </div>

        {/* Messages list */}
        <div className="p-4 sm:p-6">
          {error && (
            <div
              className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 mb-4"
              role="alert"
            >
              <p className="text-sm text-destructive">Failed to load messages. Please try again.</p>
            </div>
          )}

          {newMessagesAvailable > 0 && (
            <NewMessagesBadge
              count={newMessagesAvailable}
              onClick={handleNewMessagesClick}
              className="mb-4"
            />
          )}

          {messages.length === 0 && !isLoading && selectedChannelIds.length === 0 ? (
            <OnboardingGuide isMobile={isMobile} onOpenFilters={onOpenFilters} />
          ) : (
            <MessageList
              messages={messages}
              pagination={pagination}
              onLoadMore={loadMore}
              onMessageClick={handleMessageClick}
              isLoading={isLoading || isLoadingMore}
              loadingState={isLoading ? 'loading' : isLoadingMore ? 'loadingMore' : 'idle'}
              emptyMessage={
                selectedChannelIds.length > 0
                  ? 'No messages found in selected channels'
                  : 'No messages found'
              }
              emptyAction={
                messages.length === 0 &&
                selectedChannelIds.length > 0 && (
                  <SyncButton
                    onRefreshMessages={handleRefreshMessages}
                    onFetchStarted={onFetchStarted}
                    isAutoSyncing={isAutoSyncing || isFetchInProgress}
                    channelIds={selectedChannelIds}
                    forceReset={forceSyncButtonReset}
                    onResetComplete={onSyncButtonResetComplete}
                  />
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
