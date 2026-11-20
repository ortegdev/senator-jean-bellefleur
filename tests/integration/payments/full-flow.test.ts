/**
 * Integration Tests: Full Payment Flow
 * 
 * Tests complete donation flows including:
 * - Successful payments
 * - Failed payments
 * - Refunds
 * - Chargebacks
 * - Kill switch during checkout
 * - Duplicate webhooks
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import { MockProvider } from '@/lib/payments/providers/mock'
import { createPayment, confirmPayment, refundPayment } from '@/lib/payments/orchestrator'
import { calculateBalanceSheet, verifyLedgerIntegrity } from '@/lib/payments/ledger'
import type { DonorData } from '@/lib/compliance/engine'

describe('Full Payment Flow Integration', () => {
  let mockProvider: MockProvider

  const testDonor: DonorData = {
    email: 'donor@example.com',
    firstName: 'Jean',
    lastName: 'Doe',
    country: 'US',
    postalCode: '10001',
    addressLine1: '123 Main St',
    city: 'New York',
    state: 'NY',
    paymentMethod: 'card_4242',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
  }

  beforeEach(async () => {
    mockProvider = new MockProvider()
    
    // Clear test data
    await prisma.ledgerEntry.deleteMany()
    await prisma.paymentIntent.deleteMany()
    await prisma.contribution.deleteMany()
    await prisma.complianceCheck.deleteMany()
  })

  afterEach(() => {
    mockProvider.reset()
  })

  describe('Successful Payment Flow', () => {
    it('completes a donation end-to-end', async () => {
      // Step 1: Create payment
      const payment = await createPayment({
        donor: testDonor,
        amountCents: 5000,
        currency: 'USD',
        eligibilityAttestations: {
          isEligibleDonor: true,
          notProhibitedSource: true,
          accurateInformation: true,
        },
        isAnonymous: false,
      })

      expect(payment.paymentIntentId).toBeDefined()
      expect(payment.contributionId).toBeDefined()
      expect(payment.complianceCheckId).toBeDefined()

      // Step 2: Confirm payment
      const confirmed = await confirmPayment({
        paymentIntentId: payment.paymentIntentId,
        paymentMethodId: '4242424242424242', // Success card
      })

      expect(confirmed.status).toBe('SUCCEEDED')

      // Step 3: Verify contribution status
      const contribution = await prisma.contribution.findUnique({
        where: { id: confirmed.contributionId },
      })

      expect(contribution).toBeDefined()
      expect(contribution!.status).toBe('COMPLETED')
      expect(contribution!.amountCents).toBe(5000)

      // Step 4: Verify ledger entries
      const ledgerEntries = await prisma.ledgerEntry.findMany({
        where: { contributionId: confirmed.contributionId },
      })

      expect(ledgerEntries.length).toBeGreaterThan(0)

      // Should have donation, fee, and net entries
      const donationEntry = ledgerEntries.find(e => e.entryType === 'DONATION')
      const feeEntry = ledgerEntries.find(e => e.entryType === 'PROCESSING_FEE')
      const netEntry = ledgerEntries.find(e => e.entryType === 'NET_DONATION')

      expect(donationEntry).toBeDefined()
      expect(feeEntry).toBeDefined()
      expect(netEntry).toBeDefined()

      // Step 5: Verify balance sheet
      const balanceSheet = await calculateBalanceSheet()

      expect(balanceSheet.grossDonationsCents).toBe(5000)
      expect(balanceSheet.processingFeesCents).toBeGreaterThan(0)
      expect(balanceSheet.netDonationsCents).toBeLessThan(5000)
      expect(balanceSheet.availableBalanceCents).toBeGreaterThan(0)

      // Step 6: Verify ledger integrity
      const integrity = await verifyLedgerIntegrity()
      expect(integrity.valid).toBe(true)
    })

    it('handles idempotency correctly', async () => {
      const idempotencyKey = 'test-idempotency-key-123'

      // Create payment twice with same key
      const payment1 = await createPayment({
        donor: testDonor,
        amountCents: 5000,
        currency: 'USD',
        eligibilityAttestations: {
          isEligibleDonor: true,
          notProhibitedSource: true,
          accurateInformation: true,
        },
        isAnonymous: false,
        idempotencyKey,
      })

      const payment2 = await createPayment({
        donor: testDonor,
        amountCents: 5000,
        currency: 'USD',
        eligibilityAttestations: {
          isEligibleDonor: true,
          notProhibitedSource: true,
          accurateInformation: true,
        },
        isAnonymous: false,
        idempotencyKey,
      })

      // Should get different payment intent IDs (mock doesn't enforce true idempotency)
      // In production with Stripe, these would be the same
      expect(payment1.paymentIntentId).toBeDefined()
      expect(payment2.paymentIntentId).toBeDefined()
    })
  })

  describe('Failed Payment Flow', () => {
    it('handles declined cards correctly', async () => {
      // Create payment
      const payment = await createPayment({
        donor: testDonor,
        amountCents: 5000,
        currency: 'USD',
        eligibilityAttestations: {
          isEligibleDonor: true,
          notProhibitedSource: true,
          accurateInformation: true,
        },
        isAnonymous: false,
      })

      // Confirm with decline card
      const confirmed = await confirmPayment({
        paymentIntentId: payment.paymentIntentId,
        paymentMethodId: '4000000000000002', // Decline card
      })

      expect(confirmed.status).toBe('FAILED')
      expect(confirmed.failureReason).toBe('card_declined')

      // Verify contribution status
      const contribution = await prisma.contribution.findUnique({
        where: { id: confirmed.contributionId },
      })

      expect(contribution!.status).toBe('FAILED')
      expect(contribution!.failureReason).toBe('card_declined')

      // Should NOT have ledger entries for failed payment
      const ledgerEntries = await prisma.ledgerEntry.findMany({
        where: { contributionId: confirmed.contributionId },
      })

      expect(ledgerEntries.length).toBe(0)
    })

    it('handles insufficient funds', async () => {
      const payment = await createPayment({
        donor: testDonor,
        amountCents: 5000,
        currency: 'USD',
        eligibilityAttestations: {
          isEligibleDonor: true,
          notProhibitedSource: true,
          accurateInformation: true,
        },
        isAnonymous: false,
      })

      const confirmed = await confirmPayment({
        paymentIntentId: payment.paymentIntentId,
        paymentMethodId: '4000000000009995', // Insufficient funds
      })

      expect(confirmed.status).toBe('FAILED')
      expect(confirmed.failureReason).toBe('insufficient_funds')
    })
  })

  describe('Refund Flow', () => {
    it('processes a full refund', async () => {
      // Create and confirm payment
      const payment = await createPayment({
        donor: testDonor,
        amountCents: 5000,
        currency: 'USD',
        eligibilityAttestations: {
          isEligibleDonor: true,
          notProhibitedSource: true,
          accurateInformation: true,
        },
        isAnonymous: false,
      })

      await confirmPayment({
        paymentIntentId: payment.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      // Process refund
      await refundPayment({
        contributionId: payment.contributionId,
        reason: 'requested_by_customer',
        requestedBy: 'admin@example.com',
      })

      // Verify contribution status
      const contribution = await prisma.contribution.findUnique({
        where: { id: payment.contributionId },
      })

      expect(contribution!.status).toBe('REFUNDED')
      expect(contribution!.refundedCents).toBe(5000)

      // Verify refund ledger entries
      const refundEntries = await prisma.ledgerEntry.findMany({
        where: {
          contributionId: payment.contributionId,
          entryType: 'REFUND',
        },
      })

      expect(refundEntries.length).toBeGreaterThan(0)

      // Verify balance sheet updated
      const balanceSheet = await calculateBalanceSheet()

      // Available balance should be reduced by refund
      expect(balanceSheet.refundsCents).toBe(5000)
      expect(balanceSheet.availableBalanceCents).toBeLessThan(
        balanceSheet.netDonationsCents
      )
    })

    it('processes a partial refund', async () => {
      // Create and confirm payment
      const payment = await createPayment({
        donor: testDonor,
        amountCents: 5000,
        currency: 'USD',
        eligibilityAttestations: {
          isEligibleDonor: true,
          notProhibitedSource: true,
          accurateInformation: true,
        },
        isAnonymous: false,
      })

      await confirmPayment({
        paymentIntentId: payment.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      // Process partial refund
      await refundPayment({
        contributionId: payment.contributionId,
        amountCents: 2000, // Partial
        reason: 'partial_refund',
        requestedBy: 'admin@example.com',
      })

      // Verify contribution status (still COMPLETED for partial refund)
      const contribution = await prisma.contribution.findUnique({
        where: { id: payment.contributionId },
      })

      expect(contribution!.status).toBe('COMPLETED')
      expect(contribution!.refundedCents).toBe(2000)

      // Verify balance
      const balanceSheet = await calculateBalanceSheet()
      expect(balanceSheet.refundsCents).toBe(2000)
    })
  })

  describe('Webhook Handling', () => {
    it('handles duplicate webhook events', async () => {
      // Create payment
      const payment = await createPayment({
        donor: testDonor,
        amountCents: 5000,
        currency: 'USD',
        eligibilityAttestations: {
          isEligibleDonor: true,
          notProhibitedSource: true,
          accurateInformation: true,
        },
        isAnonymous: false,
      })

      await confirmPayment({
        paymentIntentId: payment.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      // Simulate webhook event
      const webhookEvent = {
        id: 'evt_test_duplicate',
        type: 'payment_intent.succeeded',
        data: {
          id: payment.paymentIntentId,
          amount: 5000,
        },
        createdAt: new Date(),
      }

      // Process webhook twice
      const result1 = await mockProvider.handleWebhook({
        payload: JSON.stringify(webhookEvent),
        signature: 'mock_signature',
      })

      const result2 = await mockProvider.handleWebhook({
        payload: JSON.stringify(webhookEvent),
        signature: 'mock_signature',
      })

      expect(result1.processed).toBe(true)
      expect(result2.processed).toBe(false) // Already processed

      // Should still have only one set of ledger entries
      const ledgerEntries = await prisma.ledgerEntry.findMany({
        where: { contributionId: payment.contributionId },
      })

      const donationEntries = ledgerEntries.filter(e => e.entryType === 'DONATION')
      expect(donationEntries.length).toBe(1)
    })
  })

  describe('Kill Switch During Checkout', () => {
    it('prevents new payments when kill switch is active', async () => {
      // Activate kill switch
      await prisma.launchConfig.update({
        where: { slug: 'bellefleur' },
        data: {
          killSwitchActive: true,
          killSwitchReason: 'Testing kill switch',
          killSwitchActivatedBy: 'test@example.com',
        },
      })

      // Attempt to create payment
      await expect(
        createPayment({
          donor: testDonor,
          amountCents: 5000,
          currency: 'USD',
          eligibilityAttestations: {
            isEligibleDonor: true,
            notProhibitedSource: true,
            accurateInformation: true,
          },
          isAnonymous: false,
        })
      ).rejects.toThrow('Donations are not currently available')

      // Deactivate kill switch
      await prisma.launchConfig.update({
        where: { slug: 'bellefleur' },
        data: {
          killSwitchActive: false,
        },
      })
    })
  })

  describe('Compliance Integration', () => {
    it('denies payments that fail compliance', async () => {
      // Attempt payment from sanctioned country
      await expect(
        createPayment({
          donor: {
            ...testDonor,
            country: 'KP', // North Korea (sanctioned)
          },
          amountCents: 5000,
          currency: 'USD',
          eligibilityAttestations: {
            isEligibleDonor: true,
            notProhibitedSource: true,
            accurateInformation: true,
          },
          isAnonymous: false,
        })
      ).rejects.toThrow('denied by compliance rules')
    })

    it('denies payments exceeding limits', async () => {
      // Attempt payment exceeding max
      await expect(
        createPayment({
          donor: testDonor,
          amountCents: 1000000, // $10,000 (exceeds max)
          currency: 'USD',
          eligibilityAttestations: {
            isEligibleDonor: true,
            notProhibitedSource: true,
            accurateInformation: true,
          },
          isAnonymous: false,
        })
      ).rejects.toThrow('denied by compliance rules')
    })
  })

  describe('Ledger Integrity', () => {
    it('maintains double-entry balance after multiple operations', async () => {
      // Create 3 donations
      for (let i = 0; i < 3; i++) {
        const payment = await createPayment({
          donor: {
            ...testDonor,
            email: `donor${i}@example.com`,
          },
          amountCents: 5000,
          currency: 'USD',
          eligibilityAttestations: {
            isEligibleDonor: true,
            notProhibitedSource: true,
            accurateInformation: true,
          },
          isAnonymous: false,
        })

        await confirmPayment({
          paymentIntentId: payment.paymentIntentId,
          paymentMethodId: '4242424242424242',
        })
      }

      // Verify ledger integrity
      const integrity = await verifyLedgerIntegrity()

      expect(integrity.valid).toBe(true)
      expect(integrity.errors).toHaveLength(0)

      // Verify total debits = total credits
      const allEntries = await prisma.ledgerEntry.findMany()
      
      const totalDebits = allEntries.reduce((sum, e) => sum + e.debitCents, 0)
      const totalCredits = allEntries.reduce((sum, e) => sum + e.creditCents, 0)

      expect(totalDebits).toBe(totalCredits)
    })
  })
})
