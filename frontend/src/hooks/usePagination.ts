/**
 * Pagination hook for managing offset-based pagination
 * FR-014: "Load More" button pagination
 */

import { useState, useCallback } from 'react'

export interface UsePaginationOptions {
  /**
   * Number of items per page
   * @default 50
   */
  limit?: number
}

export interface UsePaginationReturn {
  /** Current offset (number of items to skip) */
  offset: number

  /** Number of items per page */
  limit: number

  /** Load next page (increment offset by limit) */
  loadNextPage: () => void

  /** Reset pagination to first page */
  reset: () => void
}

/**
 * Hook for managing offset-based pagination
 *
 * @param options - Pagination options
 * @returns Pagination state and controls
 *
 * @example
 * ```tsx
 * const { offset, limit, loadNextPage, reset } = usePagination({ limit: 50 })
 *
 * // Use offset/limit in API query
 * const apiParams = { offset, limit, ...filters }
 *
 * // Load more button
 * <button onClick={loadNextPage}>Load More</button>
 *
 * // Reset when filters change
 * useEffect(() => { reset() }, [filters])
 * ```
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { limit = 50 } = options
  const [offset, setOffset] = useState(0)

  const loadNextPage = useCallback(() => {
    setOffset((prev) => prev + limit)
  }, [limit])

  const reset = useCallback(() => {
    setOffset(0)
  }, [])

  return {
    offset,
    limit,
    loadNextPage,
    reset,
  }
}
