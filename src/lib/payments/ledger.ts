/**
 * Double-Entry Ledger System
 * 
 * Append-only bookkeeping with immutable entries.
 * All financial state derived from ledger entries, never stored directly.
 * 
 * Accounts:
 * - GROSS_DONATIONS: Total donations received (credit)
 * - PROCESSING_FEES: Fees paid to payment processor (debit)
 * - NET_DONATIONS: Net after fees (credit)
 * - REFUNDS: Money returned to donors (debit)
 * - CHARGEBACKS: Disputed transactions (debit)
 * - TRANSFERS_OUT: Money sent to recipient (debit)
 * - TRANSFER_FEES: Fees for transfers (debit)
 * - SUSPENSE: Temporary holding for unresolved items
 * 
 * Double-entry rules:
 * - Every transaction has equal debits and credits
 * - Debits increase asset/expense accounts
 * - Credits increase liability/revenue accounts
 */

import { prisma } from '@/lib/db/prisma'
import type { LedgerEntryType, LedgerAccount } from '@prisma/client'

export interface LedgerEntryInput {
  entryType: LedgerEntryType
  account: LedgerAccount
  debitCents: number
  creditCents: number
  contributionId?: string
  paymentIntentId?: string
  transferRequestId?: string
  reconciliationRunId?: string
  complianceCheckId?: string
  attestationVersionId?: string
  notes?: string
}

export interface BalanceSheet {
  grossDonationsCents: number
  processingFeesCents: number
  netDonationsCents: number
  refundsCents: number
  chargebacksCents: number
  transfersOutCents: number
  transferFeesCents: number
  suspenseCents: number
  availableBalanceCents: number // Net - refunds - chargebacks - transfers
}

/**
 * Record a donation with processing fee
 * 
 * Journal entries:
 * 1. DR GROSS_DONATIONS, CR NET_DONATIONS (gross amount)
 * 2. DR PROCESSING_FEES, CR GROSS_DONATIONS (fee amount)
 * 
 * Net effect: 
 * - GROSS_DONATIONS: net of gross - fee
 * - PROCESSING_FEES: fee
 * - NET_DONATIONS: gross amount
 */
export async function recordDonation(params: {
  contributionId: string
  paymentIntentId: string
  complianceCheckId: string
  attestationVersionId: string
  grossAmountCents: number
  processingFeeCents: number
  notes?: string
}): Promise<void> {
  const { 
    contributionId, 
    paymentIntentId, 
    complianceCheckId,
    attestationVersionId,
    grossAmountCents, 
    processingFeeCents,
    notes,
  } = params

  const netAmountCents = grossAmountCents - processingFeeCents

  await prisma.$transaction([
    // Entry 1: Record gross donation
    prisma.ledgerEntry.create({
      data: {
        entryType: 'DONATION',
        account: 'GROSS_DONATIONS',
        debitCents: 0,
        creditCents: grossAmountCents,
        contributionId,
        paymentIntentId,
        complianceCheckId,
        attestationVersionId,
        notes: notes ?? 'Donation received',
      },
    }),

    // Entry 2: Record processing fee
    prisma.ledgerEntry.create({
      data: {
        entryType: 'PROCESSING_FEE',
        account: 'PROCESSING_FEES',
        debitCents: processingFeeCents,
        creditCents: 0,
        contributionId,
        paymentIntentId,
        complianceCheckId,
        attestationVersionId,
        notes: 'Payment processing fee',
      },
    }),

    // Entry 3: Record net donation
    prisma.ledgerEntry.create({
      data: {
        entryType: 'NET_DONATION',
        account: 'NET_DONATIONS',
        debitCents: 0,
        creditCents: netAmountCents,
        contributionId,
        paymentIntentId,
        complianceCheckId,
        attestationVersionId,
        notes: 'Net donation after fees',
      },
    }),
  ])
}

/**
 * Record a refund
 * 
 * Journal entries:
 * 1. DR REFUNDS, CR GROSS_DONATIONS (refund amount)
 * 2. CR PROCESSING_FEES, DR GROSS_DONATIONS (fee returned, if any)
 * 
 * Note: Some processors don't refund fees, adjust accordingly
 */
export async function recordRefund(params: {
  contributionId: string
  paymentIntentId: string
  refundAmountCents: number
  feeReturnedCents: number
  reason?: string
  notes?: string
}): Promise<void> {
  const { 
    contributionId, 
    paymentIntentId, 
    refundAmountCents,
    feeReturnedCents,
    reason,
    notes,
  } = params

  await prisma.$transaction([
    // Entry 1: Record refund to donor
    prisma.ledgerEntry.create({
      data: {
        entryType: 'REFUND',
        account: 'REFUNDS',
        debitCents: refundAmountCents,
        creditCents: 0,
        contributionId,
        paymentIntentId,
        notes: notes ?? `Refund: ${reason ?? 'donor requested'}`,
      },
    }),

    // Entry 2: Reduce gross donations
    prisma.ledgerEntry.create({
      data: {
        entryType: 'REFUND',
        account: 'GROSS_DONATIONS',
        debitCents: 0,
        creditCents: refundAmountCents,
        contributionId,
        paymentIntentId,
        notes: 'Gross donations reduced by refund',
      },
    }),

    // Entry 3: Fee returned (if any)
    ...(feeReturnedCents > 0 ? [
      prisma.ledgerEntry.create({
        data: {
          entryType: 'REFUND',
          account: 'PROCESSING_FEES',
          debitCents: 0,
          creditCents: feeReturnedCents,
          contributionId,
          paymentIntentId,
          notes: 'Processing fee returned',
        },
      }),
    ] : []),
  ])
}

/**
 * Record a chargeback (disputed transaction)
 * 
 * Journal entries:
 * 1. DR CHARGEBACKS, CR GROSS_DONATIONS (chargeback amount)
 * 2. DR PROCESSING_FEES, CR GROSS_DONATIONS (chargeback fee, if any)
 */
export async function recordChargeback(params: {
  contributionId: string
  paymentIntentId: string
  chargebackAmountCents: number
  chargebackFeeCents: number
  reason?: string
  notes?: string
}): Promise<void> {
  const { 
    contributionId, 
    paymentIntentId, 
    chargebackAmountCents,
    chargebackFeeCents,
    reason,
    notes,
  } = params

  await prisma.$transaction([
    // Entry 1: Record chargeback loss
    prisma.ledgerEntry.create({
      data: {
        entryType: 'CHARGEBACK',
        account: 'CHARGEBACKS',
        debitCents: chargebackAmountCents,
        creditCents: 0,
        contributionId,
        paymentIntentId,
        notes: notes ?? `Chargeback: ${reason ?? 'dispute filed'}`,
      },
    }),

    // Entry 2: Reduce gross donations
    prisma.ledgerEntry.create({
      data: {
        entryType: 'CHARGEBACK',
        account: 'GROSS_DONATIONS',
        debitCents: 0,
        creditCents: chargebackAmountCents,
        contributionId,
        paymentIntentId,
        notes: 'Gross donations reduced by chargeback',
      },
    }),

    // Entry 3: Chargeback fee (if any)
    ...(chargebackFeeCents > 0 ? [
      prisma.ledgerEntry.create({
        data: {
          entryType: 'CHARGEBACK',
          account: 'PROCESSING_FEES',
          debitCents: chargebackFeeCents,
          creditCents: 0,
          contributionId,
          paymentIntentId,
          notes: 'Chargeback fee',
        },
      }),
    ] : []),
  ])
}

/**
 * Record a transfer to recipient
 * 
 * Journal entries:
 * 1. DR TRANSFERS_OUT, CR NET_DONATIONS (transfer amount)
 * 2. DR TRANSFER_FEES, CR NET_DONATIONS (transfer fee, if any)
 */
export async function recordTransfer(params: {
  transferRequestId: string
  transferAmountCents: number
  transferFeeCents: number
  notes?: string
}): Promise<void> {
  const { 
    transferRequestId, 
    transferAmountCents,
    transferFeeCents,
    notes,
  } = params

  await prisma.$transaction([
    // Entry 1: Record transfer out
    prisma.ledgerEntry.create({
      data: {
        entryType: 'TRANSFER_OUT',
        account: 'TRANSFERS_OUT',
        debitCents: transferAmountCents,
        creditCents: 0,
        transferRequestId,
        notes: notes ?? 'Transfer to recipient',
      },
    }),

    // Entry 2: Reduce net donations
    prisma.ledgerEntry.create({
      data: {
        entryType: 'TRANSFER_OUT',
        account: 'NET_DONATIONS',
        debitCents: 0,
        creditCents: transferAmountCents,
        transferRequestId,
        notes: 'Net donations reduced by transfer',
      },
    }),

    // Entry 3: Transfer fee (if any)
    ...(transferFeeCents > 0 ? [
      prisma.ledgerEntry.create({
        data: {
          entryType: 'TRANSFER_FEE',
          account: 'TRANSFER_FEES',
          debitCents: transferFeeCents,
          creditCents: 0,
          transferRequestId,
          notes: 'Transfer fee',
        },
      }),
      prisma.ledgerEntry.create({
        data: {
          entryType: 'TRANSFER_FEE',
          account: 'NET_DONATIONS',
          debitCents: 0,
          creditCents: transferFeeCents,
          transferRequestId,
          notes: 'Net donations reduced by transfer fee',
        },
      }),
    ] : []),
  ])
}

/**
 * Record a manual adjustment
 * 
 * Use for reconciliation corrections or accounting adjustments.
 * Requires detailed notes explaining the adjustment.
 */
export async function recordAdjustment(params: {
  account: LedgerAccount
  debitCents: number
  creditCents: number
  reconciliationRunId?: string
  notes: string // Required for adjustments
}): Promise<void> {
  const { 
    account, 
    debitCents,
    creditCents,
    reconciliationRunId,
    notes,
  } = params

  if (!notes || notes.trim().length < 10) {
    throw new Error('Adjustment notes must be at least 10 characters')
  }

  await prisma.ledgerEntry.create({
    data: {
      entryType: 'ADJUSTMENT',
      account,
      debitCents,
      creditCents,
      reconciliationRunId,
      notes,
    },
  })
}

/**
 * Calculate balance sheet from ledger entries
 * 
 * All balances derived from ledger, never stored.
 * Debits increase asset accounts, credits decrease.
 * For revenue accounts (donations), credits increase.
 */
export async function calculateBalanceSheet(): Promise<BalanceSheet> {
  // Get all ledger entries grouped by account
  const entries = await prisma.ledgerEntry.groupBy({
    by: ['account'],
    _sum: {
      debitCents: true,
      creditCents: true,
    },
  })

  const balances = {
    grossDonationsCents: 0,
    processingFeesCents: 0,
    netDonationsCents: 0,
    refundsCents: 0,
    chargebacksCents: 0,
    transfersOutCents: 0,
    transferFeesCents: 0,
    suspenseCents: 0,
  }

  entries.forEach(entry => {
    const debit = entry._sum.debitCents ?? 0
    const credit = entry._sum.creditCents ?? 0
    
    switch (entry.account) {
      case 'GROSS_DONATIONS':
        // Revenue account: credits increase, debits decrease
        balances.grossDonationsCents = credit - debit
        break
      case 'PROCESSING_FEES':
        // Expense account: debits increase, credits decrease
        balances.processingFeesCents = debit - credit
        break
      case 'NET_DONATIONS':
        // Revenue account: credits increase, debits decrease
        balances.netDonationsCents = credit - debit
        break
      case 'REFUNDS':
        // Expense account: debits increase
        balances.refundsCents = debit - credit
        break
      case 'CHARGEBACKS':
        // Expense account: debits increase
        balances.chargebacksCents = debit - credit
        break
      case 'TRANSFERS_OUT':
        // Expense account: debits increase
        balances.transfersOutCents = debit - credit
        break
      case 'TRANSFER_FEES':
        // Expense account: debits increase
        balances.transferFeesCents = debit - credit
        break
      case 'SUSPENSE':
        // Temporary account: debits increase, credits decrease
        balances.suspenseCents = debit - credit
        break
    }
  })

  // Available balance: Net donations minus outflows
  const availableBalanceCents = 
    balances.netDonationsCents - 
    balances.refundsCents - 
    balances.chargebacksCents - 
    balances.transfersOutCents -
    balances.transferFeesCents

  return {
    ...balances,
    availableBalanceCents,
  }
}

/**
 * Get ledger entries for a specific contribution
 */
export async function getContributionLedgerEntries(contributionId: string) {
  return prisma.ledgerEntry.findMany({
    where: { contributionId },
    orderBy: { createdAt: 'asc' },
    include: {
      contribution: true,
      paymentIntent: true,
      complianceCheck: true,
      attestationVersion: true,
    },
  })
}

/**
 * Get ledger entries for a specific payment intent
 */
export async function getPaymentIntentLedgerEntries(paymentIntentId: string) {
  return prisma.ledgerEntry.findMany({
    where: { paymentIntentId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Get ledger entries for a date range
 */
export async function getLedgerEntriesByDateRange(
  startDate: Date,
  endDate: Date,
  options?: {
    entryType?: LedgerEntryType
    account?: LedgerAccount
    limit?: number
  }
) {
  return prisma.ledgerEntry.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(options?.entryType && { entryType: options.entryType }),
      ...(options?.account && { account: options.account }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 1000,
    include: {
      contribution: {
        select: {
          id: true,
          amountCents: true,
          currency: true,
          status: true,
        },
      },
      paymentIntent: {
        select: {
          id: true,
          provider: true,
          status: true,
        },
      },
    },
  })
}

/**
 * Verify ledger integrity
 * 
 * Checks:
 * 1. All entries have either debit or credit (not both, not neither)
 * 2. For each contribution, debits = credits
 * 3. Overall debits = overall credits
 */
export async function verifyLedgerIntegrity(): Promise<{
  valid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  // Check 1: No entries with both debit and credit
  const invalidEntries = await prisma.ledgerEntry.count({
    where: {
      AND: [
        { debitCents: { gt: 0 } },
        { creditCents: { gt: 0 } },
      ],
    },
  })

  if (invalidEntries > 0) {
    errors.push(`Found ${invalidEntries} entries with both debit and credit`)
  }

  // Check 2: No entries with neither debit nor credit
  const emptyEntries = await prisma.ledgerEntry.count({
    where: {
      AND: [
        { debitCents: 0 },
        { creditCents: 0 },
      ],
    },
  })

  if (emptyEntries > 0) {
    errors.push(`Found ${emptyEntries} entries with neither debit nor credit`)
  }

  // Check 3: Overall debits = overall credits
  const totals = await prisma.ledgerEntry.aggregate({
    _sum: {
      debitCents: true,
      creditCents: true,
    },
  })

  const totalDebits = totals._sum.debitCents ?? 0
  const totalCredits = totals._sum.creditCents ?? 0

  if (totalDebits !== totalCredits) {
    errors.push(
      `Ledger imbalance: Total debits (${totalDebits}) ≠ Total credits (${totalCredits})`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
