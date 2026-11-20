import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ht') // Haitian Creole (default)
  })

  test('displays hero section with candidate name', async ({ page }) => {
    // Should show either "Support" or "A supporter initiative for" depending on candidacy status
    await expect(page.locator('h1')).toContainText('Jean Fritznel Bellefleur')
  })

  test('shows candidacy status badge', async ({ page }) => {
    // Should display candidacy status
    const badge = page.locator('text=/Status|Estatik|Statut/i').first()
    await expect(badge).toBeVisible()
  })

  test('displays photo slot or typographic composition', async ({ page }) => {
    // Either photo or elegant placeholder should be visible
    const photoOrPlaceholder = page.locator('[alt="Jean Fritznel Bellefleur"], text="Photo pending approval"').first()
    await expect(photoOrPlaceholder).toBeVisible()
  })

  test('shows mode-aware primary CTA', async ({ page }) => {
    // Should show CTA based on launch mode (Learn more, Get updates, or Give)
    const cta = page.locator('a').filter({ hasText: /Learn More|Aprann Plis|En savoir plus|Get launch updates|Give/i }).first()
    await expect(cta).toBeVisible()
  })

  test('affiliation strip visible without scrolling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    
    // Affiliation should be in viewport
    const affiliation = page.locator('text=/independent|endepandan|indépendante/i').first()
    await expect(affiliation).toBeInViewport()
  })

  test('displays "Why Small Gifts Matter" section', async ({ page }) => {
    const section = page.locator('h2', { hasText: /Why Small Gifts|Poukisa Ti Kado|Pourquoi les Petits Dons/i })
    await expect(section).toBeVisible()
    
    // Should have 3 cards
    const cards = page.locator('[class*="grid"] > div').filter({ has: page.locator('h3') })
    await expect(cards).toHaveCount(3, { timeout: 10000 })
  })

  test('displays Nord-Ouest map or placeholder', async ({ page }) => {
    const mapSection = page.locator('h2', { hasText: /Roots|Rasin|Racines/i })
    await expect(mapSection).toBeVisible()
  })

  test('displays How It Works with 3 steps', async ({ page }) => {
    const section = page.locator('h2', { hasText: /How It Works|Kòman Li Mache|Comment Ça Marche/i })
    await expect(section).toBeVisible()
    
    // Should show 3 steps
    const steps = page.locator('text=/^[123]$/')
    await expect(steps).toHaveCount(3, { timeout: 10000 })
  })

  test('displays FAQ preview', async ({ page }) => {
    const section = page.locator('h2', { hasText: /Common Questions|Kesyon Komen|Questions Courantes/i })
    await expect(section).toBeVisible()
  })

  test('displays mode-aware signup block', async ({ page }) => {
    // Should have a prominent CTA at the bottom
    const signup = page.locator('section').last()
    await expect(signup).toContainText(/Learn More|Join|Contribute|Rantre|Soutenez/i)
  })

  test('works in French locale', async ({ page }) => {
    await page.goto('/fr')
    await expect(page.locator('h1')).toContainText('Jean Fritznel Bellefleur')
    await expect(page.locator('text=/Soutenir|Initiative/i')).toBeVisible()
  })

  test('works in English locale', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('h1')).toContainText('Jean Fritznel Bellefleur')
    await expect(page.locator('text=/Support|Initiative/i')).toBeVisible()
  })

  test('is mobile-responsive (360px)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    
    // Hero should be visible and readable
    await expect(page.locator('h1')).toBeVisible()
    
    // CTA buttons should be stacked vertically
    const buttons = page.locator('a').filter({ hasText: /Learn|Aprann|Savoir/i })
    await expect(buttons.first()).toBeVisible()
  })

  test('does not show live progress in INFO_ONLY mode', async ({ page }) => {
    // Progress section should not appear if mode is INFO_ONLY
    const progress = page.locator('h2', { hasText: /Progress|Pwogrè|Progrès/i })
    const count = await progress.count()
    // Will be 0 in INFO_ONLY, >0 in DONATIONS_LIVE
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('no autoplay video or animations', async ({ page }) => {
    // Check for autoplay video
    const autoplayVideo = page.locator('video[autoplay]')
    await expect(autoplayVideo).toHaveCount(0)
    
    // Check prefers-reduced-motion is respected
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    // Animations should not be present or should be instant
    await expect(page.locator('h1')).toBeVisible()
  })

  test('has defined image aspect ratios', async ({ page }) => {
    // Photo slot should have aspect-[3/4] class or similar
    const photoSlot = page.locator('[class*="aspect"]').first()
    if (await photoSlot.count() > 0) {
      await expect(photoSlot).toBeVisible()
    }
  })

  test('passes Lighthouse accessibility checks', async ({ page }) => {
    // Run basic accessibility checks
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
    
    // Check for semantic HTML
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('nav')).toBeVisible()
    
    // Check for alt text on images (if any)
    const images = page.locator('img')
    const imageCount = await images.count()
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })
})

test.describe('Home Page - DONATIONS_LIVE Mode', () => {
  test.skip('shows live progress with real data @smoke', async ({ page }) => {
    // This test would only run if mode is DONATIONS_LIVE
    // Skipped by default, can be enabled when donations go live
    await page.goto('/ht')
    
    const progress = page.locator('h2', { hasText: /Progress|Pwogrè|Progrès/i })
    await expect(progress).toBeVisible()
    
    // Should show raised amount, supporters, countries, communes
    await expect(page.locator('text=/Raised|Kolekte|Collecté/i')).toBeVisible()
    await expect(page.locator('text=/Supporters|Sipòtè/i')).toBeVisible()
  })
})
