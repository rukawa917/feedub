/**
 * useInsightsUsage - Manages daily usage quota for LLM insights
 * Tracks remaining insights and reset time
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '../stores/auth'
import { getUsage } from '../services/insights-service'
import type { UsageStatus } from '../types/insights'

interface UseInsightsUsageReturn {
  usage: UsageStatus | null
  isLoading: boolean
  error: Error | null
  canGenerate: boolean
  resetTimeFormatted: string
  refetch: () => Promise<void>
}

/**
 * Format time remaining until reset
 */
function formatResetTime(resetsAt: string): string {
  const resetDate = new Date(resetsAt)
  const now = new Date()
  const diffMs = resetDate.getTime() - now.getTime()

  if (diffMs <= 0) return 'Resets now'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    return `Resets tomorrow`
  }

  if (hours > 0) {
    return `Resets in ${hours}h ${minutes}m`
  }

  return `Resets in ${minutes}m`
}

export function useInsightsUsage(): UseInsightsUsageReturn {
  const token = useAuthStore((state) => state.token)
  const [usage, setUsage] = useState<UsageStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUsage = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getUsage()
      setUsage(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch usage'))
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Fetch on mount and when token changes
  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  // Computed values - allow generation while loading (backend will enforce limits)
  const canGenerate = useMemo(() => {
    if (usage === null) return true // Allow while loading
    return usage.remaining_today > 0
  }, [usage])

  const resetTimeFormatted = useMemo(() => {
    if (!usage?.resets_at) return ''
    return formatResetTime(usage.resets_at)
  }, [usage])

  return {
    usage,
    isLoading,
    error,
    canGenerate,
    resetTimeFormatted,
    refetch: fetchUsage,
  }
}
