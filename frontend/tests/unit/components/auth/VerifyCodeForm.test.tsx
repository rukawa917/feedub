import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VerifyCodeForm } from '@/components/auth/VerifyCodeForm'

/**
 * T029 [P] Component test for VerifyCode form
 *
 * Tests the VerifyCodeForm component behavior including:
 * - Code input rendering (5-digit verification code)
 * - Optional 2FA password input
 * - Form validation
 * - Form submission
 * - Loading states
 * - Error display
 * - API integration (mocked)
 *
 * Reference: contracts/auth-contract.md lines 271-299, spec.md User Story 1
 */
describe('VerifyCodeForm Component', () => {
  const mockOnSuccess = vi.fn()
  const mockPhoneNumber = '+1234567890'
  const mockPhoneHash = 'mock-phone-hash-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render verification code input field', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      expect(codeInput).toBeInTheDocument()
    })

    it('should render submit button with text "Verify Code"', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const submitButton = screen.getByRole('button', { name: /verify code/i })
      expect(submitButton).toBeInTheDocument()
    })

    it('should NOT render 2FA password field initially', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const passwordInput = screen.queryByLabelText(/password/i)
      expect(passwordInput).not.toBeInTheDocument()
    })

    it('should render 2FA password field when show2FA is true', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          show2FA={true}
        />
      )

      const passwordInput = screen.getByLabelText(/2FA password|password/i)
      expect(passwordInput).toBeInTheDocument()
    })

    it('should display phone number being verified', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(mockPhoneNumber)).toBeInTheDocument()
    })

    it('should have code input with placeholder for 5 digits', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByPlaceholderText(/12345/i)
      expect(codeInput).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show validation error when submitting empty form', async () => {
      const user = userEvent.setup()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const submitButton = screen.getByRole('button', { name: /verify code/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/code is required/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for code shorter than 5 digits', async () => {
      const user = userEvent.setup()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '1234')
      await user.click(screen.getByRole('button', { name: /verify code/i }))

      await waitFor(() => {
        expect(screen.getByText(/5 digits/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for code longer than 5 digits', async () => {
      const user = userEvent.setup()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '123456')
      await user.click(screen.getByRole('button', { name: /verify code/i }))

      await waitFor(() => {
        expect(screen.getByText(/5 digits/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for code with non-digits', async () => {
      const user = userEvent.setup()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '12a45')
      await user.click(screen.getByRole('button', { name: /verify code/i }))

      await waitFor(() => {
        expect(screen.getByText(/only digits/i)).toBeInTheDocument()
      })
    })

    it('should not show validation errors for valid 5-digit code', async () => {
      const user = userEvent.setup()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '12345')

      // No validation errors should be visible
      expect(screen.queryByText(/5 digits/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/only digits/i)).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with code when valid form is submitted', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          onSubmit={mockSubmit}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '12345')
      await user.click(screen.getByRole('button', { name: /verify code/i }))

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            phone_number: mockPhoneNumber,
            phone_code_hash: mockPhoneHash,
            code: '12345',
          })
        )
      })
    })

    it('should call onSubmit with code and password when 2FA is provided', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          onSubmit={mockSubmit}
          show2FA={true}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      const passwordInput = screen.getByLabelText(/2FA password|password/i)

      await user.type(codeInput, '12345')
      await user.type(passwordInput, 'my2fapassword')
      await user.click(screen.getByRole('button', { name: /verify code/i }))

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            phone_number: mockPhoneNumber,
            phone_code_hash: mockPhoneHash,
            code: '12345',
            password: 'my2fapassword',
          })
        )
      })
    })

    it('should disable submit button while request is in progress', async () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          isLoading={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /verify code/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show loading indicator in button when isLoading is true', async () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          isLoading={true}
        />
      )

      expect(
        screen.getByRole('button', { name: /verifying|loading/i })
      ).toBeInTheDocument()
    })

    it('should call onSuccess callback after successful verification', async () => {
      const user = userEvent.setup()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '12345')
      await user.click(screen.getByRole('button', { name: /verify code/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display API error message when verification fails', async () => {
      const errorMessage = 'Invalid verification code'
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          error={errorMessage}
        />
      )

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should display 2FA required error and show password field', async () => {
      const errorMessage = 'Two-factor authentication required'
      const mockOnRequire2FA = vi.fn()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          error={errorMessage}
          onRequire2FA={mockOnRequire2FA}
        />
      )

      // Error message should be displayed
      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()

      // Callback should be called to show 2FA field
      expect(mockOnRequire2FA).toHaveBeenCalled()
    })

    it('should display invalid 2FA password error', async () => {
      const errorMessage = 'Invalid two-factor authentication password'
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          error={errorMessage}
          show2FA={true}
        />
      )

      expect(screen.getByText(/invalid.*password/i)).toBeInTheDocument()
    })

    it('should clear error when user starts typing in code field', async () => {
      const user = userEvent.setup()
      const mockClearError = vi.fn()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          error="Some error"
          onClearError={mockClearError}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '1')

      expect(mockClearError).toHaveBeenCalled()
    })

    it('should keep form enabled after error', async () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          error="Invalid code"
        />
      )

      const submitButton = screen.getByRole('button', { name: /verify code/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('2FA Flow', () => {
    it('should initially hide 2FA password field', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
    })

    it('should show 2FA password field when show2FA prop is true', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          show2FA={true}
        />
      )

      expect(screen.getByLabelText(/2FA password|password/i)).toBeInTheDocument()
    })

    it('should make password field optional (not required)', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          show2FA={true}
        />
      )

      const passwordInput = screen.getByLabelText(/2FA password|password/i)
      // Password field should be optional (per schema in data-model.md line 386)
      expect(passwordInput).not.toBeRequired()
    })

    it('should allow submitting without 2FA password if field is shown but empty', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          onSubmit={mockSubmit}
          show2FA={true}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '12345')
      await user.click(screen.getByRole('button', { name: /verify code/i }))

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            code: '12345',
            password: undefined, // or omitted
          })
        )
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association with code input', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      expect(codeInput).toHaveAttribute('type', 'text')
    })

    it('should mark code input as required', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      expect(codeInput).toBeRequired()
    })

    it('should have aria-invalid when validation fails', async () => {
      const user = userEvent.setup()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '123')
      await user.click(screen.getByRole('button', { name: /verify code/i }))

      await waitFor(() => {
        expect(codeInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should have proper label for 2FA password field when shown', () => {
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          show2FA={true}
        />
      )

      const passwordInput = screen.getByLabelText(/2FA password|password/i)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('User Interactions', () => {
    it('should allow typing 5 digits in code input', async () => {
      const user = userEvent.setup()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i) as HTMLInputElement
      await user.type(codeInput, '12345')

      expect(codeInput.value).toBe('12345')
    })

    it('should allow clearing code input', async () => {
      const user = userEvent.setup()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i) as HTMLInputElement
      await user.type(codeInput, '12345')
      await user.clear(codeInput)

      expect(codeInput.value).toBe('')
    })

    it('should submit form on Enter key press in code field', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          onSubmit={mockSubmit}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i)
      await user.type(codeInput, '12345{Enter}')

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })

    it('should allow pasting code into input', async () => {
      const user = userEvent.setup()
      render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
        />
      )

      const codeInput = screen.getByLabelText(/verification code/i) as HTMLInputElement
      await user.click(codeInput)
      await user.paste('54321')

      expect(codeInput.value).toBe('54321')
    })
  })

  describe('Edge Cases', () => {
    // MOVED TO INTEGRATION TESTS: tests/integration/components/auth/VerifyCodeForm.integration.test.tsx
    // This test requires actual API mocking with React Query mutations and proper debouncing
    // it('should handle rapid successive submissions', async () => { ... })

    it('should handle component unmount during loading', () => {
      const { unmount } = render(
        <VerifyCodeForm
          phoneNumber={mockPhoneNumber}
          phoneHash={mockPhoneHash}
          onSuccess={mockOnSuccess}
          isLoading={true}
        />
      )

      expect(() => unmount()).not.toThrow()
    })

    it('should handle missing phoneNumber prop gracefully', () => {
      expect(() => {
        render(
          <VerifyCodeForm
            phoneNumber=""
            phoneHash={mockPhoneHash}
            onSuccess={mockOnSuccess}
          />
        )
      }).not.toThrow()
    })

    it('should handle missing phoneHash prop gracefully', () => {
      expect(() => {
        render(
          <VerifyCodeForm
            phoneNumber={mockPhoneNumber}
            phoneHash=""
            onSuccess={mockOnSuccess}
          />
        )
      }).not.toThrow()
    })
  })
})
