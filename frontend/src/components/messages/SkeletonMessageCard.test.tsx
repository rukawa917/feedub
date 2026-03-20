/**
 * T057-T060: SkeletonMessageCard Tests
 *
 * Comprehensive test suite for skeleton loading cards
 * Coverage:
 * - Component structure and layout matching MessageCard
 * - Shimmer animation presence
 * - Staggered entrance animations
 * - Accessibility attributes
 * - Varied skeleton sizes for realism
 * - Footer visibility control
 * - Screen reader support
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkeletonMessageCard, SkeletonMessageList } from './SkeletonMessageCard'

describe('SkeletonMessageCard', () => {
  describe('T057: Layout Structure', () => {
    it('renders Card component wrapper', () => {
      const { container } = render(<SkeletonMessageCard />)
      const card = container.querySelector('.rounded-xl.border.bg-card')
      expect(card).toBeInTheDocument()
    })

    it('renders header row with chat badge, separator, sender, and timestamp', () => {
      const { container } = render(<SkeletonMessageCard />)

      // Chat badge skeleton
      const chatBadge = container.querySelector('.h-5.w-24')
      expect(chatBadge).toBeInTheDocument()

      // Separator dot
      const separator = container.querySelector('.text-foreground-muted')
      expect(separator).toHaveTextContent('·')

      // Sender name skeleton
      const sender = container.querySelector('.h-4.w-20')
      expect(sender).toBeInTheDocument()

      // Timestamp skeleton
      const timestamp = container.querySelector('.h-4.w-16')
      expect(timestamp).toBeInTheDocument()
    })

    it('renders content preview with multiple lines', () => {
      const { container } = render(<SkeletonMessageCard />)

      // Should have at least 2 content lines
      const contentLines = container.querySelectorAll('.space-y-2 > div')
      expect(contentLines.length).toBeGreaterThanOrEqual(2)
    })

    it('renders footer badges when showFooter is true', () => {
      const { container } = render(<SkeletonMessageCard index={0} showFooter={true} />)

      // Footer should exist
      const footer = container.querySelector('.flex.items-center.gap-1\\.5')
      expect(footer).toBeInTheDocument()
    })

    it('hides footer badges when showFooter is false', () => {
      const { container } = render(<SkeletonMessageCard showFooter={false} />)

      // Footer should not exist
      const footer = container.querySelector('.flex.items-center.gap-1\\.5')
      expect(footer).not.toBeInTheDocument()
    })
  })

  describe('T058: Shimmer Animation', () => {
    it('applies shimmer animation to all skeleton elements', () => {
      const { container } = render(<SkeletonMessageCard />)

      // All skeleton elements should have animate-shimmer class
      const shimmerElements = container.querySelectorAll('.animate-shimmer')
      expect(shimmerElements.length).toBeGreaterThan(0)
    })

    it('applies shimmer to chat badge skeleton', () => {
      const { container } = render(<SkeletonMessageCard />)
      const chatBadge = container.querySelector('.h-5.w-24.animate-shimmer')
      expect(chatBadge).toBeInTheDocument()
    })

    it('applies shimmer to sender name skeleton', () => {
      const { container } = render(<SkeletonMessageCard />)
      const sender = container.querySelector('.h-4.w-20.animate-shimmer')
      expect(sender).toBeInTheDocument()
    })

    it('applies shimmer to timestamp skeleton', () => {
      const { container } = render(<SkeletonMessageCard />)
      const timestamp = container.querySelector('.h-4.w-16.animate-shimmer')
      expect(timestamp).toBeInTheDocument()
    })

    it('applies shimmer to content lines', () => {
      const { container } = render(<SkeletonMessageCard />)
      const contentLines = container.querySelectorAll('.space-y-2 > div.animate-shimmer')
      expect(contentLines.length).toBeGreaterThan(0)
    })
  })

  describe('T059: Staggered Entrance Animation', () => {
    it('applies fade-in-up animation to wrapper', () => {
      const { container } = render(<SkeletonMessageCard />)
      const wrapper = container.querySelector('.animate-fade-in-up')
      expect(wrapper).toBeInTheDocument()
    })

    it('calculates animation delay based on index', () => {
      const { container } = render(<SkeletonMessageCard index={3} />)
      const wrapper = container.querySelector('.animate-fade-in-up')
      expect(wrapper).toHaveStyle({ animationDelay: '150ms' })
    })

    it('caps animation delay at 500ms for high indices', () => {
      const { container } = render(<SkeletonMessageCard index={15} />)
      const wrapper = container.querySelector('.animate-fade-in-up')
      expect(wrapper).toHaveStyle({ animationDelay: '500ms' })
    })

    it('has zero delay for index 0', () => {
      const { container } = render(<SkeletonMessageCard index={0} />)
      const wrapper = container.querySelector('.animate-fade-in-up')
      expect(wrapper).toHaveStyle({ animationDelay: '0ms' })
    })
  })

  describe('T060: Accessibility', () => {
    it('has role="status" for screen readers', () => {
      const { container } = render(<SkeletonMessageCard />)
      const wrapper = container.querySelector('[role="status"]')
      expect(wrapper).toBeInTheDocument()
    })

    it('has aria-busy="true" during loading', () => {
      const { container } = render(<SkeletonMessageCard />)
      const wrapper = container.querySelector('[aria-busy="true"]')
      expect(wrapper).toBeInTheDocument()
    })

    it('has descriptive aria-label', () => {
      const { container } = render(<SkeletonMessageCard />)
      const wrapper = container.querySelector('[aria-label="Loading message"]')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Varied Skeleton Sizes', () => {
    it('varies content line widths based on index', () => {
      const { container: container1 } = render(<SkeletonMessageCard index={0} />)
      const { container: container2 } = render(<SkeletonMessageCard index={1} />)

      // Get second content line from each
      const line1 = container1.querySelectorAll('.space-y-2 > div')[1]
      const line2 = container2.querySelectorAll('.space-y-2 > div')[1]

      // Width classes should differ
      expect(line1?.className).not.toBe(line2?.className)
    })

    it('shows different number of content lines based on index', () => {
      // Test indices that will definitely have different line counts
      // index % 3 !== 0 adds a line, index % 2 === 0 adds another line
      const { container: container0 } = render(<SkeletonMessageCard index={0} />)
      const { container: container3 } = render(<SkeletonMessageCard index={3} />)

      const lines0 = container0.querySelectorAll('.space-y-2 > div')
      const lines3 = container3.querySelectorAll('.space-y-2 > div')

      // index 0: base(2) + (0%3!==0=false) + (0%2===0=true) = 3 lines
      // index 3: base(2) + (3%3!==0=false) + (3%2===0=false) = 2 lines
      expect(lines0.length).not.toBe(lines3.length)
    })

    it('shows footer badges conditionally based on index', () => {
      const { container: container0 } = render(<SkeletonMessageCard index={0} />)
      const { container: container1 } = render(<SkeletonMessageCard index={1} />)

      const badges0 = container0.querySelectorAll('.rounded-full.bg-muted')
      const badges1 = container1.querySelectorAll('.rounded-full.bg-muted')

      // Different indices should have different badge counts
      expect(badges0.length).not.toBe(badges1.length)
    })
  })

  describe('Default Props', () => {
    it('uses index 0 by default', () => {
      const { container } = render(<SkeletonMessageCard />)
      const wrapper = container.querySelector('.animate-fade-in-up')
      expect(wrapper).toHaveStyle({ animationDelay: '0ms' })
    })

    it('shows footer by default', () => {
      const { container } = render(<SkeletonMessageCard index={0} />)
      const footer = container.querySelector('.flex.items-center.gap-1\\.5')
      expect(footer).toBeInTheDocument()
    })
  })
})

describe('SkeletonMessageList', () => {
  describe('T059: List Rendering', () => {
    it('renders default count of 10 skeleton cards', () => {
      render(<SkeletonMessageList />)
      const cards = screen.getAllByLabelText('Loading message')
      expect(cards).toHaveLength(10)
    })

    it('renders custom count of skeleton cards', () => {
      render(<SkeletonMessageList count={5} />)
      const cards = screen.getAllByLabelText('Loading message')
      expect(cards).toHaveLength(5)
    })

    it('applies staggered delays to each card', () => {
      const { container } = render(<SkeletonMessageList count={3} />)
      const wrappers = container.querySelectorAll('.animate-fade-in-up')

      expect(wrappers[0]).toHaveStyle({ animationDelay: '0ms' })
      expect(wrappers[1]).toHaveStyle({ animationDelay: '50ms' })
      expect(wrappers[2]).toHaveStyle({ animationDelay: '100ms' })
    })

    it('passes showFooter prop to all skeleton cards', () => {
      const { container } = render(<SkeletonMessageList count={3} showFooter={false} />)

      // No footer badges should exist
      const badges = container.querySelectorAll('.rounded-full.bg-muted')
      expect(badges).toHaveLength(0)
    })
  })

  describe('T060: List Accessibility', () => {
    it('has role="status" on wrapper', () => {
      const { container } = render(<SkeletonMessageList />)
      const wrapper = container.querySelector('[role="status"]')
      expect(wrapper).toBeInTheDocument()
    })

    it('has descriptive aria-label with count', () => {
      const { container } = render(<SkeletonMessageList count={5} />)
      const wrapper = container.querySelector('[aria-label="Loading 5 messages"]')
      expect(wrapper).toBeInTheDocument()
    })

    it('includes screen reader text', () => {
      render(<SkeletonMessageList />)
      const srText = screen.getByText('Loading messages, please wait...')
      expect(srText).toBeInTheDocument()
      expect(srText).toHaveClass('sr-only')
    })
  })

  describe('Layout', () => {
    it('applies space-y-3 for consistent spacing', () => {
      const { container } = render(<SkeletonMessageList />)
      const wrapper = container.querySelector('.space-y-3')
      expect(wrapper).toBeInTheDocument()
    })

    it('maintains MessageList spacing convention', () => {
      const { container } = render(<SkeletonMessageList />)
      // Should match MessageList's space-y-3 spacing
      const wrapper = container.querySelector('.space-y-3')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles count of 0', () => {
      render(<SkeletonMessageList count={0} />)
      const cards = screen.queryAllByLabelText('Loading message')
      expect(cards).toHaveLength(0)
    })

    it('handles count of 1', () => {
      render(<SkeletonMessageList count={1} />)
      const cards = screen.getAllByLabelText('Loading message')
      expect(cards).toHaveLength(1)
    })

    it('handles large count', () => {
      render(<SkeletonMessageList count={50} />)
      const cards = screen.getAllByLabelText('Loading message')
      expect(cards).toHaveLength(50)
    })
  })
})

describe('Integration with MessageList', () => {
  it('matches MessageCard Card component structure', () => {
    const { container } = render(<SkeletonMessageCard />)

    // Should use Card component with same classes as MessageCard
    const card = container.querySelector('.rounded-xl.border.bg-card')
    expect(card).toBeInTheDocument()
  })

  it('matches MessageCard padding', () => {
    const { container } = render(<SkeletonMessageCard />)

    // Inner padding should match MessageCard's p-4
    const innerDiv = container.querySelector('.p-4')
    expect(innerDiv).toBeInTheDocument()
  })

  it('matches MessageCard spacing between sections', () => {
    const { container } = render(<SkeletonMessageCard />)

    // Header row spacing
    const header = container.querySelector('.mb-2')
    expect(header).toBeInTheDocument()

    // Content spacing
    const content = container.querySelector('.mb-3')
    expect(content).toBeInTheDocument()
  })

  it('uses same gap values as MessageCard', () => {
    const { container } = render(<SkeletonMessageCard />)

    // Header gap-3
    const headerGap = container.querySelector('.gap-3')
    expect(headerGap).toBeInTheDocument()

    // Footer gap-1.5
    const footerGap = container.querySelector('.gap-1\\.5')
    expect(footerGap).toBeInTheDocument()
  })
})
