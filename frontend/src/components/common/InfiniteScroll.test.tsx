/**
 * InfiniteScroll component tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { InfiniteScroll } from './InfiniteScroll'

// Mock IntersectionObserver instance
interface MockIntersectionObserver {
  observe: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
}

describe('InfiniteScroll', () => {
  const defaultProps = {
    onLoadMore: vi.fn(),
    hasMore: true,
    isLoading: false,
  }

  let mockObserve: ReturnType<typeof vi.fn>
  let mockDisconnect: ReturnType<typeof vi.fn>
  let mockIntersectionObserver: typeof IntersectionObserver
  let observerCallback: IntersectionObserverCallback | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    observerCallback = null

    // Mock IntersectionObserver
    mockObserve = vi.fn()
    mockDisconnect = vi.fn()

    mockIntersectionObserver = vi.fn((callback: IntersectionObserverCallback) => {
      observerCallback = callback
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      }
    })
    global.IntersectionObserver = mockIntersectionObserver
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children', () => {
    render(
      <InfiniteScroll {...defaultProps}>
        <div data-testid="child-content">Child Content</div>
      </InfiniteScroll>
    )

    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  it('renders sentinel element', () => {
    render(
      <InfiniteScroll {...defaultProps}>
        <div>Content</div>
      </InfiniteScroll>
    )

    const sentinel = screen.getByTestId('infinite-scroll-sentinel')
    expect(sentinel).toBeInTheDocument()
    expect(sentinel).toHaveClass('h-1')
    expect(sentinel).toHaveAttribute('aria-hidden', 'true')
  })

  it('sets up IntersectionObserver with correct options', () => {
    render(
      <InfiniteScroll {...defaultProps} threshold={300}>
        <div>Content</div>
      </InfiniteScroll>
    )

    expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      rootMargin: '300px',
      threshold: 0,
    })
  })

  it('uses default threshold of 200px when not specified', () => {
    render(
      <InfiniteScroll {...defaultProps}>
        <div>Content</div>
      </InfiniteScroll>
    )

    expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      rootMargin: '200px',
      threshold: 0,
    })
  })

  it('calls onLoadMore when sentinel becomes visible', async () => {
    render(
      <InfiniteScroll {...defaultProps}>
        <div>Content</div>
      </InfiniteScroll>
    )

    const sentinel = screen.getByTestId('infinite-scroll-sentinel')

    // Simulate intersection
    await act(async () => {
      if (observerCallback) {
        observerCallback(
          [{ isIntersecting: true, target: sentinel } as IntersectionObserverEntry],
          {
            observe: mockObserve,
            disconnect: mockDisconnect,
            unobserve: vi.fn(),
          } as MockIntersectionObserver as unknown as IntersectionObserver
        )
      }
    })

    await waitFor(() => {
      expect(defaultProps.onLoadMore).toHaveBeenCalledTimes(1)
    })
  })

  it('does not call onLoadMore when sentinel is not intersecting', () => {
    render(
      <InfiniteScroll {...defaultProps}>
        <div>Content</div>
      </InfiniteScroll>
    )

    const sentinel = screen.getByTestId('infinite-scroll-sentinel')

    // Simulate no intersection
    if (observerCallback) {
      observerCallback([{ isIntersecting: false, target: sentinel } as IntersectionObserverEntry], {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      } as MockIntersectionObserver as unknown as IntersectionObserver)
    }

    expect(defaultProps.onLoadMore).not.toHaveBeenCalled()
  })

  it('does not call onLoadMore when isLoading is true', async () => {
    render(
      <InfiniteScroll {...defaultProps} isLoading={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    const sentinel = screen.getByTestId('infinite-scroll-sentinel')

    if (observerCallback) {
      observerCallback([{ isIntersecting: true, target: sentinel } as IntersectionObserverEntry], {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      } as MockIntersectionObserver as unknown as IntersectionObserver)
    }

    await waitFor(() => {
      expect(defaultProps.onLoadMore).not.toHaveBeenCalled()
    })
  })

  it('does not call onLoadMore when hasMore is false', async () => {
    render(
      <InfiniteScroll {...defaultProps} hasMore={false}>
        <div>Content</div>
      </InfiniteScroll>
    )

    const sentinel = screen.getByTestId('infinite-scroll-sentinel')

    if (observerCallback) {
      observerCallback([{ isIntersecting: true, target: sentinel } as IntersectionObserverEntry], {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      } as MockIntersectionObserver as unknown as IntersectionObserver)
    }

    await waitFor(() => {
      expect(defaultProps.onLoadMore).not.toHaveBeenCalled()
    })
  })

  it('shows loading indicator when isLoading is true', () => {
    render(
      <InfiniteScroll {...defaultProps} isLoading={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    expect(screen.getByTestId('infinite-scroll-loading')).toBeInTheDocument()
  })

  it('hides loading indicator when isLoading is false', () => {
    render(
      <InfiniteScroll {...defaultProps} isLoading={false}>
        <div>Content</div>
      </InfiniteScroll>
    )

    expect(screen.queryByTestId('infinite-scroll-loading')).not.toBeInTheDocument()
  })

  it('shows end of list message when hasMore is false and not loading', () => {
    render(
      <InfiniteScroll {...defaultProps} hasMore={false} isLoading={false}>
        <div>Content</div>
      </InfiniteScroll>
    )

    const endMessage = screen.getByTestId('infinite-scroll-end')
    expect(endMessage).toBeInTheDocument()
    expect(endMessage).toHaveTextContent('No more items to load')
  })

  it('hides end of list message when hasMore is true', () => {
    render(
      <InfiniteScroll {...defaultProps} hasMore={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    expect(screen.queryByTestId('infinite-scroll-end')).not.toBeInTheDocument()
  })

  it('hides end of list message when loading', () => {
    render(
      <InfiniteScroll {...defaultProps} hasMore={false} isLoading={true}>
        <div>Content</div>
      </InfiniteScroll>
    )

    expect(screen.queryByTestId('infinite-scroll-end')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <InfiniteScroll {...defaultProps} className="custom-class">
        <div>Content</div>
      </InfiniteScroll>
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('debounces rapid onLoadMore calls', async () => {
    vi.useFakeTimers()

    render(
      <InfiniteScroll {...defaultProps}>
        <div>Content</div>
      </InfiniteScroll>
    )

    const sentinel = screen.getByTestId('infinite-scroll-sentinel')

    // First trigger - should call onLoadMore
    await act(async () => {
      if (observerCallback) {
        observerCallback(
          [{ isIntersecting: true, target: sentinel } as IntersectionObserverEntry],
          {
            observe: mockObserve,
            disconnect: mockDisconnect,
            unobserve: vi.fn(),
          } as MockIntersectionObserver as unknown as IntersectionObserver
        )
      }
    })

    expect(defaultProps.onLoadMore).toHaveBeenCalledTimes(1)

    // Trigger multiple times rapidly - should be blocked by debounce
    await act(async () => {
      if (observerCallback) {
        observerCallback(
          [{ isIntersecting: true, target: sentinel } as IntersectionObserverEntry],
          {
            observe: mockObserve,
            disconnect: mockDisconnect,
            unobserve: vi.fn(),
          } as MockIntersectionObserver as unknown as IntersectionObserver
        )
        observerCallback(
          [{ isIntersecting: true, target: sentinel } as IntersectionObserverEntry],
          {
            observe: mockObserve,
            disconnect: mockDisconnect,
            unobserve: vi.fn(),
          } as MockIntersectionObserver as unknown as IntersectionObserver
        )
      }
    })

    // Should still be 1 (debounced)
    expect(defaultProps.onLoadMore).toHaveBeenCalledTimes(1)

    // Advance timers to clear debounce
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // Now it should be able to call again
    await act(async () => {
      if (observerCallback) {
        observerCallback(
          [{ isIntersecting: true, target: sentinel } as IntersectionObserverEntry],
          {
            observe: mockObserve,
            disconnect: mockDisconnect,
            unobserve: vi.fn(),
          } as MockIntersectionObserver as unknown as IntersectionObserver
        )
      }
    })
    expect(defaultProps.onLoadMore).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('disconnects observer on unmount', () => {
    const { unmount } = render(
      <InfiniteScroll {...defaultProps}>
        <div>Content</div>
      </InfiniteScroll>
    )

    unmount()

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  it('handles missing sentinel gracefully', () => {
    const { rerender } = render(
      <InfiniteScroll {...defaultProps}>
        <div>Content</div>
      </InfiniteScroll>
    )

    // Force re-render with null sentinel
    const sentinel = screen.getByTestId('infinite-scroll-sentinel')
    Object.defineProperty(sentinel, 'parentElement', { value: null })

    expect(() => {
      rerender(
        <InfiniteScroll {...defaultProps}>
          <div>Content</div>
        </InfiniteScroll>
      )
    }).not.toThrow()
  })
})
