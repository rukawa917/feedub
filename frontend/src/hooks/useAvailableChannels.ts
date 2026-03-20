/**
 * Hook for fetching available channels from Telegram
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { getAvailableChannels } from '@/services/api/channels'
import type { AvailableChannel } from '@/services/api/channels'
import { queryKeys } from './query-keys'

export interface UseAvailableChannelsReturn {
  data: AvailableChannel[] | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch available channels from Telegram
 *
 * Does NOT auto-fetch on mount (channel list should be fetched on-demand).
 * Use refetch() to manually fetch the channel list.
 *
 * @returns Channel list data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data: channels, isLoading, error, refetch } = useAvailableChannels()
 *
 * const handleRefreshChannels = () => {
 *   refetch()
 * }
 *
 * if (isLoading) return <div>Loading channels...</div>
 * if (error) return <div>Error: {error.message}</div>
 *
 * return <ChannelList channels={channels} />
 * ```
 */
export function useAvailableChannels(): UseAvailableChannelsReturn {
  const token = useAuthStore((s) => s.token)

  const query = useQuery({
    queryKey: queryKeys.channels.available(),
    queryFn: () => getAvailableChannels(token!),
    enabled: false, // on-demand only; caller uses refetch()
    select: (res) => res.channels,
  })

  const refetch = async () => {
    await query.refetch()
  }

  return {
    data: query.data ?? null,
    isLoading: query.isFetching,
    error: query.error as Error | null,
    refetch,
  }
}
