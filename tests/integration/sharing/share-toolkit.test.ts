/**
 * Share Toolkit Integration Tests
 * 
 * Tests:
 * - Share message generation (all locales)
 * - UTM parameter tracking
 * - Platform-specific URL generation
 * - Link attribution accuracy
 */

import { describe, it, expect, beforeAll } from 'vitest'
import {
  getShareMessage,
  buildUrlWithUtm,
  getWhatsAppShareUrl,
  getFacebookShareUrl,
  getTelegramShareUrl,
  generateShareToolkit,
} from '@/lib/sharing/share-toolkit'

describe('Share Toolkit', () => {
  const testUrl = 'https://diaspora4bellefleur.org'

  beforeAll(async () => {
    // Ensure candidate config exists
    process.env.SITE_URL = testUrl
  })

  describe('Share Messages', () => {
    it('should generate general share message in Haitian Creole', async () => {
      const message = await getShareMessage('ht', 'general')

      expect(message).toContain('Mwen sipòte')
      expect(message).toContain('Senatè')
      expect(message).toContain('Nord-Ouest')
      // Should NOT claim official status
      expect(message).not.toContain('ofisyèl')
      expect(message).not.toContain('kanpay')
    })

    it('should generate general share message in French', async () => {
      const message = await getShareMessage('fr', 'general')

      expect(message).toContain('Je soutiens')
      expect(message).toContain('Sénateur')
      expect(message).toContain('Nord-Ouest')
      // Should NOT claim official status
      expect(message).not.toContain('officiel')
      expect(message).not.toContain('campagne')
    })

    it('should generate general share message in English', async () => {
      const message = await getShareMessage('en', 'general')

      expect(message).toContain('supporting')
      expect(message).toContain('Senator')
      expect(message).toContain('Nord-Ouest')
      // Should NOT claim official status
      expect(message).not.toContain('official')
      expect(message).not.toContain('campaign')
    })

    it('should generate chapter-specific message with context', async () => {
      const message = await getShareMessage('en', 'chapter', 'Miami Chapter')

      expect(message).toContain('Miami Chapter')
      expect(message).toContain('group')
      expect(message).toContain('supporting')
    })

    it('should generate supporter-specific message with name', async () => {
      const message = await getShareMessage('en', 'supporter', 'Jean Baptiste')

      expect(message).toContain('Jean Baptiste')
      expect(message).toContain('supports')
    })
  })

  describe('UTM Parameters', () => {
    it('should add UTM parameters to URL', () => {
      const url = buildUrlWithUtm(testUrl, {
        url: testUrl,
        message: 'Test',
        source: 'chapter',
        medium: 'whatsapp',
        campaign: 'miami-launch',
      })

      const parsed = new URL(url)

      expect(parsed.searchParams.get('utm_source')).toBe('chapter')
      expect(parsed.searchParams.get('utm_medium')).toBe('whatsapp')
      expect(parsed.searchParams.get('utm_campaign')).toBe('miami-launch')
    })

    it('should preserve existing query parameters', () => {
      const urlWithParams = `${testUrl}?ref=supporter123`

      const url = buildUrlWithUtm(urlWithParams, {
        url: urlWithParams,
        message: 'Test',
        source: 'supporter',
        medium: 'facebook',
      })

      const parsed = new URL(url)

      expect(parsed.searchParams.get('ref')).toBe('supporter123')
      expect(parsed.searchParams.get('utm_source')).toBe('supporter')
      expect(parsed.searchParams.get('utm_medium')).toBe('facebook')
    })

    it('should handle URLs with fragments', () => {
      const urlWithFragment = `${testUrl}#section`

      const url = buildUrlWithUtm(urlWithFragment, {
        url: urlWithFragment,
        message: 'Test',
        source: 'page',
        medium: 'telegram',
      })

      const parsed = new URL(url)

      expect(parsed.hash).toBe('#section')
      expect(parsed.searchParams.get('utm_source')).toBe('page')
    })
  })

  describe('Platform URLs', () => {
    const baseParams = {
      url: testUrl,
      message: 'Support Jean Fritznel Bellefleur',
      source: 'page' as const,
    }

    it('should generate WhatsApp share URL with encoded message', () => {
      const url = getWhatsAppShareUrl({
        ...baseParams,
        medium: 'whatsapp',
      })

      expect(url).toContain('wa.me')
      expect(url).toContain('text=')
      expect(decodeURIComponent(url)).toContain('Support Jean Fritznel Bellefleur')
      expect(decodeURIComponent(url)).toContain('utm_medium=whatsapp')
    })

    it('should generate Facebook share URL', () => {
      const url = getFacebookShareUrl({
        ...baseParams,
        medium: 'facebook',
      })

      expect(url).toContain('facebook.com/sharer')
      expect(url).toContain('utm_medium=facebook')
    })

    it('should generate Telegram share URL', () => {
      const url = getTelegramShareUrl({
        ...baseParams,
        medium: 'telegram',
      })

      expect(url).toContain('t.me/share')
      expect(url).toContain('utm_medium=telegram')
    })

    it('should properly encode special characters in URLs', () => {
      const urlWithSpecialChars = getWhatsAppShareUrl({
        url: testUrl,
        message: 'Test & share <this>',
        source: 'page',
        medium: 'whatsapp',
      })

      // Should not have unencoded special characters in URL
      expect(urlWithSpecialChars).not.toContain('&')
      expect(urlWithSpecialChars).not.toContain('<')
      expect(urlWithSpecialChars).not.toContain('>')
      expect(urlWithSpecialChars).toContain('%')
    })
  })

  describe('Complete Share Toolkit', () => {
    it('should generate complete toolkit for general context', async () => {
      const toolkit = await generateShareToolkit({
        url: testUrl,
        locale: 'en',
        context: 'general',
        source: 'page',
      })

      expect(toolkit.message).toBeTruthy()
      expect(toolkit.urls.whatsapp).toContain('wa.me')
      expect(toolkit.urls.facebook).toContain('facebook.com')
      expect(toolkit.urls.telegram).toContain('t.me')
      expect(toolkit.urls.sms).toContain('sms:')
      expect(toolkit.urls.email).toContain('mailto:')
      expect(toolkit.urls.copy).toContain(testUrl)
      expect(toolkit.webShare.supported).toBeDefined()
      expect(toolkit.webShare.data.title).toBeTruthy()
    })

    it('should generate toolkit for chapter context', async () => {
      const toolkit = await generateShareToolkit({
        url: `${testUrl}/chapters/miami`,
        locale: 'en',
        context: 'chapter',
        contextName: 'Miami Chapter',
        source: 'chapter',
        campaign: 'miami-launch',
      })

      expect(toolkit.message).toContain('Miami Chapter')

      // All URLs should have chapter source and campaign
      const urls = Object.values(toolkit.urls)
      urls.forEach((url) => {
        if (typeof url === 'string') {
          expect(decodeURIComponent(url)).toContain('utm_source=chapter')
          expect(decodeURIComponent(url)).toContain('utm_campaign=miami-launch')
        }
      })
    })

    it('should generate toolkit for supporter context', async () => {
      const toolkit = await generateShareToolkit({
        url: `${testUrl}/s/jean-baptiste`,
        locale: 'fr',
        context: 'supporter',
        contextName: 'Jean Baptiste',
        source: 'supporter',
        campaign: 'jean-baptiste',
      })

      expect(toolkit.message).toContain('Jean Baptiste')

      // Check UTM parameters
      const copyUrl = new URL(toolkit.urls.copy)
      expect(copyUrl.searchParams.get('utm_source')).toBe('supporter')
      expect(copyUrl.searchParams.get('utm_campaign')).toBe('jean-baptiste')
    })

    it('should generate different messages for each locale', async () => {
      const toolkits = await Promise.all([
        generateShareToolkit({
          url: testUrl,
          locale: 'ht',
          context: 'general',
          source: 'page',
        }),
        generateShareToolkit({
          url: testUrl,
          locale: 'fr',
          context: 'general',
          source: 'page',
        }),
        generateShareToolkit({
          url: testUrl,
          locale: 'en',
          context: 'general',
          source: 'page',
        }),
      ])

      const messages = toolkits.map((t) => t.message)

      // All messages should be different
      expect(messages[0]).not.toBe(messages[1])
      expect(messages[1]).not.toBe(messages[2])
      expect(messages[0]).not.toBe(messages[2])

      // Each should be in the correct language
      expect(messages[0]).toContain('sipòte') // Haitian Creole
      expect(messages[1]).toContain('soutiens') // French
      expect(messages[2]).toContain('supporting') // English
    })
  })

  describe('Link Attribution', () => {
    it('should maintain attribution through all share methods', async () => {
      const supporterSlug = 'test-supporter-123'
      const baseUrl = `${testUrl}/s/${supporterSlug}`

      const toolkit = await generateShareToolkit({
        url: baseUrl,
        locale: 'en',
        context: 'supporter',
        source: 'supporter',
        campaign: supporterSlug,
      })

      // Every URL should maintain the supporter slug in some form
      // Either in the base URL or as a campaign parameter
      Object.values(toolkit.urls).forEach((url) => {
        if (typeof url === 'string') {
          const decoded = decodeURIComponent(url)
          const hasSlugInPath = decoded.includes(`/s/${supporterSlug}`)
          const hasSlugInCampaign = decoded.includes(`utm_campaign=${supporterSlug}`)

          expect(hasSlugInPath || hasSlugInCampaign).toBe(true)
        }
      })
    })

    it('should differentiate between organic and referred traffic', async () => {
      const organicToolkit = await generateShareToolkit({
        url: testUrl,
        locale: 'en',
        context: 'general',
        source: 'page',
      })

      const referredToolkit = await generateShareToolkit({
        url: `${testUrl}?ref=supporter123`,
        locale: 'en',
        context: 'supporter',
        source: 'supporter',
        campaign: 'supporter123',
      })

      // Organic should not have campaign
      const organicUrl = new URL(organicToolkit.urls.copy)
      expect(organicUrl.searchParams.get('utm_campaign')).toBeNull()

      // Referred should have campaign
      const referredUrl = new URL(referredToolkit.urls.copy)
      expect(referredUrl.searchParams.get('utm_campaign')).toBe('supporter123')
    })
  })

  describe('Self-Referral Prevention', () => {
    it('should not create circular referral loops', async () => {
      // A supporter sharing their own page should not create self-referral
      const supporterSlug = 'jean-doe'
      const supporterPageUrl = `${testUrl}/s/${supporterSlug}`

      const toolkit = await generateShareToolkit({
        url: supporterPageUrl,
        locale: 'en',
        context: 'supporter',
        contextName: 'Jean Doe',
        source: 'supporter',
        campaign: supporterSlug,
      })

      // The campaign should match the slug, allowing backend to detect
      // that this is the supporter's own page and not count as referral
      const copyUrl = new URL(toolkit.urls.copy)
      expect(copyUrl.searchParams.get('utm_campaign')).toBe(supporterSlug)

      // Backend can check: if campaign === current supporter's slug, don't count
    })
  })
})
