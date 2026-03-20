/**
 * Message transformation utilities
 *
 * Converts backend API response format (snake_case) to frontend format (camelCase).
 * Shared between hooks and components that need to transform message data.
 */

import type { Message, GetMessagesResponse } from '../types/message'
import { normalizeChatId } from './chat-utils'

/**
 * Convert a backend message response to frontend Message format
 *
 * @param msg - Raw message from API (snake_case fields)
 * @returns Transformed Message object (camelCase fields)
 */
export function convertToFrontendMessage(msg: GetMessagesResponse['messages'][number]): Message {
  const normalizedChatId = normalizeChatId(msg.chat_id)

  return {
    id: msg.id,
    userId: msg.user_id,
    telegramMessageId: msg.telegram_message_id,
    content: msg.content,
    sender: {
      telegramUserId: msg.sender_id,
      name: msg.sender_name,
    },
    chat: {
      telegramChatId: normalizedChatId,
      title: msg.chat_title,
      type: msg.chat_type as 'private' | 'group' | 'supergroup' | 'channel',
    },
    timestamp: msg.timestamp,
    type: msg.message_type,
    media: msg.has_media
      ? {
          type: msg.message_type as
            | 'photo'
            | 'video'
            | 'document'
            | 'audio'
            | 'voice'
            | 'video_note'
            | 'sticker',
          fileName: msg.file_name || undefined,
          fileSize: msg.file_size || undefined,
          mimeType: msg.file_mime_type || undefined,
          dimensions:
            msg.file_width && msg.file_height
              ? { width: msg.file_width, height: msg.file_height }
              : undefined,
          duration: msg.file_duration || undefined,
        }
      : null,
    isReply: msg.is_reply,
    isForwarded: msg.is_forward,
    fetchedAt: msg.fetched_at,
  }
}
