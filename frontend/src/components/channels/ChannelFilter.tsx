/**
 * ChannelFilter component
 * Sidebar filter for selecting which Telegram channels to include in message display.
 * Only shows channels (excludes private, group, supergroup types).
 *
 * Features:
 * - Favorites section at the top (persisted across sessions)
 * - Star icon to toggle favorites
 * - Search and bulk selection
 */

import { useState, useMemo } from 'react'
import { Hash, RefreshCw, Check, Search, X, Star } from 'lucide-react'
import { getChannelColor } from '../../utils/channel-colors'
import type { AvailableChannel } from '../../services/api/channels'

/**
 * Format a date as relative time (e.g., "5m ago", "2h ago")
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) {
    return 'now'
  } else if (diffMin < 60) {
    return `${diffMin}m ago`
  } else if (diffHour < 24) {
    return `${diffHour}h ago`
  } else if (diffDay < 7) {
    return `${diffDay}d ago`
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
}

interface ChannelFilterProps {
  /** Available channels from Telegram */
  availableChannels: AvailableChannel[] | null
  /** Currently selected channel IDs */
  selectedChannelIds: number[]
  /** Set of favorite channel IDs */
  favoriteChannelIds: Set<number>
  /** Per-channel last sync times (channel_id -> ISO timestamp) */
  channelSyncTimes?: Record<number, string>
  /** Max channels allowed by the user's plan (null = unlimited) */
  maxChannels?: number | null
  /** Loading state for channel list */
  isLoading: boolean
  /** Whether channels are being refreshed */
  isRefreshing: boolean
  /** Whether sync is in progress */
  isSyncing?: boolean
  /** Whether a favorite toggle is in progress */
  isTogglingFavorite?: boolean
  /** Callback to refresh channel list */
  onRefresh: () => void
  /** Callback when selection changes */
  onSelectionChange: (channelIds: number[]) => void
  /** Callback when user clicks Done to start sync */
  onStartSync?: (selectedChannels: AvailableChannel[]) => void
  /** Callback to toggle a channel's favorite status */
  onToggleFavorite?: (channel: AvailableChannel) => void
}

export function ChannelFilter({
  availableChannels,
  selectedChannelIds,
  favoriteChannelIds,
  channelSyncTimes = {},
  maxChannels,
  isLoading,
  isRefreshing,
  isSyncing = false,
  isTogglingFavorite = false,
  onRefresh,
  onSelectionChange,
  onStartSync,
  onToggleFavorite,
}: ChannelFilterProps) {
  // Search query state
  const [searchQuery, setSearchQuery] = useState('')

  // Channel limit enforcement
  const hasLimit = maxChannels != null
  const isAtLimit = hasLimit && selectedChannelIds.length >= maxChannels

  // Filter to only show channels (exclude private, group, supergroup)
  const channels = useMemo(() => {
    return availableChannels?.filter((c) => c.type === 'channel') ?? []
  }, [availableChannels])

  // Separate favorites and non-favorites
  const { favoriteChannels, nonFavoriteChannels } = useMemo(() => {
    const favs: AvailableChannel[] = []
    const nonFavs: AvailableChannel[] = []

    for (const channel of channels) {
      if (favoriteChannelIds.has(channel.channel_id)) {
        favs.push(channel)
      } else {
        nonFavs.push(channel)
      }
    }

    return { favoriteChannels: favs, nonFavoriteChannels: nonFavs }
  }, [channels, favoriteChannelIds])

  // Filter channels by search query
  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favoriteChannels
    const query = searchQuery.toLowerCase()
    return favoriteChannels.filter((c) => c.title.toLowerCase().includes(query))
  }, [favoriteChannels, searchQuery])

  const filteredNonFavorites = useMemo(() => {
    if (!searchQuery.trim()) return nonFavoriteChannels
    const query = searchQuery.toLowerCase()
    return nonFavoriteChannels.filter((c) => c.title.toLowerCase().includes(query))
  }, [nonFavoriteChannels, searchQuery])

  // Get selected channel objects for pills display
  const selectedChannels = useMemo(() => {
    return channels.filter((c) => selectedChannelIds.includes(c.channel_id))
  }, [channels, selectedChannelIds])

  const handleToggle = (channelId: number) => {
    if (selectedChannelIds.includes(channelId)) {
      onSelectionChange(selectedChannelIds.filter((id) => id !== channelId))
    } else {
      if (isAtLimit) return
      onSelectionChange([...selectedChannelIds, channelId])
    }
  }

  const handleRemoveSelected = (channelId: number) => {
    onSelectionChange(selectedChannelIds.filter((id) => id !== channelId))
  }

  const handleSelectAll = () => {
    // Select all visible channels (favorites + non-favorites after search filter)
    const allVisibleIds = [...filteredFavorites, ...filteredNonFavorites].map((c) => c.channel_id)
    let newSelection = [...new Set([...selectedChannelIds, ...allVisibleIds])]
    if (hasLimit) {
      newSelection = newSelection.slice(0, maxChannels)
    }
    onSelectionChange(newSelection)
  }

  const handleDeselectAll = () => {
    onSelectionChange([])
  }

  const handleSelectAllFavorites = () => {
    const allFavIds = favoriteChannels.map((c) => c.channel_id)
    let newSelection = [...new Set([...selectedChannelIds, ...allFavIds])]
    if (hasLimit) {
      newSelection = newSelection.slice(0, maxChannels)
    }
    onSelectionChange(newSelection)
  }

  // Count how many of the visible channels are selected
  const selectedCount = channels.filter((c) => selectedChannelIds.includes(c.channel_id)).length

  // Get the selected channel objects for onStartSync callback
  const handleStartSync = () => {
    if (onStartSync) {
      const selectedChannelsList = channels.filter((c) => selectedChannelIds.includes(c.channel_id))
      onStartSync(selectedChannelsList)
    }
  }

  // Render a channel item (used in both favorites and regular list)
  const renderChannelItem = (channel: AvailableChannel, isFavorite: boolean) => {
    const isSelected = selectedChannelIds.includes(channel.channel_id)
    const isDisabled = !isSelected && isAtLimit
    const color = getChannelColor(String(channel.channel_id))
    const lastSyncTime = channelSyncTimes[channel.channel_id]

    return (
      <div
        key={channel.channel_id}
        className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
          isSelected
            ? 'bg-primary/5 hover:bg-primary/10'
            : isDisabled
              ? 'opacity-50'
              : 'hover:bg-accent'
        }`}
      >
        {/* Custom checkbox */}
        <label
          className={`flex items-center gap-2.5 flex-1 min-w-0 group ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="relative shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => handleToggle(channel.channel_id)}
              className="sr-only peer"
            />
            <div
              role="checkbox"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              aria-label={`Select ${channel.title}`}
              className={`w-4 h-4 rounded border-2 transition-all duration-150 flex items-center justify-center ${
                isSelected
                  ? 'bg-primary border-primary'
                  : isDisabled
                    ? 'border-foreground-muted/20 bg-muted/30'
                    : 'border-foreground-muted/40 group-hover:border-foreground-muted/60'
              }`}
            >
              {isSelected && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
            </div>
          </div>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${color.bg}`}
            title="Channel color indicator"
          />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground truncate block max-w-[140px]">
              {channel.title}
            </span>
            {lastSyncTime && (
              <span className="text-[10px] text-foreground-muted">
                synced {formatRelativeTime(lastSyncTime)}
              </span>
            )}
          </div>
        </label>

        {/* Favorite star button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(channel)
            }}
            disabled={isTogglingFavorite}
            aria-pressed={isFavorite}
            className={`p-1 rounded transition-colors cursor-pointer active:scale-90 ${
              isFavorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-foreground-muted hover:text-yellow-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Hash className="h-4 w-4" />
          <span className="text-sm font-semibold">Channels</span>
          {selectedCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {selectedCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          title="Refresh channel list"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-foreground-muted ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Selected channels as pills */}
      {selectedChannels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedChannels.map((channel) => {
            const color = getChannelColor(String(channel.channel_id))
            const isFav = favoriteChannelIds.has(channel.channel_id)
            return (
              <span
                key={channel.channel_id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text} border ${color.border}`}
              >
                {isFav && <Star className="h-2.5 w-2.5 fill-current" />}
                <span className="max-w-[100px] truncate">{channel.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSelected(channel.channel_id)}
                  className="hover:opacity-70 transition-opacity cursor-pointer active:scale-90"
                  title={`Remove ${channel.title}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Search bar */}
      {channels.length > 5 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-foreground-muted"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Bulk actions */}
      {channels.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {favoriteChannels.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleSelectAllFavorites}
                className="text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
              >
                <Star className="h-3 w-3 fill-current" />
                Select favorites
              </button>
              <span className="text-foreground-muted">|</span>
            </>
          )}
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={selectedCount === channels.length}
            className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select all
          </button>
          <span className="text-foreground-muted">|</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={selectedCount === 0}
            className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Deselect all
          </button>
        </div>
      )}

      {/* Channel lists */}
      <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-thin">
        {isLoading ? (
          <div className="text-sm text-foreground-muted py-2">Loading channels...</div>
        ) : channels.length === 0 ? (
          <div className="text-sm text-foreground-muted py-2">
            {availableChannels === null ? 'Click refresh to load channels' : 'No channels found'}
          </div>
        ) : filteredFavorites.length === 0 && filteredNonFavorites.length === 0 ? (
          <div className="text-sm text-foreground-muted py-2">
            No channels match &quot;{searchQuery}&quot;
          </div>
        ) : (
          <>
            {/* Favorites section */}
            {filteredFavorites.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                  <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Favorites
                  </span>
                  <span className="text-xs text-foreground-muted">
                    ({filteredFavorites.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {filteredFavorites.map((channel) => renderChannelItem(channel, true))}
                </div>
              </div>
            )}

            {/* All channels section (excluding favorites shown above) */}
            {filteredNonFavorites.length > 0 && (
              <div>
                {filteredFavorites.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 px-1 pt-2 border-t border-border">
                    <Hash className="h-3.5 w-3.5 text-foreground-muted" />
                    <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                      All Channels
                    </span>
                    <span className="text-xs text-foreground-muted">
                      ({filteredNonFavorites.length})
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  {filteredNonFavorites.map((channel) => renderChannelItem(channel, false))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selection count */}
      {channels.length > 0 && (
        <p className="text-xs text-foreground-muted">
          {selectedCount} of {hasLimit ? maxChannels : channels.length} channel
          {(hasLimit ? maxChannels : channels.length) !== 1 ? 's' : ''} selected
          {hasLimit && ` (${maxChannels} max)`}
        </p>
      )}

      {/* Done button - Start Sync */}
      {onStartSync && channels.length > 0 && (
        <button
          type="button"
          onClick={handleStartSync}
          disabled={selectedCount === 0 || isSyncing}
          aria-busy={isSyncing}
          className="w-full mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Done - Start Sync ({selectedCount})
            </>
          )}
        </button>
      )}
    </div>
  )
}
