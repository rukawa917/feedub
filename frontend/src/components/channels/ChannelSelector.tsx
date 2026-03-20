/**
 * ChannelSelector component
 * Allows users to select channels for message fetching
 */

import { useState, useEffect } from 'react'
import { RefreshCw, Check, Hash, Users, Calendar } from 'lucide-react'
import { Button } from '../ui/button'
import type { AvailableChannel } from '@/services/api/channels'

interface ChannelSelectorProps {
  /** Available channels from Telegram */
  availableChannels: AvailableChannel[] | null
  /** Currently selected channel IDs (from saved selections) */
  selectedChannelIds: number[]
  /** Loading state for available channels */
  isLoading: boolean
  /** Error state for available channels */
  error: Error | null
  /** Callback when "Refresh List" is clicked */
  onRefresh: () => void
  /** Callback when "Done - Start Sync" is clicked with selected channels */
  onDone: (selectedChannels: AvailableChannel[]) => void
  /** Is refresh currently in progress */
  isRefreshing?: boolean
}

export function ChannelSelector({
  availableChannels,
  selectedChannelIds,
  isLoading,
  error,
  onRefresh,
  onDone,
  isRefreshing = false,
}: ChannelSelectorProps) {
  // Local selection state (modified by checkboxes)
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<number>>(new Set(selectedChannelIds))

  // Sync local state when prop changes (e.g., after loading saved selections)
  useEffect(() => {
    setLocalSelectedIds(new Set(selectedChannelIds))
  }, [selectedChannelIds])

  const handleToggle = (channelId: number) => {
    setLocalSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(channelId)) {
        next.delete(channelId)
      } else {
        next.add(channelId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (!availableChannels) return
    setLocalSelectedIds(new Set(availableChannels.map((ch) => ch.channel_id)))
  }

  const handleClearAll = () => {
    setLocalSelectedIds(new Set())
  }

  const handleDone = () => {
    if (!availableChannels) return
    const selected = availableChannels.filter((ch) => localSelectedIds.has(ch.channel_id))
    onDone(selected)
  }

  const formatMemberCount = (count: number | null): string => {
    if (!count) return 'Unknown'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const formatLastMessageDate = (date: string | null): string => {
    if (!date) return 'No messages'
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  }

  const getChannelTypeBadge = (type: string): { label: string; color: string } => {
    switch (type) {
      case 'channel':
        return { label: 'Channel', color: 'bg-teal/10 text-teal border-teal/20' }
      case 'supergroup':
        return { label: 'Supergroup', color: 'bg-primary/10 text-primary border-primary/20' }
      case 'group':
        return { label: 'Group', color: 'bg-chat-group/10 text-chat-group border-chat-group/20' }
      default:
        return { label: type || 'Chat', color: 'bg-muted/10 text-muted-foreground border-muted/20' }
    }
  }

  return (
    <div className="gradient-border animate-fade-in-up mb-6">
      <div className="relative rounded-xl bg-card">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center">
              <Hash className="w-4 h-4 text-teal" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Select Channels to Sync</h2>
              <p className="text-sm text-foreground-muted">
                Choose which channels to fetch messages from
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                <p className="text-sm text-foreground-muted">Loading channels from Telegram...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4"
              role="alert"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">✗</span>
                <p className="text-sm text-destructive font-medium">Failed to load channels</p>
              </div>
              <p className="text-sm text-destructive/80 mt-2">{error.message}</p>
              <Button variant="destructive" size="sm" onClick={onRefresh} className="mt-3">
                Retry
              </Button>
            </div>
          )}

          {/* Channel list */}
          {!isLoading && !error && availableChannels && (
            <>
              {/* Bulk actions */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-foreground-muted">
                  {localSelectedIds.size} of {availableChannels.length} selected
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-primary hover:text-primary/80 font-semibold"
                  >
                    Select all
                  </button>
                  {localSelectedIds.size > 0 && (
                    <>
                      <span className="text-xs text-foreground-muted">•</span>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs text-primary hover:text-primary/80 font-semibold"
                      >
                        Clear all
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Channel cards */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableChannels.length === 0 ? (
                  <div className="text-center py-8 text-foreground-muted">
                    <Hash className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No channels found</p>
                    <p className="text-xs mt-1">Join some channels in Telegram first</p>
                  </div>
                ) : (
                  availableChannels.map((channel) => {
                    const isSelected = localSelectedIds.has(channel.channel_id)
                    const typeBadge = getChannelTypeBadge(channel.type)

                    return (
                      <label
                        key={channel.channel_id}
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/5 hover:bg-primary/10'
                            : 'border-border bg-secondary hover:bg-accent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggle(channel.channel_id)}
                          className="w-4 h-4 mt-0.5 text-primary bg-input border-border rounded focus:ring-2 focus:ring-primary accent-primary"
                        />

                        <div className="flex-1 min-w-0">
                          {/* Channel name and type */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-foreground truncate">
                              {channel.title}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md border ${typeBadge.color}`}
                            >
                              {typeBadge.label}
                            </span>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-foreground-muted">
                            {channel.member_count && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{formatMemberCount(channel.member_count)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatLastMessageDate(channel.last_message_date)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Selected indicator */}
                        {isSelected && (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </label>
                    )
                  })
                )}
              </div>

              {/* Action button */}
              {availableChannels.length > 0 && (
                <div className="flex items-center justify-end mt-6 pt-4 border-t border-border">
                  <Button
                    variant="accent"
                    onClick={handleDone}
                    disabled={localSelectedIds.size === 0}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Done - Start Sync ({localSelectedIds.size})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
