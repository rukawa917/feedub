/**
 * SkeletonMessageCard component (T011)
 * Loading state placeholder with shimmer animation
 * Displays skeleton cards during initial load
 */

/**
 * SkeletonMessageCard component
 * Animated placeholder for MessageCard during loading
 *
 * @example
 * ```typescript
 * {loadingState === 'loading' && (
 *   <div className="space-y-4">
 *     {Array.from({ length: 10 }).map((_, i) => (
 *       <SkeletonMessageCard key={i} index={i} />
 *     ))}
 *   </div>
 * )}
 * ```
 */
export function SkeletonMessageCard({
  index = 0,
  showFooter = true,
}: {
  index?: number
  showFooter?: boolean
}) {
  // Staggered animation delay
  const animationDelay = Math.min(index * 50, 500)

  // Vary content widths based on index for more realistic loading
  const widthVariants = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4']
  const secondLineWidth = widthVariants[index % widthVariants.length]

  // Vary number of content lines (2-4 lines)
  const lineCount = 2 + (index % 3 !== 0 ? 1 : 0) + (index % 2 === 0 ? 1 : 0)

  // Vary footer badge count (1-3 badges when showFooter is true)
  const badgeCount = showFooter ? (index % 3) + 1 : 0

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
      role="status"
      aria-busy="true"
      aria-label="Loading message"
    >
      <div className="rounded-xl border bg-card">
        <div className="p-4">
          {/* Header row: Chat badge · Sender · Timestamp */}
          <div className="flex items-center gap-3 mb-2">
            {/* Chat badge skeleton */}
            <div className="h-5 w-24 rounded-md bg-muted animate-shimmer" />

            {/* Separator dot */}
            <span className="text-foreground-muted">·</span>

            {/* Sender name skeleton */}
            <div className="h-4 w-20 rounded bg-muted animate-shimmer" />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Timestamp skeleton */}
            <div className="h-4 w-16 rounded bg-muted animate-shimmer" />
          </div>

          {/* Message content skeleton - varied lines */}
          <div className="space-y-2 mb-3">
            <div className="h-4 w-full rounded bg-muted animate-shimmer" />
            {lineCount >= 2 && (
              <div className={`h-4 ${secondLineWidth} rounded bg-muted animate-shimmer`} />
            )}
            {lineCount >= 3 && <div className="h-4 w-3/4 rounded bg-muted animate-shimmer" />}
            {lineCount >= 4 && <div className="h-4 w-2/3 rounded bg-muted animate-shimmer" />}
          </div>

          {/* Footer: Badges skeleton (conditional) */}
          {showFooter && (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: badgeCount }).map((_, i) => (
                <div key={i} className="h-5 w-12 rounded-full bg-muted animate-shimmer" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * SkeletonMessageList component
 * Renders multiple skeleton cards for initial loading state
 *
 * @param count - Number of skeleton cards to render (default: 10)
 * @param showFooter - Whether to show footer badges (default: true)
 *
 * @example
 * ```typescript
 * {loadingState === 'loading' && <SkeletonMessageList count={10} />}
 * ```
 */
export function SkeletonMessageList({
  count = 10,
  showFooter = true,
}: {
  count?: number
  showFooter?: boolean
}) {
  return (
    <div className="space-y-3" role="status" aria-label={`Loading ${count} messages`}>
      <span className="sr-only">Loading messages, please wait...</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMessageCard key={i} index={i} showFooter={showFooter} />
      ))}
    </div>
  )
}
