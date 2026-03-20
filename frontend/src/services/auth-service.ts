/**
 * T034: Authentication service
 * Provides API calls for phone authentication flow
 * Source: specs/003-minimal-frontend-webapp/contracts/auth-contract.md
 *
 * DEV MODE: Use phone number +1000000000 with code 12345 for mock auth
 */

import { API_ENDPOINTS } from './api/config'
import { apiClient } from './api/client'
import type {
  RequestCodeRequest,
  RequestCodeResponse,
  VerifyCodeResponse,
  CurrentUserResponse,
} from '../types/auth'
import {
  isDevPhoneNumber,
  isDevToken,
  DEV_PHONE_HASH,
  DEV_PHONE_CODE,
  DEV_TOKEN,
  DEV_USER,
} from '../mocks/dev-data'

/**
 * Request a verification code sent to the user's phone via Telegram
 * POST /auth/request-code
 *
 * DEV MODE: Using +1000000000 returns a mock response immediately
 *
 * @param phoneNumber - Phone number in E.164 format (e.g., "+1234567890")
 * @returns Response with message and phone_hash
 * @throws Error with detail message from backend
 */
export async function requestCode(phoneNumber: string): Promise<RequestCodeResponse> {
  // DEV MODE: Return mock response for dev phone number
  if (isDevPhoneNumber(phoneNumber)) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      message: `[DEV MODE] Use code ${DEV_PHONE_CODE} to login`,
      phone_hash: DEV_PHONE_HASH,
    }
  }

  return apiClient.post<RequestCodeResponse>(
    API_ENDPOINTS.auth.requestCode,
    { phone_number: phoneNumber } as RequestCodeRequest,
    { skipAuth: true }
  )
}

/**
 * Verify the code received via Telegram and obtain a JWT token
 * POST /auth/verify-code
 *
 * DEV MODE: Using +1000000000 with code 12345 returns a mock token
 *
 * @param phoneNumber - Phone number in E.164 format
 * @param phoneCodeHash - Hash received from requestCode response
 * @param code - 5-digit verification code from Telegram
 * @param password - Optional 2FA password
 * @returns Response with JWT token and user info
 * @throws Error with detail message from backend
 */
export async function verifyCode(
  phoneNumber: string,
  phoneCodeHash: string,
  code: string,
  password?: string
): Promise<VerifyCodeResponse> {
  // DEV MODE: Return mock response for dev phone number
  if (isDevPhoneNumber(phoneNumber)) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Validate dev code
    if (code !== DEV_PHONE_CODE) {
      throw new Error(`Invalid code. Use ${DEV_PHONE_CODE} for dev mode.`)
    }

    return {
      access_token: DEV_TOKEN,
      token_type: 'bearer',
      user: DEV_USER,
    }
  }

  return apiClient.post<VerifyCodeResponse>(
    API_ENDPOINTS.auth.verifyCode,
    { phone_number: phoneNumber, phone_code_hash: phoneCodeHash, code, password },
    { skipAuth: true }
  )
}

/**
 * Get the currently authenticated user's information
 * GET /auth/me
 *
 * DEV MODE: Returns mock user for dev token
 *
 * @param token - JWT access token
 * @returns User information
 * @throws Error if unauthorized or request fails
 */
export async function getCurrentUser(token: string): Promise<CurrentUserResponse> {
  // DEV MODE: Return mock user for dev token
  if (isDevToken(token)) {
    return DEV_USER
  }

  return apiClient.get<CurrentUserResponse>(API_ENDPOINTS.auth.me)
}
