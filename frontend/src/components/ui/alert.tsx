/**
 * Alert component (shadcn/ui stub)
 * This is a minimal implementation for error display
 */

import * as React from 'react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}

export function Alert({ className = '', variant = 'default', ...props }: AlertProps) {
  const variantClasses =
    variant === 'destructive'
      ? 'border-red-200 bg-red-50 text-red-900'
      : 'border-slate-200 bg-slate-50 text-slate-900'

  return (
    <div
      role="alert"
      className={`rounded-lg border p-4 ${variantClasses} ${className}`}
      {...props}
    />
  )
}

export function AlertDescription({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm ${className}`} {...props} />
}

export function AlertTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`} {...props} />
}
