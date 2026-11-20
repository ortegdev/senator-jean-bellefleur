/**
 * Waitlist System Integration Tests
 * 
 * Tests:
 * - Double opt-in flow (email verification)
 * - Unsubscribe functionality
 * - Consent record integrity
 * - Rate limiting
 * - Spam detection
 * - Launch notifications
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import {
  createWaitlistSignup,
  verifyWaitlistEmail,
  unsubscribeFromWaitlist,
  sendLaunchNotifications,
  getWaitlistStats,
} from '@/lib/engagement/waitlist'

describe('Waitlist System', () => {
  // Clean up test data
  afterEach(async () => {
    await prisma.waitlistSignup.deleteMany({
      where: { email: { contains: '@test.example' } },
    })
  })

  describe('Double Opt-In Flow', () => {
    it('should create unverified signup with token', async () => {
      const result = await createWaitlistSignup({
        email: 'alice@test.example.com',
        country: 'US',
        preferredLocale: 'en',
        emailConsent: true,
        whatsappConsent: false,
        consentIpAddress: '192.0.2.1',
        consentUserAgent: 'TestAgent/1.0',
      })

      expect(result.emailVerified).toBe(false)
      expect(result.verificationToken).toBeDefined()
      expect(result.verificationToken).toHaveLength(64) // 32 bytes hex

      // Verify database record
      const signup = await prisma.waitlistSignup.findUnique({
        where: { email: 'alice@test.example.com' },
      })

      expect(signup).toBeDefined()
      expect(signup!.emailVerified).toBe(false)
      expect(signup!.emailVerificationToken).toBe(result.verificationToken)
      expect(signup!.emailVerificationTokenExpiry).toBeDefined()
      
      // Token should expire in ~24 hours
      const now = Date.now()
      const expiry = signup!.emailVerificationTokenExpiry!.getTime()
      const hoursDiff = (expiry - now) / (1000 * 60 * 60)
      expect(hoursDiff).toBeGreaterThan(23)
      expect(hoursDiff).toBeLessThan(25)
    })

    it('should verify email with valid token', async () => {
      // Create signup
      const result = await createWaitlistSignup({
        email: 'bob@test.example.com',
        country: 'CA',
        preferredLocale: 'fr',
        emailConsent: true,
        whatsappConsent: false,
        consentIpAddress: '192.0.2.2',
        consentUserAgent: 'TestAgent/1.0',
      })

      // Verify with token
      const verified = await verifyWaitlistEmail(result.verificationToken!)

      expect(verified).toBe(true)

      // Check database
      const signup = await prisma.waitlistSignup.findUnique({
        where: { email: 'bob@test.example.com' },
      })

      expect(signup!.emailVerified).toBe(true)
      expect(signup!.emailVerificationToken).toBeNull()
      expect(signup!.emailVerificationTokenExpiry).toBeNull()
    })

    it('should reject invalid verification token', async () => {
      const verified = await verifyWaitlistEmail('invalid-token-that-does-not-exist')

      expect(verified).toBe(false)
    })

    it('should reject expired verification token', async () => {
      // Create signup
      const result = await createWaitlistSignup({
        email: 'charlie@test.example.com',
        country: 'FR',
        preferredLocale: 'fr',
        emailConsent: true,
        whatsappConsent: false,
        consentIpAddress: '192.0.2.3',
        consentUserAgent: 'TestAgent/1.0',
      })

      // Manually expire the token
      await prisma.waitlistSignup.update({
        where: { email: 'charlie@test.example.com' },
        data: {
          emailVerificationTokenExpiry: new Date(Date.now() - 1000), // 1 second ago
        },
      })

      // Try to verify
      const verified = await verifyWaitlistEmail(result.verificationToken!)

      expect(verified).toBe(false)

      // Email should still be unverified
      const signup = await prisma.waitlistSignup.findUnique({
        where: { email: 'charlie@test.example.com' },
      })

      expect(signup!.emailVerified).toBe(false)
    })
  })

  describe('Unsubscribe Functionality', () => {
    it('should unsubscribe verified email', async () => {
      // Create and verify
      const result = await createWaitlistSignup({
        email: 'diana@test.example.com',
        country: 'US',
        preferredLocale: 'en',
        emailConsent: true,
        whatsappConsent: false,
        consentIpAddress: '192.0.2.4',
        consentUserAgent: 'TestAgent/1.0',
      })

      await verifyWaitlistEmail(result.verificationToken!)

      // Unsubscribe
      const unsubscribed = await unsubscribeFromWaitlist('diana@test.example.com')

      expect(unsubscribed).toBe(true)

      // Check database
      const signup = await prisma.waitlistSignup.findUnique({
        where: { email: 'diana@test.example.com' },
      })

      expect(signup!.unsubscribed).toBe(true)
      expect(signup!.unsubscribedAt).toBeDefined()
    })

    it('should not allow resubscribing after unsubscribe', async () => {
      // Create and verify
      const result = await createWaitlistSignup({
        email: 'eve@test.example.com',
        country: 'CA',
        preferredLocale: 'en',
        emailConsent: true,
        whatsappConsent: false,
        consentIpAddress: '192.0.2.5',
        consentUserAgent: 'TestAgent/1.0',
      })

      await verifyWaitlistEmail(result.verificationToken!)
      await unsubscribeFromWaitlist('eve@test.example.com')

      // Try to sign up again
      await expect(
        createWaitlistSignup({
          email: 'eve@test.example.com',
          country: 'CA',
          preferredLocale: 'en',
          emailConsent: true,
          whatsappConsent: false,
          consentIpAddress: '192.0.2.5',
          consentUserAgent: 'TestAgent/1.0',
        })
      ).rejects.toThrow('EMAIL_UNSUBSCRIBED')
    })

    it('should return false for non-existent email', async () => {
      const unsubscribed = await unsubscribeFromWaitlist('nobody@test.example.com')

      expect(unsubscribed).toBe(false)
    })
  })

  describe('Consent Record Integrity', () => {
    it('should store complete consent metadata', async () => {
      const testIp = '192.0.2.10'
      const testUserAgent = 'Mozilla/5.0 TestBrowser'
      const beforeSignup = new Date()

      await createWaitlistSignup({
        email: 'frank@test.example.com',
        country: 'US',
        preferredLocale: 'en',
        emailConsent: true,
        whatsappConsent: true,
        whatsapp: '+15551234567',
        consentIpAddress: testIp,
        consentUserAgent: testUserAgent,
      })

      const signup = await prisma.waitlistSignup.findUnique({
        where: { email: 'frank@test.example.com' },
      })

      // Verify all consent fields
      expect(signup!.emailConsent).toBe(true)
      expect(signup!.whatsappConsent).toBe(true)
      expect(signup!.whatsapp).toBe('+15551234567')
      expect(signup!.consentIpAddress).toBe(testIp)
      expect(signup!.consentUserAgent).toBe(testUserAgent)
      expect(signup!.consentTimestamp).toBeDefined()
      expect(signup!.consentTimestamp!.getTime()).toBeGreaterThanOrEqual(beforeSignup.getTime())
      
      // Verify exact consent text was stored
      expect(signup!.consentText).toBeDefined()
      expect(signup!.consentText).toContain('email notifications')
      expect(signup!.consentText).toContain('WhatsApp messages')
    })

    it('should store separate consent for email only', async () => {
      await createWaitlistSignup({
        email: 'grace@test.example.com',
        country: 'FR',
        preferredLocale: 'fr',
        emailConsent: true,
        whatsappConsent: false,
        consentIpAddress: '192.0.2.11',
        consentUserAgent: 'TestAgent/1.0',
      })

      const signup = await prisma.waitlistSignup.findUnique({
        where: { email: 'grace@test.example.com' },
      })

      expect(signup!.emailConsent).toBe(true)
      expect(signup!.whatsappConsent).toBe(false)
      expect(signup!.whatsapp).toBeNull()
      expect(signup!.consentText).toContain('email notifications')
      expect(signup!.consentText).not.toContain('WhatsApp')
    })

    it('should not allow signup without email consent', async () => {
      await expect(
        createWaitlistSignup({
          email: 'henry@test.example.com',
          country: 'US',
          preferredLocale: 'en',
          emailConsent: false, // No consent!
          whatsappConsent: false,
          consentIpAddress: '192.0.2.12',
          consentUserAgent: 'TestAgent/1.0',
        })
      ).rejects.toThrow('EMAIL_CONSENT_REQUIRED')
    })

    it('should require WhatsApp number if WhatsApp consent given', async () => {
      await expect(
        createWaitlistSignup({
          email: 'iris@test.example.com',
          country: 'US',
          preferredLocale: 'en',
          emailConsent: true,
          whatsappConsent: true, // Consent given
          // whatsapp: missing!
          consentIpAddress: '192.0.2.13',
          consentUserAgent: 'TestAgent/1.0',
        })
      ).rejects.toThrow('WHATSAPP_NUMBER_REQUIRED')
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce email rate limit (2 per hour)', async () => {
      const testEmail = 'ratelimit1@test.example.com'

      // First signup: OK
      await createWaitlistSignup({
        email: testEmail,
        country: 'US',
        preferredLocale: 'en',
        emailConsent: true,
        whatsappConsent: false,
        consentIpAddress: '192.0.2.20',
        consentUserAgent: 'TestAgent/1.0',
      })

      // Delete to allow second attempt
      await prisma.waitlistSignup.delete({
        where: { email: testEmail },
      })

      // Second signup: OK
      await createWaitlistSignup({
        email: testEmail,
        country: 'US',
        preferredLocale: 'en',
        emailConsent: true,
        whatsappConsent: false,
        consentIpAddress: '192.0.2.20',
        consentUserAgent: 'TestAgent/1.0',
      })

      // Delete to allow third attempt
      await prisma.waitlistSignup.delete({
        where: { email: testEmail },
      })

      // Third signup: Should fail (limit is 2)
      await expect(
        createWaitlistSignup({
          email: testEmail,
          country: 'US',
          preferredLocale: 'en',
          emailConsent: true,
          whatsappConsent: false,
          consentIpAddress: '192.0.2.20',
          consentUserAgent: 'TestAgent/1.0',
        })
      ).rejects.toThrow('TOO_MANY_SIGNUPS_FROM_EMAIL')
    })

    it('should enforce IP rate limit (5 per hour)', async () => {
      const testIp = '192.0.2.30'

      // Create 5 signups from same IP
      for (let i = 0; i < 5; i++) {
        await createWaitlistSignup({
          email: `user${i}@test.example.com`,
          country: 'US',
          preferredLocale: 'en',
          emailConsent: true,
          whatsappConsent: false,
          consentIpAddress: testIp,
          consentUserAgent: 'TestAgent/1.0',
        })
      }

      // 6th signup from same IP: Should fail
      await expect(
        createWaitlistSignup({
          email: 'user6@test.example.com',
          country: 'US',
          preferredLocale: 'en',
          emailConsent: true,
          whatsappConsent: false,
          consentIpAddress: testIp,
          consentUserAgent: 'TestAgent/1.0',
        })
      ).rejects.toThrow('TOO_MANY_SIGNUPS_FROM_IP')
    })
  })

  describe('Spam Detection', () => {
    it('should detect suspicious email patterns', async () => {
      const spamEmails = [
        'test+12345+67890+abcdef@test.example.com', // Excessive plus addressing
        'spamspamspamspam@test.example.com', // Repeated words
      ]

      for (const email of spamEmails) {
        await expect(
          createWaitlistSignup({
            email,
            country: 'US',
            preferredLocale: 'en',
            emailConsent: true,
            whatsappConsent: false,
            consentIpAddress: '192.0.2.40',
            consentUserAgent: 'TestAgent/1.0',
          })
        ).rejects.toThrow('SUSPICIOUS_EMAIL_PATTERN')
      }
    })

    it('should allow legitimate plus addressing', async () => {
      // Single plus sign is fine
      const result = await createWaitlistSignup({
        email: 'user+waitlist@test.example.com',
        country: 'US',
        preferredLocale: 'en',
        emailConsent: true,
        whatsappConsent: false,
        consentIpAddress: '192.0.2.41',
        consentUserAgent: 'TestAgent/1.0',
      })

      expect(result.emailVerified).toBe(false)
    })
  })

  describe('Launch Notifications', () => {
    it('should only notify verified, non-notified subscribers', async () => {
      // Create 3 signups
      const emails = [
        'notify1@test.example.com',
        'notify2@test.example.com',
        'notify3@test.example.com',
      ]

      for (const email of emails) {
        const result = await createWaitlistSignup({
          email,
          country: 'US',
          preferredLocale: 'en',
          emailConsent: true,
          whatsappConsent: false,
          consentIpAddress: '192.0.2.50',
          consentUserAgent: 'TestAgent/1.0',
        })

        // Verify all
        await verifyWaitlistEmail(result.verificationToken!)
      }

      // Mark one as already notified
      await prisma.waitlistSignup.update({
        where: { email: 'notify2@test.example.com' },
        data: { notified: true },
      })

      // Send notifications (dry run - no actual emails)
      const notified = await sendLaunchNotifications()

      // Should notify 2 (notify1 and notify3, not notify2)
      expect(notified).toBe(2)

      // Verify database state
      const signup1 = await prisma.waitlistSignup.findUnique({
        where: { email: 'notify1@test.example.com' },
      })
      const signup2 = await prisma.waitlistSignup.findUnique({
        where: { email: 'notify2@test.example.com' },
      })
      const signup3 = await prisma.waitlistSignup.findUnique({
        where: { email: 'notify3@test.example.com' },
      })

      expect(signup1!.notified).toBe(true)
      expect(signup2!.notified).toBe(true) // Already was true
      expect(signup3!.notified).toBe(true)
    })
  })

  describe('Statistics', () => {
    it('should calculate correct statistics', async () => {
      // Create diverse signups
      await createWaitlistSignup({
        email: 'stat1@test.example.com',
        country: 'US',
        preferredLocale: 'en',
        emailConsent: true,
        whatsappConsent: false,
        consentIpAddress: '192.0.2.60',
        consentUserAgent: 'TestAgent/1.0',
      })

      const result2 = await createWaitlistSignup({
        email: 'stat2@test.example.com',
        country: 'FR',
        preferredLocale: 'fr',
        emailConsent: true,
        whatsappConsent: true,
        whatsapp: '+33123456789',
        consentIpAddress: '192.0.2.61',
        consentUserAgent: 'TestAgent/1.0',
      })

      // Verify one
      await verifyWaitlistEmail(result2.verificationToken!)

      const stats = await getWaitlistStats()

      expect(stats.total).toBeGreaterThanOrEqual(2)
      expect(stats.verified).toBeGreaterThanOrEqual(1)
      expect(stats.pending).toBeGreaterThanOrEqual(1)
      expect(stats.unsubscribed).toBe(0)
      expect(stats.byCountry['US']).toBeGreaterThanOrEqual(1)
      expect(stats.byCountry['FR']).toBeGreaterThanOrEqual(1)
      expect(stats.byLocale['en']).toBeGreaterThanOrEqual(1)
      expect(stats.byLocale['fr']).toBeGreaterThanOrEqual(1)
      expect(stats.withWhatsApp).toBeGreaterThanOrEqual(1)
    })
  })
})
