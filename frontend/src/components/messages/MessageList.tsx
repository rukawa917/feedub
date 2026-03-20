/**
 * T066 + T012: MessageList component with auto-load support
 *
 * Renders a paginated list of message cards
 * Requirements:
 * - FR-010: Display message cards
 * - FR-014: Pagination with "Load More"
 * - FR-024: Empty state handling
 * - T012: Skeleton states during loading
 * - T012: Auto-load with cached messages
 */

import React from 'react'
import { MessageCard } from './MessageCard'
import { EmptyState } from './EmptyState'
import { LoadMoreButton } from './LoadMoreButton'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { SkeletonMessageList } from './SkeletonMessageCard'
import type { Message, PaginationMeta, MessageLoadingState } from '../../types/message'

interface MessageListProps {
  /** Array of messages to display */
  messages: Message[]

  /** Pagination metadata */
  pagination?: PaginationMeta

  /** Callback when "Load More" button is clicked */
  onLoadMore?: () => void

  /** Callback when a message card is clicked */
  onMessageClick?: (message: Message) => void

  /** Loading state (T012: enhanced with MessageLoadingState) */
  isLoading?: boolean

  /** Loading state type (T012: for skeleton/spinner variants) */
  loadingState?: MessageLoadingState

  /** Custom empty state message */
  emptyMessage?: string

  /** Empty state action (e.g., FetchButton) */
  emptyAction?: React.ReactNode
}

/**
 * MessageList component
 *
 * Displays a list of message cards with:
 * - T012: Skeleton cards during initial load
 * - Empty state when no messages
 * - Loading spinner while fetching (legacy support)
 * - Pagination info and "Load More" button
 * - Clickable message cards
 */
export function MessageList({
  messages,
  pagination,
  onLoadMore,
  onMessageClick,
  isLoading = false,
  loadingState = 'idle',
  emptyMessage,
  emptyAction,
}: MessageListProps) {
  // T012: Show skeleton cards during initial loading
  if (loadingState === 'loading' && messages.length === 0) {
    return <SkeletonMessageList count={10} />
  }

  // Legacy: Loading state - show spinner (fallback for backward compatibility)
  if (isLoading && messages.length === 0 && loadingState === 'idle') {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    )
  }

  // Empty state - no messages
  if (!isLoading && loadingState === 'idle' && messages.length === 0) {
    return <EmptyState message={emptyMessage} action={emptyAction} />
  }

  return (
    <div className="space-y-4">
      {/* Pagination Info */}
      {pagination && pagination.totalItems > 0 && (
        <div className="text-sm text-foreground-muted">
          Showing{' '}
          <span className="font-medium text-foreground">
            1-{Math.min(messages.length, pagination.totalItems).toLocaleString()}
          </span>{' '}
          of{' '}
          <span className="font-medium text-foreground">
            {pagination.totalItems.toLocaleString()}
          </span>
        </div>
      )}

      {/* Message Cards */}
      <div className="space-y-4">
        {messages.map((message, index) => (
          <MessageCard key={message.id} message={message} onClick={onMessageClick} index={index} />
        ))}
      </div>

      {/* Load More Button */}
      {pagination && onLoadMore && (
        <LoadMoreButton
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onLoadMore={onLoadMore}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
