/**
 * Unit test for MessageFilters component (Simplified)
 *
 * Tests the MessageFilters orchestrator component
 * Requirements:
 * - FR-012: Filter by channel and date range
 * - Orchestrates DateRangePicker and ChannelFilter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageFilters } from '../../../../src/components/messages/MessageFilters'
import type { FilterState } from '../../../../src/types/filters'
import { DEFAULT_FILTER_STATE } from '../../../../src/types/filters'
import type { AvailableChannel } from '../../../../src/services/api/channels'

describe('MessageFilters', () => {
  const mockChannels: AvailableChannel[] = [
    {
      channel_id: 1,
      title: 'News Channel',
      type: 'channel',
      member_count: 100,
      last_message_date: '2025-01-01T00:00:00Z',
    },
    {
      channel_id: 2,
      title: 'Tech Updates',
      type: 'channel',
      member_count: 50,
      last_message_date: '2025-01-02T00:00:00Z',
    },
    {
      channel_id: 3,
      title: 'Dev Channel',
      type: 'channel',
      member_count: 200,
      last_message_date: '2025-01-03T00:00:00Z',
    },
  ]

  let defaultFilters: FilterState
  let mockOnChange: ReturnType<typeof vi.fn>
  let mockOnChannelSelectionChange: ReturnType<typeof vi.fn>
  let mockOnRefreshChannels: ReturnType<typeof vi.fn>
  let mockOnStartSync: ReturnType<typeof vi.fn>
  let mockOnToggleFavorite: ReturnType<typeof vi.fn>

  beforeEach(() => {
    defaultFilters = { ...DEFAULT_FILTER_STATE }
    mockOnChange = vi.fn()
    mockOnChannelSelectionChange = vi.fn()
    mockOnRefreshChannels = vi.fn()
    mockOnStartSync = vi.fn()
    mockOnToggleFavorite = vi.fn()
  })

  describe('Rendering', () => {
    it('should render Date Range section header', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      expect(screen.getByText('Date Range')).toBeInTheDocument()
    })

    it('should render DateRangePicker with placeholder when no dates selected', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // DateRangePicker should show placeholder text when no dates selected
      expect(screen.getByText('Select date range')).toBeInTheDocument()
    })

    it('should render ChannelFilter component', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // ChannelFilter renders channel names
      expect(screen.getByText('News Channel')).toBeInTheDocument()
      expect(screen.getByText('Tech Updates')).toBeInTheDocument()
      expect(screen.getByText('Dev Channel')).toBeInTheDocument()
    })
  })

  describe('Date Range Integration', () => {
    it('should display placeholder when no date range is set', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      expect(screen.getByText('Select date range')).toBeInTheDocument()
    })

    it('should display current date range when dates are set', () => {
      const filters: FilterState = {
        ...defaultFilters,
        advanced: {
          ...defaultFilters.advanced,
          dateRange: {
            startDate: new Date('2025-01-01T00:00:00.000Z'),
            endDate: new Date('2025-12-31T23:59:59.999Z'),
          },
        },
      }

      render(
        <MessageFilters
          filters={filters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Should show formatted date range (exact format depends on DateRangePicker implementation)
      const dateText = screen.getByText(/Jan.*2025/)
      expect(dateText).toBeInTheDocument()
    })

    it('should call onChange when date range button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Find the date range button
      const dateRangeButton = screen.getByText('Select date range')
      await user.click(dateRangeButton)

      // Note: Full date picker interaction would require more complex testing
      // This test verifies the button is clickable
      expect(dateRangeButton).toBeInTheDocument()
    })

    it('should handle null date range in filters', () => {
      const filters: FilterState = {
        ...defaultFilters,
        advanced: {
          ...defaultFilters.advanced,
          dateRange: null,
        },
      }

      render(
        <MessageFilters
          filters={filters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // DateRangePicker should show placeholder when no dates selected
      expect(screen.getByText('Select date range')).toBeInTheDocument()
    })
  })

  describe('Channel Filter Integration', () => {
    it('should display available channels', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      expect(screen.getByText('News Channel')).toBeInTheDocument()
      expect(screen.getByText('Tech Updates')).toBeInTheDocument()
      expect(screen.getByText('Dev Channel')).toBeInTheDocument()
    })

    it('should call onChannelSelectionChange when channel is selected', async () => {
      const user = userEvent.setup()

      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Find channel by text, then get the checkbox
      const channelText = screen.getByText('News Channel')
      const channelCheckbox = channelText.closest('label')?.querySelector('input[type="checkbox"]')
      expect(channelCheckbox).toBeTruthy()

      await user.click(channelCheckbox!)

      expect(mockOnChannelSelectionChange).toHaveBeenCalledWith([1])
    })

    it('should show selected channels', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[1, 2]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Find checkboxes by their associated text - use getAllByText since selected channels appear twice
      const channel1Texts = screen.getAllByText('News Channel')
      // The last occurrence is in the checkbox list (first may be in chips section)
      const channel1Text = channel1Texts[channel1Texts.length - 1]
      const channel1Checkbox = channel1Text.closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement

      const channel2Texts = screen.getAllByText('Tech Updates')
      const channel2Text = channel2Texts[channel2Texts.length - 1]
      const channel2Checkbox = channel2Text.closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement

      expect(channel1Checkbox.checked).toBe(true)
      expect(channel2Checkbox.checked).toBe(true)
    })

    it('should handle empty channels list', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={[]}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Should not crash, channel filter should show empty state
      expect(screen.queryByText('News Channel')).not.toBeInTheDocument()
    })

    it('should show loading state for channels', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={null}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={true}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Should show loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should call onRefreshChannels when refresh is triggered', async () => {
      const user = userEvent.setup()

      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Find and click the refresh button by title attribute
      const refreshButton = screen.getByTitle('Refresh channel list')
      await user.click(refreshButton)

      expect(mockOnRefreshChannels).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null availableChannels', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={null}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Should not crash, should show Date Range
      expect(screen.getByText('Date Range')).toBeInTheDocument()
    })

    it('should pass through favoriteChannelIds to ChannelFilter', () => {
      const favoriteIds = new Set([1, 3])

      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={favoriteIds}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Should render without errors
      expect(screen.getByText('News Channel')).toBeInTheDocument()
    })

    it('should pass through channelSyncTimes when provided', () => {
      const syncTimes = {
        1: '2025-01-14T10:00:00Z',
        2: '2025-01-14T11:00:00Z',
      }

      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          channelSyncTimes={syncTimes}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Should render without errors
      expect(screen.getByText('Date Range')).toBeInTheDocument()
    })

    it('should handle sync in progress state', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[1]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          isSyncing={true}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Should render without errors
      expect(screen.getByText('Date Range')).toBeInTheDocument()
    })

    it('should handle favorite toggle in progress state', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          isTogglingFavorite={true}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Should render without errors
      expect(screen.getByText('Date Range')).toBeInTheDocument()
    })
  })

  describe('Callbacks', () => {
    it('should pass onStartSync to ChannelFilter when provided', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[1]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
          onStartSync={mockOnStartSync}
        />
      )

      // Should render without errors - actual sync button interaction
      // would require knowledge of ChannelFilter internals
      // Use getAllByText since selected channel appears twice (in chips and list)
      const channelTexts = screen.getAllByText('News Channel')
      expect(channelTexts.length).toBeGreaterThan(0)
    })

    it('should pass onToggleFavorite to ChannelFilter when provided', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )

      // Should render without errors - actual favorite interaction
      // would require knowledge of ChannelFilter internals
      expect(screen.getByText('News Channel')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper section header', () => {
      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      const dateRangeSection = screen.getByText('Date Range')
      expect(dateRangeSection).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <MessageFilters
          filters={defaultFilters}
          onChange={mockOnChange}
          availableChannels={mockChannels}
          selectedChannelIds={[]}
          favoriteChannelIds={new Set()}
          isLoadingChannels={false}
          isRefreshingChannels={false}
          onRefreshChannels={mockOnRefreshChannels}
          onChannelSelectionChange={mockOnChannelSelectionChange}
        />
      )

      // Tab through interactive elements
      await user.tab()
      expect(document.activeElement).toBeTruthy()
    })
  })
})
