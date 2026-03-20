/**
 * Feedback Service
 *
 * Handles submission of user feedback to Formspree.
 * No backend changes required - uses external service.
 */

export type FeedbackType = 'bug' | 'feature' | 'general'

export interface FeedbackData {
  type: FeedbackType
  description: string
  email?: string
}

interface FeedbackSubmitResult {
  success: boolean
  error?: string
}

/**
 * Submit feedback to Formspree
 *
 * @param data - The feedback data to submit
 * @returns Promise with success status
 */
export async function submitFeedback(data: FeedbackData): Promise<FeedbackSubmitResult> {
  const endpoint = import.meta.env.VITE_FEEDBACK_ENDPOINT

  if (!endpoint) {
    return { success: false, error: 'Feedback submission is not configured' }
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        type: data.type,
        description: data.description,
        email: data.email || 'Not provided',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || 'Failed to submit feedback',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Feedback submission error:', error)
    return {
      success: false,
      error: 'Network error. Please try again.',
    }
  }
}
