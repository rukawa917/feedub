/**
 * Hook for managing user's favorite channels
 *
 * Favorites are persisted in the database across sessions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import {
  getChannelFavorites,
  toggleChannelFavorite,
  type ChannelFavorite,
  type AddChannelFavoriteRequest,
} from '@/services/api/channels'
import { queryKeys } from './query-keys'

export interface UseChannelFavoritesReturn {
  /** List of favorite channels */
  favorites: ChannelFavorite[] | null
  /** Set of favorite channel IDs for quick lookup */
  favoriteIds: Set<number>
  /** Loading state for initial fetch */
  isLoading: boolean
  /** Error from fetch */
  error: Error | null
  /** Refetch favorites from server */
  refetch: () => Promise<void>
  /** Toggle a channel's favorite status */
  toggleFavorite: (
    channelId: number,
    metadata?: AddChannelFavoriteRequest
  ) => Promise<boolean | null>
  /** Whether a toggle operation is in progress */
  isToggling: boolean
  /** Error from toggle operation */
  toggleError: Error | null
  /** Check if a channel is favorited */
  isFavorite: (channelId: number) => boolean
}

/**
 * Hook to fetch and manage user's favorite channels
 *
 * Automatically fetches favorites on mount.
 * Provides toggleFavorite function to add/remove favorites.
 *
 * @returns Favorites data, loading state, error, and toggle function
 *
 * @example
 * ```tsx
 * const { favorites, isFavorite, toggleFavorite, isToggling } = useChannelFavorites()
 *
 * const handleToggleFavorite = async (channel: AvailableChannel) => {
 *   await toggleFavorite(channel.channel_id, {
 *     channel_id: channel.channel_id,
 *     channel_title: channel.title,
 *     channel_type: channel.type
 *   })
 * }
 *
 * return (
 *   <button onClick={() => handleToggleFavorite(channel)}>
 *     {isFavorite(channel.channel_id) ? 'Unfavorite' : 'Favorite'}
 *   </button>
 * )
 * ```
 */
export function useChannelFavorites(): UseChannelFavoritesReturn {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.channels.favorites(),
    queryFn: () => getChannelFavorites(token!),
    enabled: !!token,
    select: (res) => res.favorites,
  })

  const mutation = useMutation({
    mutationFn: ({
      channelId,
      metadata,
    }: {
      channelId: number
      metadata?: AddChannelFavoriteRequest
    }) => toggleChannelFavorite(token!, channelId, metadata),
    onSuccess: (res, { channelId }) => {
      // Update cache directly from toggle response
      queryClient.setQueryData(
        queryKeys.channels.favorites(),
        (old: { favorites: ChannelFavorite[]; total: number } | undefined) => {
          if (!old) return old
          if (res.is_favorite && res.favorite) {
            return {
              ...old,
              favorites: [res.favorite, ...old.favorites.filter((f) => f.channel_id !== channelId)],
            }
          }
          return {
            ...old,
            favorites: old.favorites.filter((f) => f.channel_id !== channelId),
          }
        }
      )
    },
  })

  const favorites = query.data ?? null
  const favoriteIds = new Set<number>((favorites ?? []).map((f) => f.channel_id))

  const refetch = async () => {
    await query.refetch()
  }

  const toggleFavoriteCallback = async (
    channelId: number,
    metadata?: AddChannelFavoriteRequest
  ): Promise<boolean | null> => {
    const res = await mutation.mutateAsync({ channelId, metadata })
    return res.is_favorite
  }

  const isFavorite = (channelId: number): boolean => favoriteIds.has(channelId)

  return {
    favorites,
    favoriteIds,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch,
    toggleFavorite: toggleFavoriteCallback,
    isToggling: mutation.isPending,
    toggleError: mutation.error as Error | null,
    isFavorite,
  }
}
