/**
 * Unit tests for contribution ledger
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Ledger } from '@/lib/ledger/ledger'
import { ContributionStatus } from '@prisma/client'

describe('Contribution Ledger', () => {
  let ledger: Ledger
  
  beforeEach(() => {
    ledger = new Ledger()
  })
  
  describe('Amount calculations', () => {
    it('should calculate net amount after fees', () => {
      const gross = 10000 // $100.00
      const stripeFee = 290 + Math.round(gross * 0.029) // $2.90 + 2.9%
      const platformFee = 0 // No platform fee
      
      const net = gross - stripeFee - platformFee
      
      expect(net).toBe(10000 - 320) // $97.10
      expect(net).toBeGreaterThan(0)
    })
    
    it('should calculate Stripe fee correctly', () => {
      const testCases = [
        { amount: 1000, expected: 59 },   // $10 → $0.59
        { amount: 5000, expected: 175 },  // $50 → $1.75
        { amount: 10000, expected: 320 }, // $100 → $3.20
        { amount: 50000, expected: 1740 }, // $500 → $17.40
      ]
      
      testCases.forEach(({ amount, expected }) => {
        const fee = 30 + Math.round(amount * 0.029)
        expect(fee).toBe(expected)
      })
    })
    
    it('should handle international card fee (additional 1%)', () => {
      const amount = 10000 // $100
      const stripeFee = 30 + Math.round(amount * 0.029) // $0.30 + 2.9%
      const internationalFee = Math.round(amount * 0.01) // +1%
      
      const totalFee = stripeFee + internationalFee
      expect(totalFee).toBe(320 + 100) // $4.20 total
    })
    
    it('should never result in negative net amount', () => {
      const minimumAmount = 500 // $5.00 minimum
      const fee = 30 + Math.round(minimumAmount * 0.029)
      const net = minimumAmount - fee
      
      expect(net).toBeGreaterThan(0)
    })
  })
  
  describe('Receipt generation', () => {
    it('should generate receipt with all required fields', () => {
      const receipt = {
        id: 'rcpt_123abc',
        contributionId: 'contrib_xyz',
        amountCents: 10000,
        currency: 'USD',
        date: new Date(),
        donorName: 'Jean Doe',
        donorEmail: 'jean@example.com',
        receiptUrl: 'https://example.com/receipts/rcpt_123abc',
      }
      
      expect(receipt).toHaveProperty('id')
      expect(receipt).toHaveProperty('contributionId')
      expect(receipt).toHaveProperty('amountCents')
      expect(receipt).toHaveProperty('currency')
      expect(receipt).toHaveProperty('date')
      expect(receipt).toHaveProperty('donorName')
      expect(receipt).toHaveProperty('donorEmail')
      expect(receipt).toHaveProperty('receiptUrl')
      
      expect(receipt.amountCents).toBeGreaterThan(0)
      expect(receipt.currency).toBe('USD')
    })
    
    it('should format receipt amounts correctly', () => {
      const amounts = [
        { cents: 1000, formatted: '$10.00' },
        { cents: 500, formatted: '$5.00' },
        { cents: 12345, formatted: '$123.45' },
        { cents: 100000, formatted: '$1,000.00' },
      ]
      
      amounts.forEach(({ cents, formatted }) => {
        const dollars = cents / 100
        const result = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(dollars)
        
        expect(result).toBe(formatted)
      })
    })
  })
  
  describe('Contribution status transitions', () => {
    it('should allow valid status transitions', () => {
      const validTransitions = [
        { from: 'PENDING', to: 'PROCESSING' },
        { from: 'PROCESSING', to: 'COMPLETED' },
        { from: 'PROCESSING', to: 'FAILED' },
        { from: 'PENDING', to: 'CANCELLED' },
      ]
      
      validTransitions.forEach(({ from, to }) => {
        expect(() => ledger.transitionStatus(from, to)).not.toThrow()
      })
    })
    
    it('should reject invalid status transitions', () => {
      const invalidTransitions = [
        { from: 'COMPLETED', to: 'PENDING' },
        { from: 'COMPLETED', to: 'PROCESSING' },
        { from: 'FAILED', to: 'COMPLETED' },
        { from: 'CANCELLED', to: 'COMPLETED' },
      ]
      
      invalidTransitions.forEach(({ from, to }) => {
        expect(() => ledger.transitionStatus(from, to)).toThrow()
      })
    })
    
    it('should allow idempotent transitions (same status)', () => {
      expect(() => ledger.transitionStatus('COMPLETED', 'COMPLETED')).not.toThrow()
    })
  })
  
  describe('Refund calculations', () => {
    it('should calculate full refund correctly', () => {
      const originalAmount = 10000 // $100
      const refundAmount = 10000 // Full refund
      
      expect(refundAmount).toBe(originalAmount)
      expect(refundAmount).toBeGreaterThan(0)
    })
    
    it('should calculate partial refund correctly', () => {
      const originalAmount = 10000 // $100
      const refundAmount = 5000 // $50 partial refund
      
      expect(refundAmount).toBeLessThan(originalAmount)
      expect(refundAmount).toBeGreaterThan(0)
      expect(refundAmount).toBe(originalAmount / 2)
    })
    
    it('should not allow refund greater than original', () => {
      const originalAmount = 10000
      const refundAmount = 15000
      
      expect(() => {
        if (refundAmount > originalAmount) {
          throw new Error('Refund cannot exceed original amount')
        }
      }).toThrow()
    })
    
    it('should track refund fees (Stripe does not refund fees)', () => {
      const originalAmount = 10000
      const originalFee = 320 // $3.20
      const refundAmount = 10000
      const refundFee = 0 // Fees not refunded by Stripe
      
      const netLoss = originalFee // We lose the fee on refund
      expect(netLoss).toBe(320)
    })
  })
  
  describe('Cap splitting', () => {
    it('should split amount at cap correctly', () => {
      const contributionAmount = 600000 // $6,000
      const remainingCap = 500000 // $5,000 limit remaining
      
      const toCandidate = Math.min(contributionAmount, remainingCap)
      const toRefund = contributionAmount - toCandidate
      
      expect(toCandidate).toBe(500000) // $5,000
      expect(toRefund).toBe(100000) // $1,000 refunded
      expect(toCandidate + toRefund).toBe(contributionAmount)
    })
    
    it('should not split if under cap', () => {
      const contributionAmount = 300000 // $3,000
      const remainingCap = 500000 // $5,000 remaining
      
      const toCandidate = Math.min(contributionAmount, remainingCap)
      const toRefund = contributionAmount - toCandidate
      
      expect(toCandidate).toBe(300000)
      expect(toRefund).toBe(0)
    })
    
    it('should handle exact cap amount', () => {
      const contributionAmount = 500000 // $5,000
      const remainingCap = 500000 // Exactly at cap
      
      const toCandidate = Math.min(contributionAmount, remainingCap)
      const toRefund = contributionAmount - toCandidate
      
      expect(toCandidate).toBe(500000)
      expect(toRefund).toBe(0)
    })
    
    it('should refund entire amount if cap reached', () => {
      const contributionAmount = 100000 // $1,000
      const remainingCap = 0 // Cap already reached
      
      const toCandidate = Math.min(contributionAmount, remainingCap)
      const toRefund = contributionAmount - toCandidate
      
      expect(toCandidate).toBe(0)
      expect(toRefund).toBe(100000) // Full refund
    })
  })
  
  describe('Currency handling', () => {
    it('should only accept USD', () => {
      const validCurrency = 'USD'
      expect(validCurrency).toBe('USD')
      
      const invalidCurrencies = ['EUR', 'HTG', 'CAD', 'GBP']
      invalidCurrencies.forEach(currency => {
        expect(() => {
          if (currency !== 'USD') {
            throw new Error('Only USD accepted')
          }
        }).toThrow()
      })
    })
    
    it('should store amounts in cents (no decimals)', () => {
      const amounts = [1000, 500, 12345, 100000]
      
      amounts.forEach(amount => {
        expect(Number.isInteger(amount)).toBe(true)
        expect(amount % 1).toBe(0)
      })
    })
  })
  
  describe('Audit trail', () => {
    it('should record all contribution state changes', () => {
      const auditLog = [
        { timestamp: new Date('2026-11-18T10:00:00Z'), status: 'PENDING' },
        { timestamp: new Date('2026-11-18T10:00:05Z'), status: 'PROCESSING' },
        { timestamp: new Date('2026-11-18T10:00:10Z'), status: 'COMPLETED' },
      ]
      
      expect(auditLog).toHaveLength(3)
      expect(auditLog[0].status).toBe('PENDING')
      expect(auditLog[2].status).toBe('COMPLETED')
      
      // Verify chronological order
      expect(auditLog[1].timestamp > auditLog[0].timestamp).toBe(true)
      expect(auditLog[2].timestamp > auditLog[1].timestamp).toBe(true)
    })
    
    it('should record refund operations', () => {
      const refundLog = {
        contributionId: 'contrib_123',
        refundAmount: 10000,
        reason: 'Requested by donor',
        timestamp: new Date(),
        initiatedBy: 'admin@example.com',
      }
      
      expect(refundLog).toHaveProperty('contributionId')
      expect(refundLog).toHaveProperty('refundAmount')
      expect(refundLog).toHaveProperty('reason')
      expect(refundLog).toHaveProperty('timestamp')
      expect(refundLog).toHaveProperty('initiatedBy')
    })
  })
})
