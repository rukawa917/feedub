import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { MediaDownloadButton } from '@/components/messages/MediaDownloadButton'
import * as messageService from '@/services/message-service'

vi.mock('@/services/message-service', () => ({
  getMessageMedia: vi.fn(),
}))

describe('MediaDownloadButton', () => {
  const mockToken = 'mock-jwt-token'

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('should render download button', () => {
    render(
      <MediaDownloadButton messageId="123" fileName="photo.jpg" mimeType="image/jpeg" token={mockToken} />
    )

    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
  })

  it('should download media when clicked', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['mock data'], { type: 'image/jpeg' })
    vi.mocked(messageService.getMessageMedia).mockResolvedValue(mockBlob)

    render(
      <MediaDownloadButton messageId="123" fileName="photo.jpg" mimeType="image/jpeg" token={mockToken} />
    )

    const button = screen.getByRole('button', { name: /download/i })
    await user.click(button)

    await waitFor(() => {
      expect(messageService.getMessageMedia).toHaveBeenCalledWith(mockToken, '123')
    })

    // Verify button returns to normal state after download
    expect(screen.getByText(/download image/i)).toBeInTheDocument()
  })

  it('should show loading state during download', async () => {
    const user = userEvent.setup()
    vi.mocked(messageService.getMessageMedia).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(
      <MediaDownloadButton messageId="123" fileName="photo.jpg" mimeType="image/jpeg" token={mockToken} />
    )

    const button = screen.getByRole('button', { name: /download/i })
    await user.click(button)

    expect(screen.getByText(/downloading/i)).toBeInTheDocument()
  })

  it('should show error when download fails', async () => {
    const user = userEvent.setup()
    vi.mocked(messageService.getMessageMedia).mockRejectedValue(
      new Error('Media not available')
    )

    render(
      <MediaDownloadButton messageId="123" fileName="photo.jpg" mimeType="image/jpeg" token={mockToken} />
    )

    const button = screen.getByRole('button', { name: /download/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/media not available/i)).toBeInTheDocument()
    })
  })
})
