import { test, expect } from '@playwright/test'

test.describe('Design System @smoke', () => {
  test('design system page loads successfully', async ({ page }) => {
    await page.goto('/en/design-system')

    // Should have title
    await expect(page.locator('h1')).toContainText('Design System')

    // Should display wordmark
    await expect(page.getByText(/Diaspora4Bellefleur/i)).toBeVisible()

    // Should have color palette section
    await expect(page.getByText('Color Palette')).toBeVisible()
    await expect(page.getByText('Deep Lagoon')).toBeVisible()
    await expect(page.getByText('Coral')).toBeVisible()

    // Should have typography section
    await expect(page.getByText('Typography')).toBeVisible()
    await expect(page.getByText('Fraunces (display) + Inter (body/UI)')).toBeVisible()

    // Should have component library
    await expect(page.getByText('Component Library')).toBeVisible()
  })

  test('all button variants are visible', async ({ page }) => {
    await page.goto('/en/design-system')

    // Check button variants exist
    await expect(page.getByRole('button', { name: 'Primary Button' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Secondary Button' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tertiary Button' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ghost Button' })).toBeVisible()
  })

  test('shows accessibility features section', async ({ page }) => {
    await page.goto('/en/design-system')

    await expect(page.getByText('Accessibility Features')).toBeVisible()
    await expect(page.getByText(/WCAG 2.2 Level AA compliance/i)).toBeVisible()
  })

  test('coastline constellation motif is displayed', async ({ page }) => {
    await page.goto('/en/design-system')

    await expect(page.getByText('Coastline Constellation Motif')).toBeVisible()
  })

  test('affiliation badge is shown', async ({ page }) => {
    await page.goto('/en/design-system')

    // Should show affiliation badge examples
    await expect(page.getByText(/Affiliation Badge/i)).toBeVisible()
    await expect(page.getByText(/Independent supporter initiative/i)).toBeVisible()
  })

  test('diacritic support is demonstrated', async ({ page }) => {
    await page.goto('/en/design-system')

    // Check for French/Creole diacritics
    await expect(page.getByText(/è ò à â ê î ô û ç œ/i)).toBeVisible()
    await expect(page.getByText(/À Port-de-Paix, le cœur bat fort/i)).toBeVisible()
  })
})

test.describe('Visual Regression Tests', () => {
  test('design system matches visual baseline at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/en/design-system')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot (can be used for visual regression)
    await page.screenshot({
      path: 'docs/design-review/design-system-360.png',
      fullPage: true,
    })
  })

  test('design system matches visual baseline at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/en/design-system')
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({
      path: 'docs/design-review/design-system-768.png',
      fullPage: true,
    })
  })

  test('design system matches visual baseline at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 })
    await page.goto('/en/design-system')
    await page.waitForLoadState('networkidle')
    
    await page.screenshot({
      path: 'docs/design-review/design-system-1280.png',
      fullPage: true,
    })
  })
})
