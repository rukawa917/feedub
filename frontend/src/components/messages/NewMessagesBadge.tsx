/**
 * NewMessagesBadge component
 * Shows a clickable banner when new messages are available during fetch
 * User clicks to refresh message list
 */

import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewMessagesBadgeProps {
  /** Number of new messages available */
  count: number
  /** Callback when user clicks to refresh */
  onClick: () => void
  /** Optional className for styling */
  className?: string
}

export function NewMessagesBadge({ count, onClick, className }: NewMessagesBadgeProps) {
  if (count <= 0) return null

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        'w-full flex items-center justify-center gap-2 py-3 px-4',
        'rounded-lg text-sm font-medium',
        'transition-all duration-200 ease-out',
        // Teal accent color to match SyncButton
        'bg-teal/10 text-teal border border-teal/30',
        'hover:bg-teal/20 hover:border-teal/50',
        'active:scale-[0.99]',
        className
      )}
      aria-label={`${count} new messages available. Click to refresh.`}
    >
      <RefreshCw className="h-4 w-4" />
      <span>
        {count.toLocaleString()} new message{count !== 1 ? 's' : ''} available
      </span>
    </button>
  )
}
