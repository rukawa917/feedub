/**
 * ValidationSummary Component - LLM Insights
 *
 * Displays pre-validation results with actionable recovery suggestions.
 * Design: Brutalist-minimal with bold geometric borders and high contrast states.
 */

import React from 'react'
import { CheckCircle, AlertTriangle, Loader2, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ValidationResponse } from '@/types/insights'

interface ValidationSummaryProps {
  validation: ValidationResponse | null
  isValidating: boolean
  onApplySuggestedFilters: (filters: ValidationResponse['suggested_filters']) => void
}

export function ValidationSummary({
  validation,
  isValidating,
  onApplySuggestedFilters,
}: ValidationSummaryProps) {
  // Loading state with skeleton
  if (isValidating) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-border/30',
          'bg-gradient-subtle p-5',
          'animate-pulse'
        )}
      >
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-foreground-muted mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-foreground-muted/10 rounded" />
            <div className="h-3 w-32 bg-foreground-muted/10 rounded" />
          </div>
        </div>
      </div>
    )
  }

  // No validation data
  if (!validation) {
    return null
  }

  // Valid state - clean success with geometric accent
  if (validation.valid && !validation.exceeds_limit) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl',
          'border-2 border-teal/20 bg-gradient-to-br from-teal/5 to-transparent',
          'p-5 transition-all duration-300',
          'animate-fade-in'
        )}
      >
        {/* Left accent bar - bold geometric element */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal to-teal/50" />

        <div className="flex items-start gap-4 pl-3">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-teal/20 blur-md rounded-full" />
            <CheckCircle className="relative h-5 w-5 text-teal" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {validation.message_count.toLocaleString()} messages
              </span>
              <span className="text-xs text-foreground-muted">•</span>
              <span className="text-xs text-foreground-muted font-mono">
                ~{Math.round(validation.estimated_tokens / 1000)}K tokens estimated
              </span>
            </div>
          </div>

          {/* Ready indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal/10 border border-teal/20">
            <Zap className="h-3 w-3 text-teal" />
            <span className="text-xs font-medium text-teal-foreground">Ready</span>
          </div>
        </div>
      </div>
    )
  }

  // Warning state - exceeds limit with suggested fixes
  const suggestedFilters = validation.suggested_filters
  const hasDateSuggestion = suggestedFilters?.narrower_date_range
  const hasChannelSuggestion =
    suggestedFilters?.fewer_channels && suggestedFilters.fewer_channels.length > 0

  // Calculate impact estimates (these would ideally come from backend)
  const dateImpactEstimate = hasDateSuggestion ? Math.round(validation.message_count * 0.6) : 0
  const channelImpactEstimate = hasChannelSuggestion
    ? Math.round(validation.message_count * 0.35)
    : 0

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        'border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent',
        'transition-all duration-300',
        'animate-fade-in-up'
      )}
    >
      {/* Top accent bar - bold warning stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

      <div className="p-6 pt-7 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0 mt-0.5">
            <div className="absolute inset-0 bg-amber-500/20 blur-lg rounded-full" />
            <AlertTriangle className="relative h-6 w-6 text-amber-500" />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <h3 className="text-base font-medium text-foreground tracking-tight">
              Too many messages selected
            </h3>
            <p className="text-sm text-foreground-muted leading-relaxed">
              <span className="font-mono font-medium text-foreground">
                {validation.message_count.toLocaleString()}
              </span>{' '}
              messages selected{' '}
              <span className="text-amber-500">
                (max {(validation.max_messages ?? 1000).toLocaleString()})
              </span>
            </p>
          </div>
        </div>

        {/* Suggested fixes section */}
        {(hasDateSuggestion || hasChannelSuggestion) && (
          <div className="space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium uppercase tracking-wide text-amber-500">
                Quick Fixes
              </span>
            </div>

            {/* Suggestions list */}
            <div className="space-y-2.5">
              {/* Date range suggestion */}
              {hasDateSuggestion && (
                <div className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-background-subtle transition-colors duration-150">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-sm text-foreground">Shorten to last 7 days</div>
                    <div className="text-xs text-foreground-muted font-mono">
                      Reduces by ~{dateImpactEstimate.toLocaleString()} messages
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-150"
                    onClick={() =>
                      onApplySuggestedFilters({ narrower_date_range: hasDateSuggestion })
                    }
                  >
                    Apply
                  </Button>
                </div>
              )}

              {/* Channel suggestion */}
              {hasChannelSuggestion && (
                <div className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-background-subtle transition-colors duration-150">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-sm text-foreground">
                      Remove "{suggestedFilters.fewer_channels[0]}"
                    </div>
                    <div className="text-xs text-foreground-muted font-mono">
                      Reduces by ~{channelImpactEstimate.toLocaleString()} messages
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-150"
                    onClick={() =>
                      onApplySuggestedFilters({ fewer_channels: suggestedFilters.fewer_channels })
                    }
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No suggestions available */}
        {!hasDateSuggestion && !hasChannelSuggestion && (
          <div className="p-4 rounded-lg border border-border/50 bg-background-subtle/50">
            <p className="text-xs text-foreground-muted leading-relaxed">
              Try narrowing your date range or selecting fewer channels to reduce message count.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
