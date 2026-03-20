/**
 * ChannelMultiSelect - Refined Multi-Select Dropdown for LLM Insights
 *
 * A polished, searchable multi-select component with:
 * - Elegant chip-based display with overflow handling
 * - Smooth dropdown animations with backdrop
 * - Inline search with instant filtering
 * - Keyboard navigation (arrow keys, space, escape)
 * - Message count formatting
 * - Select all / Clear actions
 *
 * Design: Editorial refinement with micro-interactions
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface ChannelMultiSelectProps {
  availableChats: Array<{
    id: string
    title: string
    messageCount?: number
  }>
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  maxDisplay?: number
  /** Per-channel sync times (channel ID -> ISO timestamp) */
  channelSyncTimes?: Record<string, string>
}

export function ChannelMultiSelect({
  availableChats,
  selectedIds,
  onChange,
  isLoading = false,
  disabled = false,
  placeholder = 'Select channels...',
  maxDisplay = 2,
  channelSyncTimes = {},
}: ChannelMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter chats based on search
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return availableChats
    const query = searchQuery.toLowerCase()
    return availableChats.filter((chat) => chat.title.toLowerCase().includes(query))
  }, [availableChats, searchQuery])

  // Get selected chat objects
  const selectedChats = useMemo(() => {
    return availableChats.filter((chat) => selectedIds.includes(chat.id))
  }, [availableChats, selectedIds])

  // Format message count (avoids trailing .0 for whole numbers)
  const formatCount = (count?: number): string => {
    if (!count) return '0'

    if (count >= 1000000) {
      const millions = count / 1000000
      return millions % 1 === 0 ? `${Math.floor(millions)}M` : `${millions.toFixed(1)}M`
    }

    if (count >= 1000) {
      const thousands = count / 1000
      return thousands % 1 === 0 ? `${Math.floor(thousands)}K` : `${thousands.toFixed(1)}K`
    }

    return count.toString()
  }

  // Format a date as relative time (e.g., "5m ago", "2h ago")
  const formatRelativeTime = (isoString: string): string => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) {
      return 'now'
    } else if (diffMin < 60) {
      return `${diffMin}m ago`
    } else if (diffHour < 24) {
      return `${diffHour}h ago`
    } else if (diffDay < 7) {
      return `${diffDay}d ago`
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }
  }

  // Toggle selection
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  // Select all / Clear
  const handleSelectAll = () => {
    onChange(filteredChats.map((chat) => chat.id))
  }

  const handleClear = () => {
    onChange([])
  }

  // Remove single chip
  const removeChip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedIds.filter((selectedId) => selectedId !== id))
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        setIsOpen(false)
        triggerRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev < filteredChats.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredChats.length - 1))
        break
      case ' ':
        if (focusedIndex >= 0 && focusedIndex < filteredChats.length) {
          e.preventDefault()
          toggleSelection(filteredChats[focusedIndex].id)
        }
        break
      case 'Enter':
        if (focusedIndex >= 0 && focusedIndex < filteredChats.length) {
          e.preventDefault()
          toggleSelection(filteredChats[focusedIndex].id)
        }
        break
    }
  }

  // Render trigger content
  const renderTriggerContent = () => {
    if (selectedChats.length === 0) {
      return <span className="text-foreground-muted">{placeholder}</span>
    }

    const displayedChips = selectedChats.slice(0, maxDisplay)
    const remainingCount = selectedChats.length - maxDisplay

    return (
      <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
        {displayedChips.map((chat) => (
          <div
            key={chat.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium max-w-[120px] animate-scale-in"
          >
            <span className="truncate">{chat.title}</span>
            <button
              type="button"
              onClick={(e) => removeChip(chat.id, e)}
              className="flex-shrink-0 hover:bg-primary/20 rounded transition-colors p-0.5"
              aria-label={`Remove ${chat.title}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs font-medium text-foreground-muted px-1 whitespace-nowrap">
            +{remainingCount} more
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles matching Input component
          'flex h-11 w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm',
          'bg-background-subtle border border-border',
          'transition-all duration-150',

          // Focus states
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
          'focus-visible:border-primary',

          // Hover state
          !disabled && !isLoading && 'hover:border-primary/50',

          // Disabled state
          (disabled || isLoading) && 'cursor-not-allowed opacity-50',

          // Open state
          isOpen && 'border-primary ring-2 ring-primary/20'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {renderTriggerContent()}
        <ChevronDown
          className={cn(
            'h-4 w-4 text-foreground-muted transition-transform duration-200 flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" aria-hidden="true" />

          {/* Dropdown Content */}
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-2 w-full rounded-lg bg-[hsl(220,12%,13%)] border border-border shadow-elevated animate-fade-in-down origin-top"
            role="listbox"
            aria-multiselectable="true"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-border bg-[hsl(220,12%,13%)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setFocusedIndex(-1)
                  }}
                  placeholder="Search channels..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-background-subtle border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Channel List */}
            <div className="max-h-64 overflow-y-auto p-2 bg-[hsl(220,12%,13%)]">
              {filteredChats.length === 0 ? (
                <div className="py-8 text-center text-sm text-foreground-muted">
                  {searchQuery ? 'No channels match your search' : 'No channels available'}
                </div>
              ) : (
                filteredChats.map((chat, index) => {
                  const isSelected = selectedIds.includes(chat.id)
                  const isFocused = index === focusedIndex
                  const syncTime = channelSyncTimes[chat.id]

                  return (
                    <label
                      key={chat.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                        'hover:bg-background-subtle',
                        isFocused && 'bg-background-muted',
                        isSelected && 'bg-primary/5'
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(chat.id)}
                        className="pointer-events-none"
                      />

                      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                        <div className="flex flex-col min-w-0">
                          <span
                            className={cn(
                              'text-sm truncate',
                              isSelected ? 'text-foreground font-medium' : 'text-foreground'
                            )}
                          >
                            {chat.title}
                          </span>
                          {syncTime && (
                            <span className="text-[10px] text-foreground-muted">
                              synced {formatRelativeTime(syncTime)}
                            </span>
                          )}
                        </div>

                        {chat.messageCount !== undefined && (
                          <span className="text-xs text-foreground-muted font-medium whitespace-nowrap">
                            {formatCount(chat.messageCount)} msgs
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-[hsl(220,12%,13%)]">
              <span className="text-xs text-foreground-muted font-medium">
                {selectedIds.length} selected
              </span>

              <div className="flex items-center gap-3">
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  disabled={filteredChats.length === 0}
                >
                  Select All
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
