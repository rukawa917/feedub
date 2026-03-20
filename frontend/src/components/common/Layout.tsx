/**
 * Layout component - Refined Editorial Design
 * CSS Grid layout with persistent sidebar (25%) + main content (75%)
 * Responsive: Desktop (>=768px) uses grid, Mobile (<768px) uses drawer
 */

import type { ReactNode } from 'react'

interface LayoutProps {
  /** Sidebar content (filters, navigation, etc.) */
  sidebar?: ReactNode

  /** Main content area */
  children: ReactNode

  /** Optional header content */
  header?: ReactNode

  /** Enable sidebar (default: true) */
  showSidebar?: boolean
}

/**
 * Layout component with persistent sidebar
 *
 * Features:
 * - CSS Grid: 25% sidebar + 75% main content (desktop >=768px)
 * - Sticky sidebar: Remains visible while scrolling main content
 * - Responsive: Mobile (<768px) hides sidebar by default (drawer mode handled by FilterSidebar)
 * - Flexible: Can be used without sidebar for full-width layouts
 */
export function Layout({ sidebar, children, header, showSidebar = true }: LayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Header - clean, no blur effect */}
      {header && (
        <header className="bg-background border-b border-border sticky top-0 z-10">{header}</header>
      )}

      {/* Main layout container */}
      <div className="max-w-[1400px] mx-auto">
        {showSidebar && sidebar ? (
          /* Desktop: Grid layout with sidebar */
          <div className="hidden md:grid md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] md:gap-6 p-4 sm:p-6">
            {/* Sidebar: Sticky, scrolls independently */}
            <aside
              className="sticky top-[73px] h-[calc(100vh-89px)] overflow-y-auto"
              role="complementary"
              aria-label="Filters and navigation"
            >
              {sidebar}
            </aside>

            {/* Main content: Scrolls independently */}
            <main className="overflow-y-auto min-w-0" role="main">
              {children}
            </main>
          </div>
        ) : (
          /* Mobile or no sidebar: Full width content */
          <div className="p-4 sm:p-6">
            {/* Mobile: Sidebar rendered as drawer (handled by FilterSidebar component) */}
            {sidebar && <div className="md:hidden mb-4">{sidebar}</div>}

            {/* Main content */}
            <main role="main">{children}</main>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * LayoutHeader component - Refined Editorial Design
 * Compact header with serif wordmark
 */
interface LayoutHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function LayoutHeader({ title, subtitle, actions }: LayoutHeaderProps) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <div className="flex items-baseline gap-3">
        <h1 className="font-serif text-xl font-medium text-foreground">{title}</h1>
        {subtitle && (
          <span className="text-sm text-foreground-muted hidden sm:inline">{subtitle}</span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
