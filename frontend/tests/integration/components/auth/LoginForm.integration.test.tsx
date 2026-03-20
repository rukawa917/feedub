import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/LoginForm'
import React from 'react'

/**
 * Integration tests for LoginForm component
 *
 * Tests actual API integration and mutation callbacks.
 * These tests require proper API mocking or test server setup.
 */
describe('LoginForm Integration Tests', () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call onSuccess callback after successful API submission', async () => {
    // Mock fetch to simulate successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: 'Verification code sent',
        phone_hash: 'mock-hash-123',
      }),
    })

    const user = userEvent.setup()
    render(<LoginForm onSuccess={mockOnSuccess} />)

    const phoneInput = screen.getByLabelText(/phone number/i)
    await user.type(phoneInput, '+447911123456')
    await user.click(screen.getByRole('button', { name: /request code/i }))

    // Wait for API call to complete and onSuccess to be called
    await waitFor(
      () => {
        expect(mockOnSuccess).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/request-code'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('+447911123456'),
      })
    )
  })

  it('should handle API errors gracefully', async () => {
    // Mock fetch to simulate API error
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        detail: 'Invalid phone number format',
      }),
    })

    const user = userEvent.setup()
    render(<LoginForm onSuccess={mockOnSuccess} />)

    const phoneInput = screen.getByLabelText(/phone number/i)
    await user.type(phoneInput, '+123') // Invalid short number
    await user.click(screen.getByRole('button', { name: /request code/i }))

    // Wait for error to be displayed
    await waitFor(
      () => {
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // onSuccess should NOT be called on error
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should handle rate limiting (429 status)', async () => {
    // Mock fetch to simulate rate limit
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        detail: 'Rate limited by Telegram. Retry after 60 seconds',
      }),
    })

    const user = userEvent.setup()
    render(<LoginForm onSuccess={mockOnSuccess} />)

    const phoneInput = screen.getByLabelText(/phone number/i)
    await user.type(phoneInput, '+447911123456')
    await user.click(screen.getByRole('button', { name: /request code/i }))

    // Wait for rate limit error to be displayed
    await waitFor(
      () => {
        expect(screen.getByText(/rate limit/i)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })
})
