/**
 * Runtime validation utilities using Zod (T004)
 */

/**
 * Phone number validation error message
 */
export const PHONE_VALIDATION_ERROR_MESSAGE =
  'Phone number must be in E.164 format (e.g., +1234567890)'

/**
 * Validate phone number and return result object with error message
 * E.164 format: +[country code][subscriber number]
 * - Must start with '+'
 * - Must have 1-3 digit country code (starting with non-zero)
 * - Total length: 8-15 digits (after the '+')
 * - Only contains digits after the '+'
 */
export function validatePhoneNumber(phone: string | null | undefined): {
  isValid: boolean
  error?: string
} {
  // Handle null/undefined
  if (phone === null || phone === undefined || phone === '') {
    return {
      isValid: false,
      error: 'Phone number is required',
    }
  }

  // Trim whitespace
  const trimmed = phone.trim()

  // Check E.164 format: + followed by 8-15 digits, starting with non-zero
  const e164Regex = /^\+[1-9]\d{7,14}$/

  if (!e164Regex.test(trimmed)) {
    return {
      isValid: false,
      error: PHONE_VALIDATION_ERROR_MESSAGE,
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Check if a string is in valid E.164 format (simple boolean check)
 * Returns true only for valid E.164 format, false otherwise
 */
export function isValidE164Format(phone: string | null | undefined): boolean {
  if (!phone) {
    return false
  }

  const e164Regex = /^\+[1-9]\d{7,14}$/
  return e164Regex.test(phone.trim())
}
