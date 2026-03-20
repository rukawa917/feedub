import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportButton } from './ExportButton'
import * as useExportModule from '../../hooks/useExport'
import type { FilterState } from '../../types/filters'

vi.mock('../../hooks/useExport')

describe('ExportButton', () => {
  const mockFilters: FilterState = {
    searchQuery: '',
    quickFilter: 'all',
    advanced: {
      chatIds: [],
      messageTypes: [],
      hasMedia: null,
      dateRange: null,
    },
  }

  const mockExportMessages = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useExportModule.useExport).mockReturnValue({
      exportMessages: mockExportMessages,
      isExporting: false,
      error: null,
    })
  })

  it('should render export button', () => {
    render(<ExportButton filters={mockFilters} totalCount={10} />)

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('should be disabled when totalCount is 0', () => {
    render(<ExportButton filters={mockFilters} totalCount={0} />)

    const button = screen.getByRole('button', { name: /export/i })
    expect(button).toBeDisabled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<ExportButton filters={mockFilters} totalCount={10} disabled />)

    const button = screen.getByRole('button', { name: /export/i })
    expect(button).toBeDisabled()
  })

  it('should show loading state when exporting', () => {
    vi.mocked(useExportModule.useExport).mockReturnValue({
      exportMessages: mockExportMessages,
      isExporting: true,
      error: null,
    })

    render(<ExportButton filters={mockFilters} totalCount={10} />)

    expect(screen.getByText(/exporting/i)).toBeInTheDocument()
  })

  it('should open dropdown menu on click', async () => {
    render(<ExportButton filters={mockFilters} totalCount={10} />)

    const button = screen.getByRole('button', { name: /export/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/export as txt/i)).toBeInTheDocument()
      expect(screen.getByText(/export as markdown/i)).toBeInTheDocument()
    })
  })

  it('should call exportMessages with txt format', async () => {
    render(<ExportButton filters={mockFilters} totalCount={10} />)

    const button = screen.getByRole('button', { name: /export/i })
    fireEvent.click(button)

    const txtOption = await screen.findByText(/export as txt/i)
    fireEvent.click(txtOption)

    expect(mockExportMessages).toHaveBeenCalledWith('txt')
  })

  it('should call exportMessages with md format', async () => {
    render(<ExportButton filters={mockFilters} totalCount={10} />)

    const button = screen.getByRole('button', { name: /export/i })
    fireEvent.click(button)

    const mdOption = await screen.findByText(/export as markdown/i)
    fireEvent.click(mdOption)

    expect(mockExportMessages).toHaveBeenCalledWith('md')
  })

  it('should show warning when totalCount > 1000', async () => {
    render(<ExportButton filters={mockFilters} totalCount={1500} />)

    // Click the export button
    const button = screen.getByRole('button', { name: /export/i })
    fireEvent.click(button)

    // Click an export format to trigger the warning dialog
    const txtOption = await screen.findByText(/export as txt/i)
    fireEvent.click(txtOption)

    // Now the warning dialog should appear with the title
    await waitFor(() => {
      expect(screen.getByText(/export limit reached/i)).toBeInTheDocument()
    })

    // Verify the counts are shown (they're formatted with commas)
    const elementsWithCount1500 = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('1,500') ?? false
    })
    expect(elementsWithCount1500.length).toBeGreaterThan(0)

    const elementsWithCount1000 = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('1,000') ?? false
    })
    expect(elementsWithCount1000.length).toBeGreaterThan(0)
  })

  it('should show error message when export fails', () => {
    vi.mocked(useExportModule.useExport).mockReturnValue({
      exportMessages: mockExportMessages,
      isExporting: false,
      error: new Error('Export failed'),
    })

    render(<ExportButton filters={mockFilters} totalCount={10} />)

    expect(screen.getByText(/export failed/i)).toBeInTheDocument()
  })
})
