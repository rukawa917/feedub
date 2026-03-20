/**
 * FeedbackWidget Component
 *
 * Floating button in bottom-right corner that opens a feedback modal.
 * Only visible to authenticated users.
 *
 * Features:
 * - T054: Delayed appearance (30s or user action)
 * - T055: Minimized/collapsed state
 * - T056: localStorage persistence
 */

import { useState, useEffect } from 'react'
import { MessageSquarePlus, ChevronUp, Minimize2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FeedbackForm } from './FeedbackForm'
import { useAuthStore } from '@/stores/auth'
import { safeGetItem, safeSetItem } from '@/utils/storage'

const STORAGE_KEY = 'feedub:feedback-widget-state'
const SHOW_DELAY_MS = 30000 // 30 seconds

interface WidgetState {
  isMinimized: boolean
}

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())

  // Load minimized state from localStorage
  useEffect(() => {
    const savedState = safeGetItem<WidgetState>(STORAGE_KEY)
    if (savedState?.isMinimized !== undefined) {
      setIsMinimized(savedState.isMinimized)
    }
  }, [])

  // T054: Delayed appearance - show after 30s or user action
  useEffect(() => {
    if (!isAuthenticated) return

    let hasShown = false

    // Show after 30 seconds
    const timeoutId = setTimeout(() => {
      if (!hasShown) {
        setIsVisible(true)
        hasShown = true
      }
    }, SHOW_DELAY_MS)

    // Show on user action
    const handleUserAction = () => {
      if (!hasShown) {
        setIsVisible(true)
        hasShown = true
      }
    }

    window.addEventListener('click', handleUserAction)
    window.addEventListener('scroll', handleUserAction)
    window.addEventListener('keydown', handleUserAction)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('click', handleUserAction)
      window.removeEventListener('scroll', handleUserAction)
      window.removeEventListener('keydown', handleUserAction)
    }
  }, [isAuthenticated])

  // T056: Persist minimized state
  const handleToggleMinimize = () => {
    const newMinimizedState = !isMinimized
    setIsMinimized(newMinimizedState)
    safeSetItem(STORAGE_KEY, { isMinimized: newMinimizedState })
  }

  // Only show for authenticated users
  if (!isAuthenticated || !isVisible) {
    return null
  }

  return (
    <>
      {/* Floating widget */}
      <div
        data-testid="feedback-widget"
        className="fixed bottom-6 right-6 z-[60] transition-all duration-300 ease-in-out"
      >
        {isMinimized ? (
          // Minimized state - small circular button
          <button
            onClick={handleToggleMinimize}
            data-testid="feedback-expand-button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Expand feedback widget"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        ) : (
          // Expanded state - button with text + minimize button
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(true)}
              data-testid="feedback-button"
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Send feedback"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span className="text-sm font-medium">Feedback</span>
            </button>
            <button
              onClick={handleToggleMinimize}
              data-testid="feedback-minimize-button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Minimize feedback widget"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Feedback modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-[hsl(var(--popover))] border-border">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Help us improve Feedub by sharing your thoughts, reporting bugs, or requesting
              features.
            </DialogDescription>
          </DialogHeader>
          <FeedbackForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
