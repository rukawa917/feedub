/**
 * ToastContext - Global toast notification system (T010)
 *
 * Provides a context for showing toast notifications throughout the app.
 * Use the useToast hook to access the showToast function.
 */

import * as React from 'react'
import { ToastContainer } from '../components/ui/toast'

interface ToastData {
  id: string
  message: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  showToast: (
    message: string,
    options?: {
      variant?: 'success' | 'error' | 'warning' | 'info'
      duration?: number
      action?: { label: string; onClick: () => void }
    }
  ) => void
  dismissToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  const showToast = React.useCallback(
    (
      message: string,
      options?: {
        variant?: 'success' | 'error' | 'warning' | 'info'
        duration?: number
        action?: { label: string; onClick: () => void }
      }
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newToast: ToastData = {
        id,
        message,
        variant: options?.variant || 'info',
        duration: options?.duration ?? 4000,
        action: options?.action,
      }

      setToasts((prev) => [...prev, newToast])
    },
    []
  )

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value = React.useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
