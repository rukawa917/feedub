import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration for E2E Tests
 *
 * Tests deployment smoke tests and critical user flows.
 *
 * Authentication:
 * - Uses dev mode (phone: +1000000000, code: 12345) for local testing
 * - Auth setup runs first and saves state to tests/.auth/user.json
 * - All browser projects reuse the authenticated state
 *
 * Usage:
 * - Local dev: npm run dev && npm run test:e2e
 * - Production smoke: DEPLOYMENT_URL=https://your-domain.com npm run test:e2e:smoke
 */

// Path to authenticated state file
const AUTH_FILE = 'tests/.auth/user.json'

export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [['html'], ['list']],

  // Shared settings for all projects
  use: {
    // Base URL for tests - use localhost for local dev, production URL for smoke tests
    baseURL: process.env.DEPLOYMENT_URL || 'http://localhost:5173',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for different browsers
  projects: [
    // ==========================================
    // Setup project - runs first to authenticate
    // ==========================================
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      // No storageState - this creates the initial auth state
    },

    // ==========================================
    // Desktop browsers - depend on setup
    // ==========================================
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testIgnore: /deployment-smoke\.spec\.ts/, // Exclude production smoke tests
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testIgnore: /deployment-smoke\.spec\.ts/, // Exclude production smoke tests
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testIgnore: /deployment-smoke\.spec\.ts/, // Exclude production smoke tests
    },

    // ==========================================
    // Mobile viewports - depend on setup
    // ==========================================
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testIgnore: /deployment-smoke\.spec\.ts/, // Exclude production smoke tests
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testIgnore: /deployment-smoke\.spec\.ts/, // Exclude production smoke tests
    },

    // ==========================================
    // Smoke tests - no auth required (public pages)
    // ==========================================
    {
      name: 'smoke',
      testMatch: /deployment-smoke\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.DEPLOYMENT_URL || 'https://your-domain.com',
      },
      // No dependencies - smoke tests don't need auth
    },
  ],
})
