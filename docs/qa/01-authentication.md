# Authentication Test Scenarios

## Overview
Test scenarios for phone-based Telegram authentication, 2FA support, JWT token management, and session handling.

---

## Login Flow

### TS-AUTH-001: Successful login with valid phone number
**Priority**: Critical
**Type**: Happy Path

**Given** user is on the login page and not authenticated
**When** user enters a valid phone number (e.g., +1234567890) and submits
**Then**
- Loading state shows on button
- API call to `/auth/request-code` succeeds
- User is redirected to verification code page
- Phone number is displayed on verification page

**Notes**: Phone format should accept with/without country code prefix

---

### TS-AUTH-002: Login with invalid phone number format
**Priority**: High
**Type**: Edge Case

**Given** user is on the login page
**When** user enters an invalid phone number (e.g., "abc", "123", empty)
**Then**
- Form validation error displays immediately
- Submit button remains disabled or shows validation error
- No API call is made

**Notes**: Test formats: empty, too short, letters, special chars

---

### TS-AUTH-003: Successful code verification
**Priority**: Critical
**Type**: Happy Path

**Given** user has requested a code and is on verification page
**When** user enters the correct 5-digit code from Telegram
**Then**
- API call to `/auth/verify-code` succeeds
- JWT token is stored in auth state
- User is redirected to dashboard
- Channel selector modal appears (first login)

**Notes**: Code comes via Telegram app notification

---

### TS-AUTH-004: Code verification with incorrect code
**Priority**: High
**Type**: Error

**Given** user is on verification page
**When** user enters an incorrect code
**Then**
- API returns 401 error
- Error message displays: "Invalid verification code"
- User can retry entering code
- Code input is cleared

**Notes**: Check that multiple retries are allowed

---

### TS-AUTH-005: Code verification with expired code
**Priority**: High
**Type**: Error

**Given** user requested a code more than 5 minutes ago
**When** user enters the (now expired) code
**Then**
- API returns error indicating code expired
- User sees message to request new code
- "Resend code" button is available

**Notes**: Telegram codes typically expire after 5 minutes

---

## 2FA Support

### TS-AUTH-006: Login with 2FA-enabled Telegram account
**Priority**: High
**Type**: Happy Path

**Given** user has 2FA/password enabled on their Telegram account
**When** user enters correct verification code
**Then**
- API response indicates 2FA required
- Password input field appears
- User can enter their Telegram password

**Notes**: 2FA is optional Telegram feature

---

### TS-AUTH-007: 2FA password entry - correct password
**Priority**: High
**Type**: Happy Path

**Given** user is prompted for 2FA password
**When** user enters correct Telegram password
**Then**
- API call succeeds with password included
- User is authenticated and redirected to dashboard

---

### TS-AUTH-008: 2FA password entry - incorrect password
**Priority**: High
**Type**: Error

**Given** user is prompted for 2FA password
**When** user enters incorrect password
**Then**
- API returns authentication error
- Error message displays
- User can retry password entry

---

## Rate Limiting

### TS-AUTH-009: Rate limiting on code requests
**Priority**: High
**Type**: Security

**Given** user has requested verification code 3 times in 5 minutes
**When** user attempts to request another code
**Then**
- API returns 429 Too Many Requests
- User sees rate limit message with wait time
- After cooldown, requests work again

**Notes**: Limit is 3 requests per 5 minutes per phone number

---

## Token Management

### TS-AUTH-010: Token expiry warning modal
**Priority**: High
**Type**: Happy Path

**Given** user is authenticated and token expires in < 5 minutes
**When** the 5-minute warning threshold is reached
**Then**
- Modal appears warning about session expiry
- Option to "Stay logged in" (refresh token) or "Logout"
- Countdown timer shows remaining time

**Notes**: JWT tokens have 24-hour expiry

---

### TS-AUTH-011: Automatic logout on token expiry
**Priority**: Critical
**Type**: Edge Case

**Given** user's JWT token has expired
**When** user attempts any authenticated action
**Then**
- API returns 401 Unauthorized
- User is automatically logged out
- User is redirected to login page
- Auth state is cleared

---

### TS-AUTH-012: Token refresh (stay logged in)
**Priority**: High
**Type**: Happy Path

**Given** token expiry warning modal is showing
**When** user clicks "Stay logged in"
**Then**
- Token is refreshed via API
- Modal closes
- User remains on current page
- New token expiry is set

---

## Logout

### TS-AUTH-013: Manual logout
**Priority**: Critical
**Type**: Happy Path

**Given** user is authenticated on dashboard
**When** user clicks logout button
**Then**
- Confirmation dialog appears (optional)
- API call to `/auth/logout` made
- Local auth state is cleared
- User is redirected to login page
- All user data is cleared from localStorage

**Notes**: Check sessionStorage and localStorage are both cleared

---

### TS-AUTH-014: Logout clears all stored data
**Priority**: High
**Type**: Security

**Given** user has filters saved, messages cached, etc.
**When** user logs out
**Then**
- JWT token removed
- Filter preferences cleared
- Channel selections cleared
- No user data remains in browser storage

**Notes**: Inspect localStorage/sessionStorage after logout

---

## Session Handling

### TS-AUTH-015: Return to app with valid session
**Priority**: High
**Type**: Happy Path

**Given** user previously logged in and closed browser
**When** user returns to app within token validity period
**Then**
- User is automatically logged in
- Dashboard loads without login prompt
- Previous state (filters, etc.) may be restored

**Notes**: Depends on token storage mechanism (localStorage vs memory)

---

## Accessibility

### TS-AUTH-016: Keyboard navigation on login form
**Priority**: Medium
**Type**: Accessibility

**Given** user is on login page using keyboard only
**When** user tabs through form elements
**Then**
- Focus order is logical (phone input -> submit button)
- All interactive elements are focusable
- Enter key submits form when input focused
- Focus indicators are visible

---

### TS-AUTH-017: Screen reader compatibility
**Priority**: Medium
**Type**: Accessibility

**Given** user is using screen reader on login page
**When** navigating through form
**Then**
- Form labels are announced
- Error messages are announced when they appear
- Button states (loading, disabled) are announced
- Success/redirect is announced
