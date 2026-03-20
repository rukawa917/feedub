/**
 * Button component - Refined Editorial Design System
 * Variant hierarchy: Primary (filled gold) → Accent (teal) → Secondary → Ghost
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles - DM Sans (inherited), medium weight
          'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium cursor-pointer disabled:cursor-not-allowed',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',

          // Primary (default) - Solid honey gold with subtle glow
          variant === 'default' &&
            'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110',

          // Secondary - Elevated surface with border
          variant === 'secondary' &&
            'bg-background-subtle border border-border text-foreground hover:bg-background-muted hover:border-border-highlight',

          // Outline - Transparent with visible border
          variant === 'outline' &&
            'border border-border bg-transparent text-foreground hover:bg-background-subtle hover:text-foreground',

          // Ghost - Minimal, text-based
          variant === 'ghost' &&
            'text-foreground-muted hover:text-foreground hover:bg-background-subtle',

          // Destructive - Muted coral
          variant === 'destructive' &&
            'bg-destructive text-destructive-foreground shadow-md shadow-destructive/20 hover:brightness-110',

          // Accent - Teal for Telegram-related actions
          variant === 'accent' &&
            'bg-accent text-accent-foreground shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 hover:brightness-110',

          // Sizes
          size === 'default' && 'h-10 px-5 py-2',
          size === 'sm' && 'h-9 px-4 text-xs',
          size === 'lg' && 'h-12 px-8 text-base',
          size === 'icon' && 'h-10 w-10',

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
