/**
 * FeedbackWidget component tests
 *
 * Tests T054-T056:
 * - T054: Delayed appearance (30s or user action)
 * - T055: Minimized/collapsed state
 * - T056: localStorage persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { FeedbackWidget } from './FeedbackWidget'
import { useAuthStore } from '@/stores/auth'
import * as storage from '@/utils/storage'

// Mock dependencies
vi.mock('@/stores/auth')
vi.mock('@/utils/storage')
vi.mock('./FeedbackForm', () => ({
  FeedbackForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="feedback-form">
      <button onClick={onSuccess}>Submit</button>
    </div>
  ),
}))

describe('FeedbackWidget', () => {
  let isAuthenticatedValue: boolean

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    isAuthenticatedValue = true
    vi.mocked(useAuthStore).mockImplementation(
      (selector?: (state: { isAuthenticated: () => boolean }) => unknown) => {
        const state = {
          isAuthenticated: () => isAuthenticatedValue,
        }
        return selector ? selector(state) : state
      }
    )
    vi.mocked(storage.safeGetItem).mockReturnValue(null)
    vi.mocked(storage.safeSetItem).mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Authentication', () => {
    it('does not render when user is not authenticated', () => {
      isAuthenticatedValue = false
      render(<FeedbackWidget />)

      expect(screen.queryByTestId('feedback-widget')).not.toBeInTheDocument()
    })

    it('renders when user is authenticated and visible', () => {
      render(<FeedbackWidget />)

      // Trigger user action to show widget
      fireEvent.click(window)

      expect(screen.getByTestId('feedback-widget')).toBeInTheDocument()
    })
  })

  describe('T054: Delayed Appearance', () => {
    it('does not show immediately on mount', () => {
      render(<FeedbackWidget />)

      expect(screen.queryByTestId('feedback-widget')).not.toBeInTheDocument()
    })

    it('shows after 30 seconds delay', () => {
      render(<FeedbackWidget />)

      expect(screen.queryByTestId('feedback-widget')).not.toBeInTheDocument()

      // Fast-forward 30 seconds with act to flush state updates
      act(() => {
        vi.advanceTimersByTime(30000)
      })

      expect(screen.getByTestId('feedback-widget')).toBeInTheDocument()
    })

    it('shows on user click action', () => {
      render(<FeedbackWidget />)

      expect(screen.queryByTestId('feedback-widget')).not.toBeInTheDocument()

      // Trigger click event
      fireEvent.click(window)

      expect(screen.getByTestId('feedback-widget')).toBeInTheDocument()
    })

    it('shows on user scroll action', () => {
      render(<FeedbackWidget />)

      expect(screen.queryByTestId('feedback-widget')).not.toBeInTheDocument()

      // Trigger scroll event
      fireEvent.scroll(window)

      expect(screen.getByTestId('feedback-widget')).toBeInTheDocument()
    })

    it('shows on user keydown action', () => {
      render(<FeedbackWidget />)

      expect(screen.queryByTestId('feedback-widget')).not.toBeInTheDocument()

      // Trigger keydown event
      fireEvent.keyDown(window)

      expect(screen.getByTestId('feedback-widget')).toBeInTheDocument()
    })

    it('does not show twice if timeout triggers after user action', () => {
      render(<FeedbackWidget />)

      // User action shows widget
      fireEvent.click(window)

      expect(screen.getByTestId('feedback-widget')).toBeInTheDocument()

      // Fast-forward past timeout with act to flush state updates
      act(() => {
        vi.advanceTimersByTime(30000)
      })

      // Should still only have one widget
      expect(screen.getAllByTestId('feedback-widget')).toHaveLength(1)
    })

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = render(<FeedbackWidget />)
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('clears timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { unmount } = render(<FeedbackWidget />)
      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('T055: Minimized/Collapsed State', () => {
    beforeEach(() => {
      render(<FeedbackWidget />)
      // Show widget with user action
      fireEvent.click(window)
      // No waitFor needed - fireEvent is synchronous with state updates
    })

    it('shows expanded state by default', () => {
      expect(screen.getByTestId('feedback-button')).toBeInTheDocument()
      expect(screen.queryByTestId('feedback-expand-button')).not.toBeInTheDocument()
    })

    it('shows minimize button in expanded state', () => {
      expect(screen.getByTestId('feedback-minimize-button')).toBeInTheDocument()
      expect(screen.getByLabelText('Minimize feedback widget')).toBeInTheDocument()
    })

    it('toggles to minimized state when minimize button clicked', () => {
      const minimizeButton = screen.getByTestId('feedback-minimize-button')

      fireEvent.click(minimizeButton)

      expect(screen.queryByTestId('feedback-button')).not.toBeInTheDocument()
      expect(screen.getByTestId('feedback-expand-button')).toBeInTheDocument()
    })

    it('shows expand button in minimized state', () => {
      const minimizeButton = screen.getByTestId('feedback-minimize-button')

      fireEvent.click(minimizeButton)

      expect(screen.getByLabelText('Expand feedback widget')).toBeInTheDocument()
      expect(screen.queryByLabelText('Minimize feedback widget')).not.toBeInTheDocument()
    })

    it('toggles back to expanded state when expand button clicked', () => {
      // Minimize first
      fireEvent.click(screen.getByTestId('feedback-minimize-button'))
      expect(screen.getByTestId('feedback-expand-button')).toBeInTheDocument()

      // Then expand
      fireEvent.click(screen.getByTestId('feedback-expand-button'))
      expect(screen.getByTestId('feedback-button')).toBeInTheDocument()
      expect(screen.queryByTestId('feedback-expand-button')).not.toBeInTheDocument()
    })

    it('minimized button shows ChevronUp icon', () => {
      fireEvent.click(screen.getByTestId('feedback-minimize-button'))

      const expandButton = screen.getByTestId('feedback-expand-button')
      expect(expandButton.querySelector('svg')).toBeInTheDocument()
    })

    it('expanded button shows MessageSquarePlus icon and text', () => {
      const feedbackButton = screen.getByTestId('feedback-button')

      expect(feedbackButton.querySelector('svg')).toBeInTheDocument()
      expect(screen.getByText('Feedback')).toBeInTheDocument()
    })

    it('minimized button has 44px minimum touch target', () => {
      fireEvent.click(screen.getByTestId('feedback-minimize-button'))

      const expandButton = screen.getByTestId('feedback-expand-button')
      expect(expandButton).toHaveClass('h-11', 'w-11')
    })

    it('has smooth transition animations', () => {
      const widget = screen.getByTestId('feedback-widget')
      expect(widget).toHaveClass('transition-all', 'duration-300', 'ease-in-out')
    })
  })

  describe('T056: localStorage Persistence', () => {
    it('loads minimized state from localStorage on mount', () => {
      vi.mocked(storage.safeGetItem).mockReturnValue({ isMinimized: true })

      render(<FeedbackWidget />)
      fireEvent.click(window)

      expect(screen.getByTestId('feedback-expand-button')).toBeInTheDocument()
    })

    it('saves minimized state when minimize button clicked', () => {
      render(<FeedbackWidget />)
      fireEvent.click(window)

      expect(screen.getByTestId('feedback-widget')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('feedback-minimize-button'))

      expect(storage.safeSetItem).toHaveBeenCalledWith('feedub:feedback-widget-state', {
        isMinimized: true,
      })
    })

    it('saves expanded state when expand button clicked', () => {
      vi.mocked(storage.safeGetItem).mockReturnValue({ isMinimized: true })

      render(<FeedbackWidget />)
      fireEvent.click(window)

      expect(screen.getByTestId('feedback-expand-button')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('feedback-expand-button'))

      expect(storage.safeSetItem).toHaveBeenCalledWith('feedub:feedback-widget-state', {
        isMinimized: false,
      })
    })

    it('uses correct storage key', () => {
      render(<FeedbackWidget />)
      fireEvent.click(window)

      expect(storage.safeGetItem).toHaveBeenCalledWith('feedub:feedback-widget-state')
    })

    it('handles missing localStorage data gracefully', () => {
      vi.mocked(storage.safeGetItem).mockReturnValue(null)

      render(<FeedbackWidget />)
      fireEvent.click(window)

      // Should show expanded by default
      expect(screen.getByTestId('feedback-button')).toBeInTheDocument()
    })
  })

  describe('Feedback Modal', () => {
    beforeEach(() => {
      render(<FeedbackWidget />)
      fireEvent.click(window)
      // No waitFor needed - fireEvent is synchronous with state updates
    })

    it('opens modal when feedback button clicked', () => {
      fireEvent.click(screen.getByTestId('feedback-button'))

      expect(screen.getByText('Send Feedback')).toBeInTheDocument()
      expect(screen.getByTestId('feedback-form')).toBeInTheDocument()
    })

    it('shows modal title and description', () => {
      fireEvent.click(screen.getByTestId('feedback-button'))

      expect(screen.getByText('Send Feedback')).toBeInTheDocument()
      expect(
        screen.getByText(/Help us improve Feedub by sharing your thoughts/i)
      ).toBeInTheDocument()
    })

    it('closes modal when dialog is dismissed', () => {
      fireEvent.click(screen.getByTestId('feedback-button'))
      expect(screen.getByTestId('feedback-form')).toBeInTheDocument()

      // Dialog uses Escape key to close
      fireEvent.keyDown(document, { key: 'Escape' })

      // Check that modal is closed
      expect(screen.queryByTestId('feedback-form')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      render(<FeedbackWidget />)
      fireEvent.click(window)
      // No waitFor needed - fireEvent is synchronous with state updates
    })

    it('feedback button has correct aria-label', () => {
      const button = screen.getByLabelText('Send feedback')
      expect(button).toBeInTheDocument()
    })

    it('minimize button has correct aria-label', () => {
      const button = screen.getByLabelText('Minimize feedback widget')
      expect(button).toBeInTheDocument()
    })

    it('expand button has correct aria-label', () => {
      fireEvent.click(screen.getByTestId('feedback-minimize-button'))

      const button = screen.getByLabelText('Expand feedback widget')
      expect(button).toBeInTheDocument()
    })

    it('buttons have focus ring styles', () => {
      const feedbackButton = screen.getByTestId('feedback-button')
      expect(feedbackButton).toHaveClass('focus:ring-2', 'focus:ring-primary')
    })
  })

  describe('Positioning and Styling', () => {
    beforeEach(() => {
      render(<FeedbackWidget />)
      fireEvent.click(window)
      // No waitFor needed - fireEvent is synchronous with state updates
    })

    it('has fixed positioning at bottom-right', () => {
      const widget = screen.getByTestId('feedback-widget')
      expect(widget).toHaveClass('fixed', 'bottom-6', 'right-6')
    })

    it('has high z-index for proper layering', () => {
      const widget = screen.getByTestId('feedback-widget')
      expect(widget).toHaveClass('z-[60]')
    })

    it('buttons have rounded-full shape', () => {
      const feedbackButton = screen.getByTestId('feedback-button')
      expect(feedbackButton).toHaveClass('rounded-full')
    })

    it('buttons have shadow for elevation', () => {
      const feedbackButton = screen.getByTestId('feedback-button')
      expect(feedbackButton).toHaveClass('shadow-lg')
    })

    it('buttons have hover effects', () => {
      const feedbackButton = screen.getByTestId('feedback-button')
      expect(feedbackButton).toHaveClass('hover:bg-primary/90', 'hover:scale-105')
    })
  })
})
