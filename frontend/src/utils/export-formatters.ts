// frontend/src/utils/export-formatters.ts
import type { Message } from '../types/message'
import { formatFileSize } from './date-formatters'

/**
 * Format timestamp to local date/time string
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Format media metadata as human-readable string
 */
function formatMediaInfo(message: Message): string {
  if (!message.media) return 'No'

  const { type, fileName, fileSize } = message.media
  const typeName = type.charAt(0).toUpperCase() + type.slice(1)

  if (fileName && fileSize) {
    return `${typeName} (${fileName}, ${formatFileSize(fileSize)})`
  } else if (fileName) {
    return `${typeName} (${fileName})`
  } else {
    return typeName
  }
}

/**
 * Get flags (reply/forward) as string
 */
function getFlags(message: Message): string {
  const flags: string[] = []
  if (message.isReply) flags.push('↩️ Reply')
  if (message.isForwarded) flags.push('↗️ Forwarded')
  return flags.join(', ')
}

/**
 * Format messages as structured TXT blocks
 */
export function formatAsTxt(messages: Message[]): string {
  const now = new Date()
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2')

  const separator = '════════════════════════════════════════════════════════════════'

  let output = `Feedub Message Export\n`
  output += `Generated: ${now}\n`
  output += `Total Messages: ${messages.length}\n\n`

  if (messages.length === 0) {
    output += 'No messages to export.\n'
    return output
  }

  output += `${separator}\n\n`

  // Sort chronologically (oldest first)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  for (const message of sortedMessages) {
    const timestamp = formatTimestamp(message.timestamp)
    const chatType = message.chat.type.charAt(0).toUpperCase() + message.chat.type.slice(1)
    const mediaInfo = formatMediaInfo(message)
    const flags = getFlags(message)

    output += `${separator}\n`
    output += `📅 Timestamp: ${timestamp}\n`
    output += `📢 Chat: ${message.chat.title} (${chatType})\n`
    output += `👤 Sender: ${message.sender.name}\n`
    output += `📎 Type: ${message.type} | Media: ${mediaInfo}\n`

    if (flags) {
      output += `🏷️  Flags: ${flags}\n`
    }

    output += `\n${message.content || '(no text content)'}\n`
    output += `${separator}\n\n`
  }

  return output
}

/**
 * Format messages as Markdown grouped by chat
 */
export function formatAsMarkdown(messages: Message[]): string {
  const now = new Date()
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2')

  let output = `# Feedub Message Export\n\n`
  output += `**Generated:** ${now}  \n`
  output += `**Total Messages:** ${messages.length}\n\n`

  if (messages.length === 0) {
    output += 'No messages to export.\n'
    return output
  }

  output += `---\n\n`

  // Group messages by chat
  const messagesByChat = new Map<string, Message[]>()
  for (const message of messages) {
    const chatId = message.chat.telegramChatId
    if (!messagesByChat.has(chatId)) {
      messagesByChat.set(chatId, [])
    }
    messagesByChat.get(chatId)!.push(message)
  }

  // Sort chats alphabetically
  const sortedChats = Array.from(messagesByChat.entries()).sort(([, messagesA], [, messagesB]) =>
    messagesA[0].chat.title.localeCompare(messagesB[0].chat.title)
  )

  for (const [, chatMessages] of sortedChats) {
    const firstMessage = chatMessages[0]
    const chatType =
      firstMessage.chat.type.charAt(0).toUpperCase() + firstMessage.chat.type.slice(1)

    output += `## 📢 ${firstMessage.chat.title} (${chatType})\n\n`

    // Sort messages chronologically within chat
    const sortedMessages = [...chatMessages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    for (const message of sortedMessages) {
      const timestamp = formatTimestamp(message.timestamp)
      const mediaInfo = formatMediaInfo(message)
      const flags = getFlags(message)

      output += `### ${timestamp} · ${message.sender.name}\n\n`
      output += `${message.content || '(no text content)'}\n\n`
      output += `- **Type:** ${message.type}\n`

      if (message.media) {
        output += `- **Media:** ${mediaInfo}\n`
      }

      if (flags) {
        output += `- **Flags:** ${flags}\n`
      }

      output += `\n---\n\n`
    }
  }

  return output
}

/**
 * Generate filename with current timestamp
 */
export function generateFilename(format: 'txt' | 'md'): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `feedub-export-${year}-${month}-${day}-${hours}${minutes}${seconds}.${format}`
}
