/**
 * HTML Preview Utilities
 *
 * Safely creates text previews from HTML content without breaking markup.
 */

/**
 * Split text into grapheme clusters (visual characters).
 * Uses Intl.Segmenter in modern browsers, falls back to Array.from() for basic support.
 */
function getGraphemeClusters(text: string): string[] {
  // Modern browser path - perfect grapheme handling
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
      return Array.from(segmenter.segment(text), (s) => s.segment)
    } catch {
      // Fallback if Intl.Segmenter fails
    }
  }

  // Fallback: Array.from handles most multi-code-point characters
  // Works for emoji, but not perfect for all combining sequences
  return Array.from(text)
}

/**
 * Truncate text safely at grapheme cluster boundaries.
 * Handles emoji sequences, skin tone modifiers, flag emoji, and combining characters.
 */
function truncateByGraphemes(
  text: string,
  maxLength: number,
  preferWordBoundary: boolean = true
): string {
  const graphemes = getGraphemeClusters(text)

  if (graphemes.length <= maxLength) {
    return text // No truncation needed
  }

  // Truncate at grapheme boundary
  let truncated = graphemes.slice(0, maxLength).join('')

  if (preferWordBoundary) {
    // Find last space in last 20% of truncated text
    const lastSpace = truncated.lastIndexOf(' ')
    const threshold = maxLength * 0.8

    // Count graphemes up to the space
    if (lastSpace > 0) {
      const graphemesUpToSpace = getGraphemeClusters(truncated.substring(0, lastSpace))

      if (graphemesUpToSpace.length > threshold) {
        truncated = graphemesUpToSpace.join('')
      }
    }
  }

  return truncated.trim()
}

/**
 * Decode HTML entities in server-side environment.
 * Handles common entities and numeric character references.
 */
function decodeHtmlEntities(text: string): string {
  return (
    text
      // Common named entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // Numeric character references (decimal)
      .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(parseInt(dec, 10)))
      // Numeric character references (hexadecimal)
      .replace(/&#x([0-9A-Fa-f]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
  )
}

/**
 * Extract plain text from HTML content for preview purposes.
 * This removes all HTML tags and entities, returning clean text.
 */
export function extractTextFromHTML(html: string): string {
  if (!html) return ''

  // Use DOMParser to safely extract text without executing scripts
  if (typeof window !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }

  // Fallback for server-side: strip tags then decode entities
  const withoutTags = html.replace(/<[^>]*>/g, '') // Remove HTML tags
  const decoded = decodeHtmlEntities(withoutTags)

  return decoded
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Create a safe preview from potentially HTML-formatted content.
 * Returns plain text (not HTML) to avoid malformed markup issues.
 * Extracts plain text and truncates to specified length.
 */
export function createTextPreview(content: string | null, maxLength: number = 200): string | null {
  if (!content) return null

  const plainText = extractTextFromHTML(content)

  if (!plainText) return null

  // Return plain text (not HTML) for safer rendering
  if (plainText.length <= maxLength) {
    return plainText
  }

  // Truncate safely at grapheme cluster boundaries (handles emoji properly)
  const truncated = truncateByGraphemes(plainText, maxLength, true)
  return truncated + '...'
}
