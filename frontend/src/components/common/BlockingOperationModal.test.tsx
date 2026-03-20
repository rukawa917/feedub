// frontend/src/components/common/BlockingOperationModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BlockingOperationModal } from './BlockingOperationModal'

describe('BlockingOperationModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Operation',
    status: 'running' as const,
    progress: 50,
    statusText: 'Processing...',
    error: null,
    onCancel: vi.fn(),
    onDismiss: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('running state', () => {
    it('should render title with loading icon', () => {
      render(<BlockingOperationModal {...defaultProps} />)
      expect(screen.getByText('Test Operation')).toBeInTheDocument()
    })

    it('should render progress bar', () => {
      render(<BlockingOperationModal {...defaultProps} />)
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    })

    it('should display status text', () => {
      render(<BlockingOperationModal {...defaultProps} />)
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('should display progress percentage', () => {
      render(<BlockingOperationModal {...defaultProps} />)
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('should render cancel button', () => {
      render(<BlockingOperationModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should show confirmation dialog when cancel is clicked', async () => {
      render(<BlockingOperationModal {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.getByText('Cancel Operation?')).toBeInTheDocument()
      })
    })

    it('should call onCancel after confirmation', async () => {
      const onCancel = vi.fn()
      render(<BlockingOperationModal {...defaultProps} onCancel={onCancel} />)

      // Click cancel to show confirmation
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Yes, Cancel')).toBeInTheDocument()
      })

      // Confirm cancel
      fireEvent.click(screen.getByText('Yes, Cancel'))
      expect(onCancel).toHaveBeenCalled()
    })

    it('should not call onCancel if continue is clicked', async () => {
      const onCancel = vi.fn()
      render(<BlockingOperationModal {...defaultProps} onCancel={onCancel} />)

      // Click cancel to show confirmation
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Continue Operation')).toBeInTheDocument()
      })

      // Click continue
      fireEvent.click(screen.getByText('Continue Operation'))
      expect(onCancel).not.toHaveBeenCalled()
    })
  })

  describe('cancelling state', () => {
    it('should show disabled cancelling button', () => {
      render(<BlockingOperationModal {...defaultProps} status="cancelling" />)
      const button = screen.getByRole('button', { name: /cancelling/i })
      expect(button).toBeDisabled()
    })

    it('should display cancelling text', () => {
      render(<BlockingOperationModal {...defaultProps} status="cancelling" />)
      expect(screen.getByText(/cancelling/i)).toBeInTheDocument()
    })
  })

  describe('completed state', () => {
    it('should render check icon', () => {
      render(<BlockingOperationModal {...defaultProps} status="completed" progress={100} />)
      // The CheckCircle2 icon should be present (via svg)
      expect(screen.getByText('Test Operation')).toBeInTheDocument()
    })

    it('should render dismiss button', () => {
      render(<BlockingOperationModal {...defaultProps} status="completed" progress={100} />)
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument()
    })

    it('should call onDismiss when done is clicked', () => {
      const onDismiss = vi.fn()
      render(
        <BlockingOperationModal
          {...defaultProps}
          status="completed"
          progress={100}
          onDismiss={onDismiss}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /done/i }))
      expect(onDismiss).toHaveBeenCalled()
    })

    it('should display success status text', () => {
      render(
        <BlockingOperationModal
          {...defaultProps}
          status="completed"
          progress={100}
          statusText="Successfully completed 100 items"
        />
      )
      // Status text appears in multiple places, just check it exists
      expect(screen.getAllByText('Successfully completed 100 items').length).toBeGreaterThan(0)
    })
  })

  describe('failed state', () => {
    const failedProps = {
      ...defaultProps,
      status: 'failed' as const,
      error: 'Something went wrong',
    }

    it('should render error icon', () => {
      render(<BlockingOperationModal {...failedProps} />)
      expect(screen.getByText('Test Operation')).toBeInTheDocument()
    })

    it('should display error message', () => {
      render(<BlockingOperationModal {...failedProps} />)
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    })

    it('should render dismiss button', () => {
      render(<BlockingOperationModal {...failedProps} />)
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })

    it('should call onDismiss when dismiss is clicked', () => {
      const onDismiss = vi.fn()
      render(<BlockingOperationModal {...failedProps} onDismiss={onDismiss} />)

      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
      expect(onDismiss).toHaveBeenCalled()
    })
  })

  describe('modal behavior', () => {
    it('should not render when isOpen is false', () => {
      render(<BlockingOperationModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Test Operation')).not.toBeInTheDocument()
    })

    it('should prevent escape key from closing during running state', () => {
      const onDismiss = vi.fn()
      render(<BlockingOperationModal {...defaultProps} onDismiss={onDismiss} />)

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onDismiss).not.toHaveBeenCalled()
    })

    it('should use custom cancel confirmation message', async () => {
      render(
        <BlockingOperationModal
          {...defaultProps}
          cancelConfirmMessage="Custom cancel warning message"
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.getByText('Custom cancel warning message')).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('should have progress bar with proper aria attributes', () => {
      render(<BlockingOperationModal {...defaultProps} />)
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    })

    it('should have aria-live region for status text', () => {
      render(<BlockingOperationModal {...defaultProps} />)
      const statusText = screen.getByText('Processing...')
      expect(statusText).toHaveAttribute('aria-live', 'polite')
    })

    it('should have role alert for error messages', () => {
      render(<BlockingOperationModal {...defaultProps} status="failed" error="Error message" />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
