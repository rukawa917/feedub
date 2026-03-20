/**
 * InsightDetail Component - Refined Editorial Design
 *
 * Full-page view of LLM-generated insights with layered visual hierarchy.
 * Aesthetic: Editorial minimalism with dramatic typography and subtle depth.
 *
 * Design principles:
 * - Large serif headlines for gravitas
 * - Layered cards with subtle shadows and backgrounds
 * - Generous whitespace for breathing room
 * - Monospace metadata for technical precision
 * - Staggered animations for elegant entrance
 */

import React from 'react'
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { InsightHtmlContent } from './InsightHtmlContent'
import type { InsightDetail as InsightDetailType } from '@/types/insights'

export interface InsightDetailProps {
  insight: InsightDetailType | null
  isLoading: boolean
  onBack: () => void
}

/**
 * Get status badge configuration
 */
function getStatusConfig(status: InsightDetailType['status']) {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle,
        label: 'Ready',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      }
    case 'generating':
      return {
        icon: Loader2,
        label: 'Generating',
        className: 'bg-primary/10 text-primary border-primary/20 animate-pulse',
      }
    case 'pending':
      return {
        icon: Clock,
        label: 'Pending',
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      }
    case 'failed':
      return {
        icon: XCircle,
        label: 'Failed',
        className: 'bg-destructive/10 text-destructive border-destructive/20',
      }
    default:
      return {
        icon: AlertCircle,
        label: 'Unknown',
        className: 'bg-background-muted text-foreground-muted border-border',
      }
  }
}

/**
 * Format date range for display
 */
function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate || !endDate) return 'No date range'

  try {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
    const startStr = start.toLocaleDateString('en-US', options)
    const endStr = end.toLocaleDateString('en-US', options)

    // Same year optimization
    if (start.getFullYear() === end.getFullYear()) {
      const shortOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
      const startShort = start.toLocaleDateString('en-US', shortOptions)
      return `${startShort} – ${endStr}`
    }

    return `${startStr} – ${endStr}`
  } catch {
    return 'Invalid date range'
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return 'Unknown date'
  }
}

/**
 * Loading skeleton component
 */
function InsightDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-12 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-10 w-20 bg-background-muted rounded animate-pulse" />
          <div className="h-8 w-24 bg-background-muted rounded-full animate-pulse" />
        </div>

        {/* Timestamp skeleton */}
        <div className="h-6 w-48 bg-background-muted rounded animate-pulse" />

        {/* Source info skeleton */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-32 bg-background-muted rounded mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-background-muted rounded" />
              <div className="h-4 w-3/4 bg-background-muted rounded" />
            </div>
          </CardHeader>
        </Card>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-48 bg-background-muted rounded animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-background-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-background-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-background-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Metadata skeleton */}
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="h-4 w-full bg-background-muted rounded mb-2" />
            <div className="h-4 w-3/4 bg-background-muted rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Insight content component with error handling
 */
function InsightContent({ content }: { content: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          {content}
        </div>
      }
    >
      <InsightHtmlContent content={content} />
    </ErrorBoundary>
  )
}

/**
 * InsightDetail Component
 */
export function InsightDetail({ insight, isLoading, onBack }: InsightDetailProps) {
  // Loading state
  if (isLoading) {
    return <InsightDetailSkeleton />
  }

  // No insight state
  if (!insight) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8 lg:p-12 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-8 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="w-12 h-12 text-foreground-muted mb-4" />
            <h2 className="font-serif text-2xl text-foreground mb-2">Insight Not Found</h2>
            <p className="text-sm text-foreground-muted">
              The requested insight could not be loaded.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(insight.status)
  const StatusIcon = statusConfig.icon

  // Failed state
  if (insight.status === 'failed') {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8 lg:p-12 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-fade-in-down">
            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.className}`}
            >
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </div>
          </div>

          {/* Error card */}
          <Card
            className="border-destructive/30 bg-destructive/5 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-xl text-destructive mb-2">Generation Failed</h2>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {insight.error_message ||
                      'An unknown error occurred during insight generation.'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Metadata (still show what we have) */}
          {insight.created_at && (
            <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <p className="text-xs font-mono text-foreground-muted">
                Attempted {formatTimestamp(insight.created_at)}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-12 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header: Back button + Status badge */}
        <div className="flex items-center justify-between animate-fade-in-down">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.className}`}
          >
            <StatusIcon
              className={`w-4 h-4 ${insight.status === 'generating' ? 'animate-spin' : ''}`}
            />
            {statusConfig.label}
          </div>
        </div>

        {/* Timestamp */}
        {insight.completed_at && (
          <p
            className="text-sm text-foreground-muted font-mono animate-fade-in-up"
            style={{ animationDelay: '50ms' }}
          >
            Generated {formatTimestamp(insight.completed_at)}
          </p>
        )}

        {/* Source Information Card */}
        <Card
          className="bg-gradient-subtle border-border-highlight animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <CardHeader>
            <h3 className="font-serif text-lg font-medium text-foreground mb-3">
              Source Information
            </h3>
            <div className="space-y-2 text-sm">
              {/* Channels */}
              {insight.chat_titles && insight.chat_titles.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-foreground-muted shrink-0">Channels:</span>
                  <span className="text-foreground/90">{insight.chat_titles.join(', ')}</span>
                </div>
              )}

              {/* Date Range */}
              <div className="flex items-start gap-2">
                <span className="font-medium text-foreground-muted shrink-0">Date Range:</span>
                <span className="text-foreground/90">
                  {formatDateRange(insight.start_date, insight.end_date)}
                </span>
              </div>

              {/* Message Count */}
              <div className="flex items-start gap-2">
                <span className="font-medium text-foreground-muted shrink-0">Messages:</span>
                <span className="text-foreground/90">{insight.message_count.toLocaleString()}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        {insight.summary && (
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <InsightContent content={insight.summary} />
          </div>
        )}
      </div>
    </div>
  )
}
