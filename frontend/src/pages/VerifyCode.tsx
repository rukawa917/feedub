/**
 * T040: VerifyCode Page - Refined Editorial Design
 *
 * Verification code input step in authentication flow.
 * Clean, sophisticated layout matching Login page style.
 *
 * Reference: spec.md FR-002, FR-003
 */

import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { VerifyCodeForm } from '../components/auth/VerifyCodeForm'
import { useVerifyCode } from '../hooks/useAuth'
import { useAuthStore } from '../stores/auth'
import { ArrowLeft } from 'lucide-react'
import { FeedubIcon } from '../components/common/FeedubIcon'
import { ThemeToggle } from '../components/common/ThemeToggle'
import { Card } from '../components/ui/card'

/**
 * Location state interface
 * Passed from Login page via navigate()
 */
interface LocationState {
  phoneNumber: string
  phoneCodeHash: string
}

/**
 * VerifyCode Page
 *
 * Second step of authentication flow.
 * Displays verification code input (and optional 2FA password).
 * Redirects to dashboard on successful verification.
 */
export function VerifyCodePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const verifyCode = useVerifyCode()

  const [show2FA, setShow2FA] = useState(false)
  const [error, setError] = useState<string>()

  // Extract phone number and hash from location state
  const state = location.state as LocationState | undefined
  const phoneNumber = state?.phoneNumber
  const phoneCodeHash = state?.phoneCodeHash

  // Redirect to login if state is missing
  useEffect(() => {
    if (!phoneNumber || !phoneCodeHash) {
      navigate('/login', { replace: true })
    }
  }, [phoneNumber, phoneCodeHash, navigate])

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Don't render if redirecting
  if (!phoneNumber || !phoneCodeHash || isAuthenticated) {
    return null
  }

  /**
   * Handle form submission
   * Calls useVerifyCode mutation with phone, hash, code, and optional password
   */
  const handleSubmit = (data: {
    phone_number: string
    phone_code_hash: string
    code: string
    password?: string
  }) => {
    setError(undefined)

    verifyCode.mutate(
      {
        phoneNumber: data.phone_number,
        phoneCodeHash: data.phone_code_hash,
        code: data.code,
        password: data.password,
      },
      {
        onSuccess: () => {
          // Token is already stored by useVerifyCode hook
          // Set fresh login flag for auto-sync on Dashboard
          sessionStorage.setItem('feedub_fresh_login', 'true')
          // Navigate to dashboard
          navigate('/dashboard', { replace: true })
        },
        onError: (err) => {
          // Check if 2FA is required
          if (err.message.toLowerCase().includes('two-factor')) {
            setShow2FA(true)
            setError(err.message)
          } else {
            setError(err.message)
          }
        },
      }
    )
  }

  /**
   * Handle successful verification
   * Called by VerifyCodeForm when verification succeeds
   */
  const handleSuccess = () => {
    navigate('/dashboard', { replace: true })
  }

  /**
   * Handle 2FA requirement detected by form
   */
  const handleRequire2FA = () => {
    setShow2FA(true)
  }

  /**
   * Clear error when user starts typing
   */
  const handleClearError = () => {
    setError(undefined)
  }

  // Mask phone number for display
  const maskedPhone = phoneNumber.replace(/(\+\d{2})\d+(\d{4})/, '$1••••••$2')

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Theme toggle in corner */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle iconOnly />
      </div>

      <div className="w-full max-w-sm space-y-8">
        {/* Editorial Header with Serif Typography */}
        <header className="text-center space-y-4 animate-fade-in-down">
          {/* Logo with icon */}
          <div className="inline-flex items-center gap-3">
            <FeedubIcon size={36} className="rounded-lg" />
            <span className="font-serif text-3xl font-medium tracking-tight">Feedub</span>
          </div>

          {/* Instructions */}
          <div className="space-y-1">
            <h1 className="font-serif text-xl font-medium">Enter verification code</h1>
            <p className="text-foreground-muted text-sm">
              Code sent to <span className="font-mono text-foreground">{maskedPhone}</span>
            </p>
          </div>
        </header>

        {/* Verify Code Form Card */}
        <Card className="p-6 animate-fade-in-up">
          <VerifyCodeForm
            phoneNumber={phoneNumber}
            phoneHash={phoneCodeHash}
            onSuccess={handleSuccess}
            onSubmit={handleSubmit}
            show2FA={show2FA}
            isLoading={verifyCode.isPending}
            error={error}
            onRequire2FA={handleRequire2FA}
            onClearError={handleClearError}
          />
        </Card>

        {/* Back to Login Link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to login
          </button>
        </div>
      </div>
    </div>
  )
}
