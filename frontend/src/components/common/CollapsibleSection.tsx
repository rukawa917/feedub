/**
 * CollapsibleSection component (T018)
 * Generic collapsible section with expand/collapse animation
 * Used for filter groups in sidebar
 */

import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  isCollapsed: boolean
  onToggle: () => void
  icon?: ReactNode
}

export function CollapsibleSection({
  title,
  children,
  isCollapsed,
  onToggle,
  icon,
}: CollapsibleSectionProps) {
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors rounded-lg"
        aria-expanded={!isCollapsed}
        aria-controls={sectionId}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-foreground-muted">{icon}</span>}
          <span className="font-semibold text-foreground">{title}</span>
        </div>

        <span
          className="text-foreground-muted transition-transform duration-200"
          style={{
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>

      <div
        id={sectionId}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'max-h-0 pointer-events-none' : 'max-h-[1000px]'
        }`}
        aria-hidden={isCollapsed}
      >
        <div className="p-4 pt-0">{children}</div>
      </div>
    </div>
  )
}
