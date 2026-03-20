/**
 * Input component - Refined Editorial Design System
 * Clean, subtle styling with focus on readability
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'flex h-11 w-full rounded-lg px-4 py-2.5 text-sm',
          'bg-background-subtle border border-border',
          'text-foreground',
          'placeholder:text-foreground-muted',

          // Transitions
          'transition-colors duration-150',

          // Focus states - primary color ring
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
          'focus-visible:border-primary',

          // Hover state
          'hover:border-primary/50',

          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border',

          // Error state
          'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20',

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
