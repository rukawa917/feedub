/**
 * InsightStream Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InsightStream } from './InsightStream'
import type { SSEMetadataEvent } from '@/types/insights'

const mockMetadata: SSEMetadataEvent = {
  type: 'metadata',
  tokens_used: 1234,
  input_tokens: 890,
  output_tokens: 344,
  cost: 0.0012,
  provider: 'openai',
  model: 'gpt-4',
  generation_time_ms: 45000,
}

describe('InsightStream', () => {
  it('renders idle state correctly', () => {
    render(
      <InsightStream
        content=""
        status="idle"
        progress={0}
        metadata={null}
        messageCount={847}
        channelCount={3}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Preparing your insight...')).toBeInTheDocument()
    expect(screen.getByText(/Analyzing 847 messages from 3 channels/)).toBeInTheDocument()
  })

  it('renders validating state correctly', () => {
    render(
      <InsightStream
        content=""
        status="validating"
        progress={0}
        metadata={null}
        messageCount={100}
        channelCount={1}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Preparing your insight...')).toBeInTheDocument()
    expect(screen.getByText(/Analyzing 100 messages from 1 channel/)).toBeInTheDocument()
  })

  it('renders generating state with progress', () => {
    render(
      <InsightStream
        content="## Key Topics\n\nSome content"
        status="generating"
        progress={68}
        metadata={null}
        messageCount={847}
        channelCount={3}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Generating insight...')).toBeInTheDocument()
    expect(screen.getByText('68%')).toBeInTheDocument()
    expect(screen.getByText(/Key Topics/)).toBeInTheDocument()
    expect(screen.getByText('Cancel Generation')).toBeInTheDocument()
  })

  it('renders completed state with metadata', () => {
    const { container } = render(
      <InsightStream
        content="## Analysis Complete\n\nFull content here."
        status="completed"
        progress={100}
        metadata={mockMetadata}
        messageCount={847}
        channelCount={3}
        onCancel={vi.fn()}
        onViewFull={vi.fn()}
        onGenerateAnother={vi.fn()}
      />
    )

    expect(screen.getByText('Insight Ready!')).toBeInTheDocument()
    expect(screen.getByText('View Full Insight')).toBeInTheDocument()
    expect(screen.getByText('Generate Another')).toBeInTheDocument()

    // Check metadata is rendered in the container
    const containerText = container.textContent || ''
    expect(containerText).toContain('1,234 tokens')
    // Cost of 0.0012 is less than 0.01, so it shows as "<$0.01"
    expect(containerText).toContain('<$0.01')
    expect(containerText).toContain('45s')
    expect(containerText).toContain('openai')
    expect(containerText).toContain('gpt-4')
  })

  it('renders error state with retry button', () => {
    render(
      <InsightStream
        content=""
        status="error"
        progress={0}
        metadata={null}
        messageCount={847}
        channelCount={3}
        onCancel={vi.fn()}
        onGenerateAnother={vi.fn()}
      />
    )

    expect(screen.getByText('Generation failed')).toBeInTheDocument()
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <InsightStream
        content="Generating..."
        status="generating"
        progress={50}
        metadata={null}
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByText('Cancel Generation'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onViewFull when view full button is clicked', async () => {
    const user = userEvent.setup()
    const onViewFull = vi.fn()

    render(
      <InsightStream
        content="Complete content"
        status="completed"
        progress={100}
        metadata={mockMetadata}
        onCancel={vi.fn()}
        onViewFull={onViewFull}
      />
    )

    await user.click(screen.getByText('View Full Insight'))
    expect(onViewFull).toHaveBeenCalledTimes(1)
  })

  it('calls onGenerateAnother when generate another button is clicked', async () => {
    const user = userEvent.setup()
    const onGenerateAnother = vi.fn()

    render(
      <InsightStream
        content="Complete content"
        status="completed"
        progress={100}
        metadata={mockMetadata}
        onCancel={vi.fn()}
        onGenerateAnother={onGenerateAnother}
      />
    )

    await user.click(screen.getByText('Generate Another'))
    expect(onGenerateAnother).toHaveBeenCalledTimes(1)
  })

  it('does not show cancel button in completed state', () => {
    render(
      <InsightStream
        content="Complete content"
        status="completed"
        progress={100}
        metadata={mockMetadata}
        onCancel={vi.fn()}
      />
    )

    expect(screen.queryByText('Cancel Generation')).not.toBeInTheDocument()
  })

  it('renders progress bar with correct value', () => {
    const { container } = render(
      <InsightStream
        content="Content"
        status="generating"
        progress={75}
        metadata={null}
        onCancel={vi.fn()}
      />
    )

    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('aria-valuenow', '75')
    // Check inline style directly
    expect(progressBar?.getAttribute('style')).toContain('width: 75%')
  })

  it('handles metadata with null values gracefully', () => {
    const metadataWithNulls: SSEMetadataEvent = {
      type: 'metadata',
      tokens_used: 500,
      input_tokens: null,
      output_tokens: null,
      cost: null,
      provider: 'anthropic',
      model: 'claude-3',
      generation_time_ms: null,
    }

    const { container } = render(
      <InsightStream
        content="Content"
        status="completed"
        progress={100}
        metadata={metadataWithNulls}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Free (cached)')).toBeInTheDocument()
    expect(screen.getByText('anthropic')).toBeInTheDocument()
    // Check that metadata footer contains N/A for token count
    const metadataText = container.textContent
    expect(metadataText).toContain('N/A')
  })

  it('formats cost correctly for small amounts', () => {
    const cheapMetadata: SSEMetadataEvent = {
      ...mockMetadata,
      cost: 0.0001,
    }

    render(
      <InsightStream
        content="Content"
        status="completed"
        progress={100}
        metadata={cheapMetadata}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('<$0.01')).toBeInTheDocument()
  })

  it('formats generation time for milliseconds', () => {
    const fastMetadata: SSEMetadataEvent = {
      ...mockMetadata,
      generation_time_ms: 500,
    }

    render(
      <InsightStream
        content="Content"
        status="completed"
        progress={100}
        metadata={fastMetadata}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('500ms')).toBeInTheDocument()
  })

  it('formats generation time for minutes', () => {
    const slowMetadata: SSEMetadataEvent = {
      ...mockMetadata,
      generation_time_ms: 125000, // 2m 5s
    }

    render(
      <InsightStream
        content="Content"
        status="completed"
        progress={100}
        metadata={slowMetadata}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('2m 5s')).toBeInTheDocument()
  })

  it('does not show actions when callbacks are not provided', () => {
    render(
      <InsightStream
        content="Complete content"
        status="completed"
        progress={100}
        metadata={mockMetadata}
        onCancel={vi.fn()}
      />
    )

    expect(screen.queryByText('View Full Insight')).not.toBeInTheDocument()
    expect(screen.queryByText('Generate Another')).not.toBeInTheDocument()
  })

  it('applies correct styling based on status', () => {
    const { container, rerender } = render(
      <InsightStream content="" status="idle" progress={0} metadata={null} onCancel={vi.fn()} />
    )

    // Idle state should have pulse animation
    expect(container.querySelector('.animate-pulse-subtle')).toBeInTheDocument()

    // Completed state should have border highlight
    rerender(
      <InsightStream
        content="Complete"
        status="completed"
        progress={100}
        metadata={mockMetadata}
        onCancel={vi.fn()}
      />
    )

    expect(container.querySelector('.border-primary\\/20')).toBeInTheDocument()
  })
})
