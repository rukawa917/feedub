import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Contract Tests for Message API
 *
 * These tests verify the frontend-backend contract by making real HTTP requests
 * to the FastAPI backend. They ensure the API returns the expected response format
 * and status codes.
 *
 * Prerequisites:
 * - Backend server must be running: cd backend && uv run uvicorn src.main:app --reload
 * - Test user must be authenticated (requires valid JWT token)
 */

const API_BASE_URL = 'http://localhost:8000'

// Test user credentials (must match backend test data)
let authToken: string | null = null

beforeAll(async () => {
  // Authenticate test user to get JWT token
  // This assumes backend has a test user or you've manually authenticated
  // For now, we'll skip authentication and assume token is available
  // In production, this would be retrieved from test setup or environment
  authToken = process.env.TEST_AUTH_TOKEN || null
})

describe('POST /messages/fetch - Trigger Message Fetch', () => {
  it('should return 403 (Forbidden) if not authenticated', async () => {
    const response = await fetch(`${API_BASE_URL}/messages/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // FastAPI returns 403 Forbidden for missing auth (not 401)
    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data).toHaveProperty('detail')
  })

  it('should return 200 and fetch operation details when authenticated', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const response = await fetch(`${API_BASE_URL}/messages/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })

    expect(response.status).toBe(200)

    const data = await response.json()

    // Validate response structure
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('userId')
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('messageCount')
    expect(data).toHaveProperty('startedAt')

    // Validate field types
    expect(typeof data.id).toBe('string')
    expect(typeof data.userId).toBe('string')
    expect(['pending', 'in_progress', 'completed', 'failed']).toContain(
      data.status
    )
    expect(typeof data.messageCount).toBe('number')
    expect(typeof data.startedAt).toBe('string')

    // Validate ISO 8601 date format
    expect(new Date(data.startedAt).toString()).not.toBe('Invalid Date')
  })

  it('should return 409 if fetch operation already in progress', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    // Trigger first fetch
    const firstResponse = await fetch(`${API_BASE_URL}/messages/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (firstResponse.status !== 200) {
      console.warn('First fetch failed, skipping conflict test')
      return
    }

    const firstData = await firstResponse.json()

    // Only test conflict if first fetch is still in progress
    if (firstData.status === 'pending' || firstData.status === 'in_progress') {
      // Immediately trigger second fetch (should conflict)
      const secondResponse = await fetch(`${API_BASE_URL}/messages/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(secondResponse.status).toBe(409)

      const secondData = await secondResponse.json()
      expect(secondData.error).toBeDefined()
      expect(secondData.error.code).toBe('FETCH_IN_PROGRESS')
    }
  })
})

describe('GET /messages/fetch/{fetch_id} - Poll Fetch Status', () => {
  it('should return 403 (Forbidden) if not authenticated', async () => {
    const fakeFetchId = 'test-fetch-id-123'

    const response = await fetch(
      `${API_BASE_URL}/messages/fetch/${fakeFetchId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data).toHaveProperty("detail")
    // FastAPI returns 403 for missing auth
  })

  it('should return 404 if fetch operation not found', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const nonExistentFetchId = 'non-existent-fetch-id-999'

    const response = await fetch(
      `${API_BASE_URL}/messages/fetch/${nonExistentFetchId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.error).toBeDefined()
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it('should return 200 and fetch operation status when fetch exists', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    // First, create a fetch operation
    const createResponse = await fetch(`${API_BASE_URL}/messages/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (createResponse.status !== 200) {
      console.warn('Failed to create fetch operation, skipping status test')
      return
    }

    const createData = await createResponse.json()
    const fetchId = createData.id

    // Now poll the fetch status
    const statusResponse = await fetch(
      `${API_BASE_URL}/messages/fetch/${fetchId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(statusResponse.status).toBe(200)

    const statusData = await statusResponse.json()

    // Validate response structure
    expect(statusData).toHaveProperty('id')
    expect(statusData).toHaveProperty('userId')
    expect(statusData).toHaveProperty('status')
    expect(statusData).toHaveProperty('messageCount')
    expect(statusData).toHaveProperty('startedAt')
    expect(statusData).toHaveProperty('completedAt')
    expect(statusData).toHaveProperty('error')

    // Validate field types
    expect(typeof statusData.id).toBe('string')
    expect(typeof statusData.userId).toBe('string')
    expect(['pending', 'in_progress', 'completed', 'failed']).toContain(
      statusData.status
    )
    expect(typeof statusData.messageCount).toBe('number')
    expect(typeof statusData.startedAt).toBe('string')

    // Validate optional fields
    if (statusData.completedAt !== null) {
      expect(typeof statusData.completedAt).toBe('string')
      expect(new Date(statusData.completedAt).toString()).not.toBe(
        'Invalid Date'
      )
    }

    if (statusData.error !== null) {
      expect(typeof statusData.error).toBe('string')
    }
  })

  it('should reflect status changes when polled multiple times', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    // Create a fetch operation
    const createResponse = await fetch(`${API_BASE_URL}/messages/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (createResponse.status !== 200) {
      console.warn('Failed to create fetch operation, skipping polling test')
      return
    }

    const createData = await createResponse.json()
    const fetchId = createData.id

    // Poll status first time
    const firstPollResponse = await fetch(
      `${API_BASE_URL}/messages/fetch/${fetchId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    const firstPollData = await firstPollResponse.json()
    const firstStatus = firstPollData.status
    const firstMessageCount = firstPollData.messageCount

    // Wait 2 seconds (polling interval as per FR-008)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Poll status second time
    const secondPollResponse = await fetch(
      `${API_BASE_URL}/messages/fetch/${fetchId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    const secondPollData = await secondPollResponse.json()
    const secondStatus = secondPollData.status
    const secondMessageCount = secondPollData.messageCount

    // Status should either stay the same or progress
    // (pending → in_progress → completed/failed)
    const validTransitions = [
      ['pending', 'pending'],
      ['pending', 'in_progress'],
      ['in_progress', 'in_progress'],
      ['in_progress', 'completed'],
      ['in_progress', 'failed'],
      ['completed', 'completed'],
      ['failed', 'failed'],
    ]

    expect(
      validTransitions.some(
        ([from, to]) => from === firstStatus && to === secondStatus
      )
    ).toBe(true)

    // Message count should not decrease
    expect(secondMessageCount).toBeGreaterThanOrEqual(firstMessageCount)
  })
})

/**
 * T060: Contract test for GET /messages with filters
 *
 * Tests the message list endpoint with various filter combinations
 * Requirements:
 * - FR-011: Text search in message content
 * - FR-012: Filter by chat, date range, type, media presence
 * - FR-013: Multiple filters with AND logic
 * - FR-014: Pagination
 */
describe('GET /messages - List and Search Messages', () => {
  it('should return 403 (Forbidden) if not authenticated', async () => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data).toHaveProperty("detail")
    // FastAPI returns 403 for missing auth
  })

  it('should return 200 with empty array when no messages exist', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })

    expect(response.status).toBe(200)

    const data = await response.json()

    // Validate response structure
    expect(data).toHaveProperty('messages')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('limit')
    expect(data).toHaveProperty('offset')

    expect(Array.isArray(data.messages)).toBe(true)
    expect(typeof data.total).toBe('number')
    expect(typeof data.limit).toBe('number')
    expect(typeof data.offset).toBe('number')
  })

  it('should return messages with correct structure', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })

    expect(response.status).toBe(200)

    const data = await response.json()

    if (data.messages.length > 0) {
      const message = data.messages[0]

      // Validate message structure
      expect(message).toHaveProperty('id')
      expect(message).toHaveProperty('telegram_message_id')
      expect(message).toHaveProperty('sender')
      expect(message).toHaveProperty('chat')
      expect(message).toHaveProperty('timestamp')
      expect(message).toHaveProperty('type')
      expect(message).toHaveProperty('created_at')

      // Validate sender structure
      expect(message.sender).toHaveProperty('telegram_user_id')
      expect(message.sender).toHaveProperty('name')

      // Validate chat structure
      expect(message.chat).toHaveProperty('telegram_chat_id')
      expect(message.chat).toHaveProperty('title')
      expect(message.chat).toHaveProperty('type')

      // Validate types
      expect(typeof message.id).toBe('string')
      expect(typeof message.telegram_message_id).toBe('number')
      expect(typeof message.timestamp).toBe('string')

      // Validate ISO 8601 timestamp
      expect(new Date(message.timestamp).toString()).not.toBe('Invalid Date')
    }
  })

  it('should filter messages by search query (FR-011)', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const searchQuery = 'test'

    const response = await fetch(
      `${API_BASE_URL}/messages?search=${encodeURIComponent(searchQuery)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()

    // If messages exist, they should contain the search query
    if (data.messages.length > 0) {
      data.messages.forEach((message: any) => {
        if (message.content) {
          expect(message.content.toLowerCase()).toContain(searchQuery.toLowerCase())
        }
      })
    }
  })

  it('should filter messages by chat IDs (FR-012)', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const chatId = 'test-chat-123'

    const response = await fetch(
      `${API_BASE_URL}/messages?chat_ids=${chatId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()

    // All messages should be from the specified chat
    if (data.messages.length > 0) {
      data.messages.forEach((message: any) => {
        expect(message.chat.telegram_chat_id).toBe(chatId)
      })
    }
  })

  it('should filter messages by date range (FR-012)', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const startDate = '2025-01-01'
    const endDate = '2025-12-31'

    const response = await fetch(
      `${API_BASE_URL}/messages?start_date=${startDate}&end_date=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()

    // All messages should be within the date range
    if (data.messages.length > 0) {
      const startDateTime = new Date(startDate).getTime()
      const endDateTime = new Date(endDate).getTime()

      data.messages.forEach((message: any) => {
        const messageTime = new Date(message.timestamp).getTime()
        expect(messageTime).toBeGreaterThanOrEqual(startDateTime)
        expect(messageTime).toBeLessThanOrEqual(endDateTime)
      })
    }
  })

  it('should filter messages by type (FR-012)', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const messageType = 'photo'

    const response = await fetch(
      `${API_BASE_URL}/messages?type=${messageType}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()

    // All messages should be of the specified type
    if (data.messages.length > 0) {
      data.messages.forEach((message: any) => {
        expect(message.type).toBe(messageType)
      })
    }
  })

  it('should filter messages by media presence (FR-012)', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const response = await fetch(
      `${API_BASE_URL}/messages?has_media=true`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()

    // All messages should have media
    if (data.messages.length > 0) {
      data.messages.forEach((message: any) => {
        expect(message.media).not.toBeNull()
      })
    }
  })

  it('should apply multiple filters with AND logic (FR-013)', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const searchQuery = 'test'
    const messageType = 'photo'
    const hasMedia = 'true'

    const response = await fetch(
      `${API_BASE_URL}/messages?search=${searchQuery}&type=${messageType}&has_media=${hasMedia}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()

    // All messages should match ALL filters
    if (data.messages.length > 0) {
      data.messages.forEach((message: any) => {
        // Should contain search query
        if (message.content) {
          expect(message.content.toLowerCase()).toContain(searchQuery.toLowerCase())
        }

        // Should be of specified type
        expect(message.type).toBe(messageType)

        // Should have media
        expect(message.media).not.toBeNull()
      })
    }
  })

  it('should support pagination with limit parameter (FR-014)', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const limit = 10

    const response = await fetch(
      `${API_BASE_URL}/messages?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()

    // Should respect limit
    expect(data.messages.length).toBeLessThanOrEqual(limit)
    expect(data.limit).toBe(limit)
  })

  it('should support pagination with offset parameter (FR-014)', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const limit = 10
    const offset = 20

    const response = await fetch(
      `${API_BASE_URL}/messages?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()

    expect(data.limit).toBe(limit)
    expect(data.offset).toBe(offset)
  })

  it('should use default pagination values when not specified', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })

    expect(response.status).toBe(200)

    const data = await response.json()

    // Should use default limit (50) and offset (0)
    expect(data.limit).toBe(50)
    expect(data.offset).toBe(0)
  })

  it('should enforce maximum limit of 100', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const response = await fetch(
      `${API_BASE_URL}/messages?limit=200`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()

    // Should cap at 100
    expect(data.limit).toBeLessThanOrEqual(100)
  })

  it('should handle invalid filter parameters gracefully', async () => {
    if (!authToken) {
      console.warn('Skipping authenticated test - no auth token available')
      return
    }

    const response = await fetch(
      `${API_BASE_URL}/messages?limit=invalid&offset=invalid`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )

    // Should either return 400 or use defaults
    expect([200, 400, 422]).toContain(response.status)
  })
})
