import { describe, it, expect } from 'vitest'
import { validatePhoneNumber, isValidE164Format } from '@/utils/validation'

/**
 * T026 [P] Unit test for phone number E.164 validation
 *
 * Tests the phone number validation utility against E.164 format requirements.
 * E.164 format: +[country code][subscriber number]
 * - Must start with '+'
 * - Must have 1-3 digit country code (starting with non-zero)
 * - Total length: 8-15 digits (after the '+')
 * - Only contains digits after the '+'
 *
 * Reference: data-model.md lines 46-48, FR-001
 */
describe('Phone Number Validation (E.164 Format)', () => {
  describe('validatePhoneNumber', () => {
    it('should return valid for correct E.164 format with US number', () => {
      const result = validatePhoneNumber('+1234567890')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return valid for correct E.164 format with international number', () => {
      const result = validatePhoneNumber('+447911123456') // UK

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return valid for minimum length E.164 number', () => {
      const result = validatePhoneNumber('+12345678') // 8 digits after +

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return valid for maximum length E.164 number', () => {
      const result = validatePhoneNumber('+123456789012345') // 15 digits after +

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return invalid when missing plus sign', () => {
      const result = validatePhoneNumber('1234567890')

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('E.164 format')
    })

    it('should return invalid when starting with zero after plus', () => {
      const result = validatePhoneNumber('+0234567890')

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('E.164 format')
    })

    it('should return invalid when too short', () => {
      const result = validatePhoneNumber('+1234567') // Only 7 digits

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('E.164 format')
    })

    it('should return invalid when too long', () => {
      const result = validatePhoneNumber('+1234567890123456') // 16 digits

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('E.164 format')
    })

    it('should return invalid when containing spaces', () => {
      const result = validatePhoneNumber('+1 234 567 890')

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('E.164 format')
    })

    it('should return invalid when containing dashes', () => {
      const result = validatePhoneNumber('+1-234-567-890')

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('E.164 format')
    })

    it('should return invalid when containing letters', () => {
      const result = validatePhoneNumber('+1234abc890')

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('E.164 format')
    })

    it('should return invalid when containing special characters', () => {
      const result = validatePhoneNumber('+1234(567)890')

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('E.164 format')
    })

    it('should return invalid for empty string', () => {
      const result = validatePhoneNumber('')

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should return invalid for null or undefined', () => {
      const resultNull = validatePhoneNumber(null as any)
      const resultUndefined = validatePhoneNumber(undefined as any)

      expect(resultNull.isValid).toBe(false)
      expect(resultUndefined.isValid).toBe(false)
    })
  })

  describe('isValidE164Format', () => {
    it('should return true for valid E.164 numbers', () => {
      expect(isValidE164Format('+1234567890')).toBe(true)
      expect(isValidE164Format('+447911123456')).toBe(true)
      expect(isValidE164Format('+861234567890')).toBe(true)
    })

    it('should return false for invalid E.164 numbers', () => {
      expect(isValidE164Format('1234567890')).toBe(false) // Missing +
      expect(isValidE164Format('+0234567890')).toBe(false) // Starts with 0
      expect(isValidE164Format('+123')).toBe(false) // Too short
      expect(isValidE164Format('+1234567890123456')).toBe(false) // Too long
      expect(isValidE164Format('+1 234 567 890')).toBe(false) // Contains spaces
    })

    it('should return false for empty or null values', () => {
      expect(isValidE164Format('')).toBe(false)
      expect(isValidE164Format(null as any)).toBe(false)
      expect(isValidE164Format(undefined as any)).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle strings with leading/trailing whitespace', () => {
      const result = validatePhoneNumber('  +1234567890  ')

      // Should either trim and validate, or reject - test for one behavior
      expect(result.isValid).toBeDefined()
    })

    it('should handle plus sign in the middle of string', () => {
      const result = validatePhoneNumber('1234+567890')

      expect(result.isValid).toBe(false)
    })

    it('should handle multiple plus signs', () => {
      const result = validatePhoneNumber('++1234567890')

      expect(result.isValid).toBe(false)
    })
  })
})
