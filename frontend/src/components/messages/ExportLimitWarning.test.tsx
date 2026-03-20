/**
 * ExportLimitWarning component tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportLimitWarning } from './ExportLimitWarning'

describe('ExportLimitWarning', () => {
  const mockOnRefineFilters = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear sessionStorage before each test
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('renders nothing when totalCount is at or below limit', () => {
    const { container } = render(
      <ExportLimitWarning totalCount={500} onRefineFilters={mockOnRefineFilters} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when totalCount equals limit', () => {
    const { container } = render(
      <ExportLimitWarning totalCount={1000} onRefineFilters={mockOnRefineFilters} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders warning when totalCount exceeds limit', () => {
    render(<ExportLimitWarning totalCount={1500} onRefineFilters={mockOnRefineFilters} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/export limited to 1,000 messages/i)).toBeInTheDocument()
  })

  it('shows correct message count', () => {
    render(<ExportLimitWarning totalCount={2500} onRefineFilters={mockOnRefineFilters} />)

    expect(screen.getByText(/you have 2,500 messages/i)).toBeInTheDocument()
  })

  it('respects custom maxLimit', () => {
    const { container } = render(
      <ExportLimitWarning totalCount={500} maxLimit={400} onRefineFilters={mockOnRefineFilters} />
    )

    expect(container.firstChild).not.toBeNull()
    expect(screen.getByText(/export limited to 400 messages/i)).toBeInTheDocument()
  })

  it('renders "Refine filters" button when callback provided', () => {
    render(<ExportLimitWarning totalCount={1500} onRefineFilters={mockOnRefineFilters} />)

    expect(screen.getByRole('button', { name: /refine filters/i })).toBeInTheDocument()
  })

  it('does not render "Refine filters" button when no callback provided', () => {
    render(<ExportLimitWarning totalCount={1500} />)

    expect(screen.queryByRole('button', { name: /refine filters/i })).not.toBeInTheDocument()
  })

  it('calls onRefineFilters when button is clicked', async () => {
    const user = userEvent.setup()
    render(<ExportLimitWarning totalCount={1500} onRefineFilters={mockOnRefineFilters} />)

    await user.click(screen.getByRole('button', { name: /refine filters/i }))

    expect(mockOnRefineFilters).toHaveBeenCalledTimes(1)
  })

  it('can be dismissed', async () => {
    const user = userEvent.setup()
    render(<ExportLimitWarning totalCount={1500} onRefineFilters={mockOnRefineFilters} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('persists dismissed state in sessionStorage', async () => {
    const user = userEvent.setup()
    render(<ExportLimitWarning totalCount={1500} onRefineFilters={mockOnRefineFilters} />)

    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    expect(sessionStorage.getItem('feedub_export_warning_dismissed')).toBe('true')
  })

  it('does not render when previously dismissed in session', () => {
    sessionStorage.setItem('feedub_export_warning_dismissed', 'true')

    const { container } = render(
      <ExportLimitWarning totalCount={1500} onRefineFilters={mockOnRefineFilters} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('applies custom className', () => {
    render(
      <ExportLimitWarning
        totalCount={1500}
        onRefineFilters={mockOnRefineFilters}
        className="custom-class"
      />
    )

    expect(screen.getByRole('alert')).toHaveClass('custom-class')
  })

  it('has proper aria attributes', () => {
    render(<ExportLimitWarning totalCount={1500} onRefineFilters={mockOnRefineFilters} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('displays AlertTriangle icon', () => {
    render(<ExportLimitWarning totalCount={1500} onRefineFilters={mockOnRefineFilters} />)

    // The icon should be hidden from accessibility tree but present in DOM
    const alert = screen.getByRole('alert')
    const svg = alert.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('has warning color styling', () => {
    render(<ExportLimitWarning totalCount={1500} onRefineFilters={mockOnRefineFilters} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-warning/10', 'border-warning/30')
  })
})
