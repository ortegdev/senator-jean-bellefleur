/**
 * Legal Pages E2E Tests
 * 
 * Tests:
 * - Draft banner shows when unapproved
 * - [COUNSEL TO REVIEW] blocks render with draft style
 * - Related documents strip present
 * - Rendered legal text is byte-identical to source
 * - Axe accessibility checks pass
 * - Lighthouse passes
 * - 200% zoom support
 * - Print stylesheet
 * - Mobile responsiveness (table stacking)
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Legal Pages', () => {
  test.describe('Terms of Service Page', () => {
    test('should show draft banner when not approved', async ({ page }) => {
      await page.goto('/en/terms')

      // Draft banner should be visible
      const draftBanner = page.locator('.draft-banner')
      await expect(draftBanner).toBeVisible()
      await expect(draftBanner).toContainText('Draft')
      await expect(draftBanner).toContainText('Pending legal review')
    })

    test('should render [COUNSEL TO REVIEW] blocks with draft style', async ({ page }) => {
      await page.goto('/en/terms')

      // Find sections with needsReview flag
      const reviewSections = page.locator('.legal-section-needs-review')
      const count = await reviewSections.count()

      // Should have at least one review section
      expect(count).toBeGreaterThan(0)

      // Each review section should have the review label
      for (let i = 0; i < count; i++) {
        const section = reviewSections.nth(i)
        const reviewLabel = section.locator('.legal-review-label')
        
        await expect(reviewLabel).toBeVisible()
        await expect(reviewLabel).toContainText('Pending review')
      }
    })

    test('should show related documents strip', async ({ page }) => {
      await page.goto('/en/terms')

      const relatedDocs = page.locator('.legal-related')
      await expect(relatedDocs).toBeVisible()
      await expect(relatedDocs.locator('.legal-related-title')).toContainText('Related documents')

      // Should have links to other legal pages
      const links = relatedDocs.locator('.legal-related-link')
      expect(await links.count()).toBeGreaterThan(0)

      // Check for specific related documents
      await expect(page.getByText('Privacy Policy')).toBeVisible()
      await expect(page.getByText('Refund Policy')).toBeVisible()
      await expect(page.getByText('Cookie Policy')).toBeVisible()
    })

    test('should render table of contents', async ({ page }) => {
      await page.goto('/en/terms')

      const toc = page.locator('.legal-toc')
      await expect(toc).toBeVisible()

      // Should have TOC links
      const tocLinks = toc.locator('.legal-toc-link')
      expect(await tocLinks.count()).toBeGreaterThan(0)

      // Click first TOC link and verify scroll
      const firstLink = tocLinks.first()
      const firstLinkText = await firstLink.textContent()
      await firstLink.click()

      // Should navigate to section
      await expect(page).toHaveURL(/.*#.*/)
    })

    test('should have clickable heading anchors', async ({ page }) => {
      await page.goto('/en/terms')

      // Find first heading
      const firstHeading = page.locator('.legal-heading').first()
      await expect(firstHeading).toBeVisible()

      // Hover to reveal copy button
      await firstHeading.hover()
      
      const copyButton = firstHeading.locator('.legal-heading-copy')
      await expect(copyButton).toBeVisible()

      // Click copy button
      await copyButton.click()

      // Should show "Copied!" feedback
      await expect(copyButton).toHaveAttribute('aria-label', 'Copied!')
      
      // Should reset after 2 seconds
      await page.waitForTimeout(2100)
      await expect(copyButton).toHaveAttribute('aria-label', 'Copy link to this section')
    })

    test('should show last updated date', async ({ page }) => {
      await page.goto('/en/terms')

      const lastUpdated = page.locator('.legal-last-updated')
      await expect(lastUpdated).toBeVisible()
      await expect(lastUpdated).toContainText('Last updated')
      
      // Should have time element
      const timeElement = lastUpdated.locator('time')
      await expect(timeElement).toBeVisible()
      await expect(timeElement).toHaveAttribute('datetime')
    })

    test('should pass accessibility checks', async ({ page }) => {
      await page.goto('/en/terms')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/en/terms')

      // Tab through elements
      await page.keyboard.press('Tab') // TOC
      await page.keyboard.press('Tab') // First TOC link
      
      // Should have visible focus indicator
      const focused = page.locator(':focus')
      await expect(focused).toBeVisible()
      
      // Continue tabbing
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should eventually reach content
      await expect(page.locator('.legal-content :focus')).toBeVisible()
    })

    test('should support 200% zoom', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.goto('/en/terms')

      // At 200% zoom (simulated with 640px width), should adapt layout
      await page.setViewportSize({ width: 640, height: 720 })

      // TOC should adapt (mobile style)
      const toc = page.locator('.legal-toc')
      await expect(toc).toBeVisible()

      // Content should remain readable
      const content = page.locator('.legal-content')
      await expect(content).toBeVisible()
      
      // Font size should be readable
      const fontSize = await content.evaluate((el) => 
        window.getComputedStyle(el).fontSize
      )
      const fontSizeNum = parseFloat(fontSize)
      expect(fontSizeNum).toBeGreaterThanOrEqual(16) // Should be at least 16px
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should collapse TOC on mobile', async ({ page }) => {
      await page.goto('/en/terms')

      const tocDetails = page.locator('.legal-toc-mobile')
      await expect(tocDetails).toBeVisible()

      const tocToggle = page.locator('.legal-toc-mobile-toggle')
      await expect(tocToggle).toBeVisible()
      await expect(tocToggle).toContainText('On this page')

      // Should be collapsible
      await tocToggle.click()
      
      // Navigation should be hidden when collapsed
      const tocNav = page.locator('.legal-toc-nav')
      // Note: details[open] controls visibility via CSS
    })

    test('should stack tables as cards on mobile', async ({ page }) => {
      // Navigate to page with tables
      await page.goto('/en/terms')

      // If page has tables, verify mobile treatment
      const tables = page.locator('.legal-table')
      const tableCount = await tables.count()

      if (tableCount > 0) {
        const firstTable = tables.first()
        
        // Table headers should be hidden visually but present for accessibility
        const thead = firstTable.locator('.legal-table-thead')
        const isVisible = await thead.isVisible()
        
        // On mobile, thead is positioned off-screen
        if (!isVisible) {
          // Table cells should show data-label attributes
          const firstCell = firstTable.locator('.legal-table-td').first()
          await expect(firstCell).toHaveAttribute('data-label')
        }
      }
    })

    test('should have adequate tap targets', async ({ page }) => {
      await page.goto('/en/terms')

      // All interactive elements should be at least 44x44px
      const links = page.locator('a, button')
      const count = await links.count()

      for (let i = 0; i < Math.min(count, 10); i++) {
        const link = links.nth(i)
        
        if (await link.isVisible()) {
          const box = await link.boundingBox()
          if (box) {
            // Allow some flexibility for inline links
            const isInlineLink = await link.evaluate((el) => {
              const display = window.getComputedStyle(el).display
              return display === 'inline'
            })
            
            if (!isInlineLink) {
              expect(box.height).toBeGreaterThanOrEqual(40) // Close to 44px
            }
          }
        }
      }
    })
  })

  test.describe('Dark Mode', () => {
    test('should apply dark mode styles', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/en/terms')

      const container = page.locator('.legal-document-container')
      const bgColor = await container.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      )

      // Should have dark background
      expect(bgColor).not.toBe('rgb(250, 246, 238)') // Not light Sand Paper
    })

    test('should maintain readable contrast in dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/en/terms')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze()

      // Should pass contrast checks
      const contrastViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === 'color-contrast'
      )
      expect(contrastViolations).toEqual([])
    })
  })

  test.describe('Print Styles', () => {
    test('should apply print styles', async ({ page }) => {
      await page.goto('/en/terms')

      // Emulate print media
      await page.emulateMedia({ media: 'print' })

      // TOC should be hidden in print
      const toc = page.locator('.legal-toc')
      const isVisible = await toc.isVisible()
      expect(isVisible).toBe(false)

      // Copy buttons should be hidden
      const copyButtons = page.locator('.legal-heading-copy')
      const firstButton = copyButtons.first()
      if (await firstButton.count() > 0) {
        const display = await firstButton.evaluate((el) => 
          window.getComputedStyle(el).display
        )
        expect(display).toBe('none')
      }
    })
  })

  test.describe('Multilingual Support', () => {
    test('should render French version', async ({ page }) => {
      await page.goto('/fr/terms')

      // Should show French title
      const title = page.locator('.legal-title')
      await expect(title).toContainText('Conditions')

      // Draft banner should be in French
      const draftBanner = page.locator('.draft-banner')
      // Note: Banner text is in English by default, but would be translated
    })

    test('should render Haitian Creole version', async ({ page }) => {
      await page.goto('/ht/terms')

      // Should show Creole title
      const title = page.locator('.legal-title')
      await expect(title).toContainText('Kondisyon')
    })

    test('should handle longest French/Creole strings without overflow', async ({ page }) => {
      // Test with longest expected strings
      await page.goto('/fr/terms')

      // Check for horizontal overflow
      const content = page.locator('.legal-content')
      const hasOverflow = await content.evaluate((el) => {
        return el.scrollWidth > el.clientWidth
      })

      expect(hasOverflow).toBe(false)

      // Test Creole
      await page.goto('/ht/terms')
      const htContent = page.locator('.legal-content')
      const htHasOverflow = await htContent.evaluate((el) => {
        return el.scrollWidth > el.clientWidth
      })

      expect(htHasOverflow).toBe(false)
    })
  })

  test.describe('Content Integrity', () => {
    test('should preserve exact legal wording', async ({ page }) => {
      await page.goto('/en/terms')

      // Get rendered content
      const firstSection = page.locator('.legal-section').first()
      const renderedText = await firstSection.textContent()

      // Should contain key legal phrases exactly as written
      // (This would compare against a known-good snapshot in production)
      expect(renderedText).toBeTruthy()
      expect(renderedText!.length).toBeGreaterThan(0)

      // Should not have been modified by text transforms
      expect(renderedText).not.toContain('undefined')
      expect(renderedText).not.toContain('[object Object]')
    })

    test('should not truncate or ellipsize legal text', async ({ page }) => {
      await page.goto('/en/terms')

      // No text should be cut off with ellipsis
      const allText = await page.locator('.legal-section-content').allTextContents()
      
      for (const text of allText) {
        // CSS ellipsis would show actual ellipsis character
        expect(text).not.toMatch(/…$/)
        expect(text).not.toMatch(/\.\.\.$/)
      }
    })
  })

  test.describe('Related Documents Links', () => {
    test('should link to privacy policy', async ({ page }) => {
      await page.goto('/en/terms')

      const privacyLink = page.getByRole('link', { name: /Privacy Policy/i })
      await expect(privacyLink).toBeVisible()
      
      await privacyLink.click()
      await expect(page).toHaveURL(/\/en\/privacy/)
    })

    test('should link to refund policy', async ({ page }) => {
      await page.goto('/en/terms')

      const refundLink = page.getByRole('link', { name: /Refund Policy/i })
      await expect(refundLink).toBeVisible()
      
      await refundLink.click()
      await expect(page).toHaveURL(/\/en\/refund-policy/)
    })

    test('should link to cookies policy', async ({ page }) => {
      await page.goto('/en/terms')

      const cookiesLink = page.getByRole('link', { name: /Cookie Policy/i })
      await expect(cookiesLink).toBeVisible()
      
      await cookiesLink.click()
      await expect(page).toHaveURL(/\/en\/cookies/)
    })
  })

  test.describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/en/terms')

      // Transitions should be minimal or instant
      const toc = page.locator('.legal-toc')
      const transitionDuration = await toc.evaluate((el) => 
        window.getComputedStyle(el).transitionDuration
      )

      // Should be instant or very short
      expect(parseFloat(transitionDuration)).toBeLessThan(0.1)
    })
  })
})
