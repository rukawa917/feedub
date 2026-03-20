/**
 * T035-T036: Authentication hooks using direct API calls
 * Wraps auth service with simple state management
 * Source: specs/003-minimal-frontend-webapp/contracts/auth-contract.md
 */

import { useState } from 'react'
import { useAuthStore } from '../stores/auth'
import * as authService from '../services/auth-service'
import type { User } from '../types/auth'

/**
 * T035: useRequestCode hook
 * Direct API call for requesting a verification code via Telegram
 *
 * Usage:
 * ```typescript
 * const requestCode = useRequestCode()
 *
 * requestCode.mutate(
 *   { phone_number: '+1234567890' },
 *   {
 *     onSuccess: (data) => {
 *       // Save phone_hash for next step
 *       navigate('/verify-code')
 *     },
 *     onError: (error) => {
 *       toast.error(error.message)
 *     }
 *   }
 * )
 * ```
 */
export function useRequestCode() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (
    phoneNumber: string,
    callbacks?: {
      onSuccess?: (data: { phone_hash: string; message: string }) => void
      onError?: (error: Error) => void
    }
  ) => {
    setLoading(true)
    setError(null)

    try {
      const data = await authService.requestCode(phoneNumber)
      callbacks?.onSuccess?.(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to request code')
      setError(error)
      callbacks?.onError?.(error)
    } finally {
      setLoading(false)
    }
  }

  return { mutate, isPending: loading, isLoading: loading, error }
}

/**
 * T036: useVerifyCode hook
 * Direct API call for verifying code and obtaining JWT token
 * On success: Updates Zustand auth store with token
 *
 * Usage:
 * ```typescript
 * const verifyCode = useVerifyCode()
 *
 * verifyCode.mutate(
 *   {
 *     phone_number: '+1234567890',
 *     phone_code_hash: phoneHash,
 *     code: '12345',
 *     password: 'optional2FA'
 *   },
 *   {
 *     onSuccess: () => {
 *       navigate('/dashboard')
 *     },
 *     onError: (error) => {
 *       if (error.message.includes('Two-factor')) {
 *         setShow2FAInput(true)
 *       } else {
 *         toast.error(error.message)
 *       }
 *     }
 *   }
 * )
 * ```
 */
export function useVerifyCode() {
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (
    params: {
      phoneNumber: string
      phoneCodeHash: string
      code: string
      password?: string
    },
    callbacks?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }
  ) => {
    setLoading(true)
    setError(null)

    try {
      const response = await authService.verifyCode(
        params.phoneNumber,
        params.phoneCodeHash,
        params.code,
        params.password
      )

      // Calculate expiry (24 hours from now)
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000

      // Convert backend response to frontend User type
      const user: User = {
        phone: response.user.phone,
        telegramUserId: response.user.telegram_user_id,
        id: response.user.telegram_user_id,
        firstName: response.user.first_name,
        lastName: response.user.last_name,
      }

      // Store in Zustand + localStorage (via persist middleware)
      setAuth(response.access_token, user, expiresAt)

      callbacks?.onSuccess?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to verify code')
      setError(error)
      callbacks?.onError?.(error)
    } finally {
      setLoading(false)
    }
  }

  return { mutate, isPending: loading, isLoading: loading, error }
}
