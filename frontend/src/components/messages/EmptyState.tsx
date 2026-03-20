/**
 * T054 + T013: EmptyState component with onboarding variant
 * Displays "No messages found" when no messages exist
 * Requirements:
 * - FR-024: Empty state handling
 * - T013: Onboarding variant for first-time users
 */

import React from 'react'
import { MessageSquare, Search, Inbox } from 'lucide-react'

interface EmptyStateProps {
  /** Optional custom message */
  message?: string

  /** Optional action button (e.g., "Fetch Messages") */
  action?: React.ReactNode

  /** T013: Variant type (default, onboarding, noResults) */
  variant?: 'default' | 'onboarding' | 'noResults'
}

export function EmptyState({ message, action, variant = 'default' }: EmptyStateProps) {
  // T013: Onboarding variant for first-time users
  if (variant === 'onboarding') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal/20 to-primary/10 border border-teal/30 flex items-center justify-center mb-6 shadow-glow-teal">
          <MessageSquare className="h-10 w-10 text-teal" />
        </div>

        <h3 className="text-2xl font-bold text-foreground mb-2">Welcome to Feedub!</h3>

        <p className="text-foreground-muted mb-8 max-w-md leading-relaxed">
          Start by syncing your Telegram messages to see them here. Your messages will be indexed
          for lightning-fast search.
        </p>

        {action && <div className="mt-2">{action}</div>}
      </div>
    )
  }

  // T013: No results variant (for search/filters with no matches)
  if (variant === 'noResults') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center mb-5">
          <Search className="h-8 w-8 text-foreground-muted" />
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          {message || 'No messages found'}
        </h3>

        <p className="text-sm text-foreground-muted max-w-md">
          Try adjusting your filters or search query to find what you're looking for.
        </p>
      </div>
    )
  }

  // Default variant
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center mb-5">
        <Inbox className="h-8 w-8 text-foreground-muted" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{message || 'No messages yet'}</h3>

      <p className="text-sm text-foreground-muted mb-6 max-w-md">
        {action
          ? 'Sync your Telegram messages to start browsing and searching.'
          : 'Try adjusting your filters or search query.'}
      </p>

      {action && <div>{action}</div>}
    </div>
  )
}
