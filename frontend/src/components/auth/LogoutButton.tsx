/**
 * Logout button component
 * FR-020: Provides logout functionality to clear session
 */

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/services/api/client'
import { API_ENDPOINTS } from '@/services/api/config'

export interface LogoutButtonProps {
  /**
   * Button variant
   * @default 'secondary'
   */
  variant?: 'default' | 'secondary' | 'ghost' | 'outline'

  /**
   * Button size
   * @default 'default'
   */
  size?: 'default' | 'sm' | 'lg' | 'icon'

  /**
   * Whether to render icon only (no text)
   * @default false
   */
  iconOnly?: boolean
}

/**
 * LogoutButton component
 *
 * Clears authentication state and redirects to login page.
 *
 * @example
 * ```tsx
 * <LogoutButton />
 * <LogoutButton variant="outline" size="sm" />
 * <LogoutButton iconOnly /> // Icon only for mobile
 * ```
 */
export function LogoutButton({
  variant = 'secondary',
  size = 'default',
  iconOnly = false,
}: LogoutButtonProps) {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Call backend to clear server-side data (messages, fetches, telegram session)
      await apiClient.post(API_ENDPOINTS.auth.logout)
    } catch {
      // Still clear local state even if backend call fails
    }
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <Button
      variant={variant}
      size={iconOnly ? 'icon' : size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-foreground-muted hover:text-foreground"
      aria-label={iconOnly ? 'Log out' : undefined}
    >
      <LogOut className="h-4 w-4" />
      {!iconOnly && <span>Log out</span>}
    </Button>
  )
}
