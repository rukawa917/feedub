/**
 * ConsentDialog - GDPR Consent Modal for LLM Insights
 *
 * A trust-building consent interface with refined editorial aesthetics.
 * Emphasizes transparency, user control, and privacy-first design.
 */

import { Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface ConsentDialogProps {
  isOpen: boolean
  isReConsent: boolean
  currentVersion: string
  onConsent: () => void
  onDecline: () => void
  isLoading: boolean
}

export function ConsentDialog({
  isOpen,
  isReConsent,
  currentVersion,
  onConsent,
  onDecline,
  isLoading,
}: ConsentDialogProps) {
  const title = isReConsent ? '🔄 Consent Update Required' : '✨ Enable AI Insights'
  const consentButtonText = isReConsent ? 'I Agree to Update' : 'I Agree'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onDecline()}>
      <DialogContent className="max-w-xl !bg-[hsl(220,12%,11%)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">{title}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed pt-2">
            {isReConsent ? (
              <>
                Our privacy terms have been updated to version <strong>{currentVersion}</strong>.
                Please review and confirm your consent to continue using AI-powered insights.
              </>
            ) : (
              <>
                Get AI-powered summaries, sentiment analysis, and actionable insights from your
                messages. Your privacy is our priority.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Trust Section - Privacy Guarantees */}
        <div className="my-6 rounded-lg bg-secondary border border-border p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-md bg-primary/10 border border-primary/20">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <p className="text-foreground-secondary leading-relaxed">
                  Messages are only read when you request an insight
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <p className="text-foreground-secondary leading-relaxed">
                  Raw messages are never stored by AI
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <p className="text-foreground-secondary leading-relaxed">
                  You can revoke access anytime in Settings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Version & Privacy Policy */}
        <div className="pt-2 pb-1 border-t border-border">
          <div className="flex items-center justify-between text-xs text-foreground-muted">
            <span className="font-mono">Version {currentVersion}</span>
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="gap-3 sm:gap-2">
          <Button
            variant="secondary"
            onClick={onDecline}
            disabled={isLoading}
            className="sm:flex-1"
          >
            Not Now
          </Button>
          <Button
            variant="default"
            onClick={onConsent}
            disabled={isLoading}
            className="sm:flex-1 relative"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner
                  size="sm"
                  className="border-primary-foreground border-t-transparent"
                />
                <span>Processing...</span>
              </div>
            ) : (
              consentButtonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
