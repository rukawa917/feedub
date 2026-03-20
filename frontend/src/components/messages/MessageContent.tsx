import DOMPurify from 'dompurify'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { detectTextDirection } from '../../utils/text-direction'

interface MessageContentProps {
  content: string | null
  className?: string
}

/**
 * Allowed HTML elements for security.
 * This whitelist prevents XSS via script/iframe/img tags.
 * Added list elements and text formatting for rich content support.
 */
const ALLOWED_ELEMENTS = [
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

/**
 * Convert manual numbering format (1), 2), 3)) to proper markdown ordered lists
 *
 * Supports Unicode decimal number characters across all scripts:
 * - ASCII: 0-9
 * - Arabic-Indic: ٠-٩ (U+0660-U+0669)
 * - Extended Arabic-Indic (Persian/Urdu): ۰-۹ (U+06F0-U+06F9)
 * - Devanagari (Hindi): ०-९ (U+0966-U+096F)
 * - Bengali: ০-৯ (U+09E6-U+09EF)
 * - Thai: ๐-๙ (U+0E50-U+0E59)
 * - And 40+ other decimal number scripts
 *
 * Uses Unicode property escape \p{Nd} to match any decimal digit character.
 * Requires 'u' flag for Unicode mode.
 */
function preprocessNumberedLists(content: string): string {
  // Split content into lines for better processing
  const lines = content.split('\n')
  const result: string[] = []
  let inOrderedList = false
  let pendingBullets: string[] = []
  let listBuffer: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const numberedMatch = line.match(/^(\p{Nd}+)\)\s+(.+)$/u)

    if (numberedMatch) {
      // This is a numbered item like "1) Something"
      const [, , itemContent] = numberedMatch

      if (!inOrderedList) {
        // Starting a new ordered list section
        inOrderedList = true
        listBuffer = []
      }

      // Add pending bullets from previous item to list buffer
      listBuffer.push(...pendingBullets)
      pendingBullets = []

      // Add the numbered item with proper sequential numbering
      // Note: All items use "1." as markdown auto-numbers them in one list
      listBuffer.push(`1. ${itemContent}`)
    } else if (line.match(/^--\s+/) && inOrderedList) {
      // This is a bullet point under a numbered item - collect them
      const bulletContent = line.replace(/^--\s+/, '   - ')
      pendingBullets.push(bulletContent)
    } else {
      // Regular line - not a numbered item or bullet point
      if (inOrderedList) {
        // Add pending bullets and flush list buffer
        listBuffer.push(...pendingBullets)
        pendingBullets = []

        if (line.trim() === '') {
          // Empty line - check if next line continues the list
          const nextLine = lines[i + 1]
          if (nextLine && nextLine.match(/^\p{Nd}+\)/u)) {
            // Next line is a numbered item, skip this empty line to keep list continuous
            continue
          } else {
            // End of list section, flush buffer with proper spacing
            if (listBuffer.length > 0) {
              result.push('') // Add blank line before list
              result.push(...listBuffer)
              result.push('') // Add blank line after list
            }
            listBuffer = []
            inOrderedList = false
            result.push(line)
          }
        } else {
          // Non-empty, non-numbered line ends the ordered list
          if (listBuffer.length > 0) {
            result.push('') // Add blank line before list
            result.push(...listBuffer)
            result.push('') // Add blank line after list
          }
          listBuffer = []
          inOrderedList = false
          result.push(line)
        }
      } else {
        result.push(line)
      }
    }
  }

  // Add any remaining content
  if (inOrderedList && listBuffer.length > 0) {
    listBuffer.push(...pendingBullets)
    result.push('') // Add blank line before list
    result.push(...listBuffer)
  }

  return result.join('\n')
}

/**
 * Renders message content with Markdown/HTML formatting.
 *
 * Supports Telegram-style formatting converted by the backend:
 * - Bold (<strong>)
 * - Italic (<em>)
 * - Code (<code>, <pre>)
 * - Strikethrough (<del>)
 * - Underline (<u>)
 * - Blockquotes (<blockquote>)
 * - Links (<a>)
 * - Spoilers (<span class="spoiler">)
 * - Manual numbered lists converted to proper markdown
 */
export function MessageContent({ content, className }: MessageContentProps) {
  // Preprocess content to convert manual numbering to proper markdown
  const processedContent = content ? preprocessNumberedLists(content) : ''

  // Sanitize HTML before rendering to prevent XSS from Telegram message content
  const sanitizedContent = useMemo(
    () =>
      processedContent
        ? DOMPurify.sanitize(processedContent, {
            ALLOWED_TAGS: ALLOWED_ELEMENTS,
            ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'dir'],
            ALLOW_DATA_ATTR: false,
          })
        : '',
    [processedContent]
  )

  if (!content) {
    return <span className="text-foreground-muted italic">No text content</span>
  }

  return (
    <div className={className} dir={detectTextDirection(content)}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        allowedElements={ALLOWED_ELEMENTS}
        components={{
          // Paragraph with automatic direction detection
          p: ({ children }) => <p dir="auto">{children}</p>,
          // Custom link handling for security - open in new tab
          a: ({ href, children }) => {
            const safeHref = href && /^javascript:/i.test(href) ? undefined : href
            return (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            )
          },
          // Spoiler styling - use .includes() to handle multi-class attributes
          span: ({ className: spanClassName, children }) => (
            <span
              className={
                spanClassName?.split(' ').includes('spoiler')
                  ? 'bg-foreground text-foreground hover:bg-transparent transition-colors cursor-pointer'
                  : spanClassName
              }
            >
              {children}
            </span>
          ),
          // Ensure code blocks have proper styling
          pre: ({ children }) => (
            <pre className="bg-background-secondary rounded-md p-3 overflow-x-auto my-2">
              {children}
            </pre>
          ),
          code: ({ children, className: codeClassName }) => {
            // Check if this is inside a pre block (has language- class)
            const isBlock = codeClassName?.startsWith('language-')
            if (isBlock) {
              return <code className={codeClassName}>{children}</code>
            }
            // Inline code
            return (
              <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm">
                {children}
              </code>
            )
          },
          // Blockquote styling
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-4 border-primary/30 pl-4 my-2 italic text-foreground/80"
              dir="auto"
            >
              {children}
            </blockquote>
          ),
          // List styling for bullet points and numbered lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1" dir="auto">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1" dir="auto">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground" dir="auto">
              {children}
            </li>
          ),
          // Heading styling
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-2 text-foreground" dir="auto">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2 text-foreground" dir="auto">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium mb-1 text-foreground" dir="auto">
              {children}
            </h3>
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  )
}
