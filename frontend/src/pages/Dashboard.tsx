/**
 * Dashboard page
 *
 * Thin orchestrator that composes:
 * - SyncManager: fetch lifecycle and blocking modal
 * - FilterPanel: filter sidebar with channel selection
 * - MessagePane: message list and insights navigation
 *
 * Shared state that crosses component boundaries is held here.
 */

import { useState, useEffect } from 'react'
import { Filter as FilterIcon } from 'lucide-react'
import { FeedubIcon } from '../components/common/FeedubIcon'
import { Layout } from '../components/common/Layout'
import { LogoutButton } from '../components/auth/LogoutButton'
import { ThemeToggle } from '../components/common/ThemeToggle'
import { SyncManager } from '../components/messages/SyncManager'
import { FilterPanel } from '../components/messages/FilterPanel'
import { MessagePane } from '../components/messages/MessagePane'
import { useAuthStore } from '../stores/auth'
import { useAvailableChannels } from '../hooks/useAvailableChannels'
import { DEFAULT_FILTER_STATE } from '../types/filters'
import type { FilterState } from '../types/filters'

export function Dashboard() {
  const user = useAuthStore((state) => state.user)

  // Shared filter state (crosses FilterPanel <-> MessagePane)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE)

  // Channel selection state (crosses FilterPanel <-> MessagePane)
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([])
  const [hasExplicitChannelSelection, setHasExplicitChannelSelection] = useState(false)

  // Mobile layout state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Available channels needed for insights metadata in MessagePane
  const { data: availableChannels } = useAvailableChannels()

  // Clear fresh login flag on mount
  useEffect(() => {
    sessionStorage.removeItem('feedub_fresh_login')
  }, [])

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleFiltersChange = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }))
  }

  const handleChannelStateChange = (state: {
    selectedChannelIds: number[]
    hasExplicitChannelSelection: boolean
  }) => {
    setSelectedChannelIds(state.selectedChannelIds)
    setHasExplicitChannelSelection(state.hasExplicitChannelSelection)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-border/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <FeedubIcon size={40} className="rounded-xl shadow-glow-sm" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Feedub</h1>
                <div className="flex items-center gap-2">
                  {user && (
                    <p className="text-xs text-foreground-muted">
                      {user.phone?.replace(/(\+\d{2})\d+(\d{4})/, '$1••••$2')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <ThemeToggle iconOnly />

              {/* Mobile filter button */}
              {isMobile && (
                <button
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="p-2.5 rounded-lg bg-secondary border border-border hover:border-border-highlight hover:bg-accent transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
                  aria-label="Open filters"
                >
                  <FilterIcon className="h-5 w-5 text-foreground-muted" />
                </button>
              )}

              {/* Logout button */}
              <LogoutButton iconOnly={isMobile} />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SyncManager>
          {(sync) => (
            <Layout
              sidebar={
                <FilterPanel
                  isMobile={isMobile}
                  isDrawerOpen={isMobileDrawerOpen}
                  onDrawerClose={() => setIsMobileDrawerOpen(false)}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  isSyncing={sync.isFetchInProgress || sync.isAutoSyncing}
                  channelSyncTimes={sync.channelSyncTimes}
                  onFetchStarted={sync.onFetchStarted}
                  onChannelStateChange={handleChannelStateChange}
                />
              }
              showSidebar={!isMobile}
            >
              <MessagePane
                filters={filters}
                hasExplicitChannelSelection={hasExplicitChannelSelection}
                selectedChannelIds={selectedChannelIds}
                isMobile={isMobile}
                onOpenFilters={() => setIsMobileDrawerOpen(true)}
                isFetchInProgress={sync.isFetchInProgress}
                isAutoSyncing={sync.isAutoSyncing}
                forceSyncButtonReset={sync.forceSyncButtonReset}
                onSyncButtonResetComplete={sync.onSyncButtonResetComplete}
                onFetchStarted={sync.onFetchStarted}
                newMessagesAvailable={sync.newMessagesAvailable}
                onAcknowledgeNewMessages={sync.acknowledgeNewMessages}
                availableChannels={availableChannels}
              />
            </Layout>
          )}
        </SyncManager>
      </main>
    </div>
  )
}

export default Dashboard
