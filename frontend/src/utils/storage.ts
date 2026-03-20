/**
 * localStorage utility functions (T003)
 * Provides key management and storage space monitoring
 */

/**
 * Safely set item in localStorage with error handling
 * @param key - localStorage key
 * @param value - Value to store (will be JSON stringified)
 * @returns true if successful, false if quota exceeded or error
 */
export const safeSetItem = <T>(key: string, value: T): boolean => {
  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded:', error)
    } else {
      console.error('Error setting localStorage item:', error)
    }
    return false
  }
}

/**
 * Safely get item from localStorage with error handling
 * @param key - localStorage key
 * @returns Parsed value or null if not found/error
 */
export const safeGetItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return null
    }
    return JSON.parse(item) as T
  } catch (error) {
    console.error('Error getting localStorage item:', error)
    return null
  }
}

