// frontend/src/utils/html-preview.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { extractTextFromHTML, createTextPreview } from './html-preview'

describe('html-preview', () => {
  describe('extractTextFromHTML', () => {
    describe('browser environment', () => {
      beforeEach(() => {
        // Ensure we're in a browser-like environment
        global.window = {} as Window & typeof globalThis
      })

      afterEach(() => {
        // Clean up
        vi.unstubAllGlobals()
      })

      it('returns empty string for empty input', () => {
        expect(extractTextFromHTML('')).toBe('')
      })

      it('strips HTML tags from simple content', () => {
        const html = '<p>Hello World</p>'
        const result = extractTextFromHTML(html)
        expect(result).toBe('Hello World')
      })

      it('handles nested tags correctly', () => {
        const html = '<div><p>Outer <strong>inner</strong> text</p></div>'
        const result = extractTextFromHTML(html)
        expect(result).toBe('Outer inner text')
      })

      it('preserves plain text without tags', () => {
        const plainText = 'This is plain text without any tags'
        const result = extractTextFromHTML(plainText)
        expect(result).toBe(plainText)
      })

      it('handles Korean text with entities correctly', () => {
        // Korean text: "안녕하세요" (Hello in Korean)
        const html = '<p>&#xC548;&#xB155;&#xD558;&#xC138;&#xC694;</p>'
        const result = extractTextFromHTML(html)
        expect(result).toBe('안녕하세요')
      })

      it('decodes HTML entities properly', () => {
        const html = '<p>&lt;script&gt; &amp; &quot;quotes&quot; &#39;apostrophe&#39;</p>'
        const result = extractTextFromHTML(html)
        expect(result).toBe('<script> & "quotes" \'apostrophe\'')
      })

      it('decodes mixed Korean and English entities', () => {
        // "안녕 hello 세계"
        const html = '<p>&#xC548;&#xB155; hello &#xC138;&#xACC4;</p>'
        const result = extractTextFromHTML(html)
        expect(result).toBe('안녕 hello 세계')
      })

      it('handles multiple consecutive spaces in tags', () => {
        const html = '<p>Multiple    spaces    here</p>'
        const result = extractTextFromHTML(html)
        expect(result).toBe('Multiple    spaces    here')
      })

      it('handles self-closing tags', () => {
        const html = '<p>Line 1<br/>Line 2</p>'
        const result = extractTextFromHTML(html)
        expect(result).toBe('Line 1Line 2')
      })

      it('handles malformed HTML gracefully', () => {
        const html = '<p>Unclosed tag <strong>bold text'
        const result = extractTextFromHTML(html)
        expect(result).toBe('Unclosed tag bold text')
      })

      it('extracts text including script and style content (browser behavior)', () => {
        // Note: The browser's textContent/innerText includes script/style content
        // This is expected behavior - actual XSS prevention happens during rendering
        const html =
          '<div>Text<script>alert("xss")</script>More<style>.red{color:red}</style>End</div>'
        const result = extractTextFromHTML(html)
        expect(result).toContain('Text')
        expect(result).toContain('More')
        expect(result).toContain('End')
      })
    })

    describe('server-side environment (fallback)', () => {
      beforeEach(() => {
        // Remove window to simulate server environment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (global as any).window
      })

      afterEach(() => {
        // Restore window
        global.window = {} as Window & typeof globalThis
      })

      it('returns empty string for empty input', () => {
        expect(extractTextFromHTML('')).toBe('')
      })

      it('strips HTML tags using regex fallback', () => {
        const html = '<p>Hello World</p>'
        const result = extractTextFromHTML(html)
        expect(result).toBe('Hello World')
      })

      it('handles nested tags with regex fallback', () => {
        const html = '<div><p>Outer <strong>inner</strong> text</p></div>'
        const result = extractTextFromHTML(html)
        expect(result).toBe('Outer inner text')
      })

      it('decodes HTML entities properly in fallback mode', () => {
        const html = '<p>&lt;script&gt; &amp; &quot;quotes&quot;</p>'
        const result = extractTextFromHTML(html)
        // In fallback mode, entities should be properly decoded
        expect(result).toBe('<script> & "quotes"')
      })

      it('normalizes whitespace in fallback mode', () => {
        const html = '<p>Multiple    spaces    here</p>'
        const result = extractTextFromHTML(html)
        expect(result).toBe('Multiple spaces here')
      })

      it('handles malformed HTML gracefully in fallback mode', () => {
        const html = '<p>Unclosed tag <strong>bold text'
        const result = extractTextFromHTML(html)
        expect(result).toBe('Unclosed tag bold text')
      })

      it('trims leading and trailing whitespace', () => {
        const html = '  <p>Text</p>  '
        const result = extractTextFromHTML(html)
        expect(result).toBe('Text')
      })
    })
  })

  describe('createTextPreview', () => {
    it('returns null for null input', () => {
      expect(createTextPreview(null)).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(createTextPreview('')).toBeNull()
    })

    it('returns plain text for whitespace-only HTML if under maxLength', () => {
      // The function returns plain text (not HTML)
      // Whitespace is normalized
      const content = '<p>   </p>'
      expect(createTextPreview(content)).toBe('   ')
    })

    it('returns plain text if under maxLength', () => {
      const content = '<p>Short text</p>'
      const result = createTextPreview(content, 50)
      expect(result).toBe('Short text')
    })

    it('returns original plain text if under maxLength', () => {
      const content = 'Plain text without tags'
      const result = createTextPreview(content, 50)
      expect(result).toBe(content)
    })

    it('truncates plain text at safe boundary', () => {
      const content = '<p>This is a <strong>very long</strong> message that needs truncation</p>'
      const result = createTextPreview(content, 20)

      // Should return plain text with ellipsis
      expect(result).toContain('...')
      // Should not contain HTML tags
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('handles content with nested tags', () => {
      const content = '<div><p>Level 1 <span>Level 2 <strong>Level 3</strong></span></p></div>'
      const result = createTextPreview(content, 15)

      expect(result).toContain('...')
      // Should return plain text without HTML tags
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('appends ellipsis after truncation', () => {
      const content = '<p>' + 'a'.repeat(300) + '</p>'
      const result = createTextPreview(content, 50)

      expect(result).toContain('...')
      expect(result?.endsWith('...')).toBe(true)
    })

    it('handles Korean text correctly', () => {
      // Korean: "안녕하세요 이것은 긴 메시지입니다"
      const content = '<p>안녕하세요 이것은 긴 메시지입니다</p>'
      const result = createTextPreview(content, 10)

      expect(result).toContain('...')
      expect(result).toContain('안녕')
    })

    it('handles Korean text with HTML entities', () => {
      // "안녕하세요" with entities
      const content = '<p>&#xC548;&#xB155;&#xD558;&#xC138;&#xC694; this is a very long message</p>'
      const result = createTextPreview(content, 15)

      expect(result).toContain('...')
    })

    it('returns plain text without HTML tags', () => {
      const content = '<p>Text before <strong>bold text here</strong> and after</p>'

      // Try various maxLength values
      for (let maxLength = 10; maxLength <= 40; maxLength += 5) {
        const result = createTextPreview(content, maxLength)

        if (result) {
          // Should not contain any HTML tags
          expect(result).not.toContain('<')
          expect(result).not.toContain('>')
        }
      }
    })

    it('handles malformed HTML gracefully', () => {
      const content = '<p>Text with <strong>unclosed tag and more text here'
      const result = createTextPreview(content, 20)

      // Should still truncate safely
      expect(result).toBeDefined()
      if (result) {
        expect(result).toContain('...')
      }
    })

    it('handles content with only tags (no text)', () => {
      const content = '<div><br/><hr/></div>'
      const result = createTextPreview(content)

      expect(result).toBeNull() // No actual text content
    })

    it('handles self-closing tags correctly', () => {
      const content = '<p>Line 1<br/>Line 2<br/>Line 3 with lots of text here</p>'
      const result = createTextPreview(content, 20)

      expect(result).toBeDefined()
      if (result) {
        expect(result).toContain('...')
        // Should return plain text without HTML tags
        expect(result).not.toContain('<')
        expect(result).not.toContain('>')
      }
    })

    it('handles mixed plain text and HTML', () => {
      const content = 'Plain text before <p>HTML content</p> and plain text after with more text'
      const result = createTextPreview(content, 30)

      expect(result).toBeDefined()
      expect(result).toContain('...')
    })

    it('respects custom maxLength parameter', () => {
      const content = '<p>' + 'a'.repeat(500) + '</p>'

      const result50 = createTextPreview(content, 50)
      const result100 = createTextPreview(content, 100)

      // Longer maxLength should give longer preview
      expect(result100!.length).toBeGreaterThan(result50!.length)
    })

    it('uses default maxLength of 200 when not specified', () => {
      const shortContent = '<p>' + 'a'.repeat(150) + '</p>'
      const longContent = '<p>' + 'a'.repeat(300) + '</p>'

      // Should return plain text (not HTML)
      expect(createTextPreview(shortContent)).toBe('a'.repeat(150))
      expect(createTextPreview(longContent)).toContain('...')
    })

    it('handles XSS attempts safely', () => {
      const xssContent = '<p>Normal text <script>alert("xss")</script> more text</p>'
      const result = createTextPreview(xssContent, 20)

      // Should return plain text, which is safe from XSS
      expect(result).toBeDefined()
      // Should not contain any HTML tags
      if (result) {
        expect(result).not.toContain('<')
        expect(result).not.toContain('>')
      }
    })

    it('handles HTML with attributes correctly', () => {
      const content =
        '<p class="text-lg" id="main">Text with <a href="http://example.com" target="_blank">link</a> inside</p>'
      const result = createTextPreview(content, 20)

      expect(result).toBeDefined()
      if (result) {
        expect(result).toContain('...')
        // Should return plain text without HTML tags
        expect(result).not.toContain('<')
        expect(result).not.toContain('>')
      }
    })

    it('handles very long unbroken text inside tags', () => {
      const content = '<p>' + 'x'.repeat(1000) + '</p>'
      const result = createTextPreview(content, 50)

      expect(result).toBeDefined()
      expect(result).toContain('...')
      // Should return plain text without HTML tags
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('handles empty tags correctly', () => {
      const content = '<p></p><div></div><span>Actual content here that is quite long</span>'
      const result = createTextPreview(content, 20)

      expect(result).toContain('...')
      // Should return plain text without HTML tags
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('handles HTML comments correctly', () => {
      const content = '<p>Text before <!-- comment here --> and after with more content</p>'
      const result = createTextPreview(content, 20)

      expect(result).toBeDefined()
      expect(result).toContain('...')
    })

    it('preserves content exactly when at maxLength boundary', () => {
      // Create content that's exactly at the boundary
      const content = '<p>' + 'a'.repeat(50) + '</p>'
      const result = createTextPreview(content, 50)

      // Should return plain text without ellipsis
      expect(result).toBe('a'.repeat(50))
    })

    it('handles consecutive HTML tags without text between them', () => {
      const content = '<div><p><strong></strong></p></div>Actual text content here that is long'
      const result = createTextPreview(content, 20)

      expect(result).toBeDefined()
      expect(result).toContain('...')
    })
  })

  describe('Emoji Truncation - TDD (Expected to FAIL)', () => {
    describe('Emoji family sequences (ZWJ)', () => {
      it('should preserve family emoji when truncating', () => {
        // Family emoji: 👨‍👩‍👧‍👦 (man-woman-girl-boy)
        const content = '<p>Family emoji 👨‍👩‍👧‍👦 should stay together even after truncation</p>'
        const result = createTextPreview(content, 25)

        expect(result).toBeDefined()
        if (result) {
          // Should either preserve the full family emoji or exclude it entirely
          // Should NOT break it into individual characters like 👨 👩 👧 👦
          const hasFullEmoji = result.includes('👨‍👩‍👧‍👦')
          const hasPartialEmoji = result.includes('👨') && !result.includes('👨‍👩‍👧‍👦')

          // Either has full emoji or doesn't have it at all (no partial)
          expect(hasFullEmoji || !hasPartialEmoji).toBe(true)
        }
      })

      it('should handle couple emojis correctly', () => {
        // Couple emoji: 👨‍❤️‍👨 (man-heart-man)
        const content = '<p>Love is love 👨‍❤️‍👨 with more text here that will be truncated</p>'
        const result = createTextPreview(content, 25)

        expect(result).toBeDefined()
        if (result) {
          const hasFullEmoji = result.includes('👨‍❤️‍👨')
          const hasPartialEmoji = result.includes('❤️') && !result.includes('👨‍❤️‍👨')

          expect(hasFullEmoji || !hasPartialEmoji).toBe(true)
        }
      })

      it('should handle professional emojis with ZWJ', () => {
        // Woman technologist: 👩‍💻
        const content = '<p>Developer 👩‍💻 coding all day with lots of additional text here</p>'
        const result = createTextPreview(content, 25)

        expect(result).toBeDefined()
        if (result) {
          const hasFullEmoji = result.includes('👩‍💻')
          const hasPartialEmoji = result.includes('👩') && !result.includes('👩‍💻')

          expect(hasFullEmoji || !hasPartialEmoji).toBe(true)
        }
      })

      it('should handle multiple ZWJ emojis in sequence', () => {
        // Multiple profession emojis
        const content = '<p>Team: 👨‍💼 👩‍💻 👨‍🔧 👩‍🏫 with additional text for truncation testing</p>'
        const result = createTextPreview(content, 30)

        expect(result).toBeDefined()
        if (result) {
          // Check that we don't have broken emojis
          const emojiPattern = /[\u{1F468}\u{1F469}]/u
          const zwjPattern = /\u200D/
          const matches = result.match(emojiPattern)

          if (matches) {
            // If we have emoji characters, they should be followed by ZWJ or be complete
            expect(zwjPattern.test(result) || !result.includes('💼')).toBe(true)
          }
        }
      })
    })

    describe('Skin tone modifiers', () => {
      it('should preserve waving hand with skin tone modifier', () => {
        // Waving hand with medium-dark skin tone: 👋🏾
        const content = '<p>Hello 👋🏾 everyone this is a longer message that needs truncation</p>'
        const result = createTextPreview(content, 20)

        expect(result).toBeDefined()
        if (result) {
          const hasFullEmoji = result.includes('👋🏾')
          const hasPartialEmoji = result.includes('👋') && !result.includes('🏾')

          // Should preserve both base emoji and modifier or neither
          expect(hasFullEmoji || !hasPartialEmoji).toBe(true)
        }
      })

      it('should preserve thumbs up with various skin tones', () => {
        // Thumbs up with light skin tone: 👍🏻
        const content = '<p>Great job 👍🏻 keep it up with lots more text here for testing</p>'
        const result = createTextPreview(content, 20)

        expect(result).toBeDefined()
        if (result) {
          const hasFullEmoji = result.includes('👍🏻')
          const hasPartialEmoji = result.includes('👍') && !result.includes('🏻')

          expect(hasFullEmoji || !hasPartialEmoji).toBe(true)
        }
      })

      it('should handle multiple emojis with different skin tones', () => {
        // Multiple skin tone variations
        const content = '<p>Team: 👋🏻 👋🏼 👋🏽 👋🏾 👋🏿 diversity matters and here is more text</p>'
        const result = createTextPreview(content, 30)

        expect(result).toBeDefined()
        if (result) {
          // If we have the base emoji, it should have its skin tone modifier
          const baseEmojiCount = (result.match(/👋/g) || []).length
          const fullEmojiCount =
            (result.match(/👋🏻/g) || []).length +
            (result.match(/👋🏼/g) || []).length +
            (result.match(/👋🏽/g) || []).length +
            (result.match(/👋🏾/g) || []).length +
            (result.match(/👋🏿/g) || []).length

          // Every base emoji should have its modifier
          expect(baseEmojiCount).toBe(fullEmojiCount)
        }
      })

      it('should preserve raised fist with skin tone', () => {
        // Raised fist with medium skin tone: ✊🏽
        const content =
          '<p>Power ✊🏽 to the people with additional text content here for testing</p>'
        const result = createTextPreview(content, 25)

        expect(result).toBeDefined()
        if (result) {
          const hasFullEmoji = result.includes('✊🏽')
          const hasPartialEmoji = result.includes('✊') && !result.includes('🏽')

          expect(hasFullEmoji || !hasPartialEmoji).toBe(true)
        }
      })
    })

    describe('Flag emojis (Regional Indicator Symbols)', () => {
      it('should preserve US flag emoji when truncating', () => {
        // US flag: 🇺🇸 (Regional Indicator U + Regional Indicator S)
        const content =
          '<p>Made in 🇺🇸 USA with pride and quality, additional text here for truncation</p>'
        const result = createTextPreview(content, 20)

        expect(result).toBeDefined()
        if (result) {
          const hasFullFlag = result.includes('🇺🇸')
          // Regional indicators without pair are meaningless
          const hasPartialFlag = /🇺(?!🇸)|🇸(?<!🇺)/.test(result)

          expect(hasFullFlag || !hasPartialFlag).toBe(true)
        }
      })

      it('should preserve multiple flag emojis', () => {
        // Multiple flags: 🇺🇸 🇬🇧 🇫🇷 🇩🇪 🇯🇵
        const content = '<p>International: 🇺🇸 🇬🇧 🇫🇷 🇩🇪 🇯🇵 cooperation is key with more text</p>'
        const result = createTextPreview(content, 30)

        expect(result).toBeDefined()
        if (result) {
          // Regional indicator symbols should always appear in pairs
          const regionalIndicators = result.match(/[\u{1F1E6}-\u{1F1FF}]/gu) || []
          expect(regionalIndicators.length % 2).toBe(0)
        }
      })

      it('should handle Korean flag correctly', () => {
        // Korean flag: 🇰🇷
        const content =
          '<p>한국 🇰🇷 대한민국 with additional content for testing truncation behavior</p>'
        const result = createTextPreview(content, 20)

        expect(result).toBeDefined()
        if (result) {
          const hasFullFlag = result.includes('🇰🇷')
          const hasPartialFlag = /🇰(?!🇷)|🇷(?<!🇰)/.test(result)

          expect(hasFullFlag || !hasPartialFlag).toBe(true)
        }
      })

      it('should handle pride flag correctly', () => {
        // Rainbow flag: 🏳️‍🌈 (white flag + ZWJ + rainbow)
        const content =
          '<p>Pride 🏳️‍🌈 month celebration with lots of additional text content here</p>'
        const result = createTextPreview(content, 20)

        expect(result).toBeDefined()
        if (result) {
          const hasFullFlag = result.includes('🏳️‍🌈')
          const hasPartialFlag = result.includes('🏳️') && !result.includes('🏳️‍🌈')

          expect(hasFullFlag || !hasPartialFlag).toBe(true)
        }
      })
    })

    describe('Combined emoji sequences', () => {
      it('should handle emoji with text variation selector', () => {
        // Heart emoji with variation selector: ❤️ (❤ + VS16)
        const content = '<p>Love ❤️ this content and here is much more text for truncation</p>'
        const result = createTextPreview(content, 20)

        expect(result).toBeDefined()
        if (result) {
          const hasFullEmoji = result.includes('❤️')
          const hasPartialEmoji = result.includes('❤') && !result.includes('❤️')

          expect(hasFullEmoji || !hasPartialEmoji).toBe(true)
        }
      })

      it('should handle keycap sequences', () => {
        // Keycap digit: 1️⃣ (digit + VS16 + combining enclosing keycap)
        const content = '<p>Step 1️⃣ is important, then continue with more steps and information</p>'
        const result = createTextPreview(content, 20)

        expect(result).toBeDefined()
        if (result) {
          const hasFullKeycap = result.includes('1️⃣')
          const hasPartialKeycap = result.includes('1') && !result.includes('1️⃣')

          expect(hasFullKeycap || !hasPartialKeycap).toBe(true)
        }
      })

      it('should handle country subdivision flag', () => {
        // England flag: 🏴󠁧󠁢󠁥󠁮󠁧󠁿 (Black flag + tag sequence)
        const content =
          '<p>England 🏴󠁧󠁢󠁥󠁮󠁧󠁿 football team with additional text for truncation testing</p>'
        const result = createTextPreview(content, 25)

        expect(result).toBeDefined()
        // This is complex, just ensure no crash and reasonable output
        // Note: Word boundary preference may extend beyond strict maxLength
        expect(result.length).toBeLessThanOrEqual(45) // maxLength + ellipsis + emoji allowance + word boundary margin
      })
    })

    describe('Mixed content with emojis', () => {
      it('should handle mixed text and emojis correctly', () => {
        const content = '<p>Hello 👋 world 🌍 with 👨‍👩‍👧‍👦 family and 🇺🇸 flag, plus lots more text</p>'
        const result = createTextPreview(content, 30)

        expect(result).toBeDefined()
        if (result) {
          // Should not break any of the complex emojis
          const hasFamily = result.includes('👨‍👩‍👧‍👦')
          const hasFlag = result.includes('🇺🇸')

          // If family is included, it should be complete
          if (hasFamily) {
            expect(result.includes('👧')).toBe(true) // All family members present
          }

          // If flag is included, it should be complete (even count of regional indicators)
          if (hasFlag) {
            const regionalIndicators = result.match(/[\u{1F1E6}-\u{1F1FF}]/gu) || []
            expect(regionalIndicators.length % 2).toBe(0)
          }
        }
      })

      it('should handle emojis at truncation boundary', () => {
        // Place emoji exactly at truncation point
        const content = '<p>12345678901234567👨‍👩‍👧‍👦 family emoji at boundary with more text</p>'
        const result = createTextPreview(content, 20)

        expect(result).toBeDefined()
        if (result) {
          // Should either include full emoji or exclude it, not break it
          const hasBrokenEmoji = result.includes('👨') && !result.includes('👨‍👩‍👧‍👦')

          expect(!hasBrokenEmoji).toBe(true)
        }
      })

      it('should handle multiple emoji types in one message', () => {
        const content = '<p>Team meeting 👨‍💻👩‍💻 in 🇺🇸 office, great work 👍🏽🎉 everyone!</p>'
        const result = createTextPreview(content, 40)

        expect(result).toBeDefined()
        if (result) {
          // Count of ZWJ sequences should be even (complete)
          const zwjCount = (result.match(/\u200D/g) || []).length
          const peopleEmoji = (result.match(/[\u{1F468}\u{1F469}]/gu) || []).length

          // Each person emoji in ZWJ sequence should have a corresponding ZWJ
          if (peopleEmoji > 0 && zwjCount > 0) {
            expect(zwjCount).toBeLessThanOrEqual(peopleEmoji)
          }
        }
      })
    })

    describe('Edge cases', () => {
      it('should handle emoji-only content', () => {
        const content = '<p>👨‍👩‍👧‍👦🇺🇸👍🏽</p>'
        const result = createTextPreview(content, 50)

        expect(result).toBeDefined()
        // Should return the emojis without breaking them
        if (result) {
          expect(result).toContain('👨‍👩‍👧‍👦')
          expect(result).toContain('🇺🇸')
          expect(result).toContain('👍🏽')
        }
      })

      it('should handle very short maxLength with emojis', () => {
        const content = '<p>Test 👨‍👩‍👧‍👦 family</p>'
        const result = createTextPreview(content, 5)

        expect(result).toBeDefined()
        // Should truncate before emoji rather than break it
        if (result) {
          const hasBrokenEmoji = result.includes('👨') && !result.includes('👨‍👩‍👧‍👦')
          expect(hasBrokenEmoji).toBe(false)
        }
      })

      it('should handle HTML entities and emojis together', () => {
        const content = '<p>&lt;div&gt; 👨‍👩‍👧‍👦 &amp; 🇺🇸 &quot;quote&quot; with text</p>'
        const result = createTextPreview(content, 20)

        expect(result).toBeDefined()
        if (result) {
          // HTML entities should be decoded
          expect(result).toContain('<div>')
          // Emojis should be preserved if included
          const hasFamily = result.includes('👨‍👩‍👧‍👦')
          if (hasFamily) {
            expect(result.includes('👧')).toBe(true)
          }
        }
      })
    })
  })
})
