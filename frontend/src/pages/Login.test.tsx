/**
 * Login Page Tests
 * Tests for login page rendering and authentication flow
 *
 * Note: Tests for T049-T051 (Telegram branding and trust indicators)
 * have been removed as these features are not yet implemented.
 * See .sisyphus/plans/008-ui-ux-improvements-tasks.md Phase 3 for planned features.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from './Login'
import { useAuthStore } from '../stores/auth'

// Mock dependencies
vi.mock('../stores/auth')
vi.mock('../components/auth/LoginForm', () => ({
  LoginForm: ({ onSuccess }: { onSuccess: (phone: string, hash: string) => void }) => (
    <div data-testid="login-form">
      <button onClick={() => onSuccess('+1234567890', 'test-hash')}>Submit</button>
    </div>
  ),
}))

vi.mock('../components/common/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Toggle Theme</button>,
}))

vi.mock('../components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: user is not authenticated
    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (state: { isAuthenticated: () => boolean }) => unknown) => {
        const state = {
          isAuthenticated: () => false,
        }
        return selector ? selector(state) : state
      }
    )
  })

  describe('Rendering', () => {
    it('renders the page container', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const container = document.querySelector('.min-h-screen')
      expect(container).toBeInTheDocument()
    })

    it('renders theme toggle in corner', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })

    it('renders login form card', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByTestId('login-form')).toBeInTheDocument()
    })

    it('renders Feedub wordmark', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(screen.getByText('Feedub')).toBeInTheDocument()
      expect(screen.getByText('Feedub')).toHaveClass('font-serif')
    })

    it('renders main tagline', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(screen.getByText('Your messages, beautifully organized')).toBeInTheDocument()
    })
  })

  describe('Animations', () => {
    it('applies fade-in-down animation to header', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const header = screen.getByRole('banner')
      expect(header).toHaveClass('animate-fade-in-down')
    })

    it('applies fade-in-up animation to card', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('animate-fade-in-up')
    })
  })

  describe('Authentication Redirect', () => {
    it('redirects to dashboard if user is authenticated', async () => {
      vi.mocked(useAuthStore).mockImplementation(
        (selector?: (state: { isAuthenticated: () => boolean }) => unknown) => {
          const state = {
            isAuthenticated: () => true,
          }
          return selector ? selector(state) : state
        }
      )

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
      })
    })

    it('does not render form when authenticated', () => {
      vi.mocked(useAuthStore).mockImplementation(
        (selector?: (state: { isAuthenticated: () => boolean }) => unknown) => {
          const state = {
            isAuthenticated: () => true,
          }
          return selector ? selector(state) : state
        }
      )

      const { container } = render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      // Should render nothing or just return null
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Accessibility', () => {
    it('uses semantic header element', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('has readable text contrast classes', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const tagline = screen.getByText('Your messages, beautifully organized')
      expect(tagline).toHaveClass('text-foreground-muted')
    })
  })

  describe('Layout and Spacing', () => {
    it('uses space-y-8 for main content spacing', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const mainContent = screen.getByTestId('card').parentElement
      expect(mainContent).toHaveClass('space-y-8')
    })

    it('centers content vertically and horizontally', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const container = screen.getByTestId('card').parentElement?.parentElement
      expect(container).toHaveClass('min-h-screen', 'items-center', 'justify-center')
    })

    it('limits max width to sm (24rem)', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const mainContent = screen.getByTestId('card').parentElement
      expect(mainContent).toHaveClass('max-w-sm')
    })

    it('applies responsive padding', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const container = screen.getByTestId('card').parentElement?.parentElement
      expect(container).toHaveClass('px-4', 'py-12')
    })
  })

  describe('Design Tokens', () => {
    it('uses muted foreground for descriptive text', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const tagline = screen.getByText('Your messages, beautifully organized')
      expect(tagline).toHaveClass('text-foreground-muted')
    })

    it('uses serif font for wordmark', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const wordmark = screen.getByText('Feedub')
      expect(wordmark).toHaveClass('font-serif')
    })
  })
})
