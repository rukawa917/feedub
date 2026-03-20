import { useState } from 'react'
import { Download, ChevronDown, AlertTriangle } from 'lucide-react'
import { useExport } from '../../hooks/useExport'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import type { FilterState } from '../../types/filters'

const EXPORT_LIMIT = 1000

interface ExportButtonProps {
  filters: FilterState
  totalCount: number
  disabled?: boolean
}

export function ExportButton({ filters, totalCount, disabled }: ExportButtonProps) {
  const { exportMessages, isExporting, error } = useExport(filters)
  const [isOpen, setIsOpen] = useState(false)
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [pendingFormat, setPendingFormat] = useState<'txt' | 'md' | null>(null)

  const handleExportClick = (format: 'txt' | 'md') => {
    setIsOpen(false)

    // If over limit, show warning dialog first
    if (totalCount > EXPORT_LIMIT) {
      setPendingFormat(format)
      setShowWarningDialog(true)
    } else {
      // Under limit, export directly
      exportMessages(format)
    }
  }

  const handleConfirmExport = async () => {
    setShowWarningDialog(false)
    if (pendingFormat) {
      await exportMessages(pendingFormat)
      setPendingFormat(null)
    }
  }

  const handleCancelExport = () => {
    setShowWarningDialog(false)
    setPendingFormat(null)
  }

  const isDisabled = disabled || totalCount === 0 || isExporting

  return (
    <>
      <div className="relative">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              disabled={isDisabled}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExportClick('txt')}>
              Export as TXT
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportClick('md')}>
              Export as Markdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {error && (
          <p className="absolute top-full right-0 mt-1 text-xs text-destructive whitespace-nowrap hidden sm:block">
            Export failed. Please try again.
          </p>
        )}
      </div>

      {/* Export limit warning dialog */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Export Limit Reached
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              <p>
                You have <strong>{totalCount.toLocaleString()}</strong> messages matching your
                filters, but exports are limited to <strong>{EXPORT_LIMIT.toLocaleString()}</strong>{' '}
                messages.
              </p>
              <p>
                Only the most recent {EXPORT_LIMIT.toLocaleString()} messages will be exported.
                Refine your filters to export specific messages, or export in batches.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExport}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExport}>
              Export {EXPORT_LIMIT.toLocaleString()} Messages
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
