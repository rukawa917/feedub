/**
 * T063: SearchBar component
 *
 * Provides text search input with debouncing for message content search
 * Requirements:
 * - FR-011: Text search in message content
 * - Debounce input to avoid excessive API calls
 * - Clear button to reset search
 * - Accessible form controls
 */

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '../ui/input'
import { Search, X, Loader2 } from 'lucide-react'

interface SearchBarProps {
  /** Callback when search query changes (debounced) */
  onSearch: (query: string) => void

  /** Initial search value */
  initialValue?: string

  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number

  /** Loading state */
  isLoading?: boolean

  /** Maximum length for search query */
  maxLength?: number
}

/**
 * SearchBar component with debounced input
 *
 * Features:
 * - Debounced search (default 500ms)
 * - Clear button when input has value
 * - Escape key to clear
 * - Accessible with proper ARIA attributes
 * - Trims whitespace from input
 */
export function SearchBar({
  onSearch,
  initialValue = '',
  debounceMs = 500,
  isLoading = false,
  maxLength = 100,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Update value when initialValue changes (e.g., from URL params)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  // Debounced search effect
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      const trimmedValue = value.trim()
      onSearch(trimmedValue)
    }, debounceMs)

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [value, debounceMs, onSearch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value

    // Enforce max length
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength)
    }

    setValue(newValue)
  }

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear()
    }
  }

  return (
    <div className="relative w-full">
      <label htmlFor="search-messages" className="sr-only">
        Search messages
      </label>

      <div className="relative group">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {isLoading ? (
            <Loader2
              className="h-4 w-4 text-foreground-muted animate-spin"
              data-testid="loading-icon"
            />
          ) : (
            <Search
              className="h-4 w-4 text-foreground-muted group-focus-within:text-primary transition-colors"
              data-testid="search-icon"
            />
          )}
        </div>

        <Input
          id="search-messages"
          type="text"
          role="searchbox"
          placeholder="Search messages..."
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="pl-10 pr-10"
          aria-label="Search messages"
        />

        {/* Clear button */}
        {value && !isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-md text-foreground-muted hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="sr-only" role="status" aria-live="polite">
          Searching...
        </div>
      )}
    </div>
  )
}
