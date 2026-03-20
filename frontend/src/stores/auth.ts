import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/auth'

interface AuthState {
  token: string | null
  user: User | null
  expiresAt: number | null

  // Actions
  setAuth: (token: string, user: User, expiresAt: number) => void
  updateToken: (token: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

/**
 * Authentication store with localStorage persistence
 * Stores JWT token, user info, and expiry timestamp
 *
 * Session management:
 * - Token valid for 24 hours
 * - Auto-refreshed silently on API activity via X-Refreshed-Token header
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      expiresAt: null,

      setAuth: (token, user, expiresAt) => {
        set({ token, user, expiresAt })
      },

      /**
       * Update token and expiry without changing user info
       * Used by API interceptor to silently refresh tokens
       * Only updates if current session is expiring soon (< 1 hour left)
       * This prevents unnecessary re-renders from JWT timestamp differences
       */
      updateToken: (newToken) => {
        const { expiresAt: currentExpiry } = get()
        const now = Date.now()
        const oneHour = 60 * 60 * 1000

        // Only update if current token expires within 1 hour
        // This prevents constant updates since JWTs have different timestamps
        if (currentExpiry && currentExpiry - now > oneHour) {
          return // Current token is still valid for >1 hour, skip update
        }

        // Calculate new expiry (24 hours from now)
        const expiresAt = now + 24 * 60 * 60 * 1000
        set({ token: newToken, expiresAt })
      },

      clearAuth: () => {
        set({ token: null, user: null, expiresAt: null })
      },

      isAuthenticated: () => {
        const { token, expiresAt } = get()

        if (!token || !expiresAt) {
          return false
        }

        // Check if token is expired
        const now = Date.now()
        return now < expiresAt
      },
    }),
    {
      name: 'auth-storage',
      version: 1,
    }
  )
)
