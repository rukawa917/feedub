/**
 * Message detail page
 * FR-015: Display full message details with metadata
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Reply, Forward, Image, File, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import { getMessageDetail } from '@/services/message-service'
import { formatTimestamp } from '@/utils/date-formatters'
import { generateTelegramLink } from '@/utils/telegram-links'
import { MessageContent } from '@/components/messages/MessageContent'
import { MediaDownloadButton } from '@/components/messages/MediaDownloadButton'
import type { GetMessageDetailResponse } from '@/types/message'

/**
 * MessageDetail page component
 *
 * Displays full details for a single message including:
 * - Message content
 * - Sender and chat information
 * - Timestamps
 * - Reply/forward indicators
 * - Media metadata
 */
export function MessageDetail() {
  const { messageId } = useParams<{ messageId: string }>()
  const navigate = useNavigate()
  // Get token imperatively to avoid re-renders on token refresh
  const getToken = () => useAuthStore.getState().token

  const [message, setMessage] = useState<GetMessageDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMessage() {
      const token = getToken()
      if (!messageId || !token) {
        setError('Invalid request')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await getMessageDetail(token, messageId)
        setMessage(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load message')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessage()
  }, [messageId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading message...</p>
        </div>
      </div>
    )
  }

  if (error || !message) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-4">
              {error || 'Failed to load message. Please try again.'}
            </p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - normal flow, scrolls with content */}
      <header className="bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Message Details</h1>
            </div>
            <a
              href={generateTelegramLink(String(message.chat_id), message.telegram_message_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Telegram
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Message content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose-message max-w-none">
                <MessageContent
                  content={message.content}
                  className="text-foreground leading-relaxed"
                />
              </div>

              {/* Indicators */}
              <div className="flex gap-2 mt-4">
                {message.is_reply && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal rounded text-sm border border-teal/20">
                    <Reply className="h-3 w-3" />
                    <span>Reply</span>
                  </div>
                )}
                {message.is_forward && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-sm border border-primary/20">
                    <Forward className="h-3 w-3" />
                    <span>Forwarded</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sender & Chat info */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sender</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-foreground-muted">Name</div>
                  <div className="text-foreground">
                    {message.sender_name || (message.chat_type === 'channel' ? 'Channel' : '—')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground-muted">Telegram ID</div>
                  <div className="text-foreground font-mono text-sm">
                    {message.sender_id ?? '—'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-foreground-muted">Title</div>
                  <div className="text-foreground">{message.chat_title}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground-muted">Type</div>
                  <div className="text-foreground capitalize">{message.chat_type}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground-muted">Telegram ID</div>
                  <div className="text-foreground font-mono text-sm">{message.chat_id}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-foreground-muted">Sent</div>
                <div className="text-foreground">{formatTimestamp(message.timestamp)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground-muted">Fetched</div>
                <div className="text-foreground">{formatTimestamp(message.fetched_at)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Media metadata (if present) */}
          {message.has_media && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {message.file_mime_type?.startsWith('image/') ? (
                    <Image className="h-5 w-5" />
                  ) : (
                    <File className="h-5 w-5" />
                  )}
                  Media Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {message.file_name && (
                  <div>
                    <div className="text-sm font-medium text-foreground-muted">File Name</div>
                    <div className="text-foreground font-mono text-sm">{message.file_name}</div>
                  </div>
                )}
                {message.file_mime_type && (
                  <div>
                    <div className="text-sm font-medium text-foreground-muted">Type</div>
                    <div className="text-foreground">{message.file_mime_type}</div>
                  </div>
                )}
                {message.file_size && (
                  <div>
                    <div className="text-sm font-medium text-foreground-muted">Size</div>
                    <div className="text-foreground">
                      {(message.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                )}
                {message.file_width && message.file_height && (
                  <div>
                    <div className="text-sm font-medium text-foreground-muted">Dimensions</div>
                    <div className="text-foreground">
                      {message.file_width} × {message.file_height}
                    </div>
                  </div>
                )}
                {message.file_duration && (
                  <div>
                    <div className="text-sm font-medium text-foreground-muted">Duration</div>
                    <div className="text-foreground">{message.file_duration}s</div>
                  </div>
                )}

                {/* Download button */}
                <div className="pt-4">
                  <MediaDownloadButton
                    messageId={message.id}
                    fileName={message.file_name || 'download'}
                    mimeType={message.file_mime_type || 'application/octet-stream'}
                    token={getToken()!}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default MessageDetail
