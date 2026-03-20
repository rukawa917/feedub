import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
}

/**
 * Error display component for user-friendly error messages (FR-018)
 * Shows clear error information with optional retry action
 */
export function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="text-sm underline hover:no-underline">
            Try again
          </button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Inline error message (smaller, for form fields)
 */
export function InlineError({ message }: { message: string }) {
  return (
    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  )
}
