/**
 * UsageIndicator Component
 * Displays daily LLM insights quota with positive framing
 * Shows remaining insights (not used) with visual dots and countdown
 */

import { useMemo } from 'react'
import { Sparkles, Clock } from 'lucide-react'
import type { UsageStatus } from '../../../types/insights'
import { cn } from '@/lib/utils'

export interface UsageIndicatorProps {
  usage: UsageStatus | null
  isLoading: boolean
  className?: string
}

/**
 * Calculate time remaining until reset
 * Returns formatted string like "4h 23m" or "23m" or "45s"
 */
function getTimeUntilReset(resetAt: string): string {
  const now = Date.now()
  const reset = new Date(resetAt).getTime()
  const diffMs = reset - now

  if (diffMs <= 0) return '0s'

  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  const seconds = Math.floor((diffMs % 60000) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m`
  }
  return `${seconds}s`
}

export function UsageIndicator({ usage, isLoading, className }: UsageIndicatorProps) {
  // Calculate time until reset - must be called unconditionally (React hooks rule)
  const timeUntilReset = useMemo(() => {
    if (!usage?.resets_at) return ''
    return getTimeUntilReset(usage.resets_at)
  }, [usage?.resets_at])

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2',
          className
        )}
        role="status"
        aria-label="Loading usage status"
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
        <span className="text-xs text-foreground-muted font-medium">Loading...</span>
      </div>
    )
  }

  // No usage data
  if (!usage) {
    return null
  }

  const { daily_limit, remaining_today } = usage
  const isExhausted = remaining_today <= 0

  // Render dots (filled = remaining, empty = used)
  const renderDots = () => {
    return (
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: daily_limit }).map((_, index) => {
          // Show remaining dots as filled (positive framing)
          const isFilled = index < remaining_today
          return (
            <div
              key={index}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                isFilled
                  ? 'bg-primary shadow-sm shadow-primary/30 scale-100'
                  : isExhausted
                    ? 'bg-border/50 scale-90'
                    : 'bg-border scale-90'
              )}
            />
          )
        })}
      </div>
    )
  }

  // Normal state - has remaining insights
  if (!isExhausted) {
    return (
      <div
        className={cn(
          'group relative flex items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2',
          'hover:border-primary/30 hover:bg-card-elevated transition-all duration-200',
          'cursor-help',
          className
        )}
        role="status"
        aria-label={`${remaining_today} of ${daily_limit} insights remaining today`}
        title="Resets at midnight UTC"
      >
        {/* Icon with subtle glow */}
        <Sparkles
          className="h-4 w-4 text-primary flex-shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-medium text-foreground whitespace-nowrap">
            {remaining_today} insight{remaining_today !== 1 ? 's' : ''} remaining
          </span>
          {renderDots()}
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    )
  }

  // Exhausted state - no remaining insights
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg border border-border/50 bg-card/50 px-3.5 py-2',
        'cursor-help',
        className
      )}
      role="status"
      aria-label={`0 of ${daily_limit} insights remaining, resets in ${timeUntilReset}`}
      title={`Resets at ${new Date(usage.resets_at ?? '').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })}`}
    >
      {/* Clock icon - muted */}
      <Clock
        className="h-4 w-4 text-foreground-muted flex-shrink-0 animate-pulse"
        strokeWidth={2}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-xs font-medium text-foreground-muted whitespace-nowrap">
          Resets in {timeUntilReset}
        </span>
        {renderDots()}
        <span className="text-[10px] text-foreground-muted/70 font-mono whitespace-nowrap">
          0 remaining
        </span>
      </div>
    </div>
  )
}
