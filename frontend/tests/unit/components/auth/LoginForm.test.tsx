import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/LoginForm'

/**
 * T028 [P] Component test for Login form
 *
 * Tests the LoginForm component behavior including:
 * - Phone number input rendering
 * - E.164 format validation
 * - Form submission
 * - Loading states
 * - Error display
 * - API integration (mocked)
 *
 * Reference: contracts/auth-contract.md lines 103-123, spec.md User Story 1
 */
describe('LoginForm Component', () => {
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render phone number input field', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      expect(phoneInput).toBeInTheDocument()
    })

    it('should render submit button with text "Request Code"', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const submitButton = screen.getByRole('button', { name: /request code/i })
      expect(submitButton).toBeInTheDocument()
    })

    it('should have phone input with placeholder for E.164 format', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByPlaceholderText(/\+1234567890/i)
      expect(phoneInput).toBeInTheDocument()
    })

    it('should display help text explaining E.164 format', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const helpText = screen.getByText(/E\.164 format/i)
      expect(helpText).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation error when submitting empty form', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const submitButton = screen.getByRole('button', { name: /request code/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/phone number is required/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for phone without plus sign', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '1234567890')
      await user.click(screen.getByRole('button', { name: /request code/i }))

      await waitFor(() => {
        // Check for validation error message (not the help text)
        const messages = screen.getAllByText(/E\.164 format/i)
        expect(messages.length).toBeGreaterThan(1) // Help text + error message
      })
    })

    it('should show validation error for phone starting with +0', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '+0234567890')
      await user.click(screen.getByRole('button', { name: /request code/i }))

      await waitFor(() => {
        const messages = screen.getAllByText(/E\.164 format/i)
        expect(messages.length).toBeGreaterThan(1) // Help text + error message
      })
    })

    it('should show validation error for phone that is too short', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '+123456')
      await user.click(screen.getByRole('button', { name: /request code/i }))

      await waitFor(() => {
        expect(screen.getByText(/E\.164 format/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for phone with spaces', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '+1 234 567 890')
      await user.click(screen.getByRole('button', { name: /request code/i }))

      await waitFor(() => {
        const messages = screen.getAllByText(/E\.164 format/i)
        expect(messages.length).toBeGreaterThan(1) // Help text + error message
      })
    })

    it('should show validation error for phone with letters', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '+1234abc890')
      await user.click(screen.getByRole('button', { name: /request code/i }))

      await waitFor(() => {
        const messages = screen.getAllByText(/E\.164 format/i)
        expect(messages.length).toBeGreaterThan(1) // Help text + error message
      })
    })

    it('should not show validation errors for valid E.164 phone number', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '+1234567890')

      // Help text is always visible, but no error message yet
      const messages = screen.getAllByText(/E\.164 format/i)
      expect(messages.length).toBe(1) // Only help text, no error
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with phone number when valid form is submitted', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<LoginForm onSuccess={mockOnSuccess} onSubmit={mockSubmit} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '+1234567890')
      await user.click(screen.getByRole('button', { name: /request code/i }))

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            phoneNumber: '+1234567890',
          })
        )
      })
    })

    it('should disable submit button while request is in progress', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} isLoading={true} />)

      // When loading, button text changes to "Loading..." or "Requesting..."
      const submitButton = screen.getByRole('button', { name: /loading|requesting/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show loading spinner in button when isLoading is true', async () => {
      render(<LoginForm onSuccess={mockOnSuccess} isLoading={true} />)

      // Look for loading indicator (spinner or "Loading..." text)
      expect(
        screen.getByRole('button', { name: /loading|requesting/i })
      ).toBeInTheDocument()
    })

    // MOVED TO INTEGRATION TESTS: tests/integration/components/auth/LoginForm.integration.test.tsx
    // This test requires actual API mocking with React Query mutations
    // it('should call onSuccess callback after successful submission', async () => { ... })
  })

  describe('Error Handling', () => {
    it('should display API error message when request fails', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Invalid phone number format'
      render(<LoginForm onSuccess={mockOnSuccess} error={errorMessage} />)

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should display rate limit error message', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Too many code requests. Please try again later.'
      render(<LoginForm onSuccess={mockOnSuccess} error={errorMessage} />)

      expect(screen.getByText(/too many code requests/i)).toBeInTheDocument()
    })

    it('should clear error when user starts typing after error', async () => {
      const user = userEvent.setup()
      const mockClearError = vi.fn()
      render(
        <LoginForm
          onSuccess={mockOnSuccess}
          error="Some error"
          onClearError={mockClearError}
        />
      )

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '+1')

      expect(mockClearError).toHaveBeenCalled()
    })

    it('should keep form enabled after error', async () => {
      render(<LoginForm onSuccess={mockOnSuccess} error="Some error" />)

      const submitButton = screen.getByRole('button', { name: /request code/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association with input', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      expect(phoneInput).toHaveAttribute('type', 'tel')
    })

    it('should mark phone input as required', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      expect(phoneInput).toBeRequired()
    })

    it('should have aria-invalid when validation fails', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, 'invalid')
      await user.click(screen.getByRole('button', { name: /request code/i }))

      await waitFor(() => {
        expect(phoneInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should have aria-describedby pointing to error message', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.click(screen.getByRole('button', { name: /request code/i }))

      await waitFor(() => {
        const ariaDescribedBy = phoneInput.getAttribute('aria-describedby')
        expect(ariaDescribedBy).toBeTruthy()
      })
    })
  })

  describe('User Interactions', () => {
    it('should allow typing in phone input', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement
      await user.type(phoneInput, '+1234567890')

      expect(phoneInput.value).toBe('+1234567890')
    })

    it('should allow clearing phone input', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement
      await user.type(phoneInput, '+1234567890')
      await user.clear(phoneInput)

      expect(phoneInput.value).toBe('')
    })

    it('should submit form on Enter key press', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<LoginForm onSuccess={mockOnSuccess} onSubmit={mockSubmit} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '+1234567890{Enter}')

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Integration with React Hook Form', () => {
    it('should use controlled input with react-hook-form', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)

      // Type incrementally and check value updates
      await user.type(phoneInput, '+1')
      expect(phoneInput).toHaveValue('+1')

      await user.type(phoneInput, '234567890')
      expect(phoneInput).toHaveValue('+1234567890')
    })

    it('should validate on blur', async () => {
      const user = userEvent.setup()
      render(<LoginForm onSuccess={mockOnSuccess} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, 'invalid')
      await user.tab() // Trigger blur

      // Validation error should appear after blur
      await waitFor(() => {
        expect(screen.getByText(/E\.164 format/i)).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid successive submissions', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(<LoginForm onSuccess={mockOnSuccess} onSubmit={mockSubmit} />)

      const phoneInput = screen.getByLabelText(/phone number/i)
      await user.type(phoneInput, '+1234567890')

      const submitButton = screen.getByRole('button', { name: /request code/i })
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)

      // Should only submit once (or handle multiple calls gracefully)
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle component unmount during loading', () => {
      const { unmount } = render(
        <LoginForm onSuccess={mockOnSuccess} isLoading={true} />
      )

      expect(() => unmount()).not.toThrow()
    })
  })
})
