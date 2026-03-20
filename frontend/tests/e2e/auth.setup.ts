/**
 * Playwright Authentication Setup
 *
 * Global setup that authenticates using dev mode credentials before all tests.
 * This allows E2E tests to run without a backend server.
 *
 * Dev Mode Credentials:
 * - Phone: +1000000000
 * - Code: 12345
 *
 * The authenticated state is saved to tests/.auth/user.json and reused
 * by all test projects via storageState configuration.
 */

import { test as setup, expect } from '@playwright/test'

// Dev mode credentials from frontend/src/mocks/dev-data.ts
const DEV_PHONE_NUMBER = '+1000000000'
const DEV_PHONE_CODE = '12345'

// Path to save authenticated state
const AUTH_FILE = 'tests/.auth/user.json'

setup('authenticate with dev mode', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login')

  // Wait for and fill the phone input
  const phoneInput = page.getByPlaceholder('+1234567890')
  await expect(phoneInput).toBeVisible({ timeout: 10000 })
  await phoneInput.fill(DEV_PHONE_NUMBER)

  // Click the submit button
  await page.getByRole('button', { name: /request code/i }).click()

  // Wait for navigation to verify-code page
  await page.waitForURL('**/verify-code**', { timeout: 10000 })

  // Wait for and fill the verification code input
  const codeInput = page.getByPlaceholder('12345')
  await expect(codeInput).toBeVisible({ timeout: 5000 })
  await codeInput.fill(DEV_PHONE_CODE)

  // Click verify button
  await page.getByRole('button', { name: /verify code/i }).click()

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 10000 })

  // Verify we're on the dashboard - wait for the page to load
  await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible({ timeout: 10000 })

  // Save storage state (includes localStorage with auth token)
  await page.context().storageState({ path: AUTH_FILE })

  console.log('✅ Dev mode authentication complete')
  console.log(`📁 Auth state saved to: ${AUTH_FILE}`)
})
