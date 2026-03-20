/**
 * MessageFilters component (Simplified)
 *
 * Orchestrates filter components within FilterSidebar:
 * - DateRangePicker (top-level, always visible)
 * - ChannelFilter (channel selection)
 */

import { Calendar } from 'lucide-react'
import { DateRangePicker } from './DateRangePicker'
import { ChannelFilter } from '../channels/ChannelFilter'
import type { FilterState } from '../../types/filters'
import type { AvailableChannel } from '../../services/api/channels'

interface MessageFiltersProps {
  /** Current filter state */
  filters: FilterState

  /** Callback when filters change */
  onChange: (filters: Partial<FilterState>) => void

  /** Available channels for filtering */
  availableChannels: AvailableChannel[] | null

  /** Currently selected channel IDs */
  selectedChannelIds: number[]

  /** Set of favorite channel IDs */
  favoriteChannelIds: Set<number>

  /** Per-channel last sync times (channel_id -> ISO timestamp) */
  channelSyncTimes?: Record<number, string>

  /** Loading state for channels */
  isLoadingChannels: boolean

  /** Whether channels are being refreshed */
  isRefreshingChannels: boolean

  /** Whether sync is in progress */
  isSyncing?: boolean

  /** Whether a favorite toggle is in progress */
  isTogglingFavorite?: boolean

  /** Max channels allowed by the user's plan (null = unlimited) */
  maxChannels?: number | null

  /** Callback to refresh channel list */
  onRefreshChannels: () => void

  /** Callback when channel selection changes */
  onChannelSelectionChange: (channelIds: number[]) => void

  /** Callback when user clicks Done to start sync */
  onStartSync?: (selectedChannels: AvailableChannel[]) => void

  /** Callback to toggle a channel's favorite status */
  onToggleFavorite?: (channel: AvailableChannel) => void
}

/**
 * MessageFilters component
 *
 * Simplified filter orchestration:
 * - DateRangePicker (top-level with header)
 * - ChannelFilter (channel selection with color coding)
 */
export function MessageFilters({
  filters,
  onChange,
  availableChannels,
  selectedChannelIds,
  favoriteChannelIds,
  channelSyncTimes,
  isLoadingChannels,
  isRefreshingChannels,
  isSyncing,
  isTogglingFavorite,
  maxChannels,
  onRefreshChannels,
  onChannelSelectionChange,
  onStartSync,
  onToggleFavorite,
}: MessageFiltersProps) {
  // Date range change
  // Parse date strings as local time (not UTC) to avoid timezone issues
  const parseLocalDate = (dateStr: string, isEndOfDay: boolean = false): Date => {
    const [year, month, day] = dateStr.split('-').map(Number)
    if (isEndOfDay) {
      return new Date(year, month - 1, day, 23, 59, 59, 999)
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0)
  }

  const handleDateRangeChange = (startDate: string | null, endDate: string | null) => {
    onChange({
      advanced: {
        ...filters.advanced,
        dateRange:
          startDate || endDate
            ? {
                startDate: startDate ? parseLocalDate(startDate, false) : null,
                endDate: endDate ? parseLocalDate(endDate, true) : null,
              }
            : null,
      },
    })
  }

  // Convert date range to local date strings for DateRangePicker (YYYY-MM-DD format)
  // Must use local date components, not toISOString() which converts to UTC
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const startDateISO = filters.advanced.dateRange?.startDate
    ? formatLocalDate(filters.advanced.dateRange.startDate)
    : null
  const endDateISO = filters.advanced.dateRange?.endDate
    ? formatLocalDate(filters.advanced.dateRange.endDate)
    : null

  return (
    <>
      {/* Date Range - Top-level with header */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-foreground mb-3">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-semibold">Date Range</span>
        </div>
        <DateRangePicker
          startDate={startDateISO}
          endDate={endDateISO}
          onChange={handleDateRangeChange}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Channel Filter */}
      <ChannelFilter
        availableChannels={availableChannels}
        selectedChannelIds={selectedChannelIds}
        favoriteChannelIds={favoriteChannelIds}
        channelSyncTimes={channelSyncTimes}
        maxChannels={maxChannels}
        isLoading={isLoadingChannels}
        isRefreshing={isRefreshingChannels}
        isSyncing={isSyncing}
        isTogglingFavorite={isTogglingFavorite}
        onRefresh={onRefreshChannels}
        onSelectionChange={onChannelSelectionChange}
        onStartSync={onStartSync}
        onToggleFavorite={onToggleFavorite}
      />
    </>
  )
}
