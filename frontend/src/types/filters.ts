/**
 * Filter types for message filtering
 * Supports date range, channel, and search filters
 */

/**
 * Message type filter (matches backend MessageType)
 */
export type MessageType =
  | 'text'
  | 'photo'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'voice'
  | 'animation'

/**
 * Advanced filters (specific selections)
 * NOT persisted - reset on session start
 */
export interface AdvancedFilters {
  /** Selected chat/channel IDs */
  chatIds: string[]

  /** Selected message types */
  messageTypes: MessageType[]

  /** Media filter: null = all, true = only with media, false = only without media */
  hasMedia: boolean | null

  /** Custom date range */
  dateRange: {
    startDate: Date | null
    endDate: Date | null
  } | null
}

/**
 * Complete filter state (session state)
 */
export interface FilterState {
  /** Advanced filter selections (not persisted) */
  advanced: AdvancedFilters

  /** Search query (not persisted) */
  searchQuery: string
}

/**
 * Default filter state (fresh session)
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  advanced: {
    chatIds: [],
    messageTypes: [],
    hasMedia: null,
    dateRange: null,
  },
  searchQuery: '',
}

/**
 * Navigation state passed from Dashboard to Insights page.
 * Contains message IDs and metadata for display.
 */
export interface InsightsLocationState {
  /** UUIDs of messages to analyze */
  messageIds: string[]
  /** Date range for display purposes */
  dateRange?: {
    start: string // YYYY-MM-DD
    end: string // YYYY-MM-DD
  }
  /** Channel titles for display purposes */
  channelTitles?: string[]
}
