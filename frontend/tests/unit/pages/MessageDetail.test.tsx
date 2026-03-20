import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MessageDetail } from '@/pages/MessageDetail'
import { getMessageDetail } from '@/services/message-service'

// Mock the message service
vi.mock('@/services/message-service')

const mockMessage = {
  id: '123',
  user_id: 'user-1',
  telegram_message_id: '456',
  content: 'Test message content',
  sender_telegram_user_id: '789',
  sender_name: 'John Doe',
  chat_id: '101112',
  chat_title: 'Test Chat',
  chat_type: 'group',
  timestamp: '2025-11-04T12:00:00Z',
  type: 'text',
  media: null,
  is_reply: false,
  is_forward: false,
  created_at: '2025-11-04T12:00:00Z',
}

describe('MessageDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    vi.mocked(getMessageDetail).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(
      <MemoryRouter initialEntries={['/messages/123']}>
        <Routes>
          <Route path="/messages/:messageId" element={<MessageDetail />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should render message details after loading', async () => {
    vi.mocked(getMessageDetail).mockResolvedValue(mockMessage)

    render(
      <MemoryRouter initialEntries={['/messages/123']}>
        <Routes>
          <Route path="/messages/:messageId" element={<MessageDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test message content')).toBeInTheDocument()
    })

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Test Chat')).toBeInTheDocument()
  })

  it('should render error state when fetch fails', async () => {
    vi.mocked(getMessageDetail).mockRejectedValue(
      new Error('Failed to fetch message')
    )

    render(
      <MemoryRouter initialEntries={['/messages/123']}>
        <Routes>
          <Route path="/messages/:messageId" element={<MessageDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch message/i)).toBeInTheDocument()
    })
  })

  it('should show reply indicator when message is a reply', async () => {
    vi.mocked(getMessageDetail).mockResolvedValue({
      ...mockMessage,
      is_reply: true,
    })

    render(
      <MemoryRouter initialEntries={['/messages/123']}>
        <Routes>
          <Route path="/messages/:messageId" element={<MessageDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/reply/i)).toBeInTheDocument()
    })
  })

  it('should show forwarded indicator when message is forwarded', async () => {
    vi.mocked(getMessageDetail).mockResolvedValue({
      ...mockMessage,
      is_forward: true,
    })

    render(
      <MemoryRouter initialEntries={['/messages/123']}>
        <Routes>
          <Route path="/messages/:messageId" element={<MessageDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/forwarded/i)).toBeInTheDocument()
    })
  })

  it('should show media metadata when message has media', async () => {
    vi.mocked(getMessageDetail).mockResolvedValue({
      ...mockMessage,
      has_media: true,
      file_name: 'photo.jpg',
      file_size: 1024000,
      file_mime_type: 'image/jpeg',
      file_width: 1920,
      file_height: 1080,
    })

    render(
      <MemoryRouter initialEntries={['/messages/123']}>
        <Routes>
          <Route path="/messages/:messageId" element={<MessageDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/photo\.jpg/i)).toBeInTheDocument()
      expect(screen.getByText(/1920 × 1080/i)).toBeInTheDocument()
    })
  })
})
