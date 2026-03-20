/**
 * T039: Login Page - Refined Editorial Design
 *
 * Entry point for phone authentication.
 * Clean, sophisticated layout with serif wordmark.
 *
 * Reference: spec.md FR-001, FR-006
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuthStore } from '../stores/auth'
import { FeedubIcon } from '../components/common/FeedubIcon'
import { ThemeToggle } from '../components/common/ThemeToggle'
import { Card } from '../components/ui/card'

/**
 * Login Page
 *
 * Entry point for authentication flow.
 * If user is already authenticated, redirects to dashboard.
 * Otherwise, displays phone number input form.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Don't render form if redirecting
  if (isAuthenticated) {
    return null
  }

  /**
   * Handle successful code request
   * Navigate to verify-code page with phone number and hash in state
   */
  const handleSuccess = (phoneNumber: string, phoneCodeHash: string) => {
    navigate('/verify-code', {
      state: {
        phoneNumber,
        phoneCodeHash,
      },
    })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Theme toggle in corner */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle iconOnly />
      </div>

      <div className="w-full max-w-sm space-y-8">
        {/* Editorial Header with Serif Wordmark */}
        <header className="text-center space-y-4 animate-fade-in-down">
          {/* Logo with icon */}
          <div className="inline-flex items-center gap-3">
            <FeedubIcon size={36} className="rounded-lg" />
            <span className="font-serif text-3xl font-medium tracking-tight">Feedub</span>
          </div>

          {/* Tagline */}
          <p className="text-foreground-muted text-base">Your messages, beautifully organized</p>
        </header>

        {/* Login Form Card - Clean, no gradient border */}
        <Card className="p-6 animate-fade-in-up">
          <LoginForm onSuccess={handleSuccess} />
        </Card>

        {/* Simple footer note */}
        <p className="text-center text-sm text-foreground-muted">
          You'll receive a verification code via Telegram.
        </p>
      </div>
    </div>
  )
}
