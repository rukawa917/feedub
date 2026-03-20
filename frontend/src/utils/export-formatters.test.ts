// frontend/src/utils/export-formatters.test.ts
import { describe, it, expect } from 'vitest'
import { formatAsTxt, formatAsMarkdown, generateFilename } from './export-formatters'
import type { Message } from '../types/message'

describe('export-formatters', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      userId: 'user1',
      telegramMessageId: 123,
      content: 'First message from TechNews',
      sender: {
        telegramUserId: 'sender1',
        name: 'John Doe',
      },
      chat: {
        telegramChatId: 'chat1',
        title: 'TechNews Daily',
        type: 'channel',
      },
      timestamp: '2025-01-15T14:30:22Z',
      type: 'text',
      media: null,
      isReply: false,
      isForwarded: false,
      fetchedAt: '2025-01-16T10:00:00Z',
    },
    {
      id: '2',
      userId: 'user1',
      telegramMessageId: 124,
      content: 'Photo message',
      sender: {
        telegramUserId: 'sender2',
        name: 'Jane Smith',
      },
      chat: {
        telegramChatId: 'chat1',
        title: 'TechNews Daily',
        type: 'channel',
      },
      timestamp: '2025-01-15T15:45:10Z',
      type: 'photo',
      media: {
        type: 'photo',
        fileName: 'image.jpg',
        fileSize: 2621440, // 2.5 MB
        mimeType: 'image/jpeg',
        dimensions: { width: 1920, height: 1080 },
      },
      isReply: true,
      isForwarded: false,
      fetchedAt: '2025-01-16T10:00:00Z',
    },
    {
      id: '3',
      userId: 'user1',
      telegramMessageId: 125,
      content: 'Message from another chat',
      sender: {
        telegramUserId: 'sender3',
        name: 'Bob Johnson',
      },
      chat: {
        telegramChatId: 'chat2',
        title: 'Crypto Updates',
        type: 'group',
      },
      timestamp: '2025-01-15T16:00:00Z',
      type: 'text',
      media: null,
      isReply: false,
      isForwarded: true,
      fetchedAt: '2025-01-16T10:00:00Z',
    },
  ]

  describe('formatAsTxt', () => {
    it('should format messages with structured blocks', () => {
      const result = formatAsTxt(mockMessages)

      expect(result).toContain('Feedub Message Export')
      expect(result).toContain('Total Messages: 3')
      expect(result).toContain('════════════════════════════════════════════════════════════════')
      expect(result).toContain('📅 Timestamp: 2025-01-15 14:30:22')
      expect(result).toContain('📢 Chat: TechNews Daily (Channel)')
      expect(result).toContain('👤 Sender: John Doe')
      expect(result).toContain('First message from TechNews')
    })

    it('should format media metadata correctly', () => {
      const result = formatAsTxt(mockMessages)

      expect(result).toContain('📎 Type: photo')
      expect(result).toContain('Media: Photo (image.jpg, 2.5 MB)')
    })

    it('should show reply and forward indicators', () => {
      const result = formatAsTxt(mockMessages)

      expect(result).toContain('↩️ Reply')
      expect(result).toContain('↗️ Forwarded')
    })

    it('should handle empty message array', () => {
      const result = formatAsTxt([])

      expect(result).toContain('Feedub Message Export')
      expect(result).toContain('Total Messages: 0')
      expect(result).toContain('No messages to export')
    })
  })

  describe('formatAsMarkdown', () => {
    it('should format with chat grouping', () => {
      const result = formatAsMarkdown(mockMessages)

      expect(result).toContain('# Feedub Message Export')
      expect(result).toContain('**Total Messages:** 3')
      expect(result).toContain('## 📢 Crypto Updates (Group)')
      expect(result).toContain('## 📢 TechNews Daily (Channel)')
      expect(result).toContain('### 2025-01-15 14:30:22 · John Doe')
      expect(result).toContain('First message from TechNews')
    })

    it('should format media as bullet list', () => {
      const result = formatAsMarkdown(mockMessages)

      expect(result).toContain('- **Type:** photo')
      expect(result).toContain('- **Media:** Photo (image.jpg, 2.5 MB)')
      expect(result).toContain('- **Flags:** ↩️ Reply')
    })

    it('should group messages by chat alphabetically', () => {
      const result = formatAsMarkdown(mockMessages)

      const cryptoIndex = result.indexOf('Crypto Updates')
      const techNewsIndex = result.indexOf('TechNews Daily')

      expect(cryptoIndex).toBeLessThan(techNewsIndex)
    })

    it('should handle empty message array', () => {
      const result = formatAsMarkdown([])

      expect(result).toContain('# Feedub Message Export')
      expect(result).toContain('**Total Messages:** 0')
      expect(result).toContain('No messages to export')
    })
  })

  describe('generateFilename', () => {
    it('should generate filename with timestamp for txt', () => {
      const filename = generateFilename('txt')

      expect(filename).toMatch(/^feedub-export-\d{4}-\d{2}-\d{2}-\d{6}\.txt$/)
    })

    it('should generate filename with timestamp for md', () => {
      const filename = generateFilename('md')

      expect(filename).toMatch(/^feedub-export-\d{4}-\d{2}-\d{2}-\d{6}\.md$/)
    })
  })
})
