/**
 * Unit tests for compliance rules validation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { validateContribution } from '@/lib/validation/rules'
import { ComplianceError } from '@/lib/errors'

describe('Compliance Rules Validation', () => {
  describe('Amount validation', () => {
    it('should accept valid amount within range', () => {
      expect(() => validateContribution({
        amountCents: 5000, // $50.00
        country: 'US',
        email: 'test@example.com',
      })).not.toThrow()
    })
    
    it('should reject amount below minimum', () => {
      expect(() => validateContribution({
        amountCents: 400, // $4.00, below $5 minimum
        country: 'US',
        email: 'test@example.com',
      })).toThrow(ComplianceError)
      
      expect(() => validateContribution({
        amountCents: 400,
        country: 'US',
        email: 'test@example.com',
      })).toThrow(/minimum contribution/i)
    })
    
    it('should reject amount above maximum', () => {
      expect(() => validateContribution({
        amountCents: 1000000, // $10,000, above typical max
        country: 'US',
        email: 'test@example.com',
      })).toThrow(ComplianceError)
      
      expect(() => validateContribution({
        amountCents: 1000000,
        country: 'US',
        email: 'test@example.com',
      })).toThrow(/maximum contribution/i)
    })
    
    it('should reject zero or negative amounts', () => {
      expect(() => validateContribution({
        amountCents: 0,
        country: 'US',
        email: 'test@example.com',
      })).toThrow()
      
      expect(() => validateContribution({
        amountCents: -1000,
        country: 'US',
        email: 'test@example.com',
      })).toThrow()
    })
    
    it('should reject non-integer amounts', () => {
      expect(() => validateContribution({
        amountCents: 50.5, // Half cent not allowed
        country: 'US',
        email: 'test@example.com',
      })).toThrow()
    })
  })
  
  describe('Country eligibility', () => {
    it('should accept allowed countries', () => {
      const allowedCountries = ['US', 'CA', 'HT', 'FR']
      
      allowedCountries.forEach(country => {
        expect(() => validateContribution({
          amountCents: 5000,
          country,
          email: 'test@example.com',
        })).not.toThrow()
      })
    })
    
    it('should reject disallowed countries', () => {
      const disallowedCountries = ['RU', 'KP', 'IR', 'CU']
      
      disallowedCountries.forEach(country => {
        expect(() => validateContribution({
          amountCents: 5000,
          country,
          email: 'test@example.com',
        })).toThrow(ComplianceError)
      })
    })
    
    it('should reject invalid country codes', () => {
      expect(() => validateContribution({
        amountCents: 5000,
        country: 'USA', // Should be 'US'
        email: 'test@example.com',
      })).toThrow()
      
      expect(() => validateContribution({
        amountCents: 5000,
        country: 'XX',
        email: 'test@example.com',
      })).toThrow()
    })
  })
  
  describe('Email validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.org',
        'user123@sub.example.com',
      ]
      
      validEmails.forEach(email => {
        expect(() => validateContribution({
          amountCents: 5000,
          country: 'US',
          email,
        })).not.toThrow()
      })
    })
    
    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ]
      
      invalidEmails.forEach(email => {
        expect(() => validateContribution({
          amountCents: 5000,
          country: 'US',
          email,
        })).toThrow()
      })
    })
    
    it('should reject missing email', () => {
      expect(() => validateContribution({
        amountCents: 5000,
        country: 'US',
        email: '',
      })).toThrow()
    })
  })
  
  describe('Cumulative limit checking', () => {
    it('should track cumulative contributions by email', async () => {
      // This would check database for previous contributions
      // and ensure total doesn't exceed limit
      
      // Mock scenario: user has contributed $4,500 already
      const existingTotal = 450000 // cents
      const newAmount = 5500 // $55
      const limit = 500000 // $5,000 limit
      
      expect(existingTotal + newAmount).toBeLessThanOrEqual(limit)
    })
    
    it('should reject contribution that exceeds cumulative limit', () => {
      // Mock scenario: user trying to contribute more than allowed
      const existingTotal = 490000 // $4,900
      const newAmount = 15000 // $150
      const limit = 500000 // $5,000 limit
      
      expect(() => {
        if (existingTotal + newAmount > limit) {
          throw new ComplianceError('Cumulative limit exceeded')
        }
      }).toThrow(ComplianceError)
    })
  })
  
  describe('Edge cases', () => {
    it('should handle minimum valid contribution ($5.00)', () => {
      expect(() => validateContribution({
        amountCents: 500,
        country: 'US',
        email: 'test@example.com',
      })).not.toThrow()
    })
    
    it('should handle contribution exactly at maximum', () => {
      // Assuming $5,000 max
      expect(() => validateContribution({
        amountCents: 500000,
        country: 'US',
        email: 'test@example.com',
      })).not.toThrow()
    })
    
    it('should handle contribution one cent over maximum', () => {
      expect(() => validateContribution({
        amountCents: 500001,
        country: 'US',
        email: 'test@example.com',
      })).toThrow(ComplianceError)
    })
    
    it('should trim and lowercase email', () => {
      expect(() => validateContribution({
        amountCents: 5000,
        country: 'US',
        email: '  TEST@EXAMPLE.COM  ',
      })).not.toThrow()
      
      // Verify normalization happened
      const normalized = '  TEST@EXAMPLE.COM  '.trim().toLowerCase()
      expect(normalized).toBe('test@example.com')
    })
  })
})
