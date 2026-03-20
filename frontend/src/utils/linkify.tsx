/**
 * Utility for converting URLs in text to clickable React links.
 */

import React from 'react'

// Matches https://, http://, and www. URLs
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/g

/**
 * Splits a text string into an array of strings and React anchor elements.
 * Plain text segments are returned as strings; URLs are returned as <a> elements.
 *
 * @param text - Input text potentially containing URLs
 * @returns Array of strings and React elements
 */
export function linkifyText(text: string | null | undefined): (string | React.ReactElement)[] {
  if (!text) return []

  const parts = text.split(URL_REGEX)

  // Filter out empty strings that result from split
  const result: (string | React.ReactElement)[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue

    if (URL_REGEX.test(part)) {
      // Reset regex state (global flag causes stateful .test())
      URL_REGEX.lastIndex = 0

      const href = part.startsWith('www.') ? `https://${part}` : part

      result.push(
        <a
          key={`link-${i}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:opacity-80"
        >
          {part}
        </a>
      )
    } else {
      URL_REGEX.lastIndex = 0
      result.push(part)
    }
  }

  return result
}
