/**
 * Structured query key constants for React Query.
 * Use these to ensure consistent cache keys and enable targeted invalidation.
 */

export const queryKeys = {
  channels: {
    all: ['channels'] as const,
    available: () => ['channels', 'available'] as const,
    selections: () => ['channels', 'selections'] as const,
    favorites: () => ['channels', 'favorites'] as const,
  },
  messages: {
    all: ['messages'] as const,
    list: (params: Record<string, unknown>) => ['messages', 'list', params] as const,
  },
  fetchStatus: {
    all: ['fetchStatus'] as const,
    byId: (fetchId: string) => ['fetchStatus', fetchId] as const,
  },
} as const
