import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '@/hooks/usePagination'

describe('usePagination', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePagination())

    expect(result.current.offset).toBe(0)
    expect(result.current.limit).toBe(50)
  })

  it('should initialize with custom limit', () => {
    const { result } = renderHook(() => usePagination({ limit: 20 }))

    expect(result.current.limit).toBe(20)
  })

  it('should load next page', () => {
    const { result } = renderHook(() => usePagination({ limit: 50 }))

    act(() => {
      result.current.loadNextPage()
    })

    expect(result.current.offset).toBe(50)
  })

  it('should load multiple pages sequentially', () => {
    const { result } = renderHook(() => usePagination({ limit: 50 }))

    act(() => {
      result.current.loadNextPage()
    })
    expect(result.current.offset).toBe(50)

    act(() => {
      result.current.loadNextPage()
    })
    expect(result.current.offset).toBe(100)
  })

  it('should reset pagination', () => {
    const { result } = renderHook(() => usePagination({ limit: 50 }))

    act(() => {
      result.current.loadNextPage()
      result.current.loadNextPage()
    })
    expect(result.current.offset).toBe(100)

    act(() => {
      result.current.reset()
    })
    expect(result.current.offset).toBe(0)
  })
})
