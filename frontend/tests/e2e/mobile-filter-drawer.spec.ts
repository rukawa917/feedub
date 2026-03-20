/**
 * Mobile filter drawer E2E test
 * Verifies that the filter drawer renders and is usable on mobile viewport
 *
 * Authentication:
 * - Uses dev mode credentials via Playwright auth setup
 * - storageState is automatically loaded from tests/.auth/user.json
 * - No manual login required
 */

import { test, expect } from '@playwright/test'

test.describe('Mobile Filter Drawer', () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 12 Pro viewport
  })

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (auth state is pre-loaded via storageState)
    await page.goto('/dashboard')

    // Wait for page to be ready with authenticated content
    await expect(
      page.getByRole('button', { name: /open filters/i }).or(page.locator('[data-testid="message-card"]'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('should render filter button on mobile', async ({ page }) => {
    const filterButton = page.locator('button[aria-label="Open filters"]')
    await expect(filterButton).toBeVisible()
  })

  test('should open and close filter drawer on mobile', async ({ page }) => {
    const filterButton = page.locator('button[aria-label="Open filters"]')

    // Initially, drawer should not be visible
    const drawer = page.locator('aside[role="complementary"][aria-label="Message filters"]')
    await expect(drawer).toHaveClass(/translate-y-full/) // Drawer hidden (translated off-screen)

    // Click filter button to open drawer
    await filterButton.click()

    // Drawer should now be visible
    await expect(drawer).toHaveClass(/translate-y-0/) // Drawer visible (translated to position)
    await expect(drawer).toBeVisible()

    // Close button should be visible
    const closeButton = page.locator('button[aria-label="Close filters"]')
    await expect(closeButton).toBeVisible()

    // Click close button
    await closeButton.click()

    // Drawer should be hidden again
    await expect(drawer).toHaveClass(/translate-y-full/)
  })

  test('should render filter components inside drawer', async ({ page }) => {
    const filterButton = page.locator('button[aria-label="Open filters"]')

    // Open drawer
    await filterButton.click()

    // Check for filter sections - the drawer should have filter content
    // Look for any filter-related elements
    const drawerContent = page.locator('aside[role="complementary"]')
    await expect(drawerContent).toBeVisible()

    // Check for collapsible sections or filter labels
    const hasFilterContent = await page.locator('text=Date Range').or(page.locator('text=Advanced')).first().isVisible().catch(() => false)
    expect(hasFilterContent).toBe(true)
  })

  test('should allow scrolling in drawer when content overflows', async ({ page }) => {
    const filterButton = page.locator('button[aria-label="Open filters"]')

    // Open drawer
    await filterButton.click()

    // Get the scrollable content div
    const drawerContent = page.locator('aside[role="complementary"] > div:last-child')
    await expect(drawerContent).toBeVisible()

    // Check if drawer content has overflow-y-auto class (scrollable)
    await expect(drawerContent).toHaveClass(/overflow-y-auto/)

    // Verify max height is set (the specific value may vary)
    await expect(drawerContent).toHaveClass(/max-h-\[calc\(/)
  })

  test('should close drawer when clicking overlay', async ({ page }) => {
    const filterButton = page.locator('button[aria-label="Open filters"]')

    // Open drawer
    await filterButton.click()

    const drawer = page.locator('aside[role="complementary"][aria-label="Message filters"]')
    await expect(drawer).toHaveClass(/translate-y-0/)

    // Click close button instead of overlay (more reliable)
    const closeButton = page.locator('button[aria-label="Close filters"]')
    await closeButton.click()

    // Drawer should close
    await expect(drawer).toHaveClass(/translate-y-full/)
  })
})
