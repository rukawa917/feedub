/**
 * T057: Unit test for SearchBar component
 *
 * Tests the search input functionality
 * Requirements:
 * - FR-011: Text search in message content
 * - Debounce search input to avoid excessive API calls
 * - Clear button to reset search
 * - Show search icon
 * - Accessible form controls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '../../../../src/components/messages/SearchBar'

describe('SearchBar', () => {
  // No fake timers - use real timers for user interactions
  const waitForDebounce = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  describe('Rendering', () => {
    it('should render search input field', () => {
      render(<SearchBar onSearch={vi.fn()} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('should render search icon', () => {
      render(<SearchBar onSearch={vi.fn()} />)

      // Should have a search icon (look for SVG or icon element)
      const searchIcon = screen.getByTestId('search-icon')
      expect(searchIcon).toBeInTheDocument()
    })

    it('should show clear button when input has value', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await user.type(searchInput, 'test query')

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('should not show clear button when input is empty', () => {
      render(<SearchBar onSearch={vi.fn()} />)

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
    })

    it('should display initial value when provided', () => {
      render(<SearchBar onSearch={vi.fn()} initialValue="initial search" />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      expect(searchInput).toHaveValue('initial search')
    })
  })

  describe('Search Functionality', () => {
    it('should call onSearch with debounced input value', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} debounceMs={100} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await user.type(searchInput, 'test query')

      // Should not call immediately
      expect(onSearch).not.toHaveBeenCalled()

      // Wait for debounce delay
      await waitForDebounce(150)

      // Should call after debounce delay
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test query')
        expect(onSearch).toHaveBeenCalledTimes(1)
      })
    })

    it('should debounce multiple rapid inputs', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} debounceMs={100} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)

      // Type quickly (userEvent batches these)
      await user.type(searchInput, 'abc')

      // Should not call immediately
      expect(onSearch).not.toHaveBeenCalled()

      // Wait for full debounce period
      await waitForDebounce(150)

      // Should only call once with final value
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('abc')
        expect(onSearch).toHaveBeenCalledTimes(1)
      })
    })

    it('should use default debounce of 500ms when not specified', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await user.type(searchInput, 'test')

      // Wait less than default 500ms
      await waitForDebounce(300)
      expect(onSearch).not.toHaveBeenCalled()

      // Wait for full debounce period
      await waitForDebounce(300)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test')
      })
    })

    it('should clear search when clear button is clicked', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} debounceMs={100} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await user.type(searchInput, 'test query')

      await waitForDebounce(150)
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test query')
      })

      // Click clear button
      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      // Should call onSearch with empty string
      expect(searchInput).toHaveValue('')
      expect(onSearch).toHaveBeenCalledWith('')
    })

    it('should trim whitespace from search input', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} debounceMs={100} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await user.type(searchInput, '  test query  ')

      await waitForDebounce(150)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test query')
      })
    })

    it('should handle empty/whitespace-only input', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} debounceMs={100} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await user.type(searchInput, '   ')

      await waitForDebounce(150)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<SearchBar onSearch={vi.fn()} />)

      const searchInput = screen.getByLabelText(/search/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} debounceMs={100} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)

      // Tab to input
      await user.tab()
      expect(searchInput).toHaveFocus()

      // Type
      await user.type(searchInput, 'test')
      await waitForDebounce(150)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test')
      })
    })

    it('should clear on Escape key', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} debounceMs={100} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await user.type(searchInput, 'test query')

      await waitForDebounce(150)
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test query')
      })

      // Press Escape
      await user.keyboard('{Escape}')

      expect(searchInput).toHaveValue('')
      expect(onSearch).toHaveBeenCalledWith('')
    })

    it('should have proper ARIA attributes', () => {
      render(<SearchBar onSearch={vi.fn()} />)

      const searchInput = screen.getByRole('searchbox')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'text')
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<SearchBar onSearch={vi.fn()} isLoading={true} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should disable input when isLoading is true', () => {
      render(<SearchBar onSearch={vi.fn()} isLoading={true} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      expect(searchInput).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters correctly', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} debounceMs={100} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await user.type(searchInput, '@#$%^&*()')

      await waitForDebounce(150)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('@#$%^&*()')
      })
    })

    it('should handle unicode characters', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} debounceMs={100} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      await user.type(searchInput, '你好世界 🌍')

      await waitForDebounce(150)

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('你好世界 🌍')
      })
    })

    it('should handle very long search queries', async () => {
      const onSearch = vi.fn()
      const user = userEvent.setup({ delay: null })

      render(<SearchBar onSearch={onSearch} debounceMs={100} maxLength={100} />)

      const searchInput = screen.getByPlaceholderText(/search messages/i)
      const longQuery = 'a'.repeat(150)

      await user.type(searchInput, longQuery)
      await waitForDebounce(150)

      await waitFor(() => {
        // Should truncate to maxLength
        expect(onSearch).toHaveBeenCalledWith('a'.repeat(100))
      })
    })
  })
})
