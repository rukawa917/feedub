/**
 * BlockingOperationModal
 * A modal that blocks all user interaction during long-running operations.
 * Shows progress, allows cancellation with confirmation, and displays errors.
 *
 * Features:
 * - Cannot be dismissed by clicking outside or pressing Escape
 * - Shows progress bar with percentage
 * - Cancel button with confirmation dialog
 * - Error state with dismiss button
 * - Completion state with dismiss button
 */

import { useState, useEffect, useRef } from 'react'
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { BlockingOperationStatus } from '@/hooks/useBlockingOperation'

interface BlockingOperationModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Title shown in the header */
  title: string
  /** Current operation status */
  status: BlockingOperationStatus
  /** Progress percentage (0-100) */
  progress: number
  /** Status text shown below progress bar */
  statusText: string
  /** Error message when status is 'failed' */
  error?: string | null
  /** Called when user confirms cancel */
  onCancel: () => void
  /** Called when user dismisses after complete/fail */
  onDismiss: () => void
  /** Custom message for cancel confirmation */
  cancelConfirmMessage?: string
}

export function BlockingOperationModal({
  isOpen,
  title,
  status,
  progress,
  statusText,
  error,
  onCancel,
  onDismiss,
  cancelConfirmMessage = 'Are you sure you want to cancel? The operation will be stopped.',
}: BlockingOperationModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [autoDismissCountdown, setAutoDismissCountdown] = useState<number | null>(null)
  const manualDismissRef = useRef(false)
  const onDismissRef = useRef(onDismiss)

  // Keep ref updated with latest onDismiss
  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  // Reset state when modal closes
  if (!isOpen && isDismissing) {
    setIsDismissing(false)
    manualDismissRef.current = false
  }

  // Auto-dismiss countdown when operation completes
  useEffect(() => {
    if (status === 'completed' && isOpen) {
      // Start countdown (5 seconds for user to see completion message)
      setAutoDismissCountdown(5)
      manualDismissRef.current = false

      const timer = setInterval(() => {
        setAutoDismissCountdown((prev) => {
          if (prev === null || manualDismissRef.current) {
            clearInterval(timer)
            return null
          }
          if (prev <= 1) {
            clearInterval(timer)
            // Auto-dismiss using ref to avoid dependency issues
            onDismissRef.current()
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        clearInterval(timer)
        setAutoDismissCountdown(null)
      }
    }
    return undefined
  }, [status, isOpen])

  const handleDismiss = () => {
    // Cancel auto-dismiss timer
    manualDismissRef.current = true
    setAutoDismissCountdown(null)
    setIsDismissing(true)
    onDismiss()
  }

  const handleCancelClick = () => {
    setShowCancelConfirm(true)
  }

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false)
    onCancel()
  }

  const handleCancelConfirmClose = () => {
    setShowCancelConfirm(false)
  }

  const isRunning = status === 'running'
  const isCancelling = status === 'cancelling'
  const isCompleted = status === 'completed'
  const isFailed = status === 'failed'

  // Prevent closing via Escape or clicking outside
  const handleOpenChange = (open: boolean) => {
    // Only allow closing programmatically, not via user interaction
    if (!open && (isCompleted || isFailed)) {
      onDismiss()
    }
    // For running/cancelling states, ignore close attempts
  }

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent
          className="sm:max-w-md"
          onEscapeKeyDown={(e) => {
            // Prevent Escape from closing during operation
            if (isRunning || isCancelling) {
              e.preventDefault()
            }
          }}
          onPointerDownOutside={(e) => {
            // Prevent clicking outside from closing during operation
            if (isRunning || isCancelling) {
              e.preventDefault()
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {isRunning && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {isCancelling && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {isFailed && <XCircle className="h-5 w-5 text-destructive" />}
              {title}
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Progress bar - show only for running and cancelling states */}
            {(isRunning || isCancelling) && (
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${progress}% complete`}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span aria-live="polite">{statusText}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            )}

            {/* Error message */}
            {isFailed && error && (
              <AlertDialogDescription className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span role="alert">{error}</span>
              </AlertDialogDescription>
            )}

            {/* Success message */}
            {isCompleted && (
              <AlertDialogDescription className="text-muted-foreground" aria-live="polite">
                {statusText}
              </AlertDialogDescription>
            )}
          </div>

          <AlertDialogFooter>
            {/* Running state - show cancel button */}
            {isRunning && (
              <Button variant="outline" onClick={handleCancelClick}>
                Cancel
              </Button>
            )}

            {/* Cancelling state - show disabled button */}
            {isCancelling && (
              <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </Button>
            )}

            {/* Completed state - show dismiss button with auto-dismiss countdown */}
            {isCompleted && (
              <Button onClick={handleDismiss} disabled={isDismissing} autoFocus>
                {isDismissing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Closing...
                  </>
                ) : autoDismissCountdown !== null ? (
                  <span aria-live="polite" aria-atomic="true">
                    Done ({autoDismissCountdown}s)
                  </span>
                ) : (
                  'Done'
                )}
              </Button>
            )}

            {/* Failed state - show dismiss button */}
            {isFailed && (
              <Button variant="outline" onClick={handleDismiss} disabled={isDismissing} autoFocus>
                {isDismissing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Closing...
                  </>
                ) : (
                  'Dismiss'
                )}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Operation?</AlertDialogTitle>
            <AlertDialogDescription>{cancelConfirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirmClose}>
              No, Keep Running
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
