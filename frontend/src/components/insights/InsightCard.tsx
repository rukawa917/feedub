/**
 * InsightCard Component
 *
 * Displays insight history items in a polished card format with status badges.
 * Follows the "Refined Editorial" design system with warm obsidian dark theme.
 */

import { FileText, Clock, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { InsightSummary } from '../../types/insights'

interface InsightCardProps {
  insight: InsightSummary
  onClick: (id: string) => void
}

interface InsightHistoryEmptyProps {
  onGenerateFirst: () => void
}

// Status badge configuration
const statusStyles = {
  pending: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    icon: Clock,
    label: 'Pending',
  },
  generating: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    icon: Loader2,
    label: 'Generating...',
  },
  completed: {
    bg: 'bg-teal/10',
    text: 'text-teal',
    border: 'border-teal/20',
    icon: CheckCircle,
    label: 'Ready',
  },
  failed: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/20',
    icon: XCircle,
    label: 'Failed',
  },
} as const

/**
 * Format date for insight card display
 * Example: "Jan 15, 2024"
 */
function formatInsightDate(timestamp: string | null | undefined): string {
  if (!timestamp) return 'Unknown date'

  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Invalid date'

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const month = monthNames[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()

    return `${month} ${day}, ${year}`
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format chat titles for display
 * Truncates if too many channels
 */
function formatChatTitles(titles: string[] | null, maxDisplay = 3): string {
  if (!titles || titles.length === 0) return 'No channels'

  if (titles.length <= maxDisplay) {
    return titles.join(', ')
  }

  const displayed = titles.slice(0, maxDisplay).join(', ')
  const remaining = titles.length - maxDisplay
  return `${displayed}, +${remaining} more`
}

/**
 * InsightCard Component
 */
export function InsightCard({ insight, onClick }: InsightCardProps) {
  const statusConfig = statusStyles[insight.status]
  const StatusIcon = statusConfig.icon
  const isClickable = insight.status === 'completed'

  const handleClick = () => {
    if (isClickable) {
      onClick(insight.id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(insight.id)
    }
  }

  return (
    <Card
      interactive={isClickable}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `View insight: ${insight.id}` : `Insight ${insight.status}`}
      className="p-5 animate-fade-in-up"
    >
      {/* Header row: Icon + Title + Badge */}
      <div className="flex items-start gap-4 mb-3">
        {/* Document icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-medium text-foreground truncate">
            Insight Summary
          </h3>
        </div>

        {/* Status badge */}
        <div
          className={`
            flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border
            ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
          `}
        >
          <StatusIcon
            className={`w-3.5 h-3.5 ${insight.status === 'generating' ? 'animate-spin' : ''}`}
          />
          <span className="text-xs font-medium font-mono">{statusConfig.label}</span>
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex flex-col gap-1 text-sm text-foreground-muted font-mono">
        {/* Date and message count */}
        <div className="flex items-center gap-2">
          <span>{formatInsightDate(insight.created_at)}</span>
          <span className="text-border">•</span>
          <span>{insight.message_count.toLocaleString()} messages</span>
        </div>

        {/* Chat titles */}
        {insight.chat_titles && insight.chat_titles.length > 0 && (
          <div className="text-foreground-muted/80 truncate">
            {formatChatTitles(insight.chat_titles)}
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * InsightHistoryEmpty Component
 * Displayed when no insights exist yet
 */
export function InsightHistoryEmpty({ onGenerateFirst }: InsightHistoryEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in-up">
      {/* Icon with gradient background */}
      <div className="mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>

      {/* Heading */}
      <h3 className="font-serif text-2xl font-medium text-foreground mb-3">No insights yet</h3>

      {/* Description */}
      <p className="text-foreground-muted max-w-md leading-relaxed mb-6">
        Generate your first AI insight to see it appear here. Insights are saved for 30 days.
      </p>

      {/* CTA Button */}
      <Button onClick={onGenerateFirst} variant="default" size="lg" className="gap-2">
        <span>Generate First Insight</span>
        <span className="text-primary-foreground/70">→</span>
      </Button>
    </div>
  )
}
