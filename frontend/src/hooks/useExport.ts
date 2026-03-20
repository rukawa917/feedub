// frontend/src/hooks/useExport.ts
import { useState } from 'react'
import { getMessages } from '../services/message-service'
import { formatAsTxt, formatAsMarkdown, generateFilename } from '../utils/export-formatters'
import { convertFiltersToApiParams } from './useServerFilteredMessages'
import { convertToFrontendMessage } from '../utils/message-transform'
import { useAuthStore } from '../stores/auth'
import type { FilterState } from '../types/filters'
import type { Message } from '../types/message'

const BATCH_SIZE = 100 // Backend maximum limit is 100
const MAX_EXPORT_MESSAGES = 1000

/**
 * Download file via blob URL
 */
function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Hook for exporting messages
 */
export function useExport(filters: FilterState) {
  // Get token imperatively to avoid re-renders on token refresh
  const getToken = () => useAuthStore.getState().token
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const exportMessages = async (format: 'txt' | 'md'): Promise<void> => {
    const token = getToken()
    if (!token) {
      setError(new Error('No authentication token'))
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      // Fetch all messages in batches
      const allMessages: Message[] = []
      let offset = 0

      while (allMessages.length < MAX_EXPORT_MESSAGES) {
        const params = { ...convertFiltersToApiParams(filters), limit: BATCH_SIZE, offset }
        const response = await getMessages(token, params)

        if (response.messages.length === 0) break

        const convertedMessages = response.messages.map(convertToFrontendMessage)
        allMessages.push(...convertedMessages)

        if (response.messages.length < BATCH_SIZE) break // Last page
        offset += BATCH_SIZE
      }

      // Limit to MAX_EXPORT_MESSAGES
      const messagesToExport = allMessages.slice(0, MAX_EXPORT_MESSAGES)

      // Format messages
      const content =
        format === 'txt' ? formatAsTxt(messagesToExport) : formatAsMarkdown(messagesToExport)

      // Download file
      const filename = generateFilename(format)
      downloadFile(content, filename)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'))
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportMessages,
    isExporting,
    error,
  }
}
