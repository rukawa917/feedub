/**
 * OnboardingGuide component
 *
 * Displays a user-friendly guide when no channels are selected,
 * explaining how to select channels and sync messages.
 */

import { MessageSquare, CheckSquare, RefreshCw, ArrowRight } from 'lucide-react'

interface OnboardingGuideProps {
  /** Whether the current view is mobile */
  isMobile?: boolean
  /** Callback to open mobile filter drawer */
  onOpenFilters?: () => void
}

export function OnboardingGuide({ isMobile, onOpenFilters }: OnboardingGuideProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center animate-fade-in-up">
      {/* Welcome Icon */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal/20 to-primary/10 border border-teal/30 flex items-center justify-center mb-6 shadow-glow-teal">
        <MessageSquare className="h-10 w-10 text-teal" />
      </div>

      {/* Welcome Message */}
      <h3 className="text-2xl font-bold text-foreground mb-2">Welcome to Feedub!</h3>

      <p className="text-foreground-muted mb-8 max-w-md leading-relaxed">
        Get started by selecting your Telegram channels and syncing your messages.
      </p>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-4 text-left">
        {/* Step 1 */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border hover:border-border-highlight transition-colors">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground mb-1">1. Select Channels</h4>
            <p className="text-sm text-foreground-muted">
              {isMobile ? (
                <>
                  Tap the filter button in the header to open the sidebar, then select the channels
                  you want to sync.
                </>
              ) : (
                <>
                  In the sidebar on the left, select the Telegram channels you want to sync messages
                  from.
                </>
              )}
            </p>
            {isMobile && onOpenFilters && (
              <button
                onClick={onOpenFilters}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Open Filters
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border hover:border-border-highlight transition-colors">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground mb-1">2. Sync Messages</h4>
            <p className="text-sm text-foreground-muted">
              After selecting channels, click the "Start Sync" button in the sidebar to fetch your
              messages from Telegram.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Tip */}
      <p className="mt-8 text-xs text-foreground-muted max-w-sm">
        Your messages will be indexed for lightning-fast search after syncing.
      </p>
    </div>
  )
}
