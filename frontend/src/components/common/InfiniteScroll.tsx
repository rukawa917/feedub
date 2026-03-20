import { useEffect, useRef, useCallback, useState } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface InfiniteScrollProps {
  children: React.ReactNode
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number
  className?: string
}

/**
 * InfiniteScroll component
 *
 * Uses Intersection Observer API to detect when user scrolls near bottom.
 * Automatically triggers onLoadMore when sentinel element becomes visible.
 * Debounces load more calls to prevent rapid firing.
 *
 * @param children - Content to render
 * @param onLoadMore - Callback to load more items
 * @param hasMore - Whether more items are available
 * @param isLoading - Whether currently loading
 * @param threshold - Distance from bottom to trigger load (default 200px)
 */
export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
  className,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isDebouncing, setIsDebouncing] = useState(false)

  const handleLoadMore = useCallback(() => {
    // Prevent rapid firing
    if (isLoading || !hasMore || isDebouncing) {
      return
    }

    setIsDebouncing(true)
    onLoadMore()

    // Reset debounce after 500ms
    setTimeout(() => {
      setIsDebouncing(false)
    }, 500)
  }, [onLoadMore, hasMore, isLoading, isDebouncing])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          handleLoadMore()
        }
      },
      {
        // Trigger when sentinel is within threshold pixels of viewport
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [handleLoadMore, threshold])

  return (
    <div className={className}>
      {children}

      {/* Invisible sentinel element */}
      <div
        ref={sentinelRef}
        className="h-1"
        aria-hidden="true"
        data-testid="infinite-scroll-sentinel"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8" data-testid="infinite-scroll-loading">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && !isLoading && (
        <div
          className="text-center py-8 text-sm text-muted-foreground"
          data-testid="infinite-scroll-end"
        >
          No more items to load
        </div>
      )}
    </div>
  )
}
