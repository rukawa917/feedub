/**
 * Telegram Deep Link Utilities
 *
 * Generate URLs to open messages directly in Telegram.
 * Supports private channels (t.me/c/) and other chat types (tg:// protocol).
 */

/**
 * Generate Telegram deep link for a message
 *
 * For private channels: uses t.me/c/channelId/messageId format
 * Telegram channel IDs start with -100 prefix which needs to be stripped
 *
 * @param telegramChatId - The Telegram chat ID (e.g., "-1001234567890")
 * @param telegramMessageId - The Telegram message ID
 * @returns URL to open the message in Telegram
 */
export function generateTelegramLink(
  telegramChatId: string | number,
  telegramMessageId: number
): string {
  const chatIdStr = String(telegramChatId)

  // Private channels have IDs like -1001234567890
  // Remove -100 prefix to get the channel ID for t.me/c/ format
  if (chatIdStr.startsWith('-100')) {
    const channelId = chatIdStr.slice(4) // Remove '-100'
    return `https://t.me/c/${channelId}/${telegramMessageId}`
  }

  // For other chat types, use tg:// protocol
  // This opens the Telegram app directly
  return `tg://openmessage?chat_id=${chatIdStr}&message_id=${telegramMessageId}`
}
