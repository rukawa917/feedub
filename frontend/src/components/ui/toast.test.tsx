/**
 * Toast component tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast, ToastContainer } from './toast'

describe('Toast', () => {
  const mockOnDismiss = vi.fn()

  const defaultProps = {
    id: 'test-toast',
    message: 'Test message',
    onDismiss: mockOnDismiss,
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders message correctly', () => {
    render(<Toast {...defaultProps} />)
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders with success variant styling', () => {
    render(<Toast {...defaultProps} variant="success" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-success/10')
  })

  it('renders with error variant styling', () => {
    render(<Toast {...defaultProps} variant="error" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-error/10')
  })

  it('renders with warning variant styling', () => {
    render(<Toast {...defaultProps} variant="warning" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-warning/10')
  })

  it('renders with info variant styling', () => {
    render(<Toast {...defaultProps} variant="info" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-info/10')
  })

  it('auto-dismisses after duration', () => {
    render(<Toast {...defaultProps} duration={4000} />)

    expect(mockOnDismiss).not.toHaveBeenCalled()

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(4000)
    })

    // Wait for exit animation
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(mockOnDismiss).toHaveBeenCalledWith('test-toast')
  })

  it('does not auto-dismiss when duration is 0', () => {
    render(<Toast {...defaultProps} duration={0} />)

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(mockOnDismiss).not.toHaveBeenCalled()
  })

  it('dismisses on close button click', async () => {
    vi.useRealTimers() // Use real timers for user interaction
    const user = userEvent.setup()

    render(<Toast {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    // Wait a bit for the exit animation timeout
    await new Promise((r) => setTimeout(r, 400))

    expect(mockOnDismiss).toHaveBeenCalledWith('test-toast')
  })

  it('renders action button when provided', () => {
    const action = {
      label: 'Undo',
      onClick: vi.fn(),
    }

    render(<Toast {...defaultProps} action={action} />)

    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('calls action onClick when action button is clicked', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const action = {
      label: 'Undo',
      onClick: vi.fn(),
    }

    render(<Toast {...defaultProps} action={action} />)

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(action.onClick).toHaveBeenCalled()
  })

  it('has role="alert" for accessibility', () => {
    render(<Toast {...defaultProps} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('has aria-live="polite" for accessibility', () => {
    render(<Toast {...defaultProps} />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite')
  })
})

describe('ToastContainer', () => {
  const mockOnDismiss = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders multiple toasts', () => {
    const toasts = [
      { id: '1', message: 'Toast 1' },
      { id: '2', message: 'Toast 2' },
    ]

    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />)

    expect(screen.getByText('Toast 1')).toBeInTheDocument()
    expect(screen.getByText('Toast 2')).toBeInTheDocument()
  })

  it('limits visible toasts to maxVisible', () => {
    const toasts = [
      { id: '1', message: 'Toast 1' },
      { id: '2', message: 'Toast 2' },
      { id: '3', message: 'Toast 3' },
      { id: '4', message: 'Toast 4' },
    ]

    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} maxVisible={3} />)

    // Only the last 3 toasts should be visible
    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument()
    expect(screen.getByText('Toast 2')).toBeInTheDocument()
    expect(screen.getByText('Toast 3')).toBeInTheDocument()
    expect(screen.getByText('Toast 4')).toBeInTheDocument()
  })

  it('uses default maxVisible of 3', () => {
    const toasts = [
      { id: '1', message: 'Toast 1' },
      { id: '2', message: 'Toast 2' },
      { id: '3', message: 'Toast 3' },
      { id: '4', message: 'Toast 4' },
    ]

    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />)

    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument()
    expect(screen.getByText('Toast 4')).toBeInTheDocument()
  })

  it('is positioned at bottom-right', () => {
    const toasts = [{ id: '1', message: 'Toast 1' }]
    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />)

    const container = screen.getByLabelText('Notifications')
    expect(container).toHaveClass('fixed', 'bottom-4', 'right-4')
  })

  it('renders nothing when toasts array is empty', () => {
    render(<ToastContainer toasts={[]} onDismiss={mockOnDismiss} />)

    const container = screen.getByLabelText('Notifications')
    expect(container.children).toHaveLength(0)
  })

  it('passes onDismiss to each toast', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const toasts = [{ id: '1', message: 'Toast 1' }]

    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />)

    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    await new Promise((r) => setTimeout(r, 400))

    expect(mockOnDismiss).toHaveBeenCalledWith('1')
  })
})
