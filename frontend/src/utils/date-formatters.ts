/**
 * T061: Date formatter utilities
 *
 * Provides formatting functions for timestamps and file sizes
 * Used throughout the application for consistent display
 */

/**
 * Format a timestamp for message display
 *
 * Always shows date and time:
 * - Today: "Today, HH:mm" (e.g., "Today, 14:30")
 * - Yesterday: "Yesterday, HH:mm" (e.g., "Yesterday, 09:15")
 * - This year: "MMM DD, HH:mm" (e.g., "Dec 21, 08:08")
 * - Older: "MMM DD, YYYY, HH:mm" (e.g., "Jan 15, 2024, 14:30")
 *
 * @param timestamp ISO 8601 timestamp string
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return 'Invalid date'
  }

  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffMs = today.getTime() - messageDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Format time part
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const timeStr = `${hours}:${minutes}`

    // Today: show "Today, HH:mm"
    if (diffDays === 0) {
      return `Today, ${timeStr}`
    }

    // Yesterday: show "Yesterday, HH:mm"
    if (diffDays === 1) {
      return `Yesterday, ${timeStr}`
    }

    // Format date part
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const month = monthNames[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()

    // Same year: "MMM DD, HH:mm"
    if (year === now.getFullYear()) {
      return `${month} ${day}, ${timeStr}`
    }

    // Different year: "MMM DD, YYYY, HH:mm"
    return `${month} ${day}, ${year}, ${timeStr}`
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format a timestamp as relative time (e.g., "5 minutes ago")
 *
 * @param timestamp ISO 8601 timestamp string
 * @returns Relative time string
 */
export function formatRelativeDate(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return 'Invalid date'
  }

  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Less than 1 minute
    if (diffMinutes < 1) {
      return 'Just now'
    }

    // Less than 1 hour
    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
    }

    // Less than 24 hours
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    }

    // Less than 7 days
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    }

    // More than 7 days - use formatTimestamp
    return formatTimestamp(timestamp)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format file size in bytes to human-readable format
 *
 * @param bytes File size in bytes
 * @returns Formatted file size (e.g., "5.2 MB")
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes < 0 || isNaN(bytes)) {
    return '0 B'
  }

  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  // Clamp to available units
  const unitIndex = Math.min(i, units.length - 1)

  if (unitIndex === 0) {
    return `${bytes} B`
  }

  const size = bytes / Math.pow(k, unitIndex)
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
