/**
 * Integration tests for payment flows using mock provider
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import { createTestContribution, cleanupTestData } from './helpers'

describe('Payment Flows (Mock Provider)', () => {
  beforeEach(async () => {
    // Ensure we're using test mode
    expect(process.env.STRIPE_PUBLISHABLE_KEY).toContain('_test_')
    expect(process.env.NODE_ENV).toBe('test')
  })
  
  afterEach(async () => {
    await cleanupTestData()
  })
  
  describe('Successful payment flow', () => {
    it('should process payment from start to finish', async () => {
      // Step 1: Create contribution
      const contribution = await createTestContribution({
        amountCents: 10000,
        email: 'success@test.com',
        country: 'US',
      })
      
      expect(contribution.id).toBeDefined()
      expect(contribution.status).toBe('PENDING')
      expect(contribution.amountCents).toBe(10000)
      
      // Step 2: Create payment intent
      const paymentIntent = await createPaymentIntent({
        contributionId: contribution.id,
        amountCents: 10000,
      })
      
      expect(paymentIntent.id).toBeDefined()
      expect(paymentIntent.status).toBe('requires_payment_method')
      expect(paymentIntent.amount).toBe(10000)
      
      // Step 3: Confirm payment (mock success)
      const confirmed = await confirmPayment({
        paymentIntentId: paymentIntent.id,
        paymentMethodId: 'pm_card_visa',
      })
      
      expect(confirmed.status).toBe('succeeded')
      
      // Step 4: Verify contribution updated
      const updated = await prisma.contribution.findUnique({
        where: { id: contribution.id },
      })
      
      expect(updated?.status).toBe('COMPLETED')
      expect(updated?.paymentIntentId).toBe(paymentIntent.id)
      expect(updated?.completedAt).toBeDefined()
      
      // Step 5: Verify receipt generated
      const receipt = await prisma.receipt.findFirst({
        where: { contributionId: contribution.id },
      })
      
      expect(receipt).toBeDefined()
      expect(receipt?.amountCents).toBe(10000)
      expect(receipt?.pdfUrl).toBeDefined()
    })
    
    it('should handle 3D Secure authentication', async () => {
      const contribution = await createTestContribution({
        amountCents: 15000,
        email: '3dsecure@test.com',
        country: 'FR', // European card likely to require 3DS
      })
      
      const paymentIntent = await createPaymentIntent({
        contributionId: contribution.id,
        amountCents: 15000,
      })
      
      // Confirm with 3DS card (test card that requires authentication)
      const confirmed = await confirmPayment({
        paymentIntentId: paymentIntent.id,
        paymentMethodId: 'pm_card_threeDSecure2Required',
      })
      
      // Should initially require action
      expect(confirmed.status).toBe('requires_action')
      expect(confirmed.nextAction?.type).toBe('redirect_to_url')
      
      // Simulate successful 3DS authentication
      const authenticated = await complete3DSAuthentication({
        paymentIntentId: paymentIntent.id,
      })
      
      expect(authenticated.status).toBe('succeeded')
      
      // Verify contribution completed
      const updated = await prisma.contribution.findUnique({
        where: { id: contribution.id },
      })
      
      expect(updated?.status).toBe('COMPLETED')
    })
  })
  
  describe('Declined payment flow', () => {
    it('should handle declined card', async () => {
      const contribution = await createTestContribution({
        amountCents: 5000,
        email: 'decline@test.com',
        country: 'US',
      })
      
      const paymentIntent = await createPaymentIntent({
        contributionId: contribution.id,
        amountCents: 5000,
      })
      
      // Use test card that declines
      const result = await confirmPayment({
        paymentIntentId: paymentIntent.id,
        paymentMethodId: 'pm_card_chargeDeclined',
      })
      
      expect(result.status).toBe('requires_payment_method')
      expect(result.lastPaymentError?.code).toBe('card_declined')
      
      // Verify contribution still pending (user can retry)
      const updated = await prisma.contribution.findUnique({
        where: { id: contribution.id },
      })
      
      expect(updated?.status).toBe('PENDING')
      expect(updated?.completedAt).toBeNull()
      
      // Verify no receipt generated
      const receipt = await prisma.receipt.findFirst({
        where: { contributionId: contribution.id },
      })
      
      expect(receipt).toBeNull()
    })
    
    it('should handle insufficient funds', async () => {
      const contribution = await createTestContribution({
        amountCents: 10000,
        email: 'insufficient@test.com',
        country: 'US',
      })
      
      const paymentIntent = await createPaymentIntent({
        contributionId: contribution.id,
        amountCents: 10000,
      })
      
      const result = await confirmPayment({
        paymentIntentId: paymentIntent.id,
        paymentMethodId: 'pm_card_chargeDeclinedInsufficientFunds',
      })
      
      expect(result.status).toBe('requires_payment_method')
      expect(result.lastPaymentError?.code).toBe('card_declined')
      expect(result.lastPaymentError?.decline_code).toBe('insufficient_funds')
    })
    
    it('should mark contribution as failed after max retries', async () => {
      const contribution = await createTestContribution({
        amountCents: 5000,
        email: 'maxretries@test.com',
        country: 'US',
      })
      
      const paymentIntent = await createPaymentIntent({
        contributionId: contribution.id,
        amountCents: 5000,
      })
      
      // Attempt 3 times with declining card
      for (let i = 0; i < 3; i++) {
        await confirmPayment({
          paymentIntentId: paymentIntent.id,
          paymentMethodId: 'pm_card_chargeDeclined',
        })
      }
      
      // After max retries, mark as failed
      await markContributionFailed({
        contributionId: contribution.id,
        reason: 'Max retry attempts exceeded',
      })
      
      const updated = await prisma.contribution.findUnique({
        where: { id: contribution.id },
      })
      
      expect(updated?.status).toBe('FAILED')
    })
  })
  
  describe('Cap splitting', () => {
    it('should split contribution at cap and refund excess', async () => {
      // Simulate user approaching cap
      await createCompletedContribution({
        email: 'capsplit@test.com',
        amountCents: 480000, // $4,800 already contributed
      })
      
      // User tries to contribute $500 more (would exceed $5,000 cap)
      const contribution = await createTestContribution({
        amountCents: 50000, // $500
        email: 'capsplit@test.com',
        country: 'US',
      })
      
      // Calculate remaining cap
      const totalContributed = await getTotalContributed('capsplit@test.com')
      const cap = 500000 // $5,000
      const remaining = cap - totalContributed
      
      expect(remaining).toBe(20000) // $200 remaining
      
      // Process payment for full amount
      const paymentIntent = await createPaymentIntent({
        contributionId: contribution.id,
        amountCents: 50000,
      })
      
      const confirmed = await confirmPayment({
        paymentIntentId: paymentIntent.id,
        paymentMethodId: 'pm_card_visa',
      })
      
      expect(confirmed.status).toBe('succeeded')
      
      // Apply cap splitting
      await applyCapSplitting({
        contributionId: contribution.id,
        totalCharged: 50000,
        capRemaining: remaining,
      })
      
      // Verify contribution split
      const updated = await prisma.contribution.findUnique({
        where: { id: contribution.id },
      })
      
      expect(updated?.amountCents).toBe(20000) // Only $200 accepted
      expect(updated?.refundAmountCents).toBe(30000) // $300 refunded
      expect(updated?.status).toBe('COMPLETED')
      
      // Verify refund processed
      const refund = await prisma.refund.findFirst({
        where: { contributionId: contribution.id },
      })
      
      expect(refund).toBeDefined()
      expect(refund?.amountCents).toBe(30000)
      expect(refund?.reason).toContain('cap')
    })
    
    it('should reject contribution if cap already reached', async () => {
      // User already at cap
      await createCompletedContribution({
        email: 'atcap@test.com',
        amountCents: 500000, // $5,000 already contributed
      })
      
      // Try to contribute more
      const contribution = await createTestContribution({
        amountCents: 5000,
        email: 'atcap@test.com',
        country: 'US',
      })
      
      // Check cap before creating payment intent
      const totalContributed = await getTotalContributed('atcap@test.com')
      const cap = 500000
      
      expect(totalContributed).toBeGreaterThanOrEqual(cap)
      
      // Should reject immediately
      expect(() => createPaymentIntent({
        contributionId: contribution.id,
        amountCents: 5000,
      })).rejects.toThrow(/cap reached/i)
    })
  })
  
  describe('Out-of-range amounts', () => {
    it('should reject amount below minimum', async () => {
      expect(() => createTestContribution({
        amountCents: 400, // $4, below $5 minimum
        email: 'belowmin@test.com',
        country: 'US',
      })).rejects.toThrow(/minimum/i)
    })
    
    it('should reject amount above maximum', async () => {
      expect(() => createTestContribution({
        amountCents: 1000000, // $10,000, above max
        email: 'abovemax@test.com',
        country: 'US',
      })).rejects.toThrow(/maximum/i)
    })
    
    it('should accept minimum valid amount', async () => {
      const contribution = await createTestContribution({
        amountCents: 500, // $5.00 exactly
        email: 'minimum@test.com',
        country: 'US',
      })
      
      expect(contribution.amountCents).toBe(500)
    })
    
    it('should accept maximum valid amount', async () => {
      const contribution = await createTestContribution({
        amountCents: 500000, // $5,000 exactly
        email: 'maximum@test.com',
        country: 'US',
      })
      
      expect(contribution.amountCents).toBe(500000)
    })
  })
  
  describe('Webhook handling', () => {
    it('should process payment_intent.succeeded webhook', async () => {
      const contribution = await createTestContribution({
        amountCents: 10000,
        email: 'webhook@test.com',
        country: 'US',
      })
      
      const paymentIntent = await createPaymentIntent({
        contributionId: contribution.id,
        amountCents: 10000,
      })
      
      // Simulate webhook
      const webhook = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentIntent.id,
            amount: 10000,
            status: 'succeeded',
            metadata: {
              contributionId: contribution.id,
            },
          },
        },
      }
      
      await handleWebhook(webhook)
      
      // Verify contribution updated
      const updated = await prisma.contribution.findUnique({
        where: { id: contribution.id },
      })
      
      expect(updated?.status).toBe('COMPLETED')
    })
    
    it('should process payment_intent.payment_failed webhook', async () => {
      const contribution = await createTestContribution({
        amountCents: 5000,
        email: 'webhookfail@test.com',
        country: 'US',
      })
      
      const paymentIntent = await createPaymentIntent({
        contributionId: contribution.id,
        amountCents: 5000,
      })
      
      // Simulate failure webhook
      const webhook = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: paymentIntent.id,
            amount: 5000,
            status: 'requires_payment_method',
            last_payment_error: {
              code: 'card_declined',
              message: 'Your card was declined',
            },
            metadata: {
              contributionId: contribution.id,
            },
          },
        },
      }
      
      await handleWebhook(webhook)
      
      // Verify contribution still pending (user can retry)
      const updated = await prisma.contribution.findUnique({
        where: { id: contribution.id },
      })
      
      expect(updated?.status).toBe('PENDING')
      expect(updated?.errorMessage).toContain('declined')
    })
  })
  
  describe('Idempotency', () => {
    it('should handle duplicate webhook deliveries', async () => {
      const contribution = await createTestContribution({
        amountCents: 10000,
        email: 'idempotent@test.com',
        country: 'US',
      })
      
      const paymentIntent = await createPaymentIntent({
        contributionId: contribution.id,
        amountCents: 10000,
      })
      
      const webhook = {
        id: 'evt_123abc',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentIntent.id,
            status: 'succeeded',
            metadata: { contributionId: contribution.id },
          },
        },
      }
      
      // Process webhook twice
      await handleWebhook(webhook)
      await handleWebhook(webhook)
      
      // Should only update once
      const receipts = await prisma.receipt.findMany({
        where: { contributionId: contribution.id },
      })
      
      expect(receipts).toHaveLength(1) // Only one receipt generated
    })
  })
})
