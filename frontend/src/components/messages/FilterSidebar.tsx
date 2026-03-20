/**
 * FilterSidebar component (T017)
 * Persistent sidebar wrapper with collapse logic and mobile drawer mode
 */

import type { ReactNode } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'

interface FilterSidebarProps {
  /** Filter components to render */
  children: ReactNode

  /** Mobile mode - renders as drawer */
  isMobile?: boolean

  /** Drawer open state (mobile only) */
  isDrawerOpen?: boolean

  /** Callback to close drawer (mobile only) */
  onDrawerClose?: () => void

  /** Optional title */
  title?: string
}

/**
 * FilterSidebar component
 * Sidebar wrapper for filter components
 *
 * Features:
 * - Desktop: Always visible sidebar with gradient border
 * - Mobile: Bottom sheet drawer with overlay
 * - Sticky positioning for desktop
 * - Accessibility: ARIA labels and keyboard navigation
 *
 * @example
 * ```typescript
 * <FilterSidebar title="Filters">
 *   <SearchBar />
 *   <QuickFilters />
 *   <CollapsibleSection title="Advanced">
 *     <ChatFilter />
 *   </CollapsibleSection>
 * </FilterSidebar>
 * ```
 */
export function FilterSidebar({
  children,
  isMobile = false,
  isDrawerOpen = false,
  onDrawerClose,
  title = 'Filters',
}: FilterSidebarProps) {
  // Desktop: Always visible sidebar
  if (!isMobile) {
    return (
      <aside
        className="gradient-border animate-slide-in-left"
        role="complementary"
        aria-label="Message filters"
      >
        <div className="rounded-xl bg-card overflow-hidden">
          {/* Sidebar header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-card-elevated to-card">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
            </div>
          </div>

          {/* Sidebar content */}
          <div className="divide-y divide-border">{children}</div>
        </div>
      </aside>
    )
  }

  // Mobile: Drawer with overlay
  return (
    <>
      {/* Overlay backdrop */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-fade-in cursor-pointer"
          onClick={onDrawerClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          fixed bottom-0 left-0 right-0 z-50 md:hidden
          bg-card rounded-t-2xl border-t border-border
          shadow-elevated
          transform transition-transform duration-300 ease-out
          ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'}
          max-h-[85vh] overflow-hidden
        `}
        role="complementary"
        aria-label="Message filters"
        aria-hidden={!isDrawerOpen}
      >
        {/* Drawer handle indicator */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
          </div>

          <button
            onClick={onDrawerClose}
            className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors cursor-pointer active:scale-95"
            aria-label="Close filters"
          >
            <X className="h-5 w-5 text-foreground-muted" />
          </button>
        </div>

        {/* Drawer content - scrollable */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] divide-y divide-border">
          {children}
        </div>
      </aside>
    </>
  )
}
