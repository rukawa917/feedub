/**
 * ExportLimitWarning - Styled warning banner for export limit (T016-T019)
 *
 * Features:
 * - Alert styling with amber/warning colors
 * - AlertTriangle icon
 * - Dismissible (session-persistent)
 * - "Refine filters" action
 */

import * as React from 'react'
import { AlertTriangle, X } from 'lucide-react'

const STORAGE_KEY = 'feedub_export_warning_dismissed'

interface ExportLimitWarningProps {
  /** Total count of messages that could be exported */
  totalCount: number
  /** Maximum export limit */
  maxLimit?: number
  /** Callback when "Refine filters" is clicked */
  onRefineFilters?: () => void
  /** Additional CSS classes */
  className?: string
}

export function ExportLimitWarning({
  totalCount,
  maxLimit = 1000,
  onRefineFilters,
  className = '',
}: ExportLimitWarningProps) {
  const [isDismissed, setIsDismissed] = React.useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === 'true'
  })

  // Don't show if under limit or dismissed
  if (totalCount <= maxLimit || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setIsDismissed(true)
  }

  const handleRefineFilters = () => {
    onRefineFilters?.()
  }

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl
        bg-warning/10 border border-warning/30
        animate-fade-in-up
        ${className}
      `}
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <strong>Export limited to {maxLimit.toLocaleString()} messages.</strong> You have{' '}
          {totalCount.toLocaleString()} messages matching your filters.
        </p>
        <p className="text-sm text-foreground-muted mt-1">
          Refine your filters to export specific messages, or export in batches.
        </p>

        {onRefineFilters && (
          <button
            onClick={handleRefineFilters}
            className="mt-2 text-sm font-medium text-warning hover:text-warning/80 transition-colors"
          >
            Refine filters
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="p-1.5 rounded-lg hover:bg-warning/10 transition-colors shrink-0"
        aria-label="Dismiss warning"
      >
        <X className="h-4 w-4 text-foreground-muted" />
      </button>
    </div>
  )
}
