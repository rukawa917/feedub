/**
 * T037: LoginForm component
 * Phone number authentication form using React Hook Form + shadcn/ui
 * Reference: contracts/auth-contract.md lines 103-123, spec.md FR-001
 */

import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useRequestCode } from '@/hooks/useAuth'
import { isValidE164Format, PHONE_VALIDATION_ERROR_MESSAGE } from '@/utils/validation'
import { useEffect, useState } from 'react'

// Rate limiting configuration
const RATE_LIMIT_COOLDOWN_SECONDS = 60
const RATE_LIMIT_STORAGE_KEY = 'auth_request_code_last_timestamp'

/**
 * Zod schema for phone number validation
 * Validates E.164 format (FR-001)
 */
const loginFormSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required').refine(isValidE164Format, {
    message: PHONE_VALIDATION_ERROR_MESSAGE,
  }),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

/**
 * LoginForm component props
 */
export interface LoginFormProps {
  /**
   * Callback invoked on successful code request
   * Receives phone number and phone_hash for the verification step
   */
  onSuccess: (phoneNumber: string, phoneCodeHash: string) => void

  /**
   * Optional callback for testing form submission
   * @internal Used for testing only
   */
  onSubmit?: (data: LoginFormValues) => void

  /**
   * Optional external loading state
   * Overrides internal loading from mutation
   */
  isLoading?: boolean

  /**
   * Optional external error message
   * Displayed in addition to validation errors
   */
  error?: string

  /**
   * Optional callback to clear external error
   * Called when user starts typing
   */
  onClearError?: () => void
}

/**
 * LoginForm component
 *
 * Provides phone number input with E.164 validation and integrates
 * with the backend authentication API via useRequestCode hook.
 *
 * @example
 * ```tsx
 * <LoginForm
 *   onSuccess={(phoneNumber, phoneCodeHash) => {
 *     // Save for verification step
 *     navigate('/verify-code', { state: { phoneNumber, phoneCodeHash } })
 *   }}
 * />
 * ```
 */
export function LoginForm({
  onSuccess,
  onSubmit: externalOnSubmit,
  isLoading: externalIsLoading,
  error: externalError,
  onClearError,
}: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      phoneNumber: '',
    },
    mode: 'onSubmit', // Validate on submit
    reValidateMode: 'onBlur', // Re-validate on blur after first submit
  })

  const requestCode = useRequestCode()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  // Use external loading state if provided, otherwise use mutation loading state
  const isLoading = externalIsLoading ?? requestCode.isPending ?? isSubmitting

  // Calculate if button should be disabled (loading or in cooldown)
  const isButtonDisabled = isLoading || cooldownSeconds > 0

  // Initialize cooldown from localStorage on mount
  useEffect(() => {
    const checkCooldown = () => {
      const lastTimestamp = localStorage.getItem(RATE_LIMIT_STORAGE_KEY)
      if (lastTimestamp) {
        const elapsedSeconds = Math.floor((Date.now() - parseInt(lastTimestamp, 10)) / 1000)
        const remainingSeconds = RATE_LIMIT_COOLDOWN_SECONDS - elapsedSeconds

        if (remainingSeconds > 0) {
          setCooldownSeconds(remainingSeconds)
        } else {
          // Cooldown expired, clear storage
          localStorage.removeItem(RATE_LIMIT_STORAGE_KEY)
        }
      }
    }

    checkCooldown()
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds((prev) => {
          const newValue = prev - 1
          if (newValue <= 0) {
            localStorage.removeItem(RATE_LIMIT_STORAGE_KEY)
          }
          return newValue
        })
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [cooldownSeconds])

  // Handle form submission
  const handleSubmit = async (data: LoginFormValues) => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      // Call external onSubmit for testing if provided
      // When testing, return early to avoid calling the mutation
      if (externalOnSubmit) {
        externalOnSubmit(data)
        // Keep isSubmitting true briefly to prevent rapid successive submissions
        setTimeout(() => setIsSubmitting(false), 100)
        return
      }

      // Call the mutation (production path)
      requestCode.mutate(data.phoneNumber, {
        onSuccess: (response) => {
          // Set rate limit timestamp on successful request
          localStorage.setItem(RATE_LIMIT_STORAGE_KEY, Date.now().toString())
          setCooldownSeconds(RATE_LIMIT_COOLDOWN_SECONDS)

          // Call the onSuccess callback with phone number and phone_hash
          onSuccess(data.phoneNumber, response.phone_hash)
          // Reset submission state on success
          setIsSubmitting(false)
        },
        onError: () => {
          // Reset submission state on error
          setIsSubmitting(false)
        },
      })
    } catch {
      setIsSubmitting(false)
    }
  }

  // Clear external error when user starts typing
  useEffect(() => {
    const subscription = form.watch(() => {
      if (onClearError) {
        onClearError()
      }
    })
    return () => subscription.unsubscribe()
  }, [form, onClearError])

  // Determine which error to display (external or mutation error)
  const errorMessage = externalError || requestCode.error?.message

  return (
    <FormProvider {...form}>
      <Form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
        <FormField name="phoneNumber">
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input type="tel" placeholder="+1234567890" required disabled={isLoading} />
            </FormControl>
            <FormDescription>
              Enter your phone number in E.164 format (e.g., +1234567890)
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        {/* Display API error message if present */}
        {errorMessage && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {/* Display rate limit warning during cooldown */}
        {cooldownSeconds > 0 && (
          <div
            className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-accent"
            role="status"
          >
            Please wait {cooldownSeconds} second{cooldownSeconds !== 1 ? 's' : ''} before requesting
            another code. This helps prevent rate limiting by Telegram.
          </div>
        )}

        <Button type="submit" disabled={isButtonDisabled} className="w-full">
          {isLoading
            ? 'Requesting...'
            : cooldownSeconds > 0
              ? `Wait ${cooldownSeconds}s`
              : 'Request Code'}
        </Button>
      </Form>
    </FormProvider>
  )
}
