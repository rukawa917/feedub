/**
 * InsightHtmlContent - Renders LLM-generated HTML insights safely.
 *
 * Sanitizes HTML via DOMPurify, with markdown fallback for legacy insights.
 * Detects content type automatically: if content starts with '<' or contains
 * HTML tags, renders as HTML; otherwise falls back to ReactMarkdown.
 */

import React, { useMemo } from 'react'
import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'

export interface InsightHtmlContentProps {
  content: string
  className?: string
}

/** Check if content looks like HTML (vs plain markdown) */
function isHtmlContent(content: string): boolean {
  const trimmed = content.trimStart()
  return trimmed.startsWith('<') || /<[a-z][\s\S]*>/i.test(trimmed.slice(0, 200))
}

/** Strip markdown code fences the LLM might wrap around HTML */
function stripCodeFences(content: string): string {
  return content.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
}

/**
 * Sanitize HTML allowing inline styles and semantic tags.
 * Runs once per content change (memoized).
 */
function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div',
      'span',
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'br',
      'hr',
      'a',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    ALLOWED_ATTR: ['style', 'href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

export function InsightHtmlContent({ content, className }: InsightHtmlContentProps) {
  const cleaned = useMemo(() => stripCodeFences(content), [content])
  const html = useMemo(() => isHtmlContent(cleaned), [cleaned])
  const sanitized = useMemo(() => (html ? sanitize(cleaned) : ''), [html, cleaned])

  if (html) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />
  }

  // Fallback: legacy markdown insights
  return (
    <div
      className={`${className || ''} prose prose-sm prose-invert max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:!text-white prose-p:!text-gray-200 prose-p:leading-relaxed prose-strong:!text-white prose-strong:font-semibold prose-ul:!text-gray-200 prose-li:!text-gray-200 prose-ol:!text-gray-200`}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
