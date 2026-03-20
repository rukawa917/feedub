/**
 * Authentication types based on backend API contracts
 * Source: specs/003-minimal-frontend-webapp/contracts/auth-contract.md
 */

export interface User {
  /** Phone number in E.164 format (e.g., +1234567890) */
  phone: string

  /** Telegram user ID */
  telegramUserId: string

  /** User ID (computed from telegram_user_id for frontend convenience) */
  id: string

  /** Optional: Display name from Telegram */
  firstName?: string
  lastName?: string
}

export interface UserSession {
  /** JWT access token (24-hour validity) */
  token: string

  /** Token expiration timestamp (Unix epoch milliseconds) */
  expiresAt: number

  /** User details from Telegram */
  user: User
}

// Form types
export interface PhoneRequestForm {
  /** Phone number in E.164 format */
  phoneNumber: string
}

export interface CodeVerificationForm {
  /** 5-digit verification code from Telegram */
  code: string

  /** Optional 2FA password (if user has 2FA enabled) */
  password?: string
}

// API request types
export interface RequestCodeRequest {
  phone_number: string
}

export interface VerifyCodeRequest {
  phone_number: string
  code: string
  password?: string
}

// API response types
export interface RequestCodeResponse {
  message: string
  phone_hash: string
}

export interface VerifyCodeResponse {
  access_token: string
  token_type: string
  user: {
    phone: string
    telegram_user_id: string
    first_name?: string
    last_name?: string
  }
}

export interface CurrentUserResponse {
  phone: string
  telegram_user_id: string
  first_name?: string
  last_name?: string
}
