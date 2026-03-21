/**
 * InsightGenerator - Main LLM Insights generation orchestrator
 * Accepts message IDs directly and handles usage and streaming
 */

import { useState, useEffect, useCallback } from 'react'
import { useInsightGeneration } from '../../hooks/useInsightGeneration'
import { InsightStream } from './InsightStream'
import { LanguageSelect } from './LanguageSelect'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../types/insights'
import type { GenerationRequest } from '../../types/insights'
import { Button } from '@/components/ui/button'
import { Wand2, Sparkles, MessageSquare, AlertTriangle } from 'lucide-react'

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
  const generation = useInsightGeneration()

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

  const canSubmit = messageIds.length > 0 && generation.status === 'idle'

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
    const request: GenerationRequest = {
      message_ids: messageIds,
      language,
    }

    await generation.generate(request)
    onGenerationComplete?.()
  }, [messageIds, language, generation, onGenerationComplete])

  // Handle "Generate Another" after completion
  const handleGenerateAnother = useCallback(() => {
    generation.reset()
  }, [generation])

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
          {/* Data Privacy Notice */}
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground-muted leading-relaxed">
                By using AI Insights, your message data will be sent to the configured LLM provider
                for analysis. You are responsible for any data privacy risks associated with this.
              </p>
            </div>
          </div>

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
          {messageIds.length === 0 && (
            <p className="text-xs text-foreground-muted text-center">
              No messages selected. Go back to Dashboard and adjust your filters.
            </p>
          )}
          {messageIds.length > 0 && (
            <p className="text-xs text-foreground-muted text-center">
              Want to change the selection? Go back to Dashboard and adjust your filters.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
