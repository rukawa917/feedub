/**
 * Utilities for handling Telegram chat IDs
 */

/**
 * Normalize Telegram chat ID to consistent format
 * Removes -100 prefix used for channels/supergroups
 *
 * Telegram uses different ID formats:
 * - Channels/Supergroups: -1001234567890 (with -100 prefix)
 * - Groups: -1234567890 (with - prefix)
 * - Users: 1234567890 (positive number)
 *
 * This normalizes all to positive numeric string for consistent comparison.
 */
export function normalizeChatId(chatId: string | number): string {
  const str = String(chatId)

  // Telegram channels/supergroups have -100 prefix
  // Normalize by removing it for consistent comparison
  if (str.startsWith('-100') && str.length > 4) {
    return str.substring(4)
  } else if (str.startsWith('-')) {
    // Also handle negative prefix for groups
    return str.substring(1)
  }

  return str
}
