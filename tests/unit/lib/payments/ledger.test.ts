/**
 * Tests for Double-Entry Ledger System
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import {
  recordDonation,
  recordRefund,
  recordChargeback,
  recordTransfer,
  recordAdjustment,
  calculateBalanceSheet,
  verifyLedgerIntegrity,
  getContributionLedgerEntries,
} from '@/lib/payments/ledger'

// Mock prisma
vitest.mock('@/lib/db/prisma', () => ({
  prisma: {
    ledgerEntry: {
      create: vitest.fn(),
      findMany: vitest.fn(),
      groupBy: vitest.fn(),
      count: vitest.fn(),
      aggregate: vitest.fn(),
    },
    $transaction: vitest.fn((callback) => callback(prisma)),
  },
}))

describe('Ledger System', () => {
  beforeEach(() => {
    vitest.clearAllMocks()
  })

  describe('recordDonation', () => {
    it('creates three ledger entries for a donation', async () => {
      const params = {
        contributionId: 'contrib_123',
        paymentIntentId: 'pi_123',
        complianceCheckId: 'check_123',
        attestationVersionId: 'attest_123',
        grossAmountCents: 5000,
        processingFeeCents: 175, // 2.9% + 30¢ = $1.75
      }

      await recordDonation(params)

      // Should create 3 entries
      expect(prisma.ledgerEntry.create).toHaveBeenCalledTimes(3)

      // Entry 1: Gross donation (credit)
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          entryType: 'DONATION',
          account: 'GROSS_DONATIONS',
          debitCents: 0,
          creditCents: 5000,
          contributionId: 'contrib_123',
          paymentIntentId: 'pi_123',
        }),
      })

      // Entry 2: Processing fee (debit)
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          entryType: 'PROCESSING_FEE',
          account: 'PROCESSING_FEES',
          debitCents: 175,
          creditCents: 0,
        }),
      })

      // Entry 3: Net donation (credit)
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(3, {
        data: expect.objectContaining({
          entryType: 'NET_DONATION',
          account: 'NET_DONATIONS',
          debitCents: 0,
          creditCents: 4825, // 5000 - 175
        }),
      })
    })
  })

  describe('recordRefund', () => {
    it('creates refund ledger entries', async () => {
      const params = {
        contributionId: 'contrib_123',
        paymentIntentId: 'pi_123',
        refundAmountCents: 5000,
        feeReturnedCents: 0,
        reason: 'requested_by_customer',
      }

      await recordRefund(params)

      // Should create at least 2 entries (refund + gross reduction)
      expect(prisma.ledgerEntry.create).toHaveBeenCalledTimes(2)

      // Entry 1: Refund (debit)
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          entryType: 'REFUND',
          account: 'REFUNDS',
          debitCents: 5000,
          creditCents: 0,
        }),
      })

      // Entry 2: Reduce gross donations (credit)
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          entryType: 'REFUND',
          account: 'GROSS_DONATIONS',
          debitCents: 0,
          creditCents: 5000,
        }),
      })
    })

    it('includes fee return entry if fee returned', async () => {
      const params = {
        contributionId: 'contrib_123',
        paymentIntentId: 'pi_123',
        refundAmountCents: 5000,
        feeReturnedCents: 175,
        reason: 'requested_by_customer',
      }

      await recordRefund(params)

      // Should create 3 entries
      expect(prisma.ledgerEntry.create).toHaveBeenCalledTimes(3)

      // Third entry: Fee returned (credit)
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(3, {
        data: expect.objectContaining({
          entryType: 'REFUND',
          account: 'PROCESSING_FEES',
          debitCents: 0,
          creditCents: 175,
        }),
      })
    })
  })

  describe('recordChargeback', () => {
    it('creates chargeback ledger entries', async () => {
      const params = {
        contributionId: 'contrib_123',
        paymentIntentId: 'pi_123',
        chargebackAmountCents: 5000,
        chargebackFeeCents: 1500, // $15 chargeback fee
        reason: 'fraudulent',
      }

      await recordChargeback(params)

      // Should create at least 2 entries
      expect(prisma.ledgerEntry.create).toHaveBeenCalledTimes(3)

      // Entry 1: Chargeback loss (debit)
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          entryType: 'CHARGEBACK',
          account: 'CHARGEBACKS',
          debitCents: 5000,
          creditCents: 0,
        }),
      })

      // Entry 2: Reduce gross donations
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          entryType: 'CHARGEBACK',
          account: 'GROSS_DONATIONS',
          debitCents: 0,
          creditCents: 5000,
        }),
      })

      // Entry 3: Chargeback fee
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(3, {
        data: expect.objectContaining({
          entryType: 'CHARGEBACK',
          account: 'PROCESSING_FEES',
          debitCents: 1500,
          creditCents: 0,
        }),
      })
    })
  })

  describe('recordTransfer', () => {
    it('creates transfer ledger entries', async () => {
      const params = {
        transferRequestId: 'transfer_123',
        transferAmountCents: 10000,
        transferFeeCents: 0,
      }

      await recordTransfer(params)

      // Should create 2 entries
      expect(prisma.ledgerEntry.create).toHaveBeenCalledTimes(2)

      // Entry 1: Transfer out (debit)
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          entryType: 'TRANSFER_OUT',
          account: 'TRANSFERS_OUT',
          debitCents: 10000,
          creditCents: 0,
          transferRequestId: 'transfer_123',
        }),
      })

      // Entry 2: Reduce net donations
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          entryType: 'TRANSFER_OUT',
          account: 'NET_DONATIONS',
          debitCents: 0,
          creditCents: 10000,
        }),
      })
    })

    it('includes transfer fee entries if fee charged', async () => {
      const params = {
        transferRequestId: 'transfer_123',
        transferAmountCents: 10000,
        transferFeeCents: 250,
      }

      await recordTransfer(params)

      // Should create 4 entries
      expect(prisma.ledgerEntry.create).toHaveBeenCalledTimes(4)

      // Entry 3: Transfer fee (debit)
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(3, {
        data: expect.objectContaining({
          entryType: 'TRANSFER_FEE',
          account: 'TRANSFER_FEES',
          debitCents: 250,
          creditCents: 0,
        }),
      })

      // Entry 4: Reduce net donations by fee
      expect(prisma.ledgerEntry.create).toHaveBeenNthCalledWith(4, {
        data: expect.objectContaining({
          entryType: 'TRANSFER_FEE',
          account: 'NET_DONATIONS',
          debitCents: 0,
          creditCents: 250,
        }),
      })
    })
  })

  describe('recordAdjustment', () => {
    it('creates adjustment entry with notes', async () => {
      const params = {
        account: 'SUSPENSE' as const,
        debitCents: 100,
        creditCents: 0,
        notes: 'Reconciliation adjustment for missing transaction',
      }

      await recordAdjustment(params)

      expect(prisma.ledgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entryType: 'ADJUSTMENT',
          account: 'SUSPENSE',
          debitCents: 100,
          creditCents: 0,
          notes: 'Reconciliation adjustment for missing transaction',
        }),
      })
    })

    it('throws error if notes are too short', async () => {
      const params = {
        account: 'SUSPENSE' as const,
        debitCents: 100,
        creditCents: 0,
        notes: 'Short',
      }

      await expect(recordAdjustment(params)).rejects.toThrow(
        'Adjustment notes must be at least 10 characters'
      )
    })
  })

  describe('calculateBalanceSheet', () => {
    it('calculates balances from ledger entries', async () => {
      // Mock grouped entries
      ;(prisma.ledgerEntry.groupBy as any).mockResolvedValue([
        {
          account: 'GROSS_DONATIONS',
          _sum: { debitCents: 0, creditCents: 50000 },
        },
        {
          account: 'PROCESSING_FEES',
          _sum: { debitCents: 1750, creditCents: 0 },
        },
        {
          account: 'NET_DONATIONS',
          _sum: { debitCents: 0, creditCents: 48250 },
        },
        {
          account: 'REFUNDS',
          _sum: { debitCents: 5000, creditCents: 0 },
        },
        {
          account: 'TRANSFERS_OUT',
          _sum: { debitCents: 10000, creditCents: 0 },
        },
      ])

      const balanceSheet = await calculateBalanceSheet()

      expect(balanceSheet.grossDonationsCents).toBe(50000)
      expect(balanceSheet.processingFeesCents).toBe(1750)
      expect(balanceSheet.netDonationsCents).toBe(48250)
      expect(balanceSheet.refundsCents).toBe(5000)
      expect(balanceSheet.transfersOutCents).toBe(10000)
      
      // Available = Net - Refunds - Transfers
      expect(balanceSheet.availableBalanceCents).toBe(33250) // 48250 - 5000 - 10000
    })

    it('handles empty ledger', async () => {
      ;(prisma.ledgerEntry.groupBy as any).mockResolvedValue([])

      const balanceSheet = await calculateBalanceSheet()

      expect(balanceSheet.grossDonationsCents).toBe(0)
      expect(balanceSheet.netDonationsCents).toBe(0)
      expect(balanceSheet.availableBalanceCents).toBe(0)
    })
  })

  describe('verifyLedgerIntegrity', () => {
    it('passes when ledger is balanced', async () => {
      // Mock counts
      ;(prisma.ledgerEntry.count as any).mockResolvedValue(0)

      // Mock totals (balanced)
      ;(prisma.ledgerEntry.aggregate as any).mockResolvedValue({
        _sum: {
          debitCents: 10000,
          creditCents: 10000,
        },
      })

      const result = await verifyLedgerIntegrity()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('fails when debits do not equal credits', async () => {
      ;(prisma.ledgerEntry.count as any).mockResolvedValue(0)

      ;(prisma.ledgerEntry.aggregate as any).mockResolvedValue({
        _sum: {
          debitCents: 10000,
          creditCents: 9500, // Imbalance
        },
      })

      const result = await verifyLedgerIntegrity()

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Ledger imbalance: Total debits (10000) ≠ Total credits (9500)'
      )
    })

    it('fails when entries have both debit and credit', async () => {
      // Mock invalid entries
      ;(prisma.ledgerEntry.count as any)
        .mockResolvedValueOnce(5) // Invalid entries with both
        .mockResolvedValueOnce(0) // Empty entries

      ;(prisma.ledgerEntry.aggregate as any).mockResolvedValue({
        _sum: { debitCents: 10000, creditCents: 10000 },
      })

      const result = await verifyLedgerIntegrity()

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Found 5 entries with both debit and credit'
      )
    })
  })

  describe('getContributionLedgerEntries', () => {
    it('returns all ledger entries for a contribution', async () => {
      const mockEntries = [
        {
          id: 'entry_1',
          entryType: 'DONATION',
          account: 'GROSS_DONATIONS',
          creditCents: 5000,
          debitCents: 0,
          createdAt: new Date(),
        },
        {
          id: 'entry_2',
          entryType: 'PROCESSING_FEE',
          account: 'PROCESSING_FEES',
          debitCents: 175,
          creditCents: 0,
          createdAt: new Date(),
        },
      ]

      ;(prisma.ledgerEntry.findMany as any).mockResolvedValue(mockEntries)

      const entries = await getContributionLedgerEntries('contrib_123')

      expect(prisma.ledgerEntry.findMany).toHaveBeenCalledWith({
        where: { contributionId: 'contrib_123' },
        orderBy: { createdAt: 'asc' },
        include: expect.any(Object),
      })

      expect(entries).toEqual(mockEntries)
    })
  })
})
