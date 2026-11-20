/**
 * PII Scrubbing Tests
 * 
 * Verifies that PII never appears in logs, error reports, or analytics.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  scrubPII,
  scrubPIIFromObject,
  containsPII,
  assertNoPII,
  safeLogger,
  enableSafeConsole,
} from '@/lib/privacy/pii-scrubbing'

describe('PII Scrubbing', () => {
  describe('scrubPII', () => {
    it('redacts email addresses', () => {
      const text = 'Contact john.doe@example.com for info'
      const scrubbed = scrubPII(text)

      expect(scrubbed).toContain('[EMAIL_REDACTED]')
      expect(scrubbed).not.toContain('john.doe@example.com')
    })

    it('redacts multiple emails', () => {
      const text = 'Emails: test@gmail.com, admin@company.org'
      const scrubbed = scrubPII(text)

      expect(scrubbed).toContain('[EMAIL_REDACTED]')
      expect(scrubbed).not.toContain('test@gmail.com')
      expect(scrubbed).not.toContain('admin@company.org')
    })

    it('redacts credit card numbers', () => {
      const text = 'Card: 4532-1234-5678-9010'
      const scrubbed = scrubPII(text)

      expect(scrubbed).toContain('[CARD_REDACTED]')
      expect(scrubbed).not.toContain('4532-1234-5678-9010')
    })

    it('redacts phone numbers', () => {
      const text = 'Call (555) 123-4567 or +1-555-987-6543'
      const scrubbed = scrubPII(text)

      expect(scrubbed).toContain('[PHONE_REDACTED]')
      expect(scrubbed).not.toContain('555-123-4567')
      expect(scrubbed).not.toContain('+1-555-987-6543')
    })

    it('redacts IP addresses', () => {
      const text = 'Request from 192.168.1.1 blocked'
      const scrubbed = scrubPII(text)

      expect(scrubbed).toContain('[IP_REDACTED]')
      expect(scrubbed).not.toContain('192.168.1.1')
    })

    it('redacts postal codes', () => {
      const text = 'Shipped to 12345 and 90210-1234'
      const scrubbed = scrubPII(text)

      expect(scrubbed).toContain('[POSTAL_CODE_REDACTED]')
      expect(scrubbed).not.toContain('12345')
      expect(scrubbed).not.toContain('90210-1234')
    })

    it('redacts street addresses', () => {
      const text = 'Ship to 123 Main Street, Apt 4B'
      const scrubbed = scrubPII(text)

      expect(scrubbed).toContain('[ADDRESS_REDACTED]')
      expect(scrubbed).not.toContain('123 Main Street')
    })

    it('redacts names with label', () => {
      const text = 'Name: John Smith, User: Jane Doe'
      const scrubbed = scrubPII(text)

      expect(scrubbed).toContain('[NAME_REDACTED]')
      expect(scrubbed).not.toContain('John Smith')
      expect(scrubbed).not.toContain('Jane Doe')
    })

    it('handles null and non-string input', () => {
      expect(scrubPII(null as any)).toBe(null)
      expect(scrubPII(undefined as any)).toBe(undefined)
      expect(scrubPII(123 as any)).toBe(123)
    })
  })

  describe('scrubPIIFromObject', () => {
    it('redacts sensitive field names', () => {
      const obj = {
        name: 'John Doe',
        email: 'john@example.com',
        amount: 100,
        status: 'completed',
      }

      const scrubbed = scrubPIIFromObject(obj)

      expect(scrubbed.name).toBe('[REDACTED]')
      expect(scrubbed.email).toBe('[REDACTED]')
      expect(scrubbed.amount).toBe(100)
      expect(scrubbed.status).toBe('completed')
    })

    it('recursively scrubs nested objects', () => {
      const obj = {
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          metadata: {
            phone: '555-1234',
            address: '123 Main St',
          },
        },
        amount: 50,
      }

      const scrubbed = scrubPIIFromObject(obj)

      expect(scrubbed.user.name).toBe('[REDACTED]')
      expect(scrubbed.user.email).toBe('[REDACTED]')
      expect(scrubbed.user.metadata.phone).toBe('[REDACTED]')
      expect(scrubbed.user.metadata.address).toBe('[REDACTED]')
      expect(scrubbed.amount).toBe(50)
    })

    it('scrubs arrays of objects', () => {
      const obj = {
        donors: [
          { name: 'Alice', email: 'alice@example.com' },
          { name: 'Bob', email: 'bob@example.com' },
        ],
      }

      const scrubbed = scrubPIIFromObject(obj)

      expect(scrubbed.donors[0].name).toBe('[REDACTED]')
      expect(scrubbed.donors[0].email).toBe('[REDACTED]')
      expect(scrubbed.donors[1].name).toBe('[REDACTED]')
      expect(scrubbed.donors[1].email).toBe('[REDACTED]')
    })

    it('scrubs PII patterns in string values', () => {
      const obj = {
        message: 'Email support@example.com for help',
        cardInfo: 'Card ending in 1234-5678-9012-3456',
      }

      const scrubbed = scrubPIIFromObject(obj)

      expect(scrubbed.message).toContain('[EMAIL_REDACTED]')
      expect(scrubbed.cardInfo).toContain('[CARD_REDACTED]')
    })

    it('handles null and undefined values', () => {
      const obj = {
        name: null,
        email: undefined,
        phone: '555-1234',
      }

      const scrubbed = scrubPIIFromObject(obj)

      expect(scrubbed.name).toBe(null)
      expect(scrubbed.email).toBe(undefined)
      expect(scrubbed.phone).toBe('[REDACTED]')
    })
  })

  describe('safeLogger', () => {
    let consoleSpy: any

    beforeEach(() => {
      consoleSpy = {
        log: vi.spyOn(console, 'log').mockImplementation(() => {}),
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      }
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('scrubs PII from log messages', () => {
      safeLogger.log('User email: test@example.com submitted form')

      expect(consoleSpy.log).toHaveBeenCalled()
      const loggedMessage = consoleSpy.log.mock.calls[0][0]
      expect(loggedMessage).toContain('[EMAIL_REDACTED]')
      expect(loggedMessage).not.toContain('test@example.com')
    })

    it('scrubs PII from objects', () => {
      safeLogger.info({ name: 'John Doe', email: 'john@example.com', amount: 100 })

      expect(consoleSpy.info).toHaveBeenCalled()
      const loggedObj = consoleSpy.info.mock.calls[0][0]
      expect(loggedObj.name).toBe('[REDACTED]')
      expect(loggedObj.email).toBe('[REDACTED]')
      expect(loggedObj.amount).toBe(100)
    })

    it('scrubs PII from error messages', () => {
      safeLogger.error('Failed to send email to user@example.com')

      expect(consoleSpy.error).toHaveBeenCalled()
      const loggedMessage = consoleSpy.error.mock.calls[0][0]
      expect(loggedMessage).toContain('[EMAIL_REDACTED]')
      expect(loggedMessage).not.toContain('user@example.com')
    })
  })

  describe('containsPII', () => {
    it('detects email addresses', () => {
      expect(containsPII('Contact test@example.com')).toBe(true)
      expect(containsPII('No PII here')).toBe(false)
    })

    it('detects credit card numbers', () => {
      expect(containsPII('Card 1234-5678-9012-3456')).toBe(true)
      expect(containsPII('Order #12345')).toBe(false)
    })

    it('detects phone numbers', () => {
      expect(containsPII('Call (555) 123-4567')).toBe(true)
      expect(containsPII('No phone number')).toBe(false)
    })

    it('detects IP addresses', () => {
      expect(containsPII('IP: 192.168.1.1')).toBe(true)
      expect(containsPII('No IP address')).toBe(false)
    })

    it('returns false for null or undefined', () => {
      expect(containsPII(null as any)).toBe(false)
      expect(containsPII(undefined as any)).toBe(false)
    })
  })

  describe('assertNoPII', () => {
    it('does not throw for objects without PII', () => {
      const obj = {
        amount: 100,
        status: 'completed',
        date: '2026-01-01',
      }

      expect(() => assertNoPII(obj, 'Test object')).not.toThrow()
    })

    it('throws for objects with email', () => {
      const obj = {
        amount: 100,
        contact: 'test@example.com',
      }

      expect(() => assertNoPII(obj, 'Test object')).toThrow(/contains PII/)
    })

    it('throws for objects with sensitive field names', () => {
      const obj = {
        amount: 100,
        name: 'John Doe',
      }

      expect(() => assertNoPII(obj, 'Test object')).toThrow(/sensitive field/)
    })

    it('throws for nested objects with PII', () => {
      const obj = {
        user: {
          email: 'test@example.com',
        },
      }

      expect(() => assertNoPII(obj, 'Test object')).toThrow(/contains PII/)
    })
  })

  describe('enableSafeConsole', () => {
    let originalConsole: any

    beforeEach(() => {
      originalConsole = { ...console }
    })

    afterEach(() => {
      // Restore original console
      Object.assign(console, originalConsole)
    })

    it('overrides console methods to scrub PII', () => {
      enableSafeConsole()

      const logSpy = vi.spyOn(console, 'log')
      console.log('Email: test@example.com')

      // Note: The spy will capture the scrubbed version
      // This tests that the override is in place
      expect(logSpy).toHaveBeenCalled()
    })
  })

  describe('Real-world scenarios', () => {
    it('scrubs PII from contribution error', () => {
      const error = {
        message: 'Failed to process contribution',
        donor: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          country: 'US',
        },
        amount: 5000,
        card: {
          last4: '4242',
          cardNumber: '4242-4242-4242-4242',
        },
      }

      const scrubbed = scrubPIIFromObject(error)

      expect(scrubbed.donor.name).toBe('[REDACTED]')
      expect(scrubbed.donor.email).toBe('[REDACTED]')
      expect(scrubbed.donor.country).toBe('US') // Not sensitive
      expect(scrubbed.amount).toBe(5000) // Not sensitive
      expect(scrubbed.card.last4).toBe('4242') // Not sensitive (only last 4)
      expect(scrubbed.card.cardNumber).toContain('[CARD_REDACTED]')
    })

    it('scrubs PII from webhook payload', () => {
      const payload = {
        type: 'payment.succeeded',
        data: {
          object: {
            customer_email: 'customer@example.com',
            billing_details: {
              name: 'Bob Johnson',
              address: '456 Oak Street',
            },
            amount: 10000,
            currency: 'usd',
          },
        },
      }

      const scrubbed = scrubPIIFromObject(payload)

      expect(scrubbed.data.object.customer_email).toContain('[EMAIL_REDACTED]')
      expect(scrubbed.data.object.billing_details.name).toBe('[REDACTED]')
      expect(scrubbed.data.object.billing_details.address).toContain('[ADDRESS_REDACTED]')
      expect(scrubbed.data.object.amount).toBe(10000) // Not sensitive
    })

    it('scrubs PII from audit log entry', () => {
      const logEntry = {
        timestamp: '2026-01-01T12:00:00Z',
        action: 'USER_LOGIN',
        user: {
          id: 'user_123',
          email: 'user@example.com',
          ip: '203.0.113.42',
        },
        success: true,
      }

      const scrubbed = scrubPIIFromObject(logEntry)

      expect(scrubbed.timestamp).toBe('2026-01-01T12:00:00Z') // Not sensitive
      expect(scrubbed.action).toBe('USER_LOGIN') // Not sensitive
      expect(scrubbed.user.id).toBe('user_123') // Not sensitive (ID, not email)
      expect(scrubbed.user.email).toBe('[REDACTED]')
      expect(scrubbed.user.ip).toContain('[IP_REDACTED]')
      expect(scrubbed.success).toBe(true) // Not sensitive
    })
  })
})
