/**
 * OverflowMenu - Mobile header consolidation component (T001-T006)
 *
 * Custom dropdown menu for mobile views that consolidates:
 * - "All" toggle (show all vs filtered messages)
 * - Sync action
 * - Export submenu (TXT, Markdown)
 * - Filter toggle
 *
 * Uses existing dropdown-menu pattern with keyboard navigation support.
 */

import * as React from 'react'
import {
  MoreVertical,
  Check,
  RefreshCw,
  Download,
  Filter,
  FileText,
  File,
  ChevronRight,
} from 'lucide-react'

export interface OverflowMenuProps {
  /** Toggle between showing all messages vs filtered */
  onToggleAll?: () => void
  /** Whether currently showing all messages */
  isShowingAll?: boolean
  /** Trigger message sync */
  onSync?: () => void
  /** Whether sync is in progress */
  isSyncing?: boolean
  /** Export messages as TXT */
  onExportTxt?: () => void
  /** Export messages as Markdown */
  onExportMarkdown?: () => void
  /** Whether export is in progress */
  isExporting?: boolean
  /** Toggle filter drawer */
  onToggleFilters?: () => void
  /** Whether filter drawer is open */
  isFiltersOpen?: boolean
}

export function OverflowMenu({
  onToggleAll,
  isShowingAll = false,
  onSync,
  isSyncing = false,
  onExportTxt,
  onExportMarkdown,
  isExporting = false,
  onToggleFilters,
  isFiltersOpen = false,
}: OverflowMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isExportSubmenuOpen, setIsExportSubmenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuItemsRef = React.useRef<(HTMLButtonElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = React.useState(-1)

  // Close menu and submenu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsExportSubmenuOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close export submenu when main menu closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsExportSubmenuOpen(false)
      setFocusedIndex(-1)
    }
  }, [isOpen])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          setIsOpen(false)
          triggerRef.current?.focus()
          break
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev + 1
            const items = menuItemsRef.current.filter(Boolean)
            return next >= items.length ? 0 : next
          })
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex((prev) => {
            const items = menuItemsRef.current.filter(Boolean)
            return prev <= 0 ? items.length - 1 : prev - 1
          })
          break
        case 'Enter':
        case ' ':
          if (focusedIndex >= 0) {
            event.preventDefault()
            menuItemsRef.current[focusedIndex]?.click()
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, focusedIndex])

  // Focus the item when focusedIndex changes
  React.useEffect(() => {
    if (focusedIndex >= 0 && menuItemsRef.current[focusedIndex]) {
      menuItemsRef.current[focusedIndex]?.focus()
    }
  }, [focusedIndex])

  const handleToggleAll = () => {
    onToggleAll?.()
    setIsOpen(false)
  }

  const handleSync = () => {
    onSync?.()
    setIsOpen(false)
  }

  const handleToggleFilters = () => {
    onToggleFilters?.()
    setIsOpen(false)
  }

  const handleExportTxt = () => {
    onExportTxt?.()
    setIsOpen(false)
    setIsExportSubmenuOpen(false)
  }

  const handleExportMarkdown = () => {
    onExportMarkdown?.()
    setIsOpen(false)
    setIsExportSubmenuOpen(false)
  }

  const toggleExportSubmenu = () => {
    setIsExportSubmenuOpen((prev) => !prev)
  }

  // Build menu items array for keyboard navigation
  let itemIndex = 0

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 w-11 flex items-center justify-center rounded-lg bg-secondary border border-border hover:border-border-highlight hover:bg-accent transition-all"
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-5 w-5 text-foreground-muted" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-card border border-border shadow-lg z-50 overflow-hidden animate-fade-in-up"
          role="menu"
          aria-orientation="vertical"
        >
          {/* All Toggle */}
          {onToggleAll && (
            <button
              ref={(el) => {
                menuItemsRef.current[itemIndex++] = el
              }}
              onClick={handleToggleAll}
              className="w-full min-h-[44px] px-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer"
              role="menuitem"
              aria-label={isShowingAll ? 'Show filtered messages' : 'Show all messages'}
            >
              <span className="text-sm text-foreground">All</span>
              {isShowingAll && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
            </button>
          )}

          {/* Sync */}
          {onSync && (
            <button
              ref={(el) => {
                menuItemsRef.current[itemIndex++] = el
              }}
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full min-h-[44px] px-4 flex items-center gap-2 hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              role="menuitem"
              aria-label={isSyncing ? 'Syncing...' : 'Sync messages'}
            >
              <RefreshCw
                className={`h-4 w-4 text-foreground-muted ${isSyncing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="text-sm text-foreground">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          )}

          {/* Export with submenu */}
          {(onExportTxt || onExportMarkdown) && (
            <>
              <button
                ref={(el) => {
                  menuItemsRef.current[itemIndex++] = el
                }}
                onClick={toggleExportSubmenu}
                disabled={isExporting}
                className="w-full min-h-[44px] px-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                role="menuitem"
                aria-label="Export messages"
                aria-expanded={isExportSubmenuOpen}
              >
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                  <span className="text-sm text-foreground">
                    {isExporting ? 'Exporting...' : 'Export'}
                  </span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-foreground-muted transition-transform ${isExportSubmenuOpen ? 'rotate-90' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {/* Export submenu items */}
              {isExportSubmenuOpen && (
                <div className="bg-background-subtle">
                  {onExportTxt && (
                    <button
                      ref={(el) => {
                        menuItemsRef.current[itemIndex++] = el
                      }}
                      onClick={handleExportTxt}
                      disabled={isExporting}
                      className="w-full min-h-[44px] px-4 pl-10 flex items-center gap-2 hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      role="menuitem"
                      aria-label="Export as TXT"
                    >
                      <FileText className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                      <span className="text-sm text-foreground">TXT</span>
                    </button>
                  )}

                  {onExportMarkdown && (
                    <button
                      ref={(el) => {
                        menuItemsRef.current[itemIndex++] = el
                      }}
                      onClick={handleExportMarkdown}
                      disabled={isExporting}
                      className="w-full min-h-[44px] px-4 pl-10 flex items-center gap-2 hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      role="menuitem"
                      aria-label="Export as Markdown"
                    >
                      <File className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                      <span className="text-sm text-foreground">Markdown</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Filter Toggle */}
          {onToggleFilters && (
            <button
              ref={(el) => {
                menuItemsRef.current[itemIndex++] = el
              }}
              onClick={handleToggleFilters}
              className="w-full min-h-[44px] px-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer"
              role="menuitem"
              aria-label={isFiltersOpen ? 'Close filters' : 'Open filters'}
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                <span className="text-sm text-foreground">Filters</span>
              </div>
              {isFiltersOpen && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
