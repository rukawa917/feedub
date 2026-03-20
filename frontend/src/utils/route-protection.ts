/**
 * T042: Route Protection Middleware
 *
 * Provides route protection utilities for React Router v7.
 * Redirects unauthenticated users to login page.
 *
 * IMPORTANT: These loaders check localStorage directly to avoid race conditions
 * with Zustand persist middleware. When the browser reopens, persist middleware
 * rehydrates asynchronously, but loaders execute synchronously during navigation.
 *
 * Reference: spec.md FR-006
 */

import { redirect } from 'react-router-dom'

/**
 * Check if user is authenticated by reading directly from localStorage
 * Avoids race condition with Zustand persist middleware rehydration
 *
 * @returns true if user has valid non-expired token in localStorage
 */
function isAuthenticatedFromStorage(): boolean {
  try {
    // Read auth state directly from localStorage (same key as Zustand persist)
    const storageValue = localStorage.getItem('auth-storage')
    if (!storageValue) {
      return false
    }

    const parsed = JSON.parse(storageValue)
    const state = parsed.state

    // Check if token exists and is not expired
    if (!state?.token || !state?.expiresAt) {
      return false
    }

    // Validate expiration
    const now = Date.now()
    return now < state.expiresAt
  } catch (error) {
    console.error('Failed to check auth from storage:', error)
    return false
  }
}

/**
 * requireAuth - Route protection loader function
 *
 * Use this as a loader in React Router to protect routes.
 * Checks localStorage directly to avoid race conditions with Zustand persist.
 *
 * @returns null if authenticated, redirect to login otherwise
 *
 * @example
 * ```typescript
 * // In router.tsx
 * {
 *   path: '/dashboard',
 *   element: <DashboardPage />,
 *   loader: requireAuth,
 * }
 * ```
 */
export function requireAuth() {
  const isAuthenticated = isAuthenticatedFromStorage()

  if (!isAuthenticated) {
    // Redirect to login page
    throw redirect('/login')
  }

  return null
}

/**
 * redirectIfAuthenticated - Redirect authenticated users away from public pages
 *
 * Use this as a loader for login/signup pages to redirect
 * already-authenticated users to dashboard.
 *
 * @returns redirect to dashboard if authenticated, null otherwise
 *
 * @example
 * ```typescript
 * // In router.tsx
 * {
 *   path: '/login',
 *   element: <LoginPage />,
 *   loader: redirectIfAuthenticated,
 * }
 * ```
 */
export function redirectIfAuthenticated() {
  const isAuthenticated = isAuthenticatedFromStorage()

  if (isAuthenticated) {
    // Redirect to dashboard
    throw redirect('/dashboard')
  }

  return null
}
