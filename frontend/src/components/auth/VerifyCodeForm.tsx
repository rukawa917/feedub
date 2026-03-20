/**
 * T038: VerifyCodeForm Component
 *
 * Form for verifying Telegram verification code (and optional 2FA password).
 * Uses React Hook Form + Zod validation + shadcn/ui components.
 *
 * Features:
 * - 5-digit verification code input (required)
 * - Optional 2FA password input (conditional)
 * - Client-side validation (Zod schema)
 * - Loading state display
 * - Error message display
 * - Accessibility support (labels, ARIA attributes)
 *
 * Reference: contracts/auth-contract.md lines 271-299, spec.md FR-002, FR-003
 */

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Zod validation schema for verify code form
 * - Code: Required, exactly 5 digits, numeric only
 * - Password: Optional string (for 2FA)
 */
const verifyCodeSchema = z.object({
  code: z
    .string()
    .min(1, { message: 'Code is required' })
    .length(5, { message: 'Code must be exactly 5 digits' })
    .regex(/^\d+$/, { message: 'Code must contain only digits' }),
  password: z.string().optional(),
})

type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>

export interface VerifyCodeFormProps {
  /**
   * Phone number being verified (display only)
   */
  phoneNumber: string

  /**
   * Phone code hash from /auth/request-code response
   */
  phoneHash: string

  /**
   * Callback invoked on successful verification
   */
  onSuccess: () => void

  /**
   * Whether to show 2FA password field
   * Set to true when API indicates 2FA is required
   */
  show2FA?: boolean

  /**
   * Whether the verification request is in progress
   */
  isLoading?: boolean

  /**
   * Error message from API or validation
   */
  error?: string

  /**
   * Custom submit handler (for testing)
   * If provided, this is called instead of default behavior
   */
  onSubmit?: (data: {
    phone_number: string
    phone_code_hash: string
    code: string
    password?: string
  }) => void

  /**
   * Callback when 2FA is required by API
   * Parent component should set show2FA to true
   */
  onRequire2FA?: () => void

  /**
   * Callback to clear error when user starts typing
   */
  onClearError?: () => void
}

/**
 * VerifyCodeForm Component
 *
 * Renders a form for entering Telegram verification code and optional 2FA password.
 * Integrates with React Hook Form for validation and state management.
 */
export function VerifyCodeForm({
  phoneNumber,
  phoneHash,
  onSuccess,
  show2FA = false,
  isLoading = false,
  error,
  onSubmit: customSubmit,
  onRequire2FA,
  onClearError,
}: VerifyCodeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: '',
      password: '',
    },
  })

  // Track if form has been submitted to prevent duplicate submissions
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Detect 2FA requirement from error message
  React.useEffect(() => {
    if (error && error.toLowerCase().includes('two-factor')) {
      onRequire2FA?.()
    }
  }, [error, onRequire2FA])

  /**
   * Handle form submission
   * If customSubmit is provided (for testing), use it
   * Otherwise, call onSuccess callback
   */
  const onFormSubmit = React.useCallback(
    (data: VerifyCodeFormData) => {
      // Prevent duplicate submissions
      if (isSubmitting) {
        return
      }

      setIsSubmitting(true)

      const payload = {
        phone_number: phoneNumber,
        phone_code_hash: phoneHash,
        code: data.code,
        password: data.password || undefined,
      }

      if (customSubmit) {
        customSubmit(payload)
        // Reset submission state after a brief delay
        setTimeout(() => {
          setIsSubmitting(false)
        }, 100)
      } else {
        // In production, this would call the useVerifyCode hook
        // For now, just call onSuccess
        onSuccess()
        setTimeout(() => {
          setIsSubmitting(false)
        }, 100)
      }
    },
    [phoneNumber, phoneHash, customSubmit, onSuccess, isSubmitting]
  )

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
      {/* Display phone number being verified */}
      <div className="text-sm text-foreground-muted">
        Verifying: <span className="font-semibold text-foreground">{phoneNumber}</span>
      </div>

      {/* Verification Code Field */}
      <div className="space-y-2">
        <Label htmlFor="code">Verification Code</Label>
        <Input
          id="code"
          type="text"
          placeholder="12345"
          autoComplete="off"
          required
          aria-invalid={errors.code ? 'true' : 'false'}
          {...register('code', {
            onChange: () => {
              onClearError?.()
            },
          })}
        />
        {errors.code && (
          <p className="text-sm font-medium text-red-500" role="alert">
            {errors.code.message}
          </p>
        )}
      </div>

      {/* 2FA Password Field (conditional) */}
      {show2FA && (
        <div className="space-y-2">
          <Label htmlFor="password">2FA Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your 2FA password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm font-medium text-red-500" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-3"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || isSubmitting}
        aria-label={isLoading ? 'Verifying Verify Code' : undefined}
      >
        {isLoading ? 'Verifying...' : 'Verify Code'}
      </Button>
    </form>
  )
}
