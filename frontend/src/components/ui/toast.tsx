/**
 * Toast - Notification component (T010)
 *
 * Features:
 * - Position: Bottom-right, fixed
 * - Auto-dismiss after duration
 * - Variants: success, error, warning, info
 * - Manual dismiss with X button
 * - Stack multiple toasts (max 3)
 * - Smooth animations
 */

import * as React from 'react'
import { Check, X, AlertTriangle, Info, AlertCircle } from 'lucide-react'

export interface ToastProps {
  id: string
  message: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss: (id: string) => void
}

const variantStyles = {
  success: {
    bg: 'bg-success/10 border-success/30',
    icon: Check,
    iconColor: 'text-success',
  },
  error: {
    bg: 'bg-error/10 border-error/30',
    icon: AlertCircle,
    iconColor: 'text-error',
  },
  warning: {
    bg: 'bg-warning/10 border-warning/30',
    icon: AlertTriangle,
    iconColor: 'text-warning',
  },
  info: {
    bg: 'bg-info/10 border-info/30',
    icon: Info,
    iconColor: 'text-info',
  },
}

export function Toast({
  id,
  message,
  variant = 'info',
  duration = 4000,
  action,
  onDismiss,
}: ToastProps) {
  const [isExiting, setIsExiting] = React.useState(false)

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => onDismiss(id), 300) // Wait for exit animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, id, onDismiss])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => onDismiss(id), 300)
  }

  const styles = variantStyles[variant]
  const Icon = styles.icon

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        ${styles.bg}
        ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
        transition-all duration-300
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`h-5 w-5 shrink-0 ${styles.iconColor}`} aria-hidden="true" />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{message}</p>

        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-background-subtle transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4 text-foreground-muted" />
      </button>
    </div>
  )
}

/**
 * ToastContainer - Renders stacked toasts
 */
export interface ToastContainerProps {
  toasts: Array<Omit<ToastProps, 'onDismiss'>>
  onDismiss: (id: string) => void
  maxVisible?: number
}

export function ToastContainer({ toasts, onDismiss, maxVisible = 3 }: ToastContainerProps) {
  const visibleToasts = toasts.slice(-maxVisible)

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      aria-label="Notifications"
    >
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
