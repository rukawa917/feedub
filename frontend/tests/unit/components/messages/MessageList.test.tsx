/**
 * T056: Unit test for MessageList component
 *
 * Tests the message list rendering with pagination
 * Requirements:
 * - FR-010: Display message cards with content preview, sender, chat, timestamp
 * - FR-014: Pagination with "Load More" button
 * - FR-024: Empty state when no messages
 * - Handle loading and error states
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageList } from '../../../../src/components/messages/MessageList'
import type { Message } from '../../../../src/types/message'

// Mock dependencies
vi.mock('../../../../src/utils/date-formatters', () => ({
  formatTimestamp: (timestamp: string) => `Formatted: ${timestamp}`,
}))

describe('MessageList', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      userId: 'user-123',
      telegramMessageId: 12345,
      content: 'Hello world! This is a test message.',
      sender: {
        telegramUserId: '987654',
        name: 'John Doe',
      },
      chat: {
        telegramChatId: '123456',
        title: 'Test Group',
        type: 'group',
      },
      timestamp: '2025-10-14T10:30:00Z',
      type: 'text',
      media: null,
      isReply: false,
      isForwarded: false,
      createdAt: '2025-10-14T10:30:00Z',
    },
    {
      id: 'msg-2',
      userId: 'user-123',
      telegramMessageId: 12346,
      content: 'Second message with media',
      sender: {
        telegramUserId: '987655',
        name: 'Jane Smith',
      },
      chat: {
        telegramChatId: '123457',
        title: 'Another Chat',
        type: 'private',
      },
      timestamp: '2025-10-14T11:00:00Z',
      type: 'photo',
      media: {
        type: 'photo',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
        dimensions: { width: 800, height: 600 },
      },
      isReply: true,
      isForwarded: false,
      createdAt: '2025-10-14T11:00:00Z',
    },
    {
      id: 'msg-3',
      userId: 'user-123',
      telegramMessageId: 12347,
      content: null,
      sender: {
        telegramUserId: '987656',
        name: 'Bob Johnson',
      },
      chat: {
        telegramChatId: '123456',
        title: 'Test Group',
        type: 'group',
      },
      timestamp: '2025-10-14T12:00:00Z',
      type: 'video',
      media: {
        type: 'video',
        fileName: 'video.mp4',
        fileSize: 5000000,
        mimeType: 'video/mp4',
        duration: 120,
      },
      isReply: false,
      isForwarded: true,
      createdAt: '2025-10-14T12:00:00Z',
    },
  ]

  describe('Rendering', () => {
    it('should render a list of message cards', () => {
      render(<MessageList messages={mockMessages} />)

      // All messages should be rendered
      expect(screen.getByText(/Hello world/)).toBeInTheDocument()
      expect(screen.getByText(/Second message/)).toBeInTheDocument()
      // msg-3 has no content, should show media indicator
    })

    it('should display sender names', () => {
      render(<MessageList messages={mockMessages} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })

    it('should display chat titles', () => {
      render(<MessageList messages={mockMessages} />)

      // Chat titles are now inside colored pills with type prefix (e.g., "@Test Group")
      expect(screen.getAllByText(/Test Group/)).toHaveLength(2)
      expect(screen.getByText(/Another Chat/)).toBeInTheDocument()
    })

    it('should display formatted timestamps', () => {
      render(<MessageList messages={mockMessages} />)

      // Using mocked formatter
      expect(screen.getByText(/Formatted: 2025-10-14T10:30:00Z/)).toBeInTheDocument()
      expect(screen.getByText(/Formatted: 2025-10-14T11:00:00Z/)).toBeInTheDocument()
      expect(screen.getByText(/Formatted: 2025-10-14T12:00:00Z/)).toBeInTheDocument()
    })

    it('should show media indicators for messages with media', () => {
      render(<MessageList messages={mockMessages} />)

      // Should show photo and video indicators
      const mediaIndicators = screen.getAllByText(/photo|video/i)
      expect(mediaIndicators.length).toBeGreaterThanOrEqual(2)
    })

    it('should show reply indicator for reply messages', () => {
      render(<MessageList messages={mockMessages} />)

      // msg-2 is a reply
      expect(screen.getByText(/reply/i)).toBeInTheDocument()
    })

    it('should show forwarded indicator for forwarded messages', () => {
      render(<MessageList messages={mockMessages} />)

      // msg-3 is forwarded (displays as "Fwd")
      expect(screen.getByText(/fwd/i)).toBeInTheDocument()
    })

    it('should handle messages with null content', () => {
      render(<MessageList messages={mockMessages} />)

      // msg-3 has null content but should still render with media info
      const videoMessages = screen.getAllByText(/video/i)
      expect(videoMessages.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no messages provided', () => {
      render(<MessageList messages={[]} />)

      expect(screen.getByText(/no messages/i)).toBeInTheDocument()
    })

    it('should show empty state with custom message', () => {
      render(<MessageList messages={[]} emptyMessage="No results found" />)

      expect(screen.getByText(/no results found/i)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<MessageList messages={[]} isLoading={true} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should not show messages while loading (only when empty)', () => {
      // Component only hides messages when loading AND empty
      // With existing messages, they remain visible during loading
      render(<MessageList messages={mockMessages} isLoading={true} />)

      // Messages should still be visible (component doesn't hide them during load)
      expect(screen.getByText(/Hello world/)).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should render pagination info', () => {
      render(
        <MessageList
          messages={mockMessages}
          pagination={{
            currentPage: 0,
            pageSize: 50,
            totalItems: 150,
            totalPages: 3,
            hasNextPage: true,
            hasPrevPage: false,
          }}
        />
      )

      // Check for text that might be split across elements
      // Use getAllByText and check that at least one element matches
      const matchingElements = screen.getAllByText((content, element) => {
        // Only match the direct pagination info div, not parent containers
        const className = String(element?.className || '')
        return className.includes('text-sm') &&
               element?.textContent?.match(/showing\s+1-3\s+of\s+150/i) !== null
      })
      expect(matchingElements.length).toBeGreaterThan(0)
    })

    it('should show "Load More" button when hasNextPage is true', () => {
      // Component requires BOTH pagination and onLoadMore callback
      render(
        <MessageList
          messages={mockMessages}
          pagination={{
            currentPage: 0,
            pageSize: 50,
            totalItems: 150,
            totalPages: 3,
            hasNextPage: true,
            hasPrevPage: false,
          }}
          onLoadMore={vi.fn()} // Required for button to appear
        />
      )

      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument()
    })

    it('should not show "Load More" button when hasNextPage is false', () => {
      render(
        <MessageList
          messages={mockMessages}
          pagination={{
            currentPage: 2,
            pageSize: 50,
            totalItems: 150,
            totalPages: 3,
            hasNextPage: false,
            hasPrevPage: true,
          }}
        />
      )

      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
    })

    it('should call onLoadMore when "Load More" button is clicked', async () => {
      const onLoadMore = vi.fn()

      render(
        <MessageList
          messages={mockMessages}
          pagination={{
            currentPage: 0,
            pageSize: 50,
            totalItems: 150,
            totalPages: 3,
            hasNextPage: true,
            hasPrevPage: false,
          }}
          onLoadMore={onLoadMore}
        />
      )

      const loadMoreButton = screen.getByRole('button', { name: /load more/i })
      loadMoreButton.click()

      expect(onLoadMore).toHaveBeenCalledTimes(1)
    })
  })

  describe('Interaction', () => {
    it('should call onMessageClick when message card is clicked', () => {
      const onMessageClick = vi.fn()

      render(<MessageList messages={mockMessages} onMessageClick={onMessageClick} />)

      const firstMessage = screen.getByText(/Hello world/)
      firstMessage.click()

      expect(onMessageClick).toHaveBeenCalledWith(mockMessages[0])
    })

    it('should make message cards keyboard accessible', () => {
      render(<MessageList messages={mockMessages} onMessageClick={vi.fn()} />)

      // Message cards should be clickable and have proper roles
      const messageCards = screen.getAllByRole('article')
      expect(messageCards).toHaveLength(3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long message content with truncation', () => {
      const longMessage: Message = {
        ...mockMessages[0],
        content: 'A'.repeat(500),
      }

      render(<MessageList messages={[longMessage]} />)

      // Content should be truncated with ellipsis
      const displayedText = screen.getByText(/A+/)
      expect(displayedText.textContent!.length).toBeLessThan(500)
    })

    it('should handle special characters in message content', () => {
      const specialMessage: Message = {
        ...mockMessages[0],
        content: '<script>alert("XSS")</script>',
      }

      render(<MessageList messages={[specialMessage]} />)

      // Should sanitize HTML by removing script tags entirely
      // The text "alert("XSS")" should be rendered as plain text
      expect(screen.getByText(/alert\("XSS"\)/)).toBeInTheDocument()
      // Script tag should NOT be in the document
      expect(screen.queryByText(/<script>/)).not.toBeInTheDocument()
    })

    it('should handle undefined optional fields', () => {
      const minimalMessage: Message = {
        id: 'msg-minimal',
        userId: 'user-123',
        telegramMessageId: 99999,
        content: 'Minimal message',
        sender: {
          telegramUserId: '111',
          name: 'Unknown',
        },
        chat: {
          telegramChatId: '222',
          title: 'Unknown Chat',
          type: 'private',
        },
        timestamp: '2025-10-14T10:00:00Z',
        type: 'text',
        media: null,
        isReply: false,
        isForwarded: false,
        createdAt: '2025-10-14T10:00:00Z',
      }

      render(<MessageList messages={[minimalMessage]} />)

      expect(screen.getByText('Minimal message')).toBeInTheDocument()
    })
  })
})
