/**
 * MessageContent component tests
 *
 * Tests rendering of message content with Markdown/HTML formatting,
 * security features (XSS prevention), and proper handling of edge cases.
 *
 * Note: ReactMarkdown uses async rendering which can be challenging in test environments.
 * These tests focus on component behavior, prop handling, and integration patterns.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageContent } from './MessageContent'
import ReactMarkdown from 'react-markdown'

// Mock ReactMarkdown to enable synchronous testing
vi.mock('react-markdown', () => ({
  default: vi.fn((props) => {
    // ReactMarkdown receives content as children prop
    const { children } = props

    // Simple mock that applies HTML content directly for testing
    if (children === undefined || children === null) return null

    // Parse simple HTML for testing purposes
    const content = String(children)

    // Handle empty/whitespace content
    if (!content || !content.trim()) return null

    // Create a test-friendly representation
    // This mock won't be as sophisticated as real ReactMarkdown,
    // but it allows us to test component logic
    return (
      <div
        data-testid="markdown-content"
        data-allowed-elements={props.allowedElements?.join(',')}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }),
}))

describe('MessageContent', () => {
  describe('Rendering - Basic Content', () => {
    it('renders null content with placeholder', () => {
      render(<MessageContent content={null} />)

      const placeholder = screen.getByText('No text content')
      expect(placeholder).toBeInTheDocument()
      expect(placeholder).toHaveClass('text-foreground-muted', 'italic')
    })

    it('renders empty string with placeholder', () => {
      render(<MessageContent content="" />)

      expect(screen.getByText('No text content')).toBeInTheDocument()
    })

    it('renders whitespace-only content (component does not trim)', () => {
      // Note: Component checks truthy value, not trimmed value
      // Whitespace-only strings are still truthy in JavaScript
      const { container } = render(<MessageContent content="   \n\n   " />)

      // The component will pass whitespace to ReactMarkdown
      // ReactMarkdown will render it (real implementation might collapse whitespace)
      const markdownContent = container.querySelector('[data-testid="markdown-content"]')
      expect(markdownContent).toBeInTheDocument()
    })

    it('renders plain text correctly', () => {
      const { container } = render(<MessageContent content="Hello world" />)

      const markdownContent = container.querySelector('[data-testid="markdown-content"]')
      expect(markdownContent).toBeInTheDocument()
      expect(markdownContent?.innerHTML).toContain('Hello world')
    })

    it('passes content to ReactMarkdown', () => {
      render(<MessageContent content="Test content" />)

      expect(ReactMarkdown).toHaveBeenCalled()
      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toMatchObject({
        children: 'Test content',
      })
    })
  })

  describe('ReactMarkdown Configuration', () => {
    it('configures ReactMarkdown with rehypeRaw plugin', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      expect(lastCall.rehypePlugins).toBeDefined()
      expect(Array.isArray(lastCall.rehypePlugins)).toBe(true)
    })

    it('sets allowed elements whitelist', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const allowedElements = lastCall.allowedElements

      expect(allowedElements).toContain('p')
      expect(allowedElements).toContain('strong')
      expect(allowedElements).toContain('em')
      expect(allowedElements).toContain('code')
      expect(allowedElements).toContain('pre')
      expect(allowedElements).toContain('a')
      expect(allowedElements).toContain('blockquote')
      expect(allowedElements).toContain('span')
      expect(allowedElements).toContain('br')
      expect(allowedElements).toContain('del')
      expect(allowedElements).toContain('u')
    })

    it('does not allow dangerous elements', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const allowedElements = lastCall.allowedElements

      expect(allowedElements).not.toContain('script')
      expect(allowedElements).not.toContain('iframe')
      expect(allowedElements).not.toContain('img')
      expect(allowedElements).not.toContain('video')
      expect(allowedElements).not.toContain('audio')
      expect(allowedElements).not.toContain('style')
    })

    it('provides custom link component with security attributes', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const components = lastCall.components

      expect(components).toBeDefined()
      expect(components.a).toBeDefined()

      // Test the link component
      const LinkComponent = components.a
      const { container } = render(
        <LinkComponent href="https://example.com">Link text</LinkComponent>
      )

      const link = container.querySelector('a')
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveClass('text-primary', 'hover:underline')
    })

    it('provides custom span component for spoilers', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const components = lastCall.components

      expect(components.span).toBeDefined()

      // Test spoiler class
      const SpanComponent = components.span
      const { container } = render(<SpanComponent className="spoiler">Hidden text</SpanComponent>)

      const span = container.querySelector('span')
      expect(span).toHaveClass(
        'bg-foreground',
        'text-foreground',
        'hover:bg-transparent',
        'transition-colors',
        'cursor-pointer'
      )
    })

    it('handles non-spoiler spans correctly', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const SpanComponent = lastCall.components.span

      const { container } = render(
        <SpanComponent className="normal-class">Regular text</SpanComponent>
      )

      const span = container.querySelector('span')
      expect(span).toHaveClass('normal-class')
      expect(span).not.toHaveClass('bg-foreground')
    })

    it('handles spoiler with multiple classes', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const SpanComponent = lastCall.components.span

      const { container } = render(
        <SpanComponent className="spoiler other-class">Text</SpanComponent>
      )

      const span = container.querySelector('span')
      expect(span).toHaveClass('bg-foreground', 'text-foreground')
    })

    it('provides custom pre component with styling', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const PreComponent = lastCall.components.pre

      const { container } = render(<PreComponent>Code block</PreComponent>)

      const pre = container.querySelector('pre')
      expect(pre).toHaveClass(
        'bg-background-secondary',
        'rounded-md',
        'p-3',
        'overflow-x-auto',
        'my-2'
      )
    })

    it('provides custom code component for inline code', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const CodeComponent = lastCall.components.code

      const { container } = render(<CodeComponent>inline code</CodeComponent>)

      const code = container.querySelector('code')
      expect(code).toHaveClass('bg-background-secondary', 'px-1.5', 'py-0.5', 'rounded', 'text-sm')
    })

    it('handles code component for language blocks differently', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const CodeComponent = lastCall.components.code

      const { container } = render(
        <CodeComponent className="language-javascript">const x = 1;</CodeComponent>
      )

      const code = container.querySelector('code')
      expect(code).toHaveClass('language-javascript')
      // Should not have inline code classes
      expect(code).not.toHaveClass('px-1.5')
    })

    it('provides custom blockquote component with styling', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const BlockquoteComponent = lastCall.components.blockquote

      const { container } = render(<BlockquoteComponent>Quote text</BlockquoteComponent>)

      const blockquote = container.querySelector('blockquote')
      expect(blockquote).toHaveClass(
        'border-l-4',
        'border-primary/30',
        'pl-4',
        'my-2',
        'italic',
        'text-foreground/80'
      )
    })
  })

  describe('Props and Configuration', () => {
    it('applies className prop to container', () => {
      const { container } = render(
        <MessageContent content="Test content" className="custom-class" />
      )

      const contentDiv = container.querySelector('.custom-class')
      expect(contentDiv).toBeInTheDocument()
    })

    it('applies multiple className values', () => {
      const { container } = render(
        <MessageContent content="Test content" className="class-one class-two class-three" />
      )

      const contentDiv = container.querySelector('.class-one')
      expect(contentDiv).toBeInTheDocument()
      expect(contentDiv).toHaveClass('class-one', 'class-two', 'class-three')
    })

    it('does not apply className to placeholder', () => {
      render(<MessageContent content={null} className="custom-class" />)

      const placeholder = screen.getByText('No text content')
      expect(placeholder).not.toHaveClass('custom-class')
      expect(placeholder.tagName).toBe('SPAN')
    })
  })

  describe('Component Structure', () => {
    it('wraps content in a div when content exists', () => {
      const { container } = render(<MessageContent content="Test" />)

      const contentDiv = container.querySelector('div')
      expect(contentDiv).toBeInTheDocument()
    })

    it('returns span for placeholder (no wrapper div)', () => {
      const { container } = render(<MessageContent content={null} />)

      const placeholder = container.firstChild
      expect(placeholder).toBeInTheDocument()
      expect((placeholder as HTMLElement).tagName).toBe('SPAN')
    })
  })

  describe('Security - XSS Prevention via Whitelist', () => {
    it('whitelist excludes script tags', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]

      expect(lastCall.allowedElements).not.toContain('script')
    })

    it('whitelist excludes iframe tags', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]

      expect(lastCall.allowedElements).not.toContain('iframe')
    })

    it('whitelist excludes img tags', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]

      expect(lastCall.allowedElements).not.toContain('img')
    })

    it('whitelist excludes style tags', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]

      expect(lastCall.allowedElements).not.toContain('style')
    })

    it('whitelist excludes video and audio tags', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]

      expect(lastCall.allowedElements).not.toContain('video')
      expect(lastCall.allowedElements).not.toContain('audio')
    })

    it('whitelist only includes safe formatting elements', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const allowed = lastCall.allowedElements

      // All allowed elements should be safe formatting elements
      const safeElements = [
        'p',
        'br',
        'strong',
        'em',
        'code',
        'pre',
        'a',
        'blockquote',
        'del',
        'u',
        'span',
        'div',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
      ]
      expect(allowed).toEqual(safeElements)
    })
  })

  describe('List Elements', () => {
    it('provides custom ul component with styling', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const UlComponent = lastCall.components.ul

      const { container } = render(<UlComponent>List items</UlComponent>)

      const ul = container.querySelector('ul')
      expect(ul).toHaveClass('list-disc', 'list-inside', 'my-2', 'space-y-1')
    })

    it('provides custom ol component with styling', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const OlComponent = lastCall.components.ol

      const { container } = render(<OlComponent>List items</OlComponent>)

      const ol = container.querySelector('ol')
      expect(ol).toHaveClass('list-decimal', 'list-inside', 'my-2', 'space-y-1')
    })

    it('provides custom li component with styling', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const LiComponent = lastCall.components.li

      const { container } = render(<LiComponent>List item</LiComponent>)

      const li = container.querySelector('li')
      expect(li).toHaveClass('text-foreground')
    })

    it('includes list elements in allowed whitelist', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const allowedElements = lastCall.allowedElements

      expect(allowedElements).toContain('ul')
      expect(allowedElements).toContain('ol')
      expect(allowedElements).toContain('li')
    })
  })

  describe('Heading Elements', () => {
    it('provides custom h1 component with styling', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const H1Component = lastCall.components.h1

      const { container } = render(<H1Component>Heading 1</H1Component>)

      const h1 = container.querySelector('h1')
      expect(h1).toHaveClass('text-xl', 'font-bold', 'mb-2', 'text-foreground')
    })

    it('provides custom h2 component with styling', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const H2Component = lastCall.components.h2

      const { container } = render(<H2Component>Heading 2</H2Component>)

      const h2 = container.querySelector('h2')
      expect(h2).toHaveClass('text-lg', 'font-semibold', 'mb-2', 'text-foreground')
    })

    it('provides custom h3 component with styling', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const H3Component = lastCall.components.h3

      const { container } = render(<H3Component>Heading 3</H3Component>)

      const h3 = container.querySelector('h3')
      expect(h3).toHaveClass('text-base', 'font-medium', 'mb-1', 'text-foreground')
    })

    it('includes heading elements in allowed whitelist', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const allowedElements = lastCall.allowedElements

      expect(allowedElements).toContain('h1')
      expect(allowedElements).toContain('h2')
      expect(allowedElements).toContain('h3')
      expect(allowedElements).toContain('h4')
      expect(allowedElements).toContain('h5')
      expect(allowedElements).toContain('h6')
    })

    it('h4, h5, h6 elements are allowed but not styled (fallback to defaults)', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const components = lastCall.components

      // These headings are allowed but don't have custom components
      expect(components.h4).toBeUndefined()
      expect(components.h5).toBeUndefined()
      expect(components.h6).toBeUndefined()
    })
  })

  describe('Edge Cases and Real-world Content', () => {
    it('handles Korean text content', () => {
      const { container } = render(<MessageContent content="안녕하세요 테스트입니다" />)

      const markdownContent = container.querySelector('[data-testid="markdown-content"]')
      expect(markdownContent?.innerHTML).toContain('안녕하세요')
    })

    it('handles mixed Korean and English', () => {
      const { container } = render(<MessageContent content="Korean 한국어 English" />)

      const markdownContent = container.querySelector('[data-testid="markdown-content"]')
      expect(markdownContent?.innerHTML).toContain('Korean')
      expect(markdownContent?.innerHTML).toContain('한국어')
    })

    it('handles very long text', () => {
      const longText = 'A'.repeat(10000)
      render(<MessageContent content={longText} />)

      expect(ReactMarkdown).toHaveBeenCalled()
      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toMatchObject({
        children: longText,
      })
    })

    it('handles empty HTML tags in content', () => {
      render(<MessageContent content="Text <strong></strong> more text" />)

      // Should still render the content
      expect(ReactMarkdown).toHaveBeenCalled()
    })

    it('handles special characters and HTML entities', () => {
      render(<MessageContent content='&amp; &lt; &gt; "' />)

      expect(ReactMarkdown).toHaveBeenCalled()
      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1]
      // DOMPurify sanitizes content before passing to ReactMarkdown.
      // HTML entities like &amp;, &lt;, &gt; remain encoded after sanitization.
      expect(lastCall[0].children).toBe('&amp; &lt; &gt; "')
    })
  })

  describe('Integration with ReactMarkdown', () => {
    it('calls ReactMarkdown with correct children prop', () => {
      const content = 'Test content with **bold**'
      render(<MessageContent content={content} />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toMatchObject({
        children: content,
      })
    })

    it('does not call ReactMarkdown for null content', () => {
      vi.clearAllMocks()
      render(<MessageContent content={null} />)

      expect(ReactMarkdown).not.toHaveBeenCalled()
    })

    it('does not call ReactMarkdown for empty string', () => {
      vi.clearAllMocks()
      render(<MessageContent content="" />)

      expect(ReactMarkdown).not.toHaveBeenCalled()
    })

    it('provides all required props to ReactMarkdown', () => {
      render(<MessageContent content="Test" />)

      const calls = vi.mocked(ReactMarkdown).mock.calls
      const lastCall = calls[calls.length - 1]
      const props = lastCall[0]

      expect(props).toHaveProperty('rehypePlugins')
      expect(props).toHaveProperty('allowedElements')
      expect(props).toHaveProperty('components')
      expect(props).toHaveProperty('children')
    })
  })

  describe('Component Behavior', () => {
    it('renders without crashing with valid content', () => {
      expect(() => {
        render(<MessageContent content="Valid content" />)
      }).not.toThrow()
    })

    it('renders without crashing with null content', () => {
      expect(() => {
        render(<MessageContent content={null} />)
      }).not.toThrow()
    })

    it('renders without crashing with HTML content', () => {
      expect(() => {
        render(<MessageContent content="<strong>HTML</strong> content" />)
      }).not.toThrow()
    })

    it('renders without crashing with malformed HTML', () => {
      expect(() => {
        render(<MessageContent content="<strong>Unclosed tag" />)
      }).not.toThrow()
    })

    it('handles rapid re-renders with different content', () => {
      const { rerender } = render(<MessageContent content="First" />)

      expect(() => {
        rerender(<MessageContent content="Second" />)
        rerender(<MessageContent content="Third" />)
        rerender(<MessageContent content={null} />)
        rerender(<MessageContent content="Fourth" />)
      }).not.toThrow()
    })
  })

  describe('Manual Numbering Preprocessing', () => {
    it('should convert manual numbering to proper ordered lists', () => {
      const content = `💡 Top Picks (Long Strategy)

1) US Refiners (구조적 수혜)
-- 티커: $VLO (Valero), $PSX (Phillips 66)
-- 논거: 베네수엘라산 중질유 개선

2) Reconstruction & Security (재건/보안)
-- 티커: $CVX (Chevron), $SLB (SLB)
-- 논거: CVX는 현지 유일 메이저

3) Special Situations (회복 가치)
-- 티커: 베네수엘라 국채 (Sovereign/PDVSA)
-- 논거: 국채 가격 40센트 돌파`

      render(<MessageContent content={content} />)

      // Should find the section headers
      expect(screen.getByText(/Top Picks/)).toBeInTheDocument()
      expect(screen.getByText(/US Refiners/)).toBeInTheDocument()
      expect(screen.getByText(/Reconstruction & Security/)).toBeInTheDocument()
      expect(screen.getByText(/Special Situations/)).toBeInTheDocument()

      // Should find the bullet point content
      expect(screen.getByText(/티커: \$VLO/)).toBeInTheDocument()
      expect(screen.getByText(/티커: \$CVX/)).toBeInTheDocument()
    })

    it('should handle content without manual numbering', () => {
      const content = `Regular content without numbering

Some bullet points:
- First point
- Second point`

      render(<MessageContent content={content} />)

      expect(screen.getByText(/Regular content/)).toBeInTheDocument()
      expect(screen.getByText(/First point/)).toBeInTheDocument()
    })

    it('should process manual numbering format properly', () => {
      const content = `1) First item
2) Second item
3) Third item`

      const { container } = render(<MessageContent content={content} />)

      // The preprocessing should convert 1), 2), 3) to proper format for ReactMarkdown
      // Since ReactMarkdown is mocked in tests, we verify the content is rendered
      const text = container.textContent || ''
      expect(text).toContain('First item')
      expect(text).toContain('Second item')
      expect(text).toContain('Third item')

      // Should have been converted to 1. format (not 1) format)
      expect(text).toContain('1. First item')
      expect(text).toContain('1. Second item') // Note: all show as 1. due to markdown format
      expect(text).toContain('1. Third item')
    })
  })

  describe('Unicode Numbered Lists - TDD (Expected to FAIL)', () => {
    describe('Arabic numerals', () => {
      it('should convert Arabic numeral format (١) to ordered list', () => {
        const content = `١) البند الأول
٢) البند الثاني
٣) البند الثالث`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        // Should convert to markdown ordered list format
        expect(text).toContain('1. البند الأول')
        expect(text).toContain('1. البند الثاني')
        expect(text).toContain('1. البند الثالث')
      })

      it('should handle Arabic numerals with sub-bullets', () => {
        const content = `١) First item
-- Sub item one
-- Sub item two
٢) Second item
-- Sub item three`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. First item')
        expect(text).toContain('- Sub item one')
        expect(text).toContain('1. Second item')
      })

      it('should handle Arabic numerals mixed with English text', () => {
        const content = `١) Item واحد
٢) Item اثنان
٣) Item ثلاثة`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. Item واحد')
        expect(text).toContain('1. Item اثنان')
      })

      it('should handle double-digit Arabic numerals', () => {
        const content = `١٠) عاشر item
١١) حادي عشر item
١٢) ثاني عشر item`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. عاشر item')
        expect(text).toContain('1. حادي عشر item')
      })
    })

    describe('Persian numerals', () => {
      it('should convert Persian numeral format (۱) to ordered list', () => {
        const content = `۱) مورد اول
۲) مورد دوم
۳) مورد سوم`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. مورد اول')
        expect(text).toContain('1. مورد دوم')
        expect(text).toContain('1. مورد سوم')
      })

      it('should handle Persian numerals with sub-bullets', () => {
        const content = `۱) Main point
-- Detail one
-- Detail two
۲) Next point`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. Main point')
        expect(text).toContain('- Detail one')
      })

      it('should handle double-digit Persian numerals', () => {
        const content = `۱۰) Tenth item
۱۱) Eleventh item
۲۰) Twentieth item`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. Tenth item')
        expect(text).toContain('1. Eleventh item')
      })
    })

    describe('Devanagari numerals', () => {
      it('should convert Devanagari numeral format (१) to ordered list', () => {
        const content = `१) पहला आइटम
२) दूसरा आइटम
३) तीसरा आइटम`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. पहला आइटम')
        expect(text).toContain('1. दूसरा आइटम')
        expect(text).toContain('1. तीसरा आइटम')
      })

      it('should handle Devanagari numerals with sub-bullets', () => {
        const content = `१) मुख्य बिंदु
-- उप-बिंदु एक
-- उप-बिंदु दो
२) अगला बिंदु`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. मुख्य बिंदु')
        expect(text).toContain('- उप-बिंदु एक')
      })

      it('should handle double-digit Devanagari numerals', () => {
        const content = `१०) दसवां आइटम
११) ग्यारहवां आइटम
९९) निन्यानबेवां आइटम`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. दसवां आइटम')
        expect(text).toContain('1. ग्यारहवां आइटम')
      })
    })

    describe('Regression tests for ASCII numerals', () => {
      it('should still handle ASCII (1) (2) (3) format - existing behavior', () => {
        const content = `1) First ASCII item
2) Second ASCII item
3) Third ASCII item`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        // This should PASS as it's already implemented
        expect(text).toContain('1. First ASCII item')
        expect(text).toContain('1. Second ASCII item')
        expect(text).toContain('1. Third ASCII item')
      })

      it('should not break existing Korean content with ASCII numbers', () => {
        const content = `1) 한국어 콘텐츠
2) More 한국어
3) Final item`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. 한국어 콘텐츠')
        expect(text).toContain('1. More 한국어')
      })
    })

    describe('Mixed numeral systems', () => {
      it('should handle mixed Arabic and ASCII numerals in same document', () => {
        const content = `1) ASCII item
2) Another ASCII
١) Arabic item
٢) Another Arabic`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('1. ASCII item')
        expect(text).toContain('1. Arabic item')
      })

      it('should not convert numbers inside parentheses without trailing )', () => {
        const content = `Normal text (1 is not a list item)
1) This is a list item
Normal text (with number 2 inside)
2) This is also a list item`

        const { container } = render(<MessageContent content={content} />)
        const text = container.textContent || ''

        expect(text).toContain('(1 is not a list item)')
        expect(text).toContain('1. This is a list item')
        expect(text).toContain('(with number 2 inside)')
      })
    })
  })

  describe('RTL (Right-to-Left) Direction Detection - TDD (Expected to FAIL)', () => {
    describe('Arabic text direction', () => {
      it('should detect and apply dir="rtl" for Arabic text', () => {
        const content = `مرحبا بك في النظام`

        const { container } = render(<MessageContent content={content} />)

        // Should have dir="rtl" attribute on container or element
        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeInTheDocument()
      })

      it('should apply dir="rtl" for Arabic text with HTML tags', () => {
        const content = `<p>مرحبا <strong>بك</strong> في النظام</p>`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeInTheDocument()
      })

      it('should handle mixed Arabic and English with RTL', () => {
        const content = `مرحبا Hello العالم World`

        const { container } = render(<MessageContent content={content} />)

        // Predominant script is Arabic, should be RTL
        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeInTheDocument()
      })

      it('should detect RTL in lists with Arabic content', () => {
        const content = `1) البند الأول
2) البند الثاني
3) البند الثالث`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeInTheDocument()
      })

      it('should handle Arabic numerals in RTL context', () => {
        const content = `النقطة رقم ١ والنقطة رقم ٢`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeInTheDocument()
      })
    })

    describe('Hebrew text direction', () => {
      it('should detect and apply dir="rtl" for Hebrew text', () => {
        const content = `שלום עולם`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeInTheDocument()
      })

      it('should apply dir="rtl" for Hebrew text with formatting', () => {
        const content = `<p>שלום <strong>עולם</strong> היפה</p>`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeInTheDocument()
      })

      it('should handle Hebrew text in lists', () => {
        const content = `1) פריט ראשון
2) פריט שני
3) פריט שלישי`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeInTheDocument()
      })
    })

    describe('Mixed LTR/RTL content', () => {
      it('should keep dir="ltr" for predominantly English text', () => {
        const content = `This is mostly English with a bit of مرحبا Arabic`

        const { container } = render(<MessageContent content={content} />)

        // Should default to LTR or have explicit dir="ltr"
        const ltrElement = container.querySelector('[dir="ltr"]')
        const rtlElement = container.querySelector('[dir="rtl"]')

        // Either has explicit LTR or no RTL directive
        expect(ltrElement || !rtlElement).toBeTruthy()
      })

      it('should apply dir="rtl" when RTL script dominates', () => {
        const content = `مرحبا بك في النظام الجديد with some English`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeInTheDocument()
      })

      it('should handle content with Arabic and Hebrew mixed', () => {
        const content = `مرحبا שלום العالم עולם`

        const { container } = render(<MessageContent content={content} />)

        // Should be RTL since both Arabic and Hebrew are RTL
        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeInTheDocument()
      })
    })

    describe('No RTL for non-RTL scripts', () => {
      it('should not apply dir="rtl" for Korean text', () => {
        const content = `안녕하세요 한국어 텍스트입니다`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeNull()
      })

      it('should not apply dir="rtl" for Chinese text', () => {
        const content = `你好世界这是中文文本`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeNull()
      })

      it('should not apply dir="rtl" for Japanese text', () => {
        const content = `こんにちは世界`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeNull()
      })

      it('should not apply dir="rtl" for plain English text', () => {
        const content = `This is English text only`

        const { container } = render(<MessageContent content={content} />)

        const rtlElement = container.querySelector('[dir="rtl"]')
        expect(rtlElement).toBeNull()
      })
    })
  })
})
