/**
 * Hook for managing user's saved channel selections
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import {
  getChannelSelections,
  updateChannelSelections,
  type ChannelSelection,
  type UpdateChannelSelectionsRequest,
} from '@/services/api/channels'
import { queryKeys } from './query-keys'

export interface UseChannelSelectionsReturn {
  data: ChannelSelection[] | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updateSelections: (request: UpdateChannelSelectionsRequest) => Promise<ChannelSelection[] | null>
  isUpdating: boolean
  updateError: Error | null
}

/**
 * Hook to fetch and manage user's channel selections
 *
 * Automatically fetches selections on mount.
 * Provides updateSelections function to save new selections.
 *
 * @returns Selections data, loading state, error, refetch function, and update function
 *
 * @example
 * ```tsx
 * const { data: selections, isLoading, updateSelections, isUpdating } = useChannelSelections()
 *
 * const handleSaveSelections = async (channelIds: number[]) => {
 *   const request = {
 *     channels: channelIds.map(id => ({
 *       channel_id: id,
 *       channel_title: getChannelTitle(id),
 *       channel_type: 'channel'
 *     }))
 *   }
 *   await updateSelections(request)
 * }
 *
 * if (isLoading) return <div>Loading...</div>
 *
 * return <ChannelSelector selections={selections} onSave={handleSaveSelections} />
 * ```
 */
export function useChannelSelections(): UseChannelSelectionsReturn {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.channels.selections(),
    queryFn: () => getChannelSelections(token!),
    enabled: !!token,
    select: (res) => res.selections,
  })

  const mutation = useMutation({
    mutationFn: (request: UpdateChannelSelectionsRequest) =>
      updateChannelSelections(token!, request),
    onSuccess: (res) => {
      queryClient.setQueryData(queryKeys.channels.selections(), res)
    },
  })

  const refetch = async () => {
    await query.refetch()
  }

  const updateSelectionsCallback = async (
    request: UpdateChannelSelectionsRequest
  ): Promise<ChannelSelection[] | null> => {
    const res = await mutation.mutateAsync(request)
    return res.selections
  }

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch,
    updateSelections: updateSelectionsCallback,
    isUpdating: mutation.isPending,
    updateError: mutation.error as Error | null,
  }
}
