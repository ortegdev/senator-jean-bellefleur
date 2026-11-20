/**
 * Integration Tests: Ledger Balance After Refunds and Disputes
 * 
 * Verifies that ledger stays balanced after:
 * - Full refunds
 * - Partial refunds
 * - Chargebacks
 * - Mixed scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import { 
  recordDonation, 
  recordRefund, 
  recordChargeback,
  calculateBalanceSheet,
  verifyLedgerIntegrity,
} from '@/lib/payments/ledger'

describe('Ledger Balance After Refunds and Disputes', () => {
  beforeEach(async () => {
    // Clear test data
    await prisma.ledgerEntry.deleteMany()
    await prisma.contribution.deleteMany()
  })

  describe('Full Refunds', () => {
    it('maintains balance after full refund', async () => {
      // Record donation: $50 with $1.75 fee
      await recordDonation({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        complianceCheckId: 'check_1',
        attestationVersionId: 'attest_1',
        grossAmountCents: 5000,
        processingFeeCents: 175,
      })

      // Check balance before refund
      const balanceBefore = await calculateBalanceSheet()
      expect(balanceBefore.grossDonationsCents).toBe(5000)
      expect(balanceBefore.processingFeesCents).toBe(175)
      expect(balanceBefore.netDonationsCents).toBe(4825)
      expect(balanceBefore.refundsCents).toBe(0)

      // Record full refund
      await recordRefund({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        refundAmountCents: 5000,
        feeReturnedCents: 0, // Processor doesn't refund fees
        reason: 'requested_by_customer',
      })

      // Check balance after refund
      const balanceAfter = await calculateBalanceSheet()
      expect(balanceAfter.grossDonationsCents).toBe(0) // 5000 - 5000
      expect(balanceAfter.processingFeesCents).toBe(175) // Fee not refunded
      expect(balanceAfter.netDonationsCents).toBe(4825) // Unchanged
      expect(balanceAfter.refundsCents).toBe(5000)
      expect(balanceAfter.availableBalanceCents).toBe(-175) // Net - refunds = 4825 - 5000

      // Verify ledger integrity
      const integrity = await verifyLedgerIntegrity()
      expect(integrity.valid).toBe(true)
      expect(integrity.errors).toHaveLength(0)
    })

    it('maintains balance with fee refunded', async () => {
      // Record donation
      await recordDonation({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        complianceCheckId: 'check_1',
        attestationVersionId: 'attest_1',
        grossAmountCents: 5000,
        processingFeeCents: 175,
      })

      // Record refund with fee returned
      await recordRefund({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        refundAmountCents: 5000,
        feeReturnedCents: 175, // Processor refunds fee
        reason: 'requested_by_customer',
      })

      const balance = await calculateBalanceSheet()
      expect(balance.grossDonationsCents).toBe(0)
      expect(balance.processingFeesCents).toBe(0) // 175 - 175
      expect(balance.refundsCents).toBe(5000)
      expect(balance.availableBalanceCents).toBe(-175) // Net (4825) - refund (5000)

      const integrity = await verifyLedgerIntegrity()
      expect(integrity.valid).toBe(true)
    })
  })

  describe('Partial Refunds', () => {
    it('maintains balance after partial refund', async () => {
      // Record donation: $50
      await recordDonation({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        complianceCheckId: 'check_1',
        attestationVersionId: 'attest_1',
        grossAmountCents: 5000,
        processingFeeCents: 175,
      })

      // Record partial refund: $20
      await recordRefund({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        refundAmountCents: 2000,
        feeReturnedCents: 0,
        reason: 'partial_refund',
      })

      const balance = await calculateBalanceSheet()
      expect(balance.grossDonationsCents).toBe(3000) // 5000 - 2000
      expect(balance.processingFeesCents).toBe(175)
      expect(balance.netDonationsCents).toBe(4825)
      expect(balance.refundsCents).toBe(2000)
      expect(balance.availableBalanceCents).toBe(2825) // 4825 - 2000

      const integrity = await verifyLedgerIntegrity()
      expect(integrity.valid).toBe(true)
    })

    it('maintains balance with multiple partial refunds', async () => {
      // Record donation: $100
      await recordDonation({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        complianceCheckId: 'check_1',
        attestationVersionId: 'attest_1',
        grossAmountCents: 10000,
        processingFeeCents: 320,
      })

      // First partial refund: $30
      await recordRefund({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        refundAmountCents: 3000,
        feeReturnedCents: 0,
        reason: 'partial_refund_1',
      })

      // Second partial refund: $20
      await recordRefund({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        refundAmountCents: 2000,
        feeReturnedCents: 0,
        reason: 'partial_refund_2',
      })

      const balance = await calculateBalanceSheet()
      expect(balance.grossDonationsCents).toBe(5000) // 10000 - 3000 - 2000
      expect(balance.refundsCents).toBe(5000) // 3000 + 2000
      expect(balance.availableBalanceCents).toBe(4680) // 9680 - 5000

      const integrity = await verifyLedgerIntegrity()
      expect(integrity.valid).toBe(true)
    })
  })

  describe('Chargebacks', () => {
    it('maintains balance after chargeback', async () => {
      // Record donation: $50
      await recordDonation({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        complianceCheckId: 'check_1',
        attestationVersionId: 'attest_1',
        grossAmountCents: 5000,
        processingFeeCents: 175,
      })

      // Record chargeback with $15 fee
      await recordChargeback({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        chargebackAmountCents: 5000,
        chargebackFeeCents: 1500,
        reason: 'fraudulent',
      })

      const balance = await calculateBalanceSheet()
      expect(balance.grossDonationsCents).toBe(0) // 5000 - 5000
      expect(balance.processingFeesCents).toBe(1675) // 175 + 1500
      expect(balance.chargebacksCents).toBe(5000)
      expect(balance.availableBalanceCents).toBe(-1675) // 4825 - 5000 - 1500

      const integrity = await verifyLedgerIntegrity()
      expect(integrity.valid).toBe(true)
    })
  })

  describe('Mixed Scenarios', () => {
    it('maintains balance with multiple donations, refunds, and chargebacks', async () => {
      // Donation 1: $50
      await recordDonation({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        complianceCheckId: 'check_1',
        attestationVersionId: 'attest_1',
        grossAmountCents: 5000,
        processingFeeCents: 175,
      })

      // Donation 2: $100
      await recordDonation({
        contributionId: 'contrib_2',
        paymentIntentId: 'pi_2',
        complianceCheckId: 'check_2',
        attestationVersionId: 'attest_1',
        grossAmountCents: 10000,
        processingFeeCents: 320,
      })

      // Donation 3: $25
      await recordDonation({
        contributionId: 'contrib_3',
        paymentIntentId: 'pi_3',
        complianceCheckId: 'check_3',
        attestationVersionId: 'attest_1',
        grossAmountCents: 2500,
        processingFeeCents: 103,
      })

      // Refund donation 1 (full)
      await recordRefund({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        refundAmountCents: 5000,
        feeReturnedCents: 0,
        reason: 'requested_by_customer',
      })

      // Partial refund donation 2 ($30)
      await recordRefund({
        contributionId: 'contrib_2',
        paymentIntentId: 'pi_2',
        refundAmountCents: 3000,
        feeReturnedCents: 0,
        reason: 'partial_refund',
      })

      // Chargeback on donation 3
      await recordChargeback({
        contributionId: 'contrib_3',
        paymentIntentId: 'pi_3',
        chargebackAmountCents: 2500,
        chargebackFeeCents: 1500,
        reason: 'fraudulent',
      })

      const balance = await calculateBalanceSheet()
      
      // Gross: 5000 + 10000 + 2500 - 5000 (refund) - 3000 (refund) - 2500 (chargeback) = 7000
      expect(balance.grossDonationsCents).toBe(7000)
      
      // Fees: 175 + 320 + 103 + 1500 (chargeback fee) = 2098
      expect(balance.processingFeesCents).toBe(2098)
      
      // Net: (5000 - 175) + (10000 - 320) + (2500 - 103) = 14902
      expect(balance.netDonationsCents).toBe(14902)
      
      // Refunds: 5000 + 3000 = 8000
      expect(balance.refundsCents).toBe(8000)
      
      // Chargebacks: 2500
      expect(balance.chargebacksCents).toBe(2500)
      
      // Available: 14902 - 8000 - 2500 = 4402
      expect(balance.availableBalanceCents).toBe(4402)

      // Verify ledger integrity
      const integrity = await verifyLedgerIntegrity()
      expect(integrity.valid).toBe(true)
      expect(integrity.errors).toHaveLength(0)
    })

    it('handles edge case: chargeback after partial refund', async () => {
      // Donation: $100
      await recordDonation({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        complianceCheckId: 'check_1',
        attestationVersionId: 'attest_1',
        grossAmountCents: 10000,
        processingFeeCents: 320,
      })

      // Partial refund: $30
      await recordRefund({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        refundAmountCents: 3000,
        feeReturnedCents: 0,
        reason: 'partial_refund',
      })

      // Chargeback for remaining amount: $70
      await recordChargeback({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        chargebackAmountCents: 7000,
        chargebackFeeCents: 1500,
        reason: 'fraudulent',
      })

      const balance = await calculateBalanceSheet()
      
      // Gross: 10000 - 3000 (refund) - 7000 (chargeback) = 0
      expect(balance.grossDonationsCents).toBe(0)
      
      // Available should be negative (lost money on this one)
      expect(balance.availableBalanceCents).toBeLessThan(0)

      // But ledger should still be balanced
      const integrity = await verifyLedgerIntegrity()
      expect(integrity.valid).toBe(true)
    })
  })

  describe('Ledger Integrity', () => {
    it('total debits always equal total credits', async () => {
      // Create various transactions
      await recordDonation({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        complianceCheckId: 'check_1',
        attestationVersionId: 'attest_1',
        grossAmountCents: 5000,
        processingFeeCents: 175,
      })

      await recordRefund({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        refundAmountCents: 2000,
        feeReturnedCents: 0,
        reason: 'partial',
      })

      await recordChargeback({
        contributionId: 'contrib_1',
        paymentIntentId: 'pi_1',
        chargebackAmountCents: 1000,
        chargebackFeeCents: 1500,
        reason: 'dispute',
      })

      // Get all entries
      const entries = await prisma.ledgerEntry.findMany()
      
      const totalDebits = entries.reduce((sum, e) => sum + e.debitCents, 0)
      const totalCredits = entries.reduce((sum, e) => sum + e.creditCents, 0)

      // Debits must equal credits (double-entry accounting)
      expect(totalDebits).toBe(totalCredits)
    })
  })
})
