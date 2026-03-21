/**
 * InsightStream - SSE Streaming Display for LLM Insights
 *
 * Displays real-time streaming content with progress tracking, animations,
 * and state-based UI. Features smooth transitions, typing cursor, and
 * metadata display.
 *
 * Design Philosophy: Editorial refinement meets dynamic information display.
 * Subtle animations guide attention without distraction.
 */

import React from 'react'
import { Loader2, Clock, Sparkles, CheckCircle, XCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InsightHtmlContent } from './InsightHtmlContent'
import type { SSEMetadataEvent, SSEErrorEvent } from '@/types/insights'
import { formatCost, formatTokens } from '@/types/insights'
import { cn } from '@/lib/utils'

type GenerationStatus = 'idle' | 'validating' | 'generating' | 'completed' | 'error'

export interface InsightStreamProps {
  /** Accumulated markdown content from SSE */
  content: string
  /** Current generation status */
  status: GenerationStatus
  /** Progress percentage (0-100) */
  progress: number
  /** Metadata from completed generation */
  metadata: SSEMetadataEvent | null
  /** Error details from SSE error event */
  error: SSEErrorEvent | null
  /** Number of messages analyzed */
  messageCount?: number
  /** Number of channels analyzed */
  channelCount?: number
  /** Callback when user cancels generation */
  onCancel: () => void
  /** Callback when user clicks "View Full Insight" */
  onViewFull?: () => void
  /** Callback when user clicks "Generate Another" */
  onGenerateAnother?: () => void
}

/**
 * Format generation time from milliseconds to human-readable
 */
function formatGenerationTime(ms: number | null): string {
  if (!ms) return 'N/A'
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Typing cursor component with blink animation
 */
function TypingCursor() {
  return (
    <span
      className="inline-block w-2 h-4 bg-primary ml-0.5 align-middle animate-blink"
      aria-hidden="true"
    />
  )
}

/**
 * Progress bar component with smooth transitions
 */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-background-subtle rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-shift transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

/**
 * Status header component - shows icon and message based on generation status
 */
function StatusHeader({
  status,
  messageCount,
  channelCount,
}: {
  status: GenerationStatus
  messageCount?: number
  channelCount?: number
}) {
  const statusConfig = {
    idle: {
      icon: Clock,
      text: 'Preparing your insight...',
      className: 'text-foreground-muted',
      iconClassName: 'text-foreground-muted',
    },
    validating: {
      icon: Loader2,
      text: 'Preparing your insight...',
      className: 'text-foreground-muted',
      iconClassName: 'text-foreground-muted animate-spin',
    },
    generating: {
      icon: Sparkles,
      text: 'Generating insight...',
      className: 'text-primary',
      iconClassName: 'text-primary animate-pulse',
    },
    completed: {
      icon: CheckCircle,
      text: 'Insight Ready!',
      className: 'text-green-600 dark:text-green-500',
      iconClassName: 'text-green-600 dark:text-green-500',
    },
    error: {
      icon: XCircle,
      text: 'Generation failed',
      className: 'text-destructive',
      iconClassName: 'text-destructive',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-3 mb-4">
      <Icon className={cn('h-5 w-5', config.iconClassName)} />
      <div className="flex-1">
        <h3 className={cn('font-medium text-sm', config.className)}>{config.text}</h3>
        {(status === 'validating' || status === 'idle') && messageCount && channelCount && (
          <p className="text-xs text-foreground-muted mt-0.5">
            Analyzing {messageCount.toLocaleString()} messages from {channelCount} channel
            {channelCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Metadata footer component - displays token count, cost, and generation time
 */
function MetadataFooter({ metadata }: { metadata: SSEMetadataEvent }) {
  return (
    <div className="pt-4 mt-4 border-t border-border">
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <div className="flex items-center gap-4">
          <span className="font-mono">
            {formatTokens(metadata.input_tokens, metadata.output_tokens)}
          </span>
          <span className="font-medium">{formatCost(metadata.cost?.toString() || null)}</span>
          <span>{formatGenerationTime(metadata.generation_time_ms)}</span>
        </div>
        <div className="text-right">
          <span className="capitalize">{metadata.provider}</span>
          <span className="mx-1.5">•</span>
          <span className="font-mono">{metadata.model}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Main InsightStream component
 */
export function InsightStream({
  content,
  status,
  progress,
  metadata,
  error,
  messageCount,
  channelCount,
  onCancel,
  onViewFull,
  onGenerateAnother,
}: InsightStreamProps) {
  const showContent = content && (status === 'generating' || status === 'completed')
  const showProgress = status === 'generating' && progress > 0
  const showMetadata = status === 'completed' && metadata
  const showActions = status === 'completed'
  const showCancel = status === 'generating' || status === 'validating'

  return (
    <Card
      className={cn(
        'transition-all duration-500',
        status === 'idle' || status === 'validating' ? 'animate-pulse-subtle' : '',
        status === 'completed' ? 'shadow-lg border-primary/20' : ''
      )}
    >
      <CardContent className="p-6">
        {/* Status Header */}
        <StatusHeader status={status} messageCount={messageCount} channelCount={channelCount} />

        {/* Progress Bar */}
        {showProgress && (
          <div className="mb-4">
            <ProgressBar progress={progress} />
            <p className="text-xs text-foreground-muted text-right mt-1">{Math.round(progress)}%</p>
          </div>
        )}

        {/* Content Display */}
        {showContent && (
          <div
            className={cn(
              'rounded-lg bg-background-subtle border border-border p-4 mb-4',
              status === 'generating' ? 'max-h-96 overflow-y-auto' : 'max-h-[600px] overflow-y-auto'
            )}
          >
            <InsightHtmlContent content={content} />
            {status === 'generating' && <TypingCursor />}
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div
            className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 mb-4"
            role="alert"
          >
            <p className="text-sm text-foreground font-medium mb-1">
              {error?.error === 'rate_limit_exceeded'
                ? 'Daily Limit Reached'
                : error?.error === 'message_limit_exceeded'
                  ? 'Too Many Messages'
                  : 'Generation Failed'}
            </p>
            <p className="text-sm text-foreground-muted leading-relaxed">
              {error?.detail ||
                'Something went wrong while generating your insight. Please try again.'}
            </p>
            {error?.reset_at && (
              <p className="text-xs text-foreground-muted mt-2">
                Resets at {new Date(error.reset_at).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {/* Metadata Footer */}
        {showMetadata && <MetadataFooter metadata={metadata} />}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          {showCancel && (
            <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
              <X className="h-4 w-4" />
              Cancel Generation
            </Button>
          )}

          {showActions && (
            <>
              {onViewFull && (
                <Button variant="default" size="sm" onClick={onViewFull}>
                  View Full Insight
                </Button>
              )}
              {onGenerateAnother && (
                <Button variant="secondary" size="sm" onClick={onGenerateAnother}>
                  Generate Another
                </Button>
              )}
            </>
          )}

          {status === 'error' && onGenerateAnother && (
            <Button variant="default" size="sm" onClick={onGenerateAnother}>
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
