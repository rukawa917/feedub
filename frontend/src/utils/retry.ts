/**
 * Retry Utility with Exponential Backoff
 *
 * Provides automatic retry functionality for failed async operations.
 * Implements exponential backoff strategy: 1s, 2s, 4s (3 attempts total).
 *
 * Reference: FR-025
 */

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxAttempts?: number

  /**
   * Initial delay in milliseconds before first retry (default: 1000ms)
   */
  initialDelay?: number

  /**
   * Backoff multiplier for exponential delay (default: 2)
   * Each retry delay = previous delay * backoffMultiplier
   */
  backoffMultiplier?: number

  /**
   * Optional callback invoked before each retry
   * @param attempt - Current attempt number (1-indexed)
   * @param delay - Delay in milliseconds before this retry
   * @param error - Error that triggered the retry
   */
  onRetry?: (attempt: number, delay: number, error: Error) => void
}

/**
 * Default retry configuration matching FR-025
 * - 3 total attempts (initial + 2 retries)
 * - Exponential backoff: 1s, 2s, 4s
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  backoffMultiplier: 2, // doubles each time: 1s, 2s, 4s
}

/**
 * Utility function to wait for a specified duration
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Executes an async function with automatic retry on failure
 *
 * Uses exponential backoff strategy:
 * - Attempt 1: Execute immediately
 * - Attempt 2: Wait 1s, then retry
 * - Attempt 3: Wait 2s, then retry
 * - (Next would be 4s, but max is 3 attempts)
 *
 * If all attempts fail, throws the last error encountered.
 *
 * @template T - Return type of the async function
 * @param fn - Async function to execute with retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function's return value
 * @throws Last error if all retry attempts fail
 *
 * @example
 * // Retry a fetch operation with default settings (3 attempts, 1s/2s/4s delays)
 * const data = await retryAsync(
 *   async () => {
 *     const response = await fetch('/api/messages')
 *     if (!response.ok) throw new Error('Request failed')
 *     return response.json()
 *   }
 * )
 *
 * @example
 * // Retry with custom options and callback
 * const data = await retryAsync(
 *   async () => apiCall(),
 *   {
 *     maxAttempts: 5,
 *     initialDelay: 500,
 *     onRetry: (attempt, delay, error) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms: ${error.message}`)
 *     }
 *   }
 * )
 */
export async function retryAsync<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = DEFAULT_RETRY_OPTIONS.maxAttempts,
    initialDelay = DEFAULT_RETRY_OPTIONS.initialDelay,
    backoffMultiplier = DEFAULT_RETRY_OPTIONS.backoffMultiplier,
    onRetry,
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Attempt to execute the function
      return await fn()
    } catch (error) {
      // Convert unknown error to Error instance
      lastError = error instanceof Error ? error : new Error(String(error))

      // If this was the last attempt, throw the error
      if (attempt >= maxAttempts) {
        throw lastError
      }

      // Calculate delay for next retry using exponential backoff
      // Attempt 1: no delay (immediate)
      // Attempt 2: initialDelay (1s)
      // Attempt 3: initialDelay * backoffMultiplier (2s)
      // Attempt 4: initialDelay * backoffMultiplier^2 (4s)
      const retryDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1)

      // Invoke callback if provided
      if (onRetry) {
        onRetry(attempt, retryDelay, lastError)
      }

      // Wait before retrying
      await delay(retryDelay)
    }
  }

  // This should never be reached, but TypeScript needs it for type safety
  throw lastError!
}
