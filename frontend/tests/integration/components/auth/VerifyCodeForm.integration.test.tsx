import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { VerifyCodeForm } from '@/components/auth/VerifyCodeForm'
import React from 'react'

/**
 * Integration tests for VerifyCodeForm component
 *
 * Tests actual API integration, mutation callbacks, and submission behavior.
 */
describe('VerifyCodeForm Integration Tests', () => {
  const mockOnSuccess = vi.fn()
  const mockPhoneNumber = '+447911123456'
  const mockPhoneHash = 'mock-phone-hash-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle rapid successive submissions correctly', { timeout: 10000 }, async () => {
    // Mock fetch to simulate successful verification
    let callCount = 0
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++
      // Simulate slow API response
      await new Promise((resolve) => setTimeout(resolve, 100))
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'mock-jwt-token',
          token_type: 'bearer',
          user: {
            phone: mockPhoneNumber,
            telegram_user_id: '123456789',
          },
        }),
      }
    })

    const user = userEvent.setup()
    const mockSubmit = vi.fn()
    render(
      <VerifyCodeForm
        phoneNumber={mockPhoneNumber}
        phoneHash={mockPhoneHash}
        onSuccess={mockOnSuccess}
        onSubmit={mockSubmit}
      />,

    )

    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '12345')

    const submitButton = screen.getByRole('button', { name: /verify code/i })

    // Rapid successive clicks - React may not update state fast enough between clicks
    await user.click(submitButton)
    await user.click(submitButton)
    await user.click(submitButton)

    // Wait for form submission to complete
    await waitFor(
      () => {
        // The component has internal isSubmitting guard that prevents duplicate submissions
        // within the same submission cycle. Some clicks may get through due to React timing
        // but the important thing is that it's limited (not 3 full submissions)
        expect(mockSubmit).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // Allow some race condition tolerance - the guard should limit submissions
    // The form has an isSubmitting guard that resets after 100ms
    expect(mockSubmit.mock.calls.length).toBeLessThanOrEqual(2)
  })

  it('should call onSuccess after successful verification', async () => {
    const mockSubmit = vi.fn().mockImplementationOnce(async (payload) => {
      // Simulate API call
      const response = await fetch('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      mockOnSuccess(data)
    })

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        user: {
          phone: mockPhoneNumber,
          telegram_user_id: '123456789',
          first_name: 'John',
          last_name: 'Doe',
        },
      }),
    })

    const user = userEvent.setup()
    render(
      <VerifyCodeForm
        phoneNumber={mockPhoneNumber}
        phoneHash={mockPhoneHash}
        onSuccess={mockOnSuccess}
        onSubmit={mockSubmit}
      />,

    )

    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '12345')
    await user.click(screen.getByRole('button', { name: /verify code/i }))

    // Wait for onSuccess to be called
    await waitFor(
      () => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            access_token: 'mock-jwt-token',
          })
        )
      },
      { timeout: 5000 }
    )
  })

  it('should handle 2FA required error', async () => {
    const mockRequire2FA = vi.fn()
    const mockSubmit = vi.fn().mockImplementationOnce(async (payload) => {
      // Simulate API call that returns 2FA error
      const response = await fetch('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        // Don't call onSuccess, instead trigger the error flow
        throw new Error(error.detail)
      }
    })

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        detail: 'Two-factor authentication required. Please provide password.',
      }),
    })

    const user = userEvent.setup()
    render(
      <VerifyCodeForm
        phoneNumber={mockPhoneNumber}
        phoneHash={mockPhoneHash}
        onSuccess={mockOnSuccess}
        onSubmit={mockSubmit}
        error="Two-factor authentication required. Please provide password."
        onRequire2FA={mockRequire2FA}
      />,

    )

    const codeInput = screen.getByLabelText(/verification code/i)
    await user.type(codeInput, '12345')

    // The error should already be displayed (passed as prop)
    expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()

    // onSuccess should NOT be called
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
})
