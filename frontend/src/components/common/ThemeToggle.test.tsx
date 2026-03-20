/**
 * ThemeToggle component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'
import { useThemeStore } from '../../stores/theme'

// Mock the theme store
vi.mock('../../stores/theme', () => ({
  useThemeStore: vi.fn(),
}))

describe('ThemeToggle', () => {
  const mockToggleTheme = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders button with correct aria-label in dark mode', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      render(<ThemeToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
    })

    it('renders button with correct aria-label in light mode', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      render(<ThemeToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
    })

    it('renders in icon-only mode by default', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      render(<ThemeToggle />)

      // Should not have text label
      expect(screen.queryByText('Light')).not.toBeInTheDocument()
      expect(screen.queryByText('Dark')).not.toBeInTheDocument()
    })

    it('renders with text label when iconOnly is false', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      render(<ThemeToggle iconOnly={false} />)

      expect(screen.getByText('Light')).toBeInTheDocument()
    })
  })

  describe('Title Attribute (Native Tooltip)', () => {
    it('has correct title attribute in dark mode', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      render(<ThemeToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Switch to light mode')
    })

    it('has correct title attribute in light mode', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      render(<ThemeToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Switch to dark mode')
    })

    it('title attribute updates when theme changes', () => {
      // Start in dark mode
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })
      const { rerender } = render(<ThemeToggle />)

      expect(screen.getByRole('button')).toHaveAttribute('title', 'Switch to light mode')

      // Switch to light mode
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })
      rerender(<ThemeToggle />)
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Switch to dark mode')
    })
  })

  describe('Icon Animation', () => {
    it('shows sun icon with correct rotation in dark mode', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      const { container } = render(<ThemeToggle />)

      // Sun should be visible (rotate-0, scale-100, opacity-100)
      const sunIcon = container.querySelector('svg.lucide-sun')
      expect(sunIcon).toHaveClass('rotate-0', 'scale-100', 'opacity-100')
    })

    it('shows moon icon with correct rotation in light mode', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      const { container } = render(<ThemeToggle />)

      // Moon should be visible (rotate-0, scale-100, opacity-100)
      const moonIcon = container.querySelector('svg.lucide-moon')
      expect(moonIcon).toHaveClass('rotate-0', 'scale-100', 'opacity-100')
    })

    it('hides sun icon with rotation in light mode', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      const { container } = render(<ThemeToggle />)

      // Sun should be hidden with rotation (rotate-90, scale-0, opacity-0)
      const sunIcon = container.querySelector('svg.lucide-sun')
      expect(sunIcon).toHaveClass('rotate-90', 'scale-0', 'opacity-0')
    })

    it('hides moon icon with rotation in dark mode', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      const { container } = render(<ThemeToggle />)

      // Moon should be hidden with rotation (-rotate-90, scale-0, opacity-0)
      const moonIcon = container.querySelector('svg.lucide-moon')
      expect(moonIcon).toHaveClass('-rotate-90', 'scale-0', 'opacity-0')
    })

    it('has smooth transition classes on both icons', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      const { container } = render(<ThemeToggle />)

      const sunIcon = container.querySelector('svg.lucide-sun')
      const moonIcon = container.querySelector('svg.lucide-moon')

      expect(sunIcon).toHaveClass('transition-all', 'duration-300')
      expect(moonIcon).toHaveClass('transition-all', 'duration-300')
    })
  })

  describe('Interaction', () => {
    it('calls toggleTheme on button click', async () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      const user = userEvent.setup()
      render(<ThemeToggle />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockToggleTheme).toHaveBeenCalledTimes(1)
    })

    it('has proper touch target size (44x44 minimum)', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      render(<ThemeToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-w-[44px]', 'min-h-[44px]')
    })

    it('has hover styles', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      render(<ThemeToggle />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-background-subtle', 'hover:text-foreground')
    })
  })

  describe('Accessibility', () => {
    it('is keyboard accessible', async () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      const user = userEvent.setup()
      render(<ThemeToggle />)

      const button = screen.getByRole('button')

      // Tab to button
      await user.tab()
      expect(button).toHaveFocus()

      // Activate with keyboard
      await user.keyboard('{Enter}')
      expect(mockToggleTheme).toHaveBeenCalled()
    })

    it('has appropriate aria-label that describes the action', () => {
      vi.mocked(useThemeStore).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        setTheme: vi.fn(),
      })

      render(<ThemeToggle />)

      const button = screen.getByRole('button')
      const ariaLabel = button.getAttribute('aria-label')

      // Should describe what will happen when clicked
      expect(ariaLabel).toContain('Switch to')
    })
  })
})
