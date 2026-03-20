/**
 * Media download button component
 * FR-016, FR-017: Download/view media content
 */

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getMessageMedia } from '@/services/message-service'

export interface MediaDownloadButtonProps {
  /** Message ID containing media */
  messageId: string

  /** File name for download */
  fileName: string

  /** MIME type of media */
  mimeType: string

  /** JWT authentication token */
  token: string

  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost'

  /** Button size */
  size?: 'default' | 'sm' | 'lg'
}

/**
 * MediaDownloadButton component
 *
 * Downloads media from a message and triggers browser download.
 * Shows loading state during download and error if download fails.
 *
 * @example
 * ```tsx
 * <MediaDownloadButton
 *   messageId="123"
 *   fileName="photo.jpg"
 *   mimeType="image/jpeg"
 *   token={authToken}
 * />
 * ```
 */
export function MediaDownloadButton({
  messageId,
  fileName,
  mimeType,
  token,
  variant = 'default',
  size = 'default',
}: MediaDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      setError(null)

      const blob = await getMessageMedia(token, messageId)

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download media')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2"
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Download {mimeType.startsWith('image/') ? 'Image' : 'File'}</span>
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
