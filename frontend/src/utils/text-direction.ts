/**
 * Detects text direction based on first strong directional character.
 *
 * Unicode Bidirectional Algorithm (UAX #9) simplified:
 * - Scan for first "strong" directional character
 * - RTL: Arabic (U+0600-U+06FF), Hebrew (U+0590-U+05FF), etc.
 * - LTR: Latin, Cyrillic, Greek, CJK
 * - Fallback: "auto" for browser-based detection
 *
 * @param text - Text content to analyze
 * @returns "rtl" | "ltr" | "auto"
 */
export function detectTextDirection(text: string | null | undefined): 'rtl' | 'ltr' | 'auto' {
  if (!text || !text.trim()) {
    return 'auto'
  }

  // Strip HTML tags to analyze actual text content
  // This ensures we detect direction based on text, not markup
  const textWithoutTags = text.replace(/<[^>]*>/g, '')

  // Find first strong directional character
  for (let i = 0; i < textWithoutTags.length; i++) {
    const char = textWithoutTags[i]

    if (isRTLChar(char)) {
      return 'rtl'
    }

    if (isLTRChar(char)) {
      return 'ltr'
    }

    // Skip neutral characters (numbers, punctuation, spaces)
  }

  // No strong character found - let browser decide
  return 'auto'
}

function isRTLChar(char: string): boolean {
  const code = char.charCodeAt(0)
  return (
    (code >= 0x0590 && code <= 0x05ff) || // Hebrew
    (code >= 0x0600 && code <= 0x06ff) || // Arabic
    (code >= 0x0750 && code <= 0x077f) || // Arabic Supplement
    (code >= 0x08a0 && code <= 0x08ff) || // Arabic Extended-A
    (code >= 0xfb1d && code <= 0xfb4f) || // Hebrew Presentation Forms
    (code >= 0xfb50 && code <= 0xfdff) || // Arabic Presentation Forms-A
    (code >= 0xfe70 && code <= 0xfeff) // Arabic Presentation Forms-B
  )
}

function isLTRChar(char: string): boolean {
  const code = char.charCodeAt(0)
  return (
    (code >= 0x0041 && code <= 0x007a) || // Latin (A-Z, a-z)
    (code >= 0x0370 && code <= 0x03ff) || // Greek
    (code >= 0x0400 && code <= 0x04ff) || // Cyrillic
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified
    (code >= 0xac00 && code <= 0xd7af) // Korean Hangul
  )
}
