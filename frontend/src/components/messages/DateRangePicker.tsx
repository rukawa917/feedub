/**
 * DateRangePicker component (T021)
 * Single calendar for selecting date range (from and to dates)
 * Uses react-day-picker v9 in range mode
 */

import { useState, useRef } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { DayPicker, type DateRange } from 'react-day-picker'
import { Calendar, X, ChevronDown } from 'lucide-react'
import 'react-day-picker/style.css'

// Custom styles for dark theme date range
const customStyles = `
  .rdp-range_middle .rdp-day_button {
    background: rgba(251, 191, 36, 0.2) !important;
    color: #1e293b !important;
    border-radius: 0 !important;
  }
  .rdp-range_start .rdp-day_button,
  .rdp-range_end .rdp-day_button {
    background: #fbbf24 !important;
    color: #1e293b !important;
    border: none !important;
    outline: none !important;
  }
  .rdp-selected .rdp-day_button {
    border: 2px solid #fbbf24 !important;
    outline: none !important;
  }
  .rdp-today:not(.rdp-range_start):not(.rdp-range_end):not(.rdp-range_middle) .rdp-day_button {
    color: #fbbf24 !important;
    font-weight: 600;
  }
  .rdp-day_button:hover:not(.rdp-range_start):not(.rdp-range_end):not(.rdp-range_middle) {
    background: rgba(251, 191, 36, 0.3) !important;
  }
  .rdp-day_button:focus {
    outline: none !important;
    box-shadow: none !important;
  }
  .rdp-day_button:focus-visible {
    outline: 2px solid #fbbf24 !important;
    outline-offset: 2px;
  }
`

interface DateRangePickerProps {
  /** Start date (YYYY-MM-DD string or null) */
  startDate: string | null

  /** End date (YYYY-MM-DD string or null) */
  endDate: string | null

  /** Callback when date range changes */
  onChange: (startDate: string | null, endDate: string | null) => void
}

/**
 * Format a Date to YYYY-MM-DD string in local timezone
 */
function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse YYYY-MM-DD string to Date in local timezone
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Format date for display (e.g., "Dec 21, 2025")
 */
function formatDisplayDate(date: Date): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Convert string dates to DateRange for react-day-picker
  const selected: DateRange | undefined =
    startDate || endDate
      ? {
          from: startDate ? parseDateString(startDate) : undefined,
          to: endDate ? parseDateString(endDate) : undefined,
        }
      : undefined

  // Handle date range selection
  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange(null, null)
      return
    }

    const newStart = range.from ? formatDateToString(range.from) : null
    const newEnd = range.to ? formatDateToString(range.to) : null
    onChange(newStart, newEnd)
  }

  // Handle clear button
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null, null)
    setIsOpen(false)
  }

  // Generate display text
  const getDisplayText = () => {
    if (!startDate && !endDate) {
      return 'Select date range'
    }
    if (startDate && endDate) {
      return `${formatDisplayDate(parseDateString(startDate))} - ${formatDisplayDate(parseDateString(endDate))}`
    }
    if (startDate) {
      return `From ${formatDisplayDate(parseDateString(startDate))}`
    }
    if (endDate) {
      return `Until ${formatDisplayDate(parseDateString(endDate))}`
    }
    return 'Select date range'
  }

  const hasSelection = startDate || endDate

  return (
    <div ref={containerRef} className="relative">
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-input border border-border rounded-lg cursor-pointer hover:border-border-highlight hover:bg-accent/50 transition-colors text-left"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
          >
            <Calendar className="h-4 w-4 text-foreground-muted flex-shrink-0" />
            <span
              className={`flex-1 text-sm truncate ${hasSelection ? 'text-foreground' : 'text-foreground-muted'}`}
            >
              {getDisplayText()}
            </span>
            {hasSelection ? (
              <X
                className="h-4 w-4 text-foreground-muted hover:text-destructive flex-shrink-0 cursor-pointer"
                onClick={handleClear}
              />
            ) : (
              <ChevronDown
                className={`h-4 w-4 text-foreground-muted flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            )}
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-[9999] rounded-xl p-4"
            style={{
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            }}
            sideOffset={8}
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <style>{customStyles}</style>
            <div
              style={
                {
                  '--rdp-accent-color': '#fbbf24',
                  '--rdp-accent-background-color': 'rgba(251, 191, 36, 0.15)',
                  '--rdp-range_middle-background-color': 'rgba(251, 191, 36, 0.1)',
                  '--rdp-day-height': '44px',
                  '--rdp-day-width': '44px',
                  '--rdp-font-family': 'Inter, system-ui, sans-serif',
                  '--rdp-day-font': '400 14px Inter, system-ui, sans-serif',
                  '--rdp-weekday-font': '500 12px Inter, system-ui, sans-serif',
                  '--rdp-background-color': 'transparent',
                  '--rdp-selected-font': '500 14px Inter, system-ui, sans-serif',
                  '--rdp-today-color': '#fbbf24',
                  color: '#e2e8f0',
                } as React.CSSProperties
              }
            >
              <DayPicker
                mode="range"
                selected={selected}
                onSelect={handleSelect}
                numberOfMonths={1}
                showOutsideDays
              />
            </div>
            <div
              className="mt-3 pt-3 flex justify-between items-center"
              style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              <button
                type="button"
                onClick={() => onChange(null, null)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:bg-white/10 cursor-pointer active:scale-95"
                style={{ color: '#94a3b8' }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors hover:opacity-90 cursor-pointer active:scale-95"
                style={{
                  background: '#fbbf24',
                  color: '#1e293b',
                }}
              >
                Done
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
