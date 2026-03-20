/**
 * T059: Unit test for date formatter utilities
 *
 * Tests the date formatting functions used for message timestamps
 * Requirements:
 * - Format dates as "HH:mm" for today
 * - Format as "Yesterday" for yesterday
 * - Format as day name (e.g., "Monday") for this week
 * - Format as "MMM DD, YYYY" for older dates
 * - Handle ISO 8601 string inputs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatTimestamp, formatRelativeDate, formatFileSize } from '../../../src/utils/date-formatters'

describe('Date Formatters', () => {
  // Use local time for consistent testing across timezones
  // Set "now" to a specific local time: Oct 14, 2025, 15:30 local time
  let mockNow: Date

  beforeEach(() => {
    // Create mockNow as local time to avoid timezone issues
    mockNow = new Date(2025, 9, 14, 15, 30, 0) // Oct 14, 2025, 15:30 local
    vi.useFakeTimers()
    vi.setSystemTime(mockNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatTimestamp', () => {
    it('should format today\'s date as "Today, HH:mm"', () => {
      // Create timestamp for earlier today (10:30 local time)
      const todayTimestamp = new Date(2025, 9, 14, 10, 30, 0).toISOString()
      const result = formatTimestamp(todayTimestamp)

      // Should show "Today, HH:mm"
      expect(result).toMatch(/^Today, \d{2}:\d{2}$/)
    })

    it('should format yesterday as "Yesterday, HH:mm"', () => {
      // Create timestamp for yesterday (Oct 13, 10:30 local time)
      const yesterdayTimestamp = new Date(2025, 9, 13, 10, 30, 0).toISOString()
      const result = formatTimestamp(yesterdayTimestamp)

      // Should show "Yesterday, HH:mm"
      expect(result).toMatch(/^Yesterday, \d{2}:\d{2}$/)
    })

    it('should format dates within this year as "MMM DD, HH:mm"', () => {
      // Two days ago (Oct 12, same year)
      const timestamp = new Date(2025, 9, 12, 10, 30, 0).toISOString()
      const result = formatTimestamp(timestamp)

      // Should show "MMM DD, HH:mm" (e.g., "Oct 12, 18:30")
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2}$/)
    })

    it('should format older dates as "MMM DD, YYYY, HH:mm"', () => {
      const timestamp = '2024-01-15T10:30:00Z' // Previous year
      const result = formatTimestamp(timestamp)

      // Should match pattern like "Jan 15, 2024, 18:30"
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{2}:\d{2}$/)
    })

    it('should handle invalid date strings gracefully', () => {
      const timestamp = 'invalid-date'
      const result = formatTimestamp(timestamp)

      expect(result).toBe('Invalid date')
    })

    it('should handle null or undefined inputs', () => {
      expect(formatTimestamp(null as any)).toBe('Invalid date')
      expect(formatTimestamp(undefined as any)).toBe('Invalid date')
    })
  })

  describe('formatRelativeDate', () => {
    it('should return "Just now" for times less than 1 minute ago', () => {
      // 30 seconds ago - use local time to avoid timezone issues
      const timestamp = new Date(2025, 9, 14, 15, 29, 30).toISOString()
      const result = formatRelativeDate(timestamp)

      expect(result).toBe('Just now')
    })

    it('should return "X minutes ago" for times less than 1 hour ago', () => {
      // 30 minutes ago - use local time
      const timestamp = new Date(2025, 9, 14, 15, 0, 0).toISOString()
      const result = formatRelativeDate(timestamp)

      expect(result).toBe('30 minutes ago')
    })

    it('should return "X hours ago" for times less than 24 hours ago', () => {
      // 2 hours ago - use local time
      const timestamp = new Date(2025, 9, 14, 13, 30, 0).toISOString()
      const result = formatRelativeDate(timestamp)

      expect(result).toBe('2 hours ago')
    })

    it('should return "X days ago" for times less than 7 days ago', () => {
      // 2 days ago - use local time
      const timestamp = new Date(2025, 9, 12, 15, 30, 0).toISOString()
      const result = formatRelativeDate(timestamp)

      expect(result).toBe('2 days ago')
    })

    it('should return formatted date for times more than 7 days ago', () => {
      const timestamp = '2025-09-01T10:30:00Z' // More than 7 days
      const result = formatRelativeDate(timestamp)

      // Should delegate to formatTimestamp (returns "MMM DD, HH:mm" for same year)
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2}$/)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(500)).toBe('500 B')
      expect(formatFileSize(1023)).toBe('1023 B')
    })

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(10240)).toBe('10.0 KB')
    })

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB')
      expect(formatFileSize(5242880)).toBe('5.0 MB')
      expect(formatFileSize(10485760)).toBe('10.0 MB')
    })

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB')
      expect(formatFileSize(2147483648)).toBe('2.0 GB')
    })

    it('should round to 1 decimal place', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1638)).toBe('1.6 KB')
      expect(formatFileSize(1740)).toBe('1.7 KB')
    })

    it('should handle 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B')
    })

    it('should handle negative numbers gracefully', () => {
      expect(formatFileSize(-1024)).toBe('0 B')
    })

    it('should handle null or undefined inputs', () => {
      expect(formatFileSize(null as any)).toBe('0 B')
      expect(formatFileSize(undefined as any)).toBe('0 B')
    })
  })
})
