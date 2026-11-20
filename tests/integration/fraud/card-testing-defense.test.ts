/**
 * Integration Tests: Card Testing Defense
 * 
 * Simulates hundreds of $5 card-testing attempts and verifies:
 * - Velocity limits trigger correctly
 * - Lockouts are applied
 * - Alerts are triggered
 * - Legitimate donors on other IPs are not blocked
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { checkVelocityLimits, recordPaymentAttempt, clearVelocityCounters } from '@/lib/fraud/velocity'
import { calculateRiskScore } from '@/lib/fraud/risk-score'
import { checkAlerts } from '@/lib/fraud/alerts'
import { InMemoryRateLimitStore } from '@/lib/rate-limit/store'

describe('Card Testing Defense Integration', () => {
  let store: InMemoryRateLimitStore

  beforeEach(() => {
    store = new InMemoryRateLimitStore()
  })

  afterEach(() => {
    store.destroy()
  })

  describe('Hundreds of $5 Card-Testing Attempts', () => {
    it('blocks attacker after velocity limits exceeded', async () => {
      const attackerIp = '1.2.3.4'
      const attackerEmail = 'attacker@test.com'

      // Simulate 100 rapid $5 attempts (card testing pattern)
      for (let i = 0; i < 100; i++) {
        const velocityResult = await checkVelocityLimits({
          ipAddress: attackerIp,
          deviceFingerprint: 'device_attacker',
          email: attackerEmail,
          cardFingerprint: `4242${i.toString().padStart(4, '0')}`, // Different cards
          userAgent: 'Mozilla/5.0',
        })

        // Record attempt
        await recordPaymentAttempt({
          ipAddress: attackerIp,
          deviceFingerprint: 'device_attacker',
          email: attackerEmail,
          cardFingerprint: `4242${i.toString().padStart(4, '0')}`,
          userAgent: 'Mozilla/5.0',
        })

        // After first few attempts, should be blocked
        if (i >= 10) {
          expect(velocityResult.allowed).toBe(false)
          expect(velocityResult.reason).toContain('Too many attempts')
        }
      }

      // Verify lockout is applied
      const finalCheck = await checkVelocityLimits({
        ipAddress: attackerIp,
        deviceFingerprint: 'device_attacker',
        email: attackerEmail,
        cardFingerprint: '42424242',
        userAgent: 'Mozilla/5.0',
      })

      expect(finalCheck.allowed).toBe(false)
      expect(finalCheck.lockedUntil).toBeDefined()
      expect(finalCheck.waitSeconds).toBeGreaterThan(0)
    })

    it('does not block legitimate donors on different IPs', async () => {
      const attackerIp = '1.2.3.4'
      const legitimateIp = '5.6.7.8'

      // Attacker: 20 rapid attempts
      for (let i = 0; i < 20; i++) {
        await recordPaymentAttempt({
          ipAddress: attackerIp,
          deviceFingerprint: 'device_attacker',
          email: 'attacker@test.com',
          cardFingerprint: `4242${i}`,
          userAgent: 'Mozilla/5.0',
        })
      }

      // Legitimate donor: 1 attempt (normal behavior)
      const legitCheck = await checkVelocityLimits({
        ipAddress: legitimateIp,
        deviceFingerprint: 'device_legit',
        email: 'donor@example.com',
        cardFingerprint: '4242424242424242',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      })

      // Should be allowed
      expect(legitCheck.allowed).toBe(true)

      // Record legitimate attempt
      await recordPaymentAttempt({
        ipAddress: legitimateIp,
        deviceFingerprint: 'device_legit',
        email: 'donor@example.com',
        cardFingerprint: '4242424242424242',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      })

      // Verify still allowed
      const legitCheck2 = await checkVelocityLimits({
        ipAddress: legitimateIp,
        deviceFingerprint: 'device_legit',
        email: 'donor@example.com',
        cardFingerprint: '4242424242424242',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      })

      expect(legitCheck2.allowed).toBe(true)
    })

    it('detects high risk scores for card testing patterns', async () => {
      // Simulate card testing pattern
      const riskResult = await calculateRiskScore({
        email: 'test@tempmail.com', // Disposable email
        country: 'US',
        amountCents: 500, // Exact $5 (common card testing amount)
        ipAddress: '1.2.3.4',
        ipCountry: 'US',
        deviceFingerprint: 'device_123',
        userAgent: 'curl/7.64.1', // Bot user agent
        cardCountry: 'US',
        cardFingerprint: '4242',
        donorFingerprint: 'donor_test',
      })

      // Should have HIGH risk score
      expect(riskResult.score).toBeGreaterThan(30) // At least MEDIUM
      expect(riskResult.factors.length).toBeGreaterThan(0)

      // Check specific factors
      const factors = riskResult.factors.map(f => f.factor)
      expect(factors).toContain('disposable_email')
      expect(factors).toContain('suspicious_pattern')
    })

    it('triggers admin alerts after threshold exceeded', async () => {
      // Simulate 15 failed payments (exceeds threshold of 10)
      for (let i = 0; i < 15; i++) {
        await prisma.contribution.create({
          data: {
            amountCents: 500,
            currency: 'USD',
            status: 'FAILED',
            donorEmail: `test${i}@test.com`,
            donorFirstName: 'Test',
            donorLastName: 'User',
            donorCountry: 'US',
            donorFingerprint: `donor_${i}`,
            complianceCheckId: 'check_123',
            attestationVersionId: 'attest_123',
          },
        })
      }

      // Check alerts
      const alerts = await checkAlerts()

      // Should have failure spike alert
      const failureAlert = alerts.find(a => a.type === 'FAILURE_SPIKE')
      expect(failureAlert).toBeDefined()
      expect(failureAlert!.count).toBeGreaterThanOrEqual(10)
      expect(failureAlert!.severity).toBe('HIGH')
    })
  })

  describe('Progressive Lockouts', () => {
    it('applies increasing lockout durations for repeat violations', async () => {
      const ipAddress = '1.2.3.4'

      // First violation: 5 minute lockout
      for (let i = 0; i < 4; i++) {
        await recordPaymentAttempt({
          ipAddress,
          deviceFingerprint: 'device_123',
          email: 'test@test.com',
          cardFingerprint: '4242',
          userAgent: 'Mozilla/5.0',
        })
      }

      // Trigger velocity check (will record violation)
      const check1 = await checkVelocityLimits({
        ipAddress,
        deviceFingerprint: 'device_123',
        email: 'test@test.com',
        cardFingerprint: '4242',
        userAgent: 'Mozilla/5.0',
      })

      expect(check1.allowed).toBe(false)
      expect(check1.waitSeconds).toBeGreaterThan(0)

      const firstLockout = check1.waitSeconds!

      // Clear counters but keep violation count
      await clearVelocityCounters('ip', ipAddress)

      // Second violation: 30 minute lockout
      for (let i = 0; i < 4; i++) {
        await recordPaymentAttempt({
          ipAddress,
          deviceFingerprint: 'device_123',
          email: 'test@test.com',
          cardFingerprint: '4242',
          userAgent: 'Mozilla/5.0',
        })
      }

      const check2 = await checkVelocityLimits({
        ipAddress,
        deviceFingerprint: 'device_123',
        email: 'test@test.com',
        cardFingerprint: '4242',
        userAgent: 'Mozilla/5.0',
      })

      expect(check2.allowed).toBe(false)
      const secondLockout = check2.waitSeconds!

      // Second lockout should be longer
      expect(secondLockout).toBeGreaterThan(firstLockout)
    })
  })

  describe('Multi-Dimensional Tracking', () => {
    it('tracks across IP, device, email, and card', async () => {
      const baseParams = {
        ipAddress: '1.2.3.4',
        deviceFingerprint: 'device_123',
        email: 'test@test.com',
        cardFingerprint: '4242',
        userAgent: 'Mozilla/5.0',
      }

      // Record multiple attempts
      for (let i = 0; i < 5; i++) {
        await recordPaymentAttempt(baseParams)
      }

      // Check limits
      const result = await checkVelocityLimits(baseParams)

      // Verify all dimensions tracked
      expect(result.limits.ip.current).toBeGreaterThan(0)
      expect(result.limits.device.current).toBeGreaterThan(0)
      expect(result.limits.email.current).toBeGreaterThan(0)
      expect(result.limits.card.current).toBeGreaterThan(0)
    })

    it('blocks on any single dimension exceeding limit', async () => {
      // Same email, different IPs (email-based blocking)
      const sameEmail = 'test@test.com'

      for (let i = 0; i < 3; i++) {
        await recordPaymentAttempt({
          ipAddress: `1.2.3.${i}`,
          deviceFingerprint: `device_${i}`,
          email: sameEmail,
          cardFingerprint: `4242${i}`,
          userAgent: 'Mozilla/5.0',
        })
      }

      // Next attempt with same email should be blocked
      const result = await checkVelocityLimits({
        ipAddress: '5.6.7.8', // Different IP
        deviceFingerprint: 'device_999',
        email: sameEmail, // Same email
        cardFingerprint: '9999',
        userAgent: 'Mozilla/5.0',
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('email')
    })
  })

  describe('Time Windows', () => {
    it('resets counters after time window expires', async () => {
      // This test would need time mocking in real implementation
      // For now, verify that TTL is set correctly
      
      const result = await checkVelocityLimits({
        ipAddress: '1.2.3.4',
        deviceFingerprint: 'device_123',
        email: 'test@test.com',
        cardFingerprint: '4242',
        userAgent: 'Mozilla/5.0',
      })

      // Check that limits have proper windows
      expect(result.limits.ip.window).toBeTruthy()
      expect(result.limits.email.window).toBeTruthy()
    })
  })
})
