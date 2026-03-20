import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { linkifyText } from './linkify'

describe('linkifyText', () => {
  describe('basic functionality', () => {
    it('returns original text when no URLs present', () => {
      const result = linkifyText('Hello world, this is plain text')
      expect(result).toEqual(['Hello world, this is plain text'])
    })

    it('returns empty array for empty string', () => {
      const result = linkifyText('')
      expect(result).toEqual([])
    })

    it('returns empty array for null/undefined', () => {
      // @ts-expect-error Testing edge case
      expect(linkifyText(null)).toEqual([])
      // @ts-expect-error Testing edge case
      expect(linkifyText(undefined)).toEqual([])
    })
  })

  describe('https URLs', () => {
    it('converts https URL to clickable link', () => {
      const result = linkifyText('Check out https://example.com')
      expect(result).toHaveLength(2)
      expect(result[0]).toBe('Check out ')

      const { container } = render(<>{result[1]}</>)
      const link = container.querySelector('a')
      expect(link).toBeTruthy()
      expect(link?.href).toBe('https://example.com/')
      expect(link?.target).toBe('_blank')
      expect(link?.rel).toBe('noopener noreferrer')
      expect(link?.textContent).toBe('https://example.com')
    })

    it('handles https URL with path and query params', () => {
      const result = linkifyText('Visit https://example.com/path?foo=bar&baz=123')
      expect(result).toHaveLength(2)

      const { container } = render(<>{result[1]}</>)
      const link = container.querySelector('a')
      expect(link?.href).toBe('https://example.com/path?foo=bar&baz=123')
    })
  })

  describe('http URLs', () => {
    it('converts http URL to clickable link', () => {
      const result = linkifyText('Old site: http://legacy.example.com')
      expect(result).toHaveLength(2)
      expect(result[0]).toBe('Old site: ')

      const { container } = render(<>{result[1]}</>)
      const link = container.querySelector('a')
      expect(link?.href).toBe('http://legacy.example.com/')
      expect(link?.textContent).toBe('http://legacy.example.com')
    })
  })

  describe('www URLs', () => {
    it('converts www URL and prepends https://', () => {
      const result = linkifyText('Go to www.example.com for more')
      expect(result).toHaveLength(3)
      expect(result[0]).toBe('Go to ')
      expect(result[2]).toBe(' for more')

      const { container } = render(<>{result[1]}</>)
      const link = container.querySelector('a')
      expect(link?.href).toBe('https://www.example.com/')
      expect(link?.textContent).toBe('www.example.com')
    })
  })

  describe('multiple URLs', () => {
    it('handles multiple URLs in same text', () => {
      const result = linkifyText('Check https://first.com and https://second.com for info')
      expect(result).toHaveLength(5)
      expect(result[0]).toBe('Check ')
      expect(result[2]).toBe(' and ')
      expect(result[4]).toBe(' for info')

      const { container: c1 } = render(<>{result[1]}</>)
      expect(c1.querySelector('a')?.href).toBe('https://first.com/')

      const { container: c2 } = render(<>{result[3]}</>)
      expect(c2.querySelector('a')?.href).toBe('https://second.com/')
    })

    it('handles mixed URL types', () => {
      const result = linkifyText('Sites: https://secure.com http://old.com www.simple.com')
      expect(result).toHaveLength(6)

      const { container: c1 } = render(<>{result[1]}</>)
      expect(c1.querySelector('a')?.href).toBe('https://secure.com/')

      const { container: c2 } = render(<>{result[3]}</>)
      expect(c2.querySelector('a')?.href).toBe('http://old.com/')

      const { container: c3 } = render(<>{result[5]}</>)
      expect(c3.querySelector('a')?.href).toBe('https://www.simple.com/')
    })
  })

  describe('URL positioning', () => {
    it('handles URL at start of text', () => {
      const result = linkifyText('https://example.com is great')
      expect(result).toHaveLength(2)

      const { container } = render(<>{result[0]}</>)
      expect(container.querySelector('a')).toBeTruthy()
      expect(result[1]).toBe(' is great')
    })

    it('handles URL at end of text', () => {
      const result = linkifyText('Check out https://example.com')
      expect(result).toHaveLength(2)
      expect(result[0]).toBe('Check out ')

      const { container } = render(<>{result[1]}</>)
      expect(container.querySelector('a')).toBeTruthy()
    })

    it('handles only URL (no surrounding text)', () => {
      const result = linkifyText('https://example.com')
      expect(result).toHaveLength(1)

      const { container } = render(<>{result[0]}</>)
      const link = container.querySelector('a')
      expect(link?.href).toBe('https://example.com/')
    })
  })

  describe('link attributes', () => {
    it('includes security attributes on all links', () => {
      const result = linkifyText('Link: https://example.com')
      const { container } = render(<>{result[1]}</>)
      const link = container.querySelector('a')

      expect(link?.target).toBe('_blank')
      expect(link?.rel).toBe('noopener noreferrer')
    })

    it('includes styling classes on links', () => {
      const result = linkifyText('Link: https://example.com')
      const { container } = render(<>{result[1]}</>)
      const link = container.querySelector('a')

      expect(link?.className).toContain('text-primary')
      expect(link?.className).toContain('underline')
    })
  })

  describe('edge cases', () => {
    it('handles URLs with special characters', () => {
      const result = linkifyText('See https://example.com/path?q=hello%20world&lang=en#section')
      expect(result).toHaveLength(2)

      const { container } = render(<>{result[1]}</>)
      const link = container.querySelector('a')
      expect(link?.href).toContain('example.com/path')
    })

    it('handles consecutive calls (regex state reset)', () => {
      // First call
      const result1 = linkifyText('https://first.com')
      expect(result1).toHaveLength(1)

      // Second call should work independently
      const result2 = linkifyText('https://second.com')
      expect(result2).toHaveLength(1)

      const { container } = render(<>{result2[0]}</>)
      expect(container.querySelector('a')?.href).toBe('https://second.com/')
    })

    it('does not match partial URLs without protocol or www', () => {
      const result = linkifyText('Visit example.com for more')
      expect(result).toEqual(['Visit example.com for more'])
    })
  })
})
