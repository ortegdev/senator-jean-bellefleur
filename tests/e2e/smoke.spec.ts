/**
 * Production Smoke Tests
 * 
 * Quick validation that critical paths work in production build.
 * Run with: npm run test:smoke
 */

import { test, expect } from '@playwright/test'

test.describe('Production Smoke Tests @smoke', () => {
  test('home page loads successfully', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
    
    // Should have candidate name
    await expect(page.locator('h1')).toContainText('Bellefleur')
  })

  test('all locales are accessible', async ({ page }) => {
    // Haitian Creole
    await page.goto('/ht')
    await expect(page.locator('h1')).toBeVisible()

    // French
    await page.goto('/fr')
    await expect(page.locator('h1')).toBeVisible()

    // English
    await page.goto('/en')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('security headers are set', async ({ page }) => {
    const response = await page.goto('/')
    
    const headers = response?.headers()
    
    // Check critical security headers
    expect(headers?.['x-frame-options']).toBe('DENY')
    expect(headers?.['x-content-type-options']).toBe('nosniff')
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/en')
    
    // Allow some time for any async errors
    await page.waitForTimeout(1000)
    
    expect(consoleErrors).toHaveLength(0)
  })

  test('donation features are disabled by default', async ({ page }) => {
    await page.goto('/en')
    
    // Should NOT have active donation buttons
    const contributeButton = page.getByRole('button', { name: /contribute|donate/i })
    await expect(contributeButton).not.toBeVisible()
  })
})
