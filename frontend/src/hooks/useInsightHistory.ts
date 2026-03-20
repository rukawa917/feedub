/**
 * useInsightHistory - Fetches paginated insight history
 * Uses offset-based pagination with existing usePagination hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '../stores/auth'
import { usePagination } from './usePagination'
import { getInsightHistory } from '../services/insights-service'
import type { InsightSummary } from '../types/insights'

interface UseInsightHistoryReturn {
  insights: InsightSummary[]
  total: number
  isLoading: boolean
  error: Error | null
  offset: number
  limit: number
  hasMore: boolean
  loadNextPage: () => void
  reset: () => void
  refetch: () => Promise<void>
}

export function useInsightHistory(): UseInsightHistoryReturn {
  const token = useAuthStore((state) => state.token)
  const { offset, limit, loadNextPage, reset: resetPagination } = usePagination({ limit: 20 })

  const [insights, setInsights] = useState<InsightSummary[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchHistory = useCallback(
    async (shouldAppend: boolean = false) => {
      if (!token) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const data = await getInsightHistory(limit, offset)

        if (shouldAppend && offset > 0) {
          // Append for "load more"
          setInsights((prev) => [...prev, ...data.insights])
        } else {
          // Replace for initial load or refetch
          setInsights(data.insights)
        }
        setTotal(data.total)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch insight history'))
      } finally {
        setIsLoading(false)
      }
    },
    [token, limit, offset]
  )

  // Fetch when offset changes (for pagination)
  useEffect(() => {
    fetchHistory(offset > 0)
  }, [offset, fetchHistory])

  // Computed: has more items to load
  const hasMore = useMemo(() => {
    return offset + limit < total
  }, [offset, limit, total])

  // Reset pagination and refetch
  const reset = useCallback(() => {
    resetPagination()
    setInsights([])
  }, [resetPagination])

  // Refetch from beginning
  const refetch = useCallback(async () => {
    resetPagination()
    setInsights([])
    // Wait for state to update, then fetch
    await new Promise((resolve) => setTimeout(resolve, 0))
    await fetchHistory(false)
  }, [resetPagination, fetchHistory])

  return {
    insights,
    total,
    isLoading,
    error,
    offset,
    limit,
    hasMore,
    loadNextPage,
    reset,
    refetch,
  }
}
