/**
 * E2E tests for donation flow
 * 
 * Tests: success, decline, 3DS, cap splitting, out-of-range, language switching, launch gate
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Donation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set test mode
    await page.addInitScript(() => {
      window.localStorage.setItem('test_mode', 'true')
    })
  })
  
  test('successful donation flow (en)', async ({ page }) => {
    await page.goto('/en')
    
    // Navigate to contribution page
    await page.getByRole('link', { name: /contribute|support/i }).click()
    await expect(page).toHaveURL(/\/en\/contribute/)
    
    // Verify affiliation disclosure visible
    await expect(page.getByText(/independent supporter initiative/i)).toBeVisible()
    
    // Fill amount
    await page.getByLabel(/amount/i).fill('50')
    
    // Fill donor information
    await page.getByLabel(/full name/i).fill('Jean Doe')
    await page.getByLabel(/email/i).fill('jean.doe@example.com')
    await page.getByLabel(/country/i).selectOption('US')
    
    // Accept terms
    await page.getByLabel(/terms and conditions/i).check()
    await page.getByLabel(/not employed by foreign government/i).check()
    
    // Submit
    await page.getByRole('button', { name: /continue to payment/i }).click()
    
    // Payment page loaded
    await expect(page.getByText(/payment details/i)).toBeVisible()
    
    // Fill card (Stripe test card)
    const cardFrame = page.frameLocator('iframe[name*="stripe"]')
    await cardFrame.getByPlaceholder(/card number/i).fill('4242424242424242')
    await cardFrame.getByPlaceholder(/mm \/ yy/i).fill('12/34')
    await cardFrame.getByPlaceholder(/cvc/i).fill('123')
    await cardFrame.getByPlaceholder(/zip/i).fill('10001')
    
    // Submit payment
    await page.getByRole('button', { name: /complete contribution/i }).click()
    
    // Wait for success
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/\$50\.00/)).toBeVisible()
    
    // Verify receipt link
    await expect(page.getByRole('link', { name: /download receipt/i })).toBeVisible()
    
    // No console errors
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })
  
  test('declined card handling', async ({ page }) => {
    await page.goto('/en/contribute')
    
    // Fill form
    await page.getByLabel(/amount/i).fill('25')
    await page.getByLabel(/full name/i).fill('Test Decline')
    await page.getByLabel(/email/i).fill('decline@test.com')
    await page.getByLabel(/country/i).selectOption('US')
    await page.getByLabel(/terms/i).check()
    await page.getByLabel(/not employed/i).check()
    await page.getByRole('button', { name: /continue/i }).click()
    
    // Use declining card
    const cardFrame = page.frameLocator('iframe[name*="stripe"]')
    await cardFrame.getByPlaceholder(/card number/i).fill('4000000000000002') // Decline card
    await cardFrame.getByPlaceholder(/mm \/ yy/i).fill('12/34')
    await cardFrame.getByPlaceholder(/cvc/i).fill('123')
    await cardFrame.getByPlaceholder(/zip/i).fill('10001')
    
    // Submit
    await page.getByRole('button', { name: /complete/i }).click()
    
    // Verify error shown
    await expect(page.getByText(/card.*declined/i)).toBeVisible({ timeout: 10000 })
    
    // Verify user can retry (form still visible)
    await expect(cardFrame.getByPlaceholder(/card number/i)).toBeVisible()
    
    // Try again with valid card
    await cardFrame.getByPlaceholder(/card number/i).fill('4242424242424242')
    await page.getByRole('button', { name: /complete/i }).click()
    
    // Should succeed
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 })
  })
  
  test('3D Secure authentication', async ({ page }) => {
    await page.goto('/en/contribute')
    
    // Fill form
    await page.getByLabel(/amount/i).fill('100')
    await page.getByLabel(/full name/i).fill('Test 3DS')
    await page.getByLabel(/email/i).fill('3ds@test.com')
    await page.getByLabel(/country/i).selectOption('FR') // European card
    await page.getByLabel(/terms/i).check()
    await page.getByLabel(/not employed/i).check()
    await page.getByRole('button', { name: /continue/i }).click()
    
    // Use 3DS required card
    const cardFrame = page.frameLocator('iframe[name*="stripe"]')
    await cardFrame.getByPlaceholder(/card number/i).fill('4000002500003155') // 3DS required
    await cardFrame.getByPlaceholder(/mm \/ yy/i).fill('12/34')
    await cardFrame.getByPlaceholder(/cvc/i).fill('123')
    await cardFrame.getByPlaceholder(/zip/i).fill('75001')
    
    // Submit
    await page.getByRole('button', { name: /complete/i }).click()
    
    // Wait for 3DS challenge
    await expect(page.getByText(/authenticat/i)).toBeVisible({ timeout: 10000 })
    
    // Stripe test 3DS frame
    const threeDSFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]')
    
    // Complete authentication (test mode)
    await threeDSFrame.getByRole('button', { name: /complete|authenticate/i }).click()
    
    // Should succeed after authentication
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 15000 })
  })
  
  test('cap splitting and refund', async ({ page, context }) => {
    // First contribution: $4,800 (approaching $5,000 cap)
    await page.goto('/en/contribute')
    await page.getByLabel(/amount/i).fill('4800')
    await page.getByLabel(/full name/i).fill('Cap Test')
    await page.getByLabel(/email/i).fill('capsplit@test.com')
    await page.getByLabel(/country/i).selectOption('US')
    await page.getByLabel(/terms/i).check()
    await page.getByLabel(/not employed/i).check()
    await page.getByRole('button', { name: /continue/i }).click()
    
    const cardFrame = page.frameLocator('iframe[name*="stripe"]')
    await cardFrame.getByPlaceholder(/card number/i).fill('4242424242424242')
    await cardFrame.getByPlaceholder(/mm \/ yy/i).fill('12/34')
    await cardFrame.getByPlaceholder(/cvc/i).fill('123')
    await cardFrame.getByPlaceholder(/zip/i).fill('10001')
    await page.getByRole('button', { name: /complete/i }).click()
    
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 })
    
    // Second contribution: $500 (would exceed cap)
    await page.goto('/en/contribute')
    await page.getByLabel(/amount/i).fill('500')
    await page.getByLabel(/email/i).fill('capsplit@test.com')
    await page.getByLabel(/full name/i).fill('Cap Test')
    await page.getByLabel(/country/i).selectOption('US')
    await page.getByLabel(/terms/i).check()
    await page.getByLabel(/not employed/i).check()
    await page.getByRole('button', { name: /continue/i }).click()
    
    // Fill card
    await cardFrame.getByPlaceholder(/card number/i).fill('4242424242424242')
    await cardFrame.getByPlaceholder(/mm \/ yy/i).fill('12/34')
    await cardFrame.getByPlaceholder(/cvc/i).fill('123')
    await cardFrame.getByPlaceholder(/zip/i).fill('10001')
    await page.getByRole('button', { name: /complete/i }).click()
    
    // Should succeed but show split message
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/\$200\.00.*accepted/i)).toBeVisible()
    await expect(page.getByText(/\$300\.00.*refunded/i)).toBeVisible()
  })
  
  test('out-of-range amount validation', async ({ page }) => {
    await page.goto('/en/contribute')
    
    // Below minimum ($5)
    await page.getByLabel(/amount/i).fill('3')
    await page.getByLabel(/amount/i).blur()
    await expect(page.getByText(/minimum.*\$5/i)).toBeVisible()
    
    // Above maximum ($5,000)
    await page.getByLabel(/amount/i).fill('10000')
    await page.getByLabel(/amount/i).blur()
    await expect(page.getByText(/maximum.*\$5,?000/i)).toBeVisible()
    
    // Valid amount
    await page.getByLabel(/amount/i).fill('50')
    await page.getByLabel(/amount/i).blur()
    await expect(page.getByText(/minimum|maximum/i)).not.toBeVisible()
  })
  
  test('language switching persists through flow', async ({ page }) => {
    // Start in English
    await page.goto('/en')
    await expect(page).toHaveURL(/\/en/)
    
    // Switch to French
    await page.getByRole('button', { name: /language|langue/i }).click()
    await page.getByRole('menuitem', { name: /français/i }).click()
    await expect(page).toHaveURL(/\/fr/)
    
    // Navigate to contribute
    await page.getByRole('link', { name: /contribuer|soutenir/i }).click()
    await expect(page).toHaveURL(/\/fr\/contribuer/)
    
    // Verify French labels
    await expect(page.getByLabel(/montant/i)).toBeVisible()
    await expect(page.getByLabel(/nom complet/i)).toBeVisible()
    await expect(page.getByLabel(/courriel|e-mail/i)).toBeVisible()
    
    // Switch to Haitian Creole
    await page.getByRole('button', { name: /langue|lang/i }).click()
    await page.getByRole('menuitem', { name: /kreyòl|creole/i }).click()
    await expect(page).toHaveURL(/\/ht\/kontribye/)
    
    // Verify Creole labels
    await expect(page.getByLabel(/montan|kantite/i)).toBeVisible()
  })
  
  test('launch gate: INFO_ONLY mode blocks donations', async ({ page }) => {
    // Set gate to INFO_ONLY via API or database
    // (Would need admin login or direct DB access)
    
    await page.goto('/en')
    
    // Contribute button should be hidden or disabled
    const contributeButton = page.getByRole('link', { name: /contribute/i })
    
    // Either not visible, or shows "coming soon"
    const isVisible = await contributeButton.isVisible().catch(() => false)
    
    if (isVisible) {
      await contributeButton.click()
      await expect(page.getByText(/not.*available|coming soon/i)).toBeVisible()
    } else {
      // Button hidden entirely
      await expect(contributeButton).not.toBeVisible()
    }
    
    // Direct URL navigation should also block
    await page.goto('/en/contribute')
    await expect(page.getByText(/not.*available|coming soon/i)).toBeVisible()
  })
  
  test('launch gate: DONATIONS_LIVE allows donations', async ({ page }) => {
    // Assume gate is DONATIONS_LIVE for this test
    
    await page.goto('/en')
    
    // Contribute button visible and clickable
    const contributeButton = page.getByRole('link', { name: /contribute/i })
    await expect(contributeButton).toBeVisible()
    await contributeButton.click()
    
    // Form should be accessible
    await expect(page.getByLabel(/amount/i)).toBeVisible()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
  })
  
  test('accessibility: no violations on donation flow', async ({ page }) => {
    // Contribution page
    await page.goto('/en/contribute')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
    
    // Fill form and go to payment page
    await page.getByLabel(/amount/i).fill('50')
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/country/i).selectOption('US')
    await page.getByLabel(/terms/i).check()
    await page.getByLabel(/not employed/i).check()
    await page.getByRole('button', { name: /continue/i }).click()
    
    // Payment page
    await expect(page.getByText(/payment/i)).toBeVisible()
    
    const paymentScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(paymentScanResults.violations).toEqual([])
  })
  
  test('keyboard navigation through entire flow', async ({ page }) => {
    await page.goto('/en')
    
    // Navigate to contribute link via keyboard
    await page.keyboard.press('Tab')
    // Keep tabbing until contribute link focused (or use skip link)
    let focused = await page.evaluate(() => document.activeElement?.textContent)
    while (!focused?.match(/contribute|support/i)) {
      await page.keyboard.press('Tab')
      focused = await page.evaluate(() => document.activeElement?.textContent)
    }
    await page.keyboard.press('Enter')
    
    await expect(page).toHaveURL(/\/contribute/)
    
    // Fill form with keyboard only
    await page.keyboard.press('Tab') // To amount field
    await page.keyboard.type('50')
    
    await page.keyboard.press('Tab') // To name field
    await page.keyboard.type('Keyboard Test')
    
    await page.keyboard.press('Tab') // To email field
    await page.keyboard.type('keyboard@test.com')
    
    await page.keyboard.press('Tab') // To country select
    await page.keyboard.press('ArrowDown') // Select US
    await page.keyboard.press('Enter')
    
    // Check boxes
    await page.keyboard.press('Tab') // To first checkbox
    await page.keyboard.press('Space')
    
    await page.keyboard.press('Tab') // To second checkbox
    await page.keyboard.press('Space')
    
    // Submit
    await page.keyboard.press('Tab') // To submit button
    await page.keyboard.press('Enter')
    
    // Should reach payment page
    await expect(page.getByText(/payment/i)).toBeVisible()
  })
  
  test('no hard-coded candidate wording when UNVERIFIED', async ({ page }) => {
    // If candidacy status is UNVERIFIED, should not say "candidate" or "running"
    
    await page.goto('/en')
    
    // Check for prohibited phrases
    const content = await page.textContent('body')
    
    // If status is UNVERIFIED (check via API or DB)
    const candidacyStatus = 'UNVERIFIED' // Would fetch from API
    
    if (candidacyStatus === 'UNVERIFIED') {
      expect(content).not.toMatch(/is running|is a candidate|senate candidate/i)
      // Should use conditional wording instead
      expect(content).toMatch(/prospective|potential|pursuing/i)
    }
  })
})
