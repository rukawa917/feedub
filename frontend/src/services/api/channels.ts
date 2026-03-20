/**
 * Channel API service
 * Provides API calls for channel selection and management
 *
 * DEV MODE: Returns mock data when using dev token (+1000000000)
 */

import { isDevToken, DEV_CHATS } from '../../mocks/dev-data'
import { apiClient } from './client'
import { API_ENDPOINTS } from './config'

/**
 * Channel representation from Telegram
 */
export interface AvailableChannel {
  /** Telegram channel ID */
  channel_id: number
  /** Channel title */
  title: string
  /** Channel type (channel, supergroup, group) */
  type: 'channel' | 'supergroup' | 'group'
  /** Number of members (may be null if unknown) */
  member_count: number | null
  /** Last message date (ISO 8601, may be null) */
  last_message_date: string | null
}

/**
 * Response from GET /channels/available
 */
export interface GetAvailableChannelsResponse {
  channels: AvailableChannel[]
  total: number
}

/**
 * Saved channel selection
 */
export interface ChannelSelection {
  /** Selection ID (UUID) */
  id: string
  /** Telegram channel ID */
  channel_id: number
  /** Channel title (cached) */
  channel_title: string
  /** Channel type (cached) */
  channel_type: 'channel' | 'supergroup' | 'group'
  /** When this selection was saved (ISO 8601) */
  selected_at: string
}

/**
 * Response from GET /channels/selections
 */
export interface GetChannelSelectionsResponse {
  selections: ChannelSelection[]
  total: number
}

/**
 * Request body for PUT /channels/selections
 */
export interface UpdateChannelSelectionsRequest {
  channels: Array<{
    channel_id: number
    channel_title: string
    channel_type: 'channel' | 'supergroup' | 'group'
  }>
}

/**
 * Get available channels from Telegram
 * GET /channels/available
 *
 * Fetches list of channels user is subscribed to in Telegram.
 * This operation may take a few seconds as it queries Telegram API.
 *
 * @param token - JWT access token
 * @returns List of available channels with metadata
 * @throws Error if request fails
 */
export async function getAvailableChannels(token: string): Promise<GetAvailableChannelsResponse> {
  // DEV MODE: Return mock channels
  if (isDevToken(token)) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return {
      channels: DEV_CHATS.map((chat, index) => ({
        channel_id: chat.telegramChannelId ?? -(1000000000 + index),
        title: chat.title,
        type: chat.type === 'private' ? 'group' : chat.type,
        member_count: null,
        last_message_date: null,
      })),
      total: DEV_CHATS.length,
    }
  }

  return apiClient.get<GetAvailableChannelsResponse>(API_ENDPOINTS.channels.available)
}

/**
 * Get user's saved channel selections
 * GET /channels/selections
 *
 * @param token - JWT access token
 * @returns List of saved channel selections
 * @throws Error if request fails
 */
export async function getChannelSelections(token: string): Promise<GetChannelSelectionsResponse> {
  // DEV MODE: Return empty selections (user hasn't selected yet)
  if (isDevToken(token)) {
    return { selections: [], total: 0 }
  }

  return apiClient.get<GetChannelSelectionsResponse>(API_ENDPOINTS.channels.selections)
}

/**
 * Update user's channel selections (bulk replace)
 * PUT /channels/selections
 *
 * Replaces all existing selections with the provided list.
 * Pass empty array to clear all selections.
 *
 * @param token - JWT access token
 * @param request - New channel selections
 * @returns Updated list of selections
 * @throws Error if request fails
 */
export async function updateChannelSelections(
  token: string,
  request: UpdateChannelSelectionsRequest
): Promise<GetChannelSelectionsResponse> {
  // DEV MODE: Return mock success with the provided selections
  if (isDevToken(token)) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return {
      selections: request.channels.map((ch, index) => ({
        id: `dev-selection-${index}`,
        channel_id: ch.channel_id,
        channel_title: ch.channel_title,
        channel_type: ch.channel_type,
        selected_at: new Date().toISOString(),
      })),
      total: request.channels.length,
    }
  }

  return apiClient.put<GetChannelSelectionsResponse>(API_ENDPOINTS.channels.selections, request)
}

// =============================================================================
// Channel Favorites API
// =============================================================================

/**
 * Favorite channel (persisted across sessions)
 */
export interface ChannelFavorite {
  /** Favorite record ID (UUID) */
  id: string
  /** Telegram channel ID */
  channel_id: number
  /** Channel title (cached) */
  channel_title: string | null
  /** Channel type (cached) */
  channel_type: 'channel' | 'supergroup' | 'group' | null
  /** When this channel was favorited (ISO 8601) */
  favorited_at: string
}

/**
 * Response from GET /channels/favorites
 */
export interface GetChannelFavoritesResponse {
  favorites: ChannelFavorite[]
  total: number
}

/**
 * Request body for POST /channels/favorites
 */
export interface AddChannelFavoriteRequest {
  channel_id: number
  channel_title?: string | null
  channel_type?: 'channel' | 'supergroup' | 'group' | null
}

/**
 * Response from POST /channels/favorites/{channel_id}/toggle
 */
export interface ToggleFavoriteResponse {
  is_favorite: boolean
  favorite: ChannelFavorite | null
}

/**
 * Get user's favorite channels
 * GET /channels/favorites
 *
 * @param token - JWT access token
 * @returns List of favorite channels
 * @throws Error if request fails
 */
export async function getChannelFavorites(token: string): Promise<GetChannelFavoritesResponse> {
  // DEV MODE: Return empty favorites
  if (isDevToken(token)) {
    return { favorites: [], total: 0 }
  }

  return apiClient.get<GetChannelFavoritesResponse>(API_ENDPOINTS.channels.favorites)
}

/**
 * Toggle a channel's favorite status
 * POST /channels/favorites/{channel_id}/toggle
 *
 * @param token - JWT access token
 * @param channelId - Telegram channel ID to toggle
 * @param metadata - Optional channel metadata (used when adding)
 * @returns Toggle result with is_favorite flag and optional favorite record
 * @throws Error if request fails
 */
export async function toggleChannelFavorite(
  token: string,
  channelId: number,
  metadata?: AddChannelFavoriteRequest
): Promise<ToggleFavoriteResponse> {
  // DEV MODE: Toggle returns added state (simple mock)
  if (isDevToken(token)) {
    await new Promise((resolve) => setTimeout(resolve, 150))
    return {
      is_favorite: true,
      favorite: {
        id: `dev-favorite-${channelId}`,
        channel_id: channelId,
        channel_title: metadata?.channel_title ?? null,
        channel_type: metadata?.channel_type ?? null,
        favorited_at: new Date().toISOString(),
      },
    }
  }

  return apiClient.post<ToggleFavoriteResponse>(
    API_ENDPOINTS.channels.toggleFavorite(channelId),
    metadata
  )
}
