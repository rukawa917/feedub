/**
 * InsightGenerator - Main LLM Insights generation orchestrator
 * Accepts message IDs directly and handles consent, usage, and streaming
 */

import { useState, useEffect, useCallback } from 'react'
import { useInsightsConsent } from '../../hooks/useInsightsConsent'
import { useInsightsUsage } from '../../hooks/useInsightsUsage'
import { useInsightGeneration } from '../../hooks/useInsightGeneration'
import { InsightStream } from './InsightStream'
import { ConsentDialog } from './ConsentDialog'
import { LanguageSelect } from './LanguageSelect'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../types/insights'
import type { GenerationRequest } from '../../types/insights'
import { Button } from '@/components/ui/button'
import { Wand2, Sparkles, MessageSquare } from 'lucide-react'

interface InsightGeneratorProps {
  messageIds: string[]
  dateRange?: { start: string; end: string }
  channelTitles?: string[]
  onGenerationComplete?: () => void
}

const LANGUAGE_STORAGE_KEY = 'feedub_insights_language'

export function InsightGenerator({
  messageIds,
  dateRange,
  channelTitles,
  onGenerationComplete,
}: InsightGeneratorProps) {
  const { needsConsent, consentStatus, giveConsent } = useInsightsConsent()
  const { usage, canGenerate, refetch: refetchUsage } = useInsightsUsage()
  const generation = useInsightGeneration()

  // Local state
  const [showConsentDialog, setShowConsentDialog] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [isReConsent, setIsReConsent] = useState(false)
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      if (stored && stored in SUPPORTED_LANGUAGES) {
        return stored as SupportedLanguage
      }
    } catch {
      // localStorage may be unavailable in incognito/privacy mode
    }
    return 'en'
  })

  const canSubmit = messageIds.length > 0 && canGenerate && generation.status === 'idle'

  // Handle re-consent requirement from SSE errors
  useEffect(() => {
    if (generation.error?.requires_reconsent) {
      setIsReConsent(true)
      setShowConsentDialog(true)
    }
  }, [generation.error?.requires_reconsent])

  // Persist language to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // localStorage may be unavailable in incognito/privacy mode
    }
  }, [language])

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (needsConsent) {
      setIsReConsent(false)
      setShowConsentDialog(true)
      return
    }

    const request: GenerationRequest = {
      message_ids: messageIds,
      language,
    }

    await generation.generate(request)
    refetchUsage()
    onGenerationComplete?.()
  }, [needsConsent, messageIds, language, generation, refetchUsage, onGenerationComplete])

  // Handle consent given
  const handleConsent = useCallback(async () => {
    setConsentLoading(true)
    try {
      await giveConsent()
      setShowConsentDialog(false)
      setIsReConsent(false)
      // Proceed with generation after consent (initial or re-consent)
      const request: GenerationRequest = {
        message_ids: messageIds,
        language,
      }
      generation.reset() // Clear error state before retrying
      await generation.generate(request)
      refetchUsage()
      onGenerationComplete?.()
    } finally {
      setConsentLoading(false)
    }
  }, [giveConsent, messageIds, language, generation, refetchUsage, onGenerationComplete])

  // Handle "Generate Another" after completion
  const handleGenerateAnother = useCallback(() => {
    generation.reset()
    refetchUsage()
  }, [generation, refetchUsage])

  // Show stream view when generating or completed
  const showStreamView =
    generation.status === 'generating' ||
    generation.status === 'completed' ||
    generation.status === 'error'

  return (
    <div className="space-y-6">
      {/* Generating/Completed State - Show Stream */}
      {showStreamView ? (
        <div className="space-y-4">
          <InsightStream
            status={generation.status}
            content={generation.streamedContent}
            metadata={generation.metadata}
            error={generation.error}
            progress={generation.progress}
            messageCount={messageIds.length}
            channelCount={channelTitles?.length || 0}
            onCancel={generation.cancel}
          />

          {/* Generate Another Button */}
          {generation.status === 'completed' && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleGenerateAnother} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Another Insight
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Message Summary and Generation Form */
        <div className="space-y-6">
          {/* Message Summary Card */}
          <div className="rounded-xl border border-border bg-secondary/30 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">
                  {messageIds.length.toLocaleString()} messages selected
                </h3>
                {dateRange && (
                  <p className="text-sm text-foreground-muted mt-1">
                    From {dateRange.start} to {dateRange.end}
                  </p>
                )}
                {channelTitles && channelTitles.length > 0 && (
                  <p className="text-sm text-foreground-muted mt-1">
                    Channels: {channelTitles.slice(0, 3).join(', ')}
                    {channelTitles.length > 3 && ` +${channelTitles.length - 3} more`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Output Language</label>
            <LanguageSelect
              value={language}
              onChange={setLanguage}
              disabled={generation.status === 'generating'}
            />
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={!canSubmit} className="w-full gap-2" size="lg">
            <Wand2 className="h-5 w-5" />
            Generate Insight
          </Button>

          {/* Helper text */}
          {!canGenerate && usage && (
            <p className="text-xs text-foreground-muted text-center">
              Daily limit reached ({usage.used_today}/{usage.daily_limit})
              {usage.resets_at && (
                <span className="ml-1">
                  - Resets in{' '}
                  {Math.ceil((new Date(usage.resets_at).getTime() - Date.now()) / (1000 * 60 * 60))}
                  h
                </span>
              )}
            </p>
          )}
          {messageIds.length === 0 && (
            <p className="text-xs text-foreground-muted text-center">
              No messages selected. Go back to Dashboard and adjust your filters.
            </p>
          )}
          {messageIds.length > 0 && canGenerate && (
            <p className="text-xs text-foreground-muted text-center">
              💡 Want to change the selection? Go back to Dashboard and adjust your filters.
            </p>
          )}
        </div>
      )}

      {/* Consent Dialog */}
      {showConsentDialog && consentStatus && (
        <ConsentDialog
          isOpen={showConsentDialog}
          isReConsent={isReConsent}
          currentVersion={consentStatus.current_version}
          onConsent={handleConsent}
          onDecline={() => {
            setShowConsentDialog(false)
            setIsReConsent(false)
          }}
          isLoading={consentLoading}
        />
      )}
    </div>
  )
}
