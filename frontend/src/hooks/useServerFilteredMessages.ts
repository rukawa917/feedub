import { useInfiniteQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import * as messageService from '../services/message-service'
import type { Message, PaginationMeta } from '../types/message'
import type { FilterState } from '../types/filters'
import { convertToFrontendMessage } from '../utils/message-transform'
import { queryKeys } from './query-keys'

const PAGE_SIZE = 50

interface UseServerFilteredMessagesOptions {
  filters: FilterState
  pageSize?: number
  /**
   * When true, the user has explicitly interacted with channel selection.
   * If chatIds is empty while this is true, show no messages (user deselected all).
   * If false, empty chatIds means "no filter" = show all messages.
   */
  hasExplicitChannelSelection?: boolean
}

interface UseServerFilteredMessagesReturn {
  messages: Message[]
  pagination: PaginationMeta | undefined
  loadMore: () => void
  isLoading: boolean
  isLoadingMore: boolean
  error: Error | null
  totalFiltered: number
  refetch: () => void
}

export function convertFiltersToApiParams(filters: FilterState): {
  search?: string
  chat_ids?: string[]
  start_date?: string
  end_date?: string
  message_type?: string
  has_media?: boolean
} {
  const params: ReturnType<typeof convertFiltersToApiParams> = {}

  if (filters.searchQuery.trim()) {
    params.search = filters.searchQuery.trim()
  }

  if (filters.advanced.chatIds.length > 0) {
    // Pass string chat IDs directly - URLSearchParams stringifies anyway
    // and FastAPI parses integers from query string
    params.chat_ids = filters.advanced.chatIds
  }

  if (filters.advanced.dateRange) {
    if (filters.advanced.dateRange.startDate) {
      params.start_date = filters.advanced.dateRange.startDate.toISOString()
    }
    if (filters.advanced.dateRange.endDate) {
      params.end_date = filters.advanced.dateRange.endDate.toISOString()
    }
  }

  if (filters.advanced.messageTypes.length === 1) {
    params.message_type = filters.advanced.messageTypes[0]
  }

  if (filters.advanced.hasMedia !== null) {
    params.has_media = filters.advanced.hasMedia
  }

  return params
}

export function useServerFilteredMessages(
  options: UseServerFilteredMessagesOptions
): UseServerFilteredMessagesReturn {
  const { filters, pageSize = PAGE_SIZE, hasExplicitChannelSelection = false } = options
  const token = useAuthStore((s) => s.token)

  // When user has explicitly selected channels but none are selected, show no messages
  const shouldShowNoMessages = hasExplicitChannelSelection && filters.advanced.chatIds.length === 0

  const apiParams = convertFiltersToApiParams(filters)
  // Stable key object for React Query
  const filterKey = { ...apiParams, shouldShowNoMessages }

  const query = useInfiniteQuery({
    queryKey: queryKeys.messages.list(filterKey),
    queryFn: ({ pageParam = 0, signal }) => {
      if (!token) throw new Error('No authentication token')
      return messageService
        .getMessages(token, { ...apiParams, limit: pageSize, offset: pageParam as number }, signal)
        .then((res) => ({
          messages: res.messages.map(convertToFrontendMessage),
          total: res.total,
          hasMore: res.has_more,
          nextOffset: (pageParam as number) + res.messages.length,
        }))
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
    enabled: !!token && !shouldShowNoMessages,
  })

  // Flatten pages into a single messages array
  const messages: Message[] = shouldShowNoMessages
    ? []
    : (query.data?.pages.flatMap((p) => p.messages) ?? [])

  const total = shouldShowNoMessages ? 0 : (query.data?.pages[0]?.total ?? 0)

  const pagination: PaginationMeta | undefined = {
    currentPage: Math.floor(messages.length / pageSize),
    pageSize,
    totalItems: total,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: messages.length < total,
    hasPrevPage: false,
  }

  const loadMore = () => {
    if (!query.isFetchingNextPage && query.hasNextPage) {
      query.fetchNextPage()
    }
  }

  const refetch = () => {
    query.refetch()
  }

  return {
    messages,
    pagination,
    loadMore,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    error: query.error as Error | null,
    totalFiltered: total,
    refetch,
  }
}
