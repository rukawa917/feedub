/**
 * T067: LoadMoreButton component
 *
 * Pagination button to load more messages
 * Requirements:
 * - FR-014: "Load More" button for pagination
 * - Show current page info
 * - Disable when no more pages
 */

import { Button } from '../ui/button'
import { ChevronDown, Loader2 } from 'lucide-react'

interface LoadMoreButtonProps {
  /** Current page number (zero-indexed) */
  currentPage: number

  /** Total number of pages */
  totalPages: number

  /** Callback when button is clicked */
  onLoadMore: () => void

  /** Loading state */
  isLoading?: boolean
}

/**
 * LoadMoreButton component
 *
 * Displays a "Load More" button for pagination
 * Shows current page/total pages
 * Disabled when on last page or loading
 */
export function LoadMoreButton({
  currentPage,
  totalPages,
  onLoadMore,
  isLoading = false,
}: LoadMoreButtonProps) {
  const hasNextPage = currentPage < totalPages - 1
  const displayPage = currentPage + 1 // Convert from zero-indexed to one-indexed for display

  if (!hasNextPage) {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <span className="text-sm text-foreground-muted">End of messages</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <Button
        onClick={onLoadMore}
        disabled={isLoading}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />
            Load More
          </>
        )}
      </Button>
      <span className="text-xs text-foreground-muted">
        Page {displayPage} of {totalPages}
      </span>
    </div>
  )
}
