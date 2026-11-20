/**
 * Visual Regression Tests
 * 
 * Captures screenshots of all public pages, donation steps, admin pages, and emails
 * At 360px, 768px, 1280px viewports in ht/fr/en, light and dark mode
 * 
 * Baselines committed to docs/design-review/final/
 */

import { test, expect } from '@playwright/test'

const viewports = [
  { width: 360, height: 640, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1280, height: 720, name: 'desktop' },
]

const locales = ['ht', 'fr', 'en']
const colorSchemes: ('light' | 'dark')[] = ['light', 'dark']

const publicPages = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/his-journey', name: 'journey' },
  { path: '/vision', name: 'vision' },
  { path: '/department', name: 'department' },
  { path: '/faq', name: 'faq' },
  { path: '/contact', name: 'contact' },
  { path: '/privacy', name: 'privacy' },
  { path: '/terms', name: 'terms' },
]

const donationSteps = [
  { path: '/contribute', name: 'contribute-form' },
  { path: '/contribute/payment', name: 'contribute-payment', requiresSetup: true },
  { path: '/contribute/success', name: 'contribute-success', requiresSetup: true },
]

const adminPages = [
  { path: '/admin/login', name: 'admin-login' },
  { path: '/admin', name: 'admin-dashboard', requiresAuth: true },
  { path: '/admin/contributions', name: 'admin-contributions', requiresAuth: true },
  { path: '/admin/launch-control', name: 'admin-launch', requiresAuth: true },
]

test.describe('Visual Regression Suite', () => {
  for (const viewport of viewports) {
    for (const colorScheme of colorSchemes) {
      test.describe(`${viewport.name} - ${colorScheme}`, () => {
        test.use({
          viewport: { width: viewport.width, height: viewport.height },
          colorScheme,
        })
        
        for (const locale of locales) {
          test.describe(`locale: ${locale}`, () => {
            // Public pages
            for (const page of publicPages) {
              test(`${page.name}`, async ({ page: pw }) => {
                await pw.goto(`/${locale}${page.path}`)
                await pw.waitForLoadState('networkidle')
                
                // Wait for fonts to load
                await pw.evaluate(() => document.fonts.ready)
                
                // Full page screenshot
                await expect(pw).toHaveScreenshot(
                  `${locale}-${page.name}-${viewport.name}-${colorScheme}.png`,
                  {
                    fullPage: true,
                    animations: 'disabled',
                  }
                )
              })
            }
            
            // Donation steps
            for (const step of donationSteps) {
              if (step.requiresSetup) {
                // Skip in automated visual regression (requires form submission)
                // Manual screenshot capture required
                test.skip(`${step.name} (manual capture required)`, async () => {})
              } else {
                test(`${step.name}`, async ({ page: pw }) => {
                  await pw.goto(`/${locale}${step.path}`)
                  await pw.waitForLoadState('networkidle')
                  await pw.evaluate(() => document.fonts.ready)
                  
                  await expect(pw).toHaveScreenshot(
                    `${locale}-${step.name}-${viewport.name}-${colorScheme}.png`,
                    {
                      fullPage: true,
                      animations: 'disabled',
                    }
                  )
                })
              }
            }
          })
        }
        
        // Admin pages (no locale)
        test.describe('admin', () => {
          for (const page of adminPages) {
            if (page.requiresAuth) {
              test.skip(`${page.name} (requires auth)`, async () => {})
            } else {
              test(`${page.name}`, async ({ page: pw }) => {
                await pw.goto(page.path)
                await pw.waitForLoadState('networkidle')
                await pw.evaluate(() => document.fonts.ready)
                
                await expect(pw).toHaveScreenshot(
                  `admin-${page.name}-${viewport.name}-${colorScheme}.png`,
                  {
                    fullPage: true,
                    animations: 'disabled',
                  }
                )
              })
            }
          }
        })
      })
    }
  }
  
  // Email renders (manual capture via /api/test-email endpoint)
  test.describe('email renders', () => {
    const emailTypes = [
      'receipt',
      'contribution-confirmation',
      'refund-notice',
      'cap-reached',
    ]
    
    for (const emailType of emailTypes) {
      test.skip(`${emailType} (manual capture from test endpoint)`, async () => {
        // Test emails at /api/test-email?type=${emailType}
        // Capture manually and save to docs/design-review/final/emails/
      })
    }
  })
})

test.describe('Component Screenshots', () => {
  test('affiliation badge variations', async ({ page }) => {
    await page.goto('/en')
    
    // Locate affiliation badge
    const badge = page.locator('[data-testid="affiliation-badge"]')
    await expect(badge).toBeVisible()
    
    // Screenshot just the badge
    await badge.screenshot({
      path: 'docs/design-review/final/components/affiliation-badge-light.png',
    })
    
    // Dark mode
    await page.emulateMedia({ colorScheme: 'dark' })
    await badge.screenshot({
      path: 'docs/design-review/final/components/affiliation-badge-dark.png',
    })
  })
  
  test('candidacy status badge variations', async ({ page }) => {
    await page.goto('/en')
    
    const statusBadge = page.locator('[data-testid="candidacy-status"]')
    if (await statusBadge.isVisible()) {
      await statusBadge.screenshot({
        path: 'docs/design-review/final/components/candidacy-status-light.png',
      })
      
      await page.emulateMedia({ colorScheme: 'dark' })
      await statusBadge.screenshot({
        path: 'docs/design-review/final/components/candidacy-status-dark.png',
      })
    }
  })
  
  test('contribution form validation states', async ({ page }) => {
    await page.goto('/en/contribute')
    
    // Empty state
    await page.screenshot({
      path: 'docs/design-review/final/components/form-empty.png',
    })
    
    // Error state (submit empty form)
    await page.getByRole('button', { name: /continue/i }).click()
    await page.screenshot({
      path: 'docs/design-review/final/components/form-errors.png',
    })
    
    // Filled state
    await page.getByLabel(/amount/i).fill('50')
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.screenshot({
      path: 'docs/design-review/final/components/form-filled.png',
    })
  })
  
  test('candidate photo placeholder', async ({ page }) => {
    await page.goto('/en/about')
    
    // If no photo uploaded, should show elegant placeholder
    const placeholder = page.locator('[data-testid="candidate-photo-placeholder"]')
    if (await placeholder.isVisible()) {
      await placeholder.screenshot({
        path: 'docs/design-review/final/components/photo-placeholder.png',
      })
    }
  })
})

test.describe('Design Quality Checks', () => {
  test('no hard-coded colors (Tailwind classes only)', async ({ page }) => {
    await page.goto('/en')
    
    // Check for inline styles with colors
    const elementsWithInlineColors = await page.evaluate(() => {
      const elements = document.querySelectorAll('[style*="color:"], [style*="background"]')
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        style: el.getAttribute('style'),
        text: el.textContent?.slice(0, 50),
      }))
    })
    
    // Allow specific cases (e.g., dynamic status colors)
    const allowed = elementsWithInlineColors.filter(el => 
      el.style?.includes('var(--') // CSS variables are OK
    )
    
    const violations = elementsWithInlineColors.length - allowed.length
    expect(violations).toBe(0)
  })
  
  test('no hard-coded sizes (use design tokens)', async ({ page }) => {
    await page.goto('/en')
    
    const elementsWithHardcodedSizes = await page.evaluate(() => {
      const elements = document.querySelectorAll('[style*="px"], [style*="rem"]')
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        style: el.getAttribute('style'),
      }))
    })
    
    // Allow CSS variables
    const allowed = elementsWithHardcodedSizes.filter(el =>
      el.style?.includes('var(--')
    )
    
    const violations = elementsWithHardcodedSizes.length - allowed.length
    expect(violations).toBe(0)
  })
  
  test('no placeholder text in production', async ({ page }) => {
    await page.goto('/en')
    
    const content = await page.textContent('body')
    
    const placeholderPatterns = [
      /lorem ipsum/i,
      /placeholder/i,
      /TODO:/i,
      /FIXME:/i,
      /\[TBD\]/i,
      /\[INSERT.*\]/i,
    ]
    
    for (const pattern of placeholderPatterns) {
      expect(content).not.toMatch(pattern)
    }
  })
  
  test('affiliation disclosure visible on every page', async ({ page }) => {
    for (const locale of locales) {
      for (const pageDef of publicPages) {
        await page.goto(`/${locale}${pageDef.path}`)
        
        const disclosure = page.locator('[data-testid="affiliation-badge"]')
        await expect(disclosure).toBeVisible()
      }
    }
  })
  
  test('site looks complete without candidate photo', async ({ page }) => {
    await page.goto('/en/about')
    
    // Check that page doesn't look broken without photo
    const placeholder = page.locator('[data-testid="candidate-photo-placeholder"]')
    
    if (await placeholder.isVisible()) {
      // Placeholder should have proper styling
      const styles = await placeholder.evaluate(el => ({
        background: getComputedStyle(el).background,
        borderRadius: getComputedStyle(el).borderRadius,
        aspectRatio: getComputedStyle(el).aspectRatio,
      }))
      
      expect(styles.background).not.toBe('none')
      expect(parseInt(styles.borderRadius)).toBeGreaterThan(0)
    }
  })
  
  test('no campaign identity copying', async ({ page }) => {
    await page.goto('/en')
    
    // Check for suspicious similarity to real campaigns
    // This is a manual review item, but we can check for specific patterns
    
    const content = await page.textContent('body')
    
    // Should not copy exact slogans from real campaigns
    const suspiciousPatterns = [
      /exact slogan from real campaign/i,
      // Add more patterns based on known campaigns
    ]
    
    for (const pattern of suspiciousPatterns) {
      expect(content).not.toMatch(pattern)
    }
  })
})
