/**
 * BackToTop component tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackToTop } from './BackToTop'

describe('BackToTop', () => {
  let scrollToMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window.scrollTo
    scrollToMock = vi.fn()
    Object.defineProperty(window, 'scrollTo', {
      writable: true,
      value: scrollToMock,
    })

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders button with correct aria-label', () => {
    render(<BackToTop />)
    expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument()
  })

  it('renders ChevronUp icon', () => {
    render(<BackToTop />)
    const button = screen.getByTestId('back-to-top')
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('is hidden by default when scroll is 0', () => {
    render(<BackToTop />)
    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('opacity-0', 'pointer-events-none')
  })

  it('appears when scrolled past default threshold (500px)', () => {
    render(<BackToTop />)

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 501,
    })
    fireEvent.scroll(window)

    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('opacity-100')
    expect(button).not.toHaveClass('pointer-events-none')
  })

  it('respects custom threshold', () => {
    render(<BackToTop threshold={300} />)

    // Scroll to 301px (above custom threshold)
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 301,
    })
    fireEvent.scroll(window)

    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('opacity-100')
  })

  it('hides when scrolled below threshold', () => {
    render(<BackToTop threshold={500} />)

    // First scroll past threshold
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 501,
    })
    fireEvent.scroll(window)

    let button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('opacity-100')

    // Then scroll back below threshold
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 100,
    })
    fireEvent.scroll(window)

    button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('opacity-0')
  })

  it('scrolls to top with smooth behavior when clicked', async () => {
    const user = userEvent.setup()

    // Set scroll to show button
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 600,
    })

    render(<BackToTop />)
    fireEvent.scroll(window)

    const button = screen.getByRole('button', { name: /back to top/i })
    await user.click(button)

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    })
  })

  it('applies custom className', () => {
    render(<BackToTop className="custom-class" />)
    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('custom-class')
  })

  it('has fixed positioning at bottom-right', () => {
    render(<BackToTop />)
    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('fixed', 'bottom-6', 'right-6')
  })

  it('has z-40 for proper layering', () => {
    render(<BackToTop />)
    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('z-40')
  })

  it('has rounded-full shape', () => {
    render(<BackToTop />)
    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('rounded-full')
  })

  it('has shadow for elevation', () => {
    render(<BackToTop />)
    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('shadow-lg')
  })

  it('has transition classes for smooth animation', () => {
    render(<BackToTop />)
    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('transition-all', 'duration-300', 'ease-in-out')
  })

  it('removes scroll listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(<BackToTop />)
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })

  it('uses passive scroll listener for performance', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    render(<BackToTop />)

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
    })
  })

  it('performs initial scroll check on mount', () => {
    // Set scrollY before mount
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 600,
    })

    render(<BackToTop />)

    // Should be visible immediately without needing scroll event
    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('opacity-100')
  })

  it('shows translate animation when hidden', () => {
    render(<BackToTop />)
    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('translate-y-2')
  })

  it('removes translate when visible', () => {
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 600,
    })

    render(<BackToTop />)
    fireEvent.scroll(window)

    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('translate-y-0')
  })

  it('has 44px minimum touch target size', () => {
    render(<BackToTop />)
    const button = screen.getByTestId('back-to-top')
    expect(button).toHaveClass('h-11', 'w-11')
  })

  it('uses secondary variant for consistent styling', () => {
    render(<BackToTop />)
    const button = screen.getByTestId('back-to-top')
    // Button component applies bg-background-subtle for secondary variant
    expect(button).toHaveClass('bg-background-subtle')
  })
})
