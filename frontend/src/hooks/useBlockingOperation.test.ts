// frontend/src/hooks/useBlockingOperation.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBlockingOperation } from './useBlockingOperation'

describe('useBlockingOperation', () => {
  const originalAddEventListener = window.addEventListener
  const originalRemoveEventListener = window.removeEventListener
  let addEventListenerSpy: ReturnType<typeof vi.fn>
  let removeEventListenerSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    addEventListenerSpy = vi.fn()
    removeEventListenerSpy = vi.fn()
    window.addEventListener = addEventListenerSpy
    window.removeEventListener = removeEventListenerSpy
  })

  afterEach(() => {
    window.addEventListener = originalAddEventListener
    window.removeEventListener = originalRemoveEventListener
  })

  describe('initial state', () => {
    it('should have idle status initially', () => {
      const { result } = renderHook(() => useBlockingOperation())
      expect(result.current.status).toBe('idle')
    })

    it('should not be blocking initially', () => {
      const { result } = renderHook(() => useBlockingOperation())
      expect(result.current.isBlocking).toBe(false)
    })

    it('should have zero progress initially', () => {
      const { result } = renderHook(() => useBlockingOperation())
      expect(result.current.progress).toBe(0)
    })

    it('should have empty status text initially', () => {
      const { result } = renderHook(() => useBlockingOperation())
      expect(result.current.statusText).toBe('')
    })

    it('should have no error initially', () => {
      const { result } = renderHook(() => useBlockingOperation())
      expect(result.current.error).toBeNull()
    })
  })

  describe('start()', () => {
    it('should set status to running', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test Operation' })
      })

      expect(result.current.status).toBe('running')
    })

    it('should set isBlocking to true', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test Operation' })
      })

      expect(result.current.isBlocking).toBe(true)
    })

    it('should set title', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test Operation' })
      })

      expect(result.current.title).toBe('Test Operation')
    })

    it('should use default status text', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test Operation' })
      })

      expect(result.current.statusText).toBe('Starting...')
    })

    it('should use custom initial status text', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({
          title: 'Test Operation',
          initialStatusText: 'Custom starting message',
        })
      })

      expect(result.current.statusText).toBe('Custom starting message')
    })

    it('should reset progress to 0', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test Operation' })
        result.current.setProgress(50)
      })

      act(() => {
        result.current.start({ title: 'New Operation' })
      })

      expect(result.current.progress).toBe(0)
    })
  })

  describe('setProgress()', () => {
    it('should update progress value', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.setProgress(50)
      })

      expect(result.current.progress).toBe(50)
    })

    it('should clamp progress to minimum of 0', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.setProgress(-10)
      })

      expect(result.current.progress).toBe(0)
    })

    it('should clamp progress to maximum of 100', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.setProgress(150)
      })

      expect(result.current.progress).toBe(100)
    })
  })

  describe('setStatusText()', () => {
    it('should update status text', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.setStatusText('Processing item 1 of 5')
      })

      expect(result.current.statusText).toBe('Processing item 1 of 5')
    })
  })

  describe('complete()', () => {
    it('should set status to completed', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.complete()
      })

      expect(result.current.status).toBe('completed')
    })

    it('should set progress to 100', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.setProgress(50)
        result.current.complete()
      })

      expect(result.current.progress).toBe(100)
    })

    it('should not be blocking after complete', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.complete()
      })

      expect(result.current.isBlocking).toBe(false)
    })

    it('should update status text with success message', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.complete('Successfully processed 100 items')
      })

      expect(result.current.statusText).toBe('Successfully processed 100 items')
    })
  })

  describe('fail()', () => {
    it('should set status to failed', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.fail('Something went wrong')
      })

      expect(result.current.status).toBe('failed')
    })

    it('should set error message', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.fail('Network error')
      })

      expect(result.current.error).toBe('Network error')
    })

    it('should not be blocking after fail', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.fail('Error')
      })

      expect(result.current.isBlocking).toBe(false)
    })
  })

  describe('dismiss()', () => {
    it('should reset to idle status', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.complete()
        result.current.dismiss()
      })

      expect(result.current.status).toBe('idle')
    })

    it('should reset all state', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
        result.current.setProgress(50)
        result.current.setStatusText('Working...')
        result.current.dismiss()
      })

      expect(result.current.progress).toBe(0)
      expect(result.current.statusText).toBe('')
      expect(result.current.title).toBe('')
      expect(result.current.error).toBeNull()
    })
  })

  describe('requestCancel()', () => {
    it('should set status to cancelling', async () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
      })

      await act(async () => {
        await result.current.requestCancel()
      })

      // After cancel completes, it should dismiss
      expect(result.current.status).toBe('idle')
    })

    it('should call onCancel callback', async () => {
      const onCancel = vi.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test', onCancel })
      })

      await act(async () => {
        await result.current.requestCancel()
      })

      expect(onCancel).toHaveBeenCalled()
    })

    it('should set failed status if cancel throws', async () => {
      const onCancel = vi.fn().mockRejectedValue(new Error('Cancel failed'))
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test', onCancel })
      })

      await act(async () => {
        await result.current.requestCancel()
      })

      expect(result.current.status).toBe('failed')
      expect(result.current.error).toBe('Cancel failed')
    })

    it('should not cancel if not running', async () => {
      const onCancel = vi.fn()
      const { result } = renderHook(() => useBlockingOperation())

      // Don't start, just try to cancel
      await act(async () => {
        await result.current.requestCancel()
      })

      expect(onCancel).not.toHaveBeenCalled()
      expect(result.current.status).toBe('idle')
    })
  })

  describe('beforeunload handler', () => {
    it('should add beforeunload listener when blocking starts', () => {
      const { result } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
      })

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    })

    it('should remove beforeunload listener when blocking ends', () => {
      const { result, unmount } = renderHook(() => useBlockingOperation())

      act(() => {
        result.current.start({ title: 'Test' })
      })

      act(() => {
        result.current.complete()
      })

      // Unmount to trigger cleanup
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    })
  })
})
