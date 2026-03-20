/**
 * T065: MessageCard component - Refined Editorial Design
 *
 * Editorial-style message card resembling typeset correspondence.
 * Typography hierarchy with serif display + sans body + mono timestamps.
 *
 * Requirements:
 * - FR-010: Display content preview, sender, chat, timestamp
 * - Show media indicators as subtle pills
 * - Show reply/forward badges
 * - Clickable to view full message details
 */

import React from 'react'
import { formatTimestamp } from '../../utils/date-formatters'
import { getChannelColor } from '../../utils/channel-colors'
import { createTextPreview } from '../../utils/html-preview'
import {
  Image,
  Video,
  FileText,
  Music,
  Mic,
  Sticker,
  Reply,
  Forward,
  ChevronRight,
} from 'lucide-react'
import type { Message } from '../../types/message'
import { Card } from '../ui/card'
import { MessageContent } from './MessageContent'

interface MessageCardProps {
  /** Message data to display */
  message: Message

  /** Callback when card is clicked */
  onClick?: (message: Message) => void

  /** Animation delay index for staggered entrance */
  index?: number
}

/**
 * Get chat type badge styles - simplified, using accent-soft for all
 */
function getChatTypeLabel(type: string) {
  switch (type) {
    case 'channel':
      return '#'
    case 'group':
    case 'supergroup':
      return '@'
    case 'private':
    default:
      return ''
  }
}

/**
 * Get media type icon
 */
function getMediaIcon(type: string) {
  switch (type) {
    case 'photo':
      return Image
    case 'video':
    case 'video_note':
      return Video
    case 'document':
      return FileText
    case 'audio':
      return Music
    case 'voice':
      return Mic
    case 'sticker':
      return Sticker
    default:
      return FileText
  }
}

/**
 * MessageCard component
 *
 * Editorial-style message card with:
 * - Serif chat title (Newsreader)
 * - Sans sender name
 * - Mono timestamp
 * - Clean content preview
 * - Subtle media/reply/forward indicators
 */
export function MessageCard({ message, onClick, index = 0 }: MessageCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(message)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  // Safely truncate content for preview (handles HTML content)
  const contentPreview = createTextPreview(message.content, 200)

  const chatLabel = getChatTypeLabel(message.chat.type)
  const channelColor = getChannelColor(message.chat.telegramChatId)

  // Calculate staggered animation delay (max 500ms for first 10 items)
  const animationDelay = Math.min(index * 50, 500)

  return (
    <div className="relative animate-fade-in-up" style={{ animationDelay: `${animationDelay}ms` }}>
      {/* Main card */}
      <Card
        interactive
        className="group relative"
        onClick={handleClick}
        onKeyPress={handleKeyPress}
        tabIndex={onClick ? 0 : undefined}
        role="article"
        aria-label={`Message from ${message.sender.name}`}
      >
        <div className="p-4">
          {/* Header Row: Chat + Sender + Timestamp */}
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <div className="flex items-baseline gap-2 min-w-0 flex-1">
              {/* Chat badge - colored pill */}
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium border shrink-0 ${channelColor.bg} ${channelColor.text} ${channelColor.border}`}
              >
                {chatLabel}
                {message.chat.title}
              </span>

              {/* Separator dot */}
              <span className="text-foreground-muted text-xs shrink-0">·</span>

              {/* Sender name - serif for editorial feel */}
              <span className="font-serif text-sm text-foreground truncate">
                {message.sender.name}
              </span>
            </div>

            {/* Timestamp - monospace */}
            <time className="font-mono text-xs text-foreground-muted whitespace-nowrap shrink-0">
              {formatTimestamp(message.timestamp)}
            </time>
          </div>

          {/* Content Preview */}
          {contentPreview && (
            <div className="mb-3">
              <MessageContent
                content={contentPreview}
                className="text-sm text-foreground/85 leading-relaxed line-clamp-3"
              />
            </div>
          )}

          {/* Footer: Media/Reply/Forward indicators - subtle pills */}
          {(message.media ||
            message.isReply ||
            message.isForwarded ||
            (!contentPreview && message.type !== 'text')) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Media Indicator */}
              {message.media && <MediaPill type={message.media.type} />}

              {/* Reply Indicator */}
              {message.isReply && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-foreground-muted bg-background-subtle">
                  <Reply className="w-3 h-3" />
                  Reply
                </span>
              )}

              {/* Forwarded Indicator */}
              {message.isForwarded && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-foreground-muted bg-background-subtle">
                  <Forward className="w-3 h-3" />
                  Fwd
                </span>
              )}

              {/* Message Type (if not text and no content) */}
              {!contentPreview && message.type !== 'text' && (
                <span className="text-xs text-foreground-muted italic capitalize">
                  {message.type.replace('_', ' ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover chevron indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-foreground-muted" />
        </div>
      </Card>
    </div>
  )
}

/**
 * Media pill component - subtle, minimal
 */
function MediaPill({ type }: { type: string }) {
  const Icon = getMediaIcon(type)

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-foreground-muted bg-background-subtle">
      <Icon className="w-3 h-3" />
      <span className="capitalize">{type.replace('_', ' ')}</span>
    </span>
  )
}
