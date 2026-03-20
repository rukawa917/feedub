/**
 * ThemeToggle component - Refined Editorial Design
 * Minimal icon-only toggle with rotation transition
 */

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../stores/theme'

interface ThemeToggleProps {
  /** Show only icon (default: true in new design) */
  iconOnly?: boolean
}

export function ThemeToggle({ iconOnly = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center justify-center rounded-lg transition-all duration-200
        ${iconOnly ? 'p-2.5 min-w-[44px] min-h-[44px]' : 'px-3 py-2 gap-2'}
        bg-transparent hover:bg-background-subtle
        text-foreground-muted hover:text-foreground
        cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        active:scale-95
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="relative w-5 h-5">
        {/* Sun icon - visible in dark mode */}
        <Sun
          className={`
            absolute inset-0 h-5 w-5 transition-all duration-300
            ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}
          `}
        />
        {/* Moon icon - visible in light mode */}
        <Moon
          className={`
            absolute inset-0 h-5 w-5 transition-all duration-300
            ${isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
          `}
        />
      </span>
      {!iconOnly && <span className="text-sm font-medium">{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  )
}
