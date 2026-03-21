/**
 * Insights Page - Main LLM Insights Interface
 *
 * Features:
 * - Two-tab interface: Generate New / History
 * - Paginated insight history
 * - Navigation to detail view
 *
 * States:
 * 1. Generate tab with messages: Show generator form
 * 2. Generate tab without messages: Show onboarding or "no messages" state
 * 3. History tab: Show insight list or empty state
 */

import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Sparkles, History as HistoryIcon } from 'lucide-react'
import { FeedubIcon } from '../components/common/FeedubIcon'
import { ThemeToggle } from '../components/common/ThemeToggle'
import { LogoutButton } from '../components/auth/LogoutButton'
import { InsightOnboarding } from '../components/insights/InsightOnboarding'
import { InsightGenerator } from '../components/insights/InsightGenerator'
import { InsightCard, InsightHistoryEmpty } from '../components/insights/InsightCard'
import { InsightDetail } from '../components/insights/InsightDetail'
import { Button } from '@/components/ui/button'
import { useInsightHistory } from '../hooks/useInsightHistory'
import { useAuthStore } from '../stores/auth'
import { getInsightDetail } from '../services/insights-service'
import type { InsightDetail as InsightDetailType } from '../types/insights'
import type { InsightsLocationState } from '../types/filters'
import { cn } from '@/lib/utils'

type TabId = 'generate' | 'history'

export function Insights() {
  const navigate = useNavigate()
  const { insightId } = useParams<{ insightId: string }>()
  const location = useLocation()
  const locationState = location.state as InsightsLocationState | undefined
  const hasMessageIds = locationState?.messageIds && locationState.messageIds.length > 0
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  // Hooks
  const {
    insights,
    total: totalInsights,
    isLoading: isLoadingHistory,
    hasMore,
    loadNextPage,
    refetch: refetchHistory,
  } = useInsightHistory()

  // Fetch insight detail when insightId is present
  const [insightDetail, setInsightDetail] = useState<InsightDetailType | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  useEffect(() => {
    if (!token || !insightId) {
      setInsightDetail(null)
      return
    }

    let cancelled = false
    setIsLoadingDetail(true)

    getInsightDetail(insightId)
      .then((data) => {
        if (!cancelled) {
          setInsightDetail(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to fetch insight detail:', err)
          setInsightDetail(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDetail(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, insightId])

  // Local state
  const [activeTab, setActiveTabState] = useState<TabId>('generate')

  // Tab change with scroll reset
  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Handle navigation
  const handleBackToDashboard = useCallback(() => {
    navigate('/dashboard')
  }, [navigate])

  const handleBackToInsights = useCallback(() => {
    navigate('/insights')
  }, [navigate])

  const handleInsightClick = useCallback(
    (insightId: string) => {
      navigate(`/insights/${insightId}`)
    },
    [navigate]
  )

  // Handle "Generate First Insight" from empty history
  const handleGenerateFirst = useCallback(() => {
    setActiveTab('generate')
  }, [setActiveTab])

  // After generation completes, refresh history
  const handleGenerationComplete = useCallback(() => {
    refetchHistory()
  }, [refetchHistory])

  // Show onboarding when no messages selected
  const showOnboarding = !hasMessageIds && activeTab === 'generate'

  // If viewing a specific insight detail, render the detail view
  if (insightId) {
    return (
      <InsightDetail
        insight={insightDetail || null}
        isLoading={isLoadingDetail}
        onBack={handleBackToInsights}
      />
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header - Glass effect sticky header */}
      <header className="glass border-b border-border/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <FeedubIcon size={40} className="rounded-xl shadow-glow-sm" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">AI Insights</h1>
                {user && (
                  <p className="text-xs text-foreground-muted">
                    {user.phone?.replace(/(\+\d{2})\d+(\d{4})/, '$1••••$2')}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <ThemeToggle iconOnly />

              {/* Logout button */}
              <LogoutButton iconOnly />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={handleBackToDashboard}
          className="group mb-6 flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Dashboard
        </button>

        {/* Tab Navigation */}
        <div className="mb-6 flex items-center gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('generate')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2',
              activeTab === 'generate'
                ? 'text-foreground border-primary bg-primary/5'
                : 'text-foreground-muted border-transparent hover:text-foreground hover:bg-accent/50'
            )}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate New
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2',
              activeTab === 'history'
                ? 'text-foreground border-primary bg-primary/5'
                : 'text-foreground-muted border-transparent hover:text-foreground hover:bg-accent/50'
            )}
          >
            <span className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              History
              {totalInsights > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-foreground-muted/20 font-mono">
                  {totalInsights}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="gradient-border animate-fade-in-up">
          <div className="rounded-xl bg-card p-6">
            {/* Generate Tab */}
            {activeTab === 'generate' && (
              <>
                {showOnboarding ? (
                  <InsightOnboarding onGetStarted={handleBackToDashboard} />
                ) : hasMessageIds ? (
                  /* Generator form */
                  <InsightGenerator
                    messageIds={locationState!.messageIds}
                    dateRange={locationState!.dateRange}
                    channelTitles={locationState!.channelTitles}
                    onGenerationComplete={handleGenerationComplete}
                  />
                ) : (
                  /* No messages selected */
                  <NoMessagesSelected onGoToDashboard={handleBackToDashboard} />
                )}
              </>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <>
                {isLoadingHistory && insights.length === 0 ? (
                  /* Loading state */
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary mb-4" />
                    <p className="text-sm text-foreground-muted">Loading insights...</p>
                  </div>
                ) : insights.length === 0 ? (
                  /* Empty state */
                  <InsightHistoryEmpty onGenerateFirst={handleGenerateFirst} />
                ) : (
                  /* Insight list */
                  <div className="space-y-4">
                    {/* List header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <h3 className="text-lg font-semibold text-foreground">Your Insights</h3>
                      <span className="text-sm text-foreground-muted font-mono">
                        {totalInsights} total
                      </span>
                    </div>

                    {/* Insight cards */}
                    <div className="space-y-3">
                      {insights.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onClick={handleInsightClick}
                        />
                      ))}
                    </div>

                    {/* Load More button */}
                    {hasMore && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={loadNextPage}
                          variant="outline"
                          disabled={isLoadingHistory}
                          className="gap-2"
                        >
                          {isLoadingHistory ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                              Loading...
                            </>
                          ) : (
                            <>Load More</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function NoMessagesSelected({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center animate-fade-in-up">
      <div className="mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-3">Select Messages to Analyze</h3>
      <p className="text-foreground-muted mb-8 max-w-md leading-relaxed">
        Apply filters on the Dashboard to select which messages you want to analyze with AI.
      </p>
      <Button onClick={onGoToDashboard} className="gap-2">
        Go to Dashboard
        <ArrowLeft className="h-4 w-4 rotate-180" />
      </Button>
    </div>
  )
}

export default Insights
