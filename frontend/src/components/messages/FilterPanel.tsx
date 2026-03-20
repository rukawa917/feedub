/**
 * FilterPanel component
 *
 * Manages channel selection state and renders the filter sidebar.
 * Owns: sessionSelectedChannelIds, hasExplicitChannelSelection
 * Communicates channel filter changes upward via onFiltersChange.
 */

import { useState, useEffect, useCallback } from 'react'
import { FilterSidebar } from './FilterSidebar'
import { SearchBar } from './SearchBar'
import { MessageFilters } from './MessageFilters'
import { useAvailableChannels } from '../../hooks/useAvailableChannels'
import { useChannelSelections } from '../../hooks/useChannelSelections'
import { useChannelFavorites } from '../../hooks/useChannelFavorites'
import { useTriggerFetch } from '../../hooks/useMessages'
import type { FilterState } from '../../types/filters'
import type { AvailableChannel } from '../../services/api/channels'

const SESSION_SELECTIONS_KEY = 'feedub_session_channel_selections'

export interface FilterPanelProps {
  isMobile: boolean
  isDrawerOpen: boolean
  onDrawerClose: () => void
  filters: FilterState
  onFiltersChange: (partial: Partial<FilterState>) => void
  /** Whether a sync is in progress (to disable sync trigger in sidebar) */
  isSyncing: boolean
  /** Channel sync times per channel ID */
  channelSyncTimes: Record<number, string>
  /** Called when a fetch is triggered from the sidebar */
  onFetchStarted: (fetchId: string) => void
  /** Expose selected channel IDs and hasExplicitChannelSelection to parent */
  onChannelStateChange: (state: {
    selectedChannelIds: number[]
    hasExplicitChannelSelection: boolean
  }) => void
}

export function FilterPanel({
  isMobile,
  isDrawerOpen,
  onDrawerClose,
  filters,
  onFiltersChange,
  isSyncing,
  channelSyncTimes,
  onFetchStarted,
  onChannelStateChange,
}: FilterPanelProps) {
  const {
    data: availableChannels,
    isLoading: isLoadingChannels,
    refetch: refetchChannels,
  } = useAvailableChannels()

  const { data: channelSelections, updateSelections } = useChannelSelections()
  const { favoriteIds, toggleFavorite, isToggling: isTogglingFavorite } = useChannelFavorites()
  const triggerFetch = useTriggerFetch()

  // Session-level channel selections
  const [sessionSelectedChannelIds, setSessionSelectedChannelIds] = useState<number[]>(() => {
    const stored = sessionStorage.getItem(SESSION_SELECTIONS_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  })

  const [hasExplicitChannelSelection, setHasExplicitChannelSelection] = useState(() => {
    return sessionStorage.getItem(SESSION_SELECTIONS_KEY) !== null
  })

  // Notify parent of channel state on mount
  useEffect(() => {
    onChannelStateChange({
      selectedChannelIds: sessionSelectedChannelIds,
      hasExplicitChannelSelection,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  // Sync filter state with session selections on mount
  useEffect(() => {
    if (hasExplicitChannelSelection && sessionSelectedChannelIds.length > 0) {
      onFiltersChange({
        advanced: {
          ...filters.advanced,
          chatIds: sessionSelectedChannelIds.map((id) => String(id)),
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  // Sync filter state with backend channel selections when they load
  useEffect(() => {
    if (!hasExplicitChannelSelection && channelSelections && channelSelections.length > 0) {
      onFiltersChange({
        advanced: {
          ...filters.advanced,
          chatIds: channelSelections.map((s) => String(s.channel_id)),
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasExplicitChannelSelection, channelSelections])

  // Fetch available channels on mount
  useEffect(() => {
    refetchChannels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  const handleSearch = (query: string) => {
    onFiltersChange({ searchQuery: query })
  }

  const handleFilterChange = (partialFilters: Partial<FilterState>) => {
    onFiltersChange(partialFilters)
  }

  const handleRefreshChannels = useCallback(() => {
    refetchChannels()
  }, [refetchChannels])

  const handleSidebarChannelSelectionChange = useCallback(
    (channelIds: number[]) => {
      setHasExplicitChannelSelection(true)
      sessionStorage.setItem(SESSION_SELECTIONS_KEY, JSON.stringify(channelIds))
      setSessionSelectedChannelIds(channelIds)
      onFiltersChange({
        advanced: {
          ...filters.advanced,
          chatIds: channelIds.map((id) => String(id)),
        },
      })
      onChannelStateChange({ selectedChannelIds: channelIds, hasExplicitChannelSelection: true })
    },
    [filters.advanced, onFiltersChange, onChannelStateChange]
  )

  const handleToggleFavorite = useCallback(
    async (channel: AvailableChannel) => {
      try {
        await toggleFavorite(channel.channel_id, {
          channel_id: channel.channel_id,
          channel_title: channel.title,
          channel_type: channel.type,
        })
      } catch (err) {
        console.error('[FilterPanel] Failed to toggle favorite:', err)
      }
    },
    [toggleFavorite]
  )

  const handleStartSync = useCallback(
    async (selectedChannels: AvailableChannel[]) => {
      try {
        await updateSelections({
          channels: selectedChannels.map((ch) => ({
            channel_id: ch.channel_id,
            channel_title: ch.title,
            channel_type: ch.type,
          })),
        })

        const channelIds = selectedChannels.map((ch) => ch.channel_id)
        triggerFetch.mutate(
          { channelIds },
          {
            onSuccess: (data) => {
              onFetchStarted(data.fetchId)
            },
            onError: (err) => {
              console.error('[FilterPanel] Failed to trigger fetch:', err)
              const errorMessage = err instanceof Error ? err.message : String(err)
              const fetchIdMatch = errorMessage.match(/fetch_id:\s*([a-f0-9-]+)/i)
              if (fetchIdMatch) {
                onFetchStarted(fetchIdMatch[1])
              }
            },
          }
        )
      } catch (err) {
        console.error('[FilterPanel] Failed to save channel selections:', err)
      }
    },
    [updateSelections, triggerFetch, onFetchStarted]
  )

  // Resolve selected channel IDs: session > DB
  const sidebarSelectedChannelIds = hasExplicitChannelSelection
    ? sessionSelectedChannelIds
    : (channelSelections?.map((s) => s.channel_id) ?? [])

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border">
        <SearchBar onSearch={handleSearch} initialValue={filters.searchQuery} isLoading={false} />
      </div>

      <MessageFilters
        filters={filters}
        onChange={handleFilterChange}
        availableChannels={availableChannels}
        selectedChannelIds={sidebarSelectedChannelIds}
        favoriteChannelIds={favoriteIds}
        channelSyncTimes={channelSyncTimes}
        maxChannels={null}
        isLoadingChannels={isLoadingChannels}
        isRefreshingChannels={isLoadingChannels}
        isSyncing={isSyncing}
        isTogglingFavorite={isTogglingFavorite}
        onRefreshChannels={handleRefreshChannels}
        onChannelSelectionChange={handleSidebarChannelSelectionChange}
        onStartSync={handleStartSync}
        onToggleFavorite={handleToggleFavorite}
      />
    </>
  )

  return (
    <FilterSidebar
      isMobile={isMobile}
      isDrawerOpen={isDrawerOpen}
      onDrawerClose={onDrawerClose}
      title="Filters"
    >
      {sidebarContent}
    </FilterSidebar>
  )
}
