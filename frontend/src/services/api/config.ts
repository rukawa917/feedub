/**
 * API configuration for backend communication
 * Base URL is configured via environment variable VITE_API_BASE_URL
 */

import { useAuthStore } from '../../stores/auth'

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
}

/**
 * Handle token refresh from API response
 * Checks for X-Refreshed-Token header and updates auth store if present
 *
 * @param response - Fetch Response object
 */
export function handleTokenRefresh(response: Response): void {
  const newToken = response.headers.get('X-Refreshed-Token')
  if (newToken) {
    useAuthStore.getState().updateToken(newToken)
  }
}

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    requestCode: '/auth/request-code',
    verifyCode: '/auth/verify-code',
    me: '/auth/me',
    logout: '/auth/logout',
  },

  // Channels
  channels: {
    available: '/channels/available',
    selections: '/channels/selections',
    favorites: '/channels/favorites',
    removeFavorite: (channelId: number) => `/channels/favorites/${channelId}`,
    toggleFavorite: (channelId: number) => `/channels/favorites/${channelId}/toggle`,
  },

  // Messages
  messages: {
    fetch: '/messages/fetch',
    activeFetch: '/messages/fetch/active',
    fetchStatus: (fetchId: string) => `/messages/fetch/${fetchId}`,
    cancelFetch: (fetchId: string) => `/messages/fetch/${fetchId}/cancel`,
    list: '/messages',
    chats: '/messages/chats',
    ids: '/messages/ids',
    detail: (messageId: string) => `/messages/${messageId}`,
    media: (messageId: string) => `/messages/${messageId}/media`,
  },

  // Insights
  insights: {
    consentStatus: '/insights/consent/status',
    giveConsent: '/insights/consent/give',
    revokeConsent: '/insights/consent/revoke',
    usage: '/insights/usage',
    validate: '/insights/validate',
    generate: '/insights/generate',
    generateFromIds: '/insights/generate-from-ids',
    list: '/insights/',
    detail: (insightId: string) => `/insights/${insightId}`,
  },

  // Health
  health: '/health',
}
