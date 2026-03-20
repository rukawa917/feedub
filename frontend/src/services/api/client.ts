/**
 * Centralized API client
 * Reads auth token from the store internally - callers do not pass tokens.
 * Handles: auth headers, error parsing, token refresh, abort signal forwarding.
 */

import { useAuthStore } from '../../stores/auth'
import { API_CONFIG, handleTokenRefresh } from './config'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
  signal?: AbortSignal
  /** Extra headers merged on top of defaults (e.g. Accept: text/event-stream) */
  headers?: Record<string, string>
  /** When true, skips the Authorization header (unauthenticated endpoints) */
  skipAuth?: boolean
}

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json()
    return body.detail || body.message || fallback
  } catch {
    return fallback
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const token = useAuthStore.getState().token

  const headers: Record<string, string> = {
    ...API_CONFIG.headers,
    ...options.headers,
  }

  if (!options.skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const init: RequestInit = {
    method,
    headers,
    signal: options.signal,
  }

  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  const url = `${API_CONFIG.baseURL}${path}`
  const response = await fetch(url, init)

  if (!response.ok) {
    const message = await parseError(response, `Request failed: ${method} ${path}`)
    const err = new Error(message) as Error & { status: number; response: Response }
    err.status = response.status
    err.response = response
    throw err
  }

  handleTokenRefresh(response)

  return response.json() as Promise<T>
}

/**
 * Make a raw fetch via the client (returns the Response directly).
 * Used for streaming (SSE) endpoints where the caller reads the body.
 */
async function requestRaw(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<Response> {
  const token = useAuthStore.getState().token

  const headers: Record<string, string> = {
    ...API_CONFIG.headers,
    ...options.headers,
  }

  if (!options.skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const init: RequestInit = {
    method,
    headers,
    signal: options.signal,
  }

  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  const url = `${API_CONFIG.baseURL}${path}`
  return fetch(url, init)
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),

  /** Raw fetch for streaming responses (SSE). Returns Response directly. */
  stream: (path: string, body?: unknown, options?: RequestOptions) =>
    requestRaw('POST', path, body, options),

  /** GET a binary response as a Blob (e.g. media downloads). */
  getBlob: async (path: string, options?: RequestOptions): Promise<Blob> => {
    const response = await requestRaw('GET', path, undefined, options)
    if (!response.ok) {
      const message = await parseError(response, `Request failed: GET ${path}`)
      const err = new Error(message) as Error & { status: number; response: Response }
      err.status = response.status
      err.response = response
      throw err
    }
    handleTokenRefresh(response)
    return response.blob()
  },
}
