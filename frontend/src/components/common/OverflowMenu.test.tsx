/**
 * OverflowMenu component tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverflowMenu } from './OverflowMenu'

describe('OverflowMenu', () => {
  const defaultProps = {
    onToggleAll: vi.fn(),
    isShowingAll: false,
    onSync: vi.fn(),
    isSyncing: false,
    onExportTxt: vi.fn(),
    onExportMarkdown: vi.fn(),
    isExporting: false,
    onToggleFilters: vi.fn(),
    isFiltersOpen: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders menu trigger button', () => {
    render(<OverflowMenu {...defaultProps} />)
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('opens menu on click', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('shows All option and calls onToggleAll when clicked', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /all/i }))

    expect(defaultProps.onToggleAll).toHaveBeenCalledTimes(1)
  })

  it('shows check mark when isShowingAll is true', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu {...defaultProps} isShowingAll={true} />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))

    const allItem = screen.getByRole('menuitem', { name: /show filtered messages/i })
    expect(allItem).toBeInTheDocument()
  })

  it('shows Sync option and calls onSync when clicked', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /sync messages/i }))

    expect(defaultProps.onSync).toHaveBeenCalledTimes(1)
  })

  it('disables Sync when isSyncing is true', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu {...defaultProps} isSyncing={true} />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))

    const syncItem = screen.getByRole('menuitem', { name: /syncing/i })
    expect(syncItem).toBeDisabled()
  })

  it('shows Export submenu and expands on click', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /export messages/i }))

    expect(screen.getByRole('menuitem', { name: /export as txt/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /export as markdown/i })).toBeInTheDocument()
  })

  it('calls onExportTxt when TXT option is clicked', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /export messages/i }))
    await user.click(screen.getByRole('menuitem', { name: /export as txt/i }))

    expect(defaultProps.onExportTxt).toHaveBeenCalledTimes(1)
  })

  it('calls onExportMarkdown when Markdown option is clicked', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /export messages/i }))
    await user.click(screen.getByRole('menuitem', { name: /export as markdown/i }))

    expect(defaultProps.onExportMarkdown).toHaveBeenCalledTimes(1)
  })

  it('shows Filters option and calls onToggleFilters when clicked', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /open filters/i }))

    expect(defaultProps.onToggleFilters).toHaveBeenCalledTimes(1)
  })

  it('closes menu on Escape key', async () => {
    const user = userEvent.setup()
    render(<OverflowMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <OverflowMenu {...defaultProps} />
        <button data-testid="outside">Outside</button>
      </div>
    )

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    // Simulate clicking outside
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('renders with minimum props', () => {
    render(<OverflowMenu />)
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('has 44px minimum touch target', () => {
    render(<OverflowMenu {...defaultProps} />)
    const button = screen.getByRole('button', { name: /open menu/i })
    expect(button).toHaveClass('h-11', 'w-11')
  })
})
