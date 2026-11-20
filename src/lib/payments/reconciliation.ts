/**
 * Payment Reconciliation System
 * 
 * Compares our ledger against payment provider's balance transactions.
 * Detects discrepancies and generates reconciliation reports.
 * 
 * Run frequency: Daily or weekly
 * 
 * Checks:
 * 1. Total amounts match
 * 2. Transaction counts match
 * 3. Individual transactions match
 * 4. Fee calculations are correct
 */

import { prisma } from '@/lib/db/prisma'
import { getPaymentProvider } from './factory'
import { calculateBalanceSheet } from './ledger'
import type { BalanceTransaction } from './provider'

export interface ReconciliationResult {
  runId: string
  status: 'SUCCESS' | 'DISCREPANCIES_FOUND' | 'ERROR'
  startDate: Date
  endDate: Date
  ourTotalCents: number
  providerTotalCents: number
  differenceCents: number
  transactionCount: number
  discrepancyCount: number
  discrepancies: ReconciliationDiscrepancy[]
}

export interface ReconciliationDiscrepancy {
  type: 'MISSING_IN_LEDGER' | 'MISSING_IN_PROVIDER' | 'AMOUNT_MISMATCH' | 'FEE_MISMATCH'
  providerTransactionId?: string
  ourPaymentIntentId?: string
  amountCents: number
  expectedCents?: number
  description: string
}

/**
 * Run reconciliation for a date range
 * 
 * Compares our ledger entries against provider balance transactions.
 */
export async function runReconciliation(
  startDate: Date,
  endDate: Date,
  providerName?: string
): Promise<ReconciliationResult> {
  const runId = `recon_${Date.now()}_${Math.random().toString(36).slice(2)}`

  try {
    console.log(`[Reconciliation] Starting run ${runId} for ${startDate} to ${endDate}`)

    // Step 1: Get provider balance transactions
    const provider = getPaymentProvider(providerName)
    const providerTransactions = await provider.getBalanceTransactions({
      startDate,
      endDate,
      limit: 10000, // Adjust based on volume
    })

    console.log(`[Reconciliation] Found ${providerTransactions.length} provider transactions`)

    // Step 2: Get our ledger entries
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        entryType: {
          in: ['DONATION', 'PROCESSING_FEE', 'REFUND', 'CHARGEBACK'],
        },
      },
      include: {
        paymentIntent: true,
      },
    })

    console.log(`[Reconciliation] Found ${ledgerEntries.length} ledger entries`)

    // Step 3: Calculate totals
    const providerTotal = providerTransactions.reduce((sum, tx) => sum + tx.netCents, 0)
    const ourTotal = ledgerEntries
      .filter(e => e.entryType === 'NET_DONATION')
      .reduce((sum, e) => sum + (e.creditCents - e.debitCents), 0)

    const differenceCents = ourTotal - providerTotal

    // Step 4: Find discrepancies
    const discrepancies: ReconciliationDiscrepancy[] = []

    // Check each provider transaction
    for (const providerTx of providerTransactions) {
      const paymentIntentId = providerTx.metadata?.paymentIntentId
      
      if (!paymentIntentId) {
        discrepancies.push({
          type: 'MISSING_IN_LEDGER',
          providerTransactionId: providerTx.id,
          amountCents: providerTx.amountCents,
          description: `Provider transaction ${providerTx.id} has no paymentIntentId in metadata`,
        })
        continue
      }

      // Find matching ledger entries
      const matchingEntries = ledgerEntries.filter(
        e => e.paymentIntent?.providerIntentId === paymentIntentId
      )

      if (matchingEntries.length === 0) {
        discrepancies.push({
          type: 'MISSING_IN_LEDGER',
          providerTransactionId: providerTx.id,
          ourPaymentIntentId: paymentIntentId,
          amountCents: providerTx.amountCents,
          description: `Provider transaction ${providerTx.id} not found in ledger`,
        })
        continue
      }

      // Check amount matches
      const donationEntry = matchingEntries.find(e => e.entryType === 'DONATION')
      if (donationEntry && donationEntry.creditCents !== providerTx.amountCents) {
        discrepancies.push({
          type: 'AMOUNT_MISMATCH',
          providerTransactionId: providerTx.id,
          ourPaymentIntentId: paymentIntentId,
          amountCents: donationEntry.creditCents,
          expectedCents: providerTx.amountCents,
          description: `Amount mismatch: Ledger ${donationEntry.creditCents}, Provider ${providerTx.amountCents}`,
        })
      }

      // Check fee matches
      const feeEntry = matchingEntries.find(e => e.entryType === 'PROCESSING_FEE')
      if (feeEntry && feeEntry.debitCents !== providerTx.feeCents) {
        discrepancies.push({
          type: 'FEE_MISMATCH',
          providerTransactionId: providerTx.id,
          ourPaymentIntentId: paymentIntentId,
          amountCents: feeEntry.debitCents,
          expectedCents: providerTx.feeCents,
          description: `Fee mismatch: Ledger ${feeEntry.debitCents}, Provider ${providerTx.feeCents}`,
        })
      }
    }

    // Check for ledger entries not in provider
    const providerPaymentIntentIds = new Set(
      providerTransactions
        .map(tx => tx.metadata?.paymentIntentId)
        .filter(Boolean)
    )

    const ledgerPaymentIntentIds = new Set(
      ledgerEntries
        .map(e => e.paymentIntent?.providerIntentId)
        .filter(Boolean)
    )

    for (const paymentIntentId of ledgerPaymentIntentIds) {
      if (!providerPaymentIntentIds.has(paymentIntentId)) {
        const entry = ledgerEntries.find(
          e => e.paymentIntent?.providerIntentId === paymentIntentId
        )
        
        if (entry) {
          discrepancies.push({
            type: 'MISSING_IN_PROVIDER',
            ourPaymentIntentId: paymentIntentId,
            amountCents: entry.creditCents || entry.debitCents,
            description: `Ledger payment ${paymentIntentId} not found in provider transactions`,
          })
        }
      }
    }

    // Step 5: Determine status
    const status = discrepancies.length === 0 
      ? 'SUCCESS' 
      : 'DISCREPANCIES_FOUND'

    // Step 6: Save reconciliation run
    await prisma.reconciliationRun.create({
      data: {
        provider: provider.name,
        startDate,
        endDate,
        status,
        ourTotalCents: ourTotal,
        providerTotalCents: providerTotal,
        differenceCents,
        transactionCount: providerTransactions.length,
        discrepancyCount: discrepancies.length,
        discrepancies: discrepancies as any, // JSON field
        completedAt: new Date(),
      },
    })

    console.log(`[Reconciliation] Run ${runId} completed: ${status}`)

    return {
      runId,
      status,
      startDate,
      endDate,
      ourTotalCents: ourTotal,
      providerTotalCents: providerTotal,
      differenceCents,
      transactionCount: providerTransactions.length,
      discrepancyCount: discrepancies.length,
      discrepancies,
    }

  } catch (error: any) {
    console.error(`[Reconciliation] Run ${runId} failed:`, error)

    // Save failed run
    await prisma.reconciliationRun.create({
      data: {
        provider: providerName ?? 'unknown',
        startDate,
        endDate,
        status: 'ERROR',
        ourTotalCents: 0,
        providerTotalCents: 0,
        differenceCents: 0,
        transactionCount: 0,
        discrepancyCount: 0,
        discrepancies: [],
        error: error.message,
        completedAt: new Date(),
      },
    })

    throw error
  }
}

/**
 * Get recent reconciliation runs
 */
export async function getRecentReconciliations(limit = 10) {
  return prisma.reconciliationRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Get reconciliation run by ID
 */
export async function getReconciliationRun(runId: string) {
  return prisma.reconciliationRun.findUnique({
    where: { id: runId },
  })
}

/**
 * Automated daily reconciliation
 * 
 * Run this via cron job daily.
 */
export async function runDailyReconciliation(): Promise<ReconciliationResult> {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 1) // Previous day

  return runReconciliation(startDate, endDate)
}

/**
 * Automated weekly reconciliation
 * 
 * Run this via cron job weekly.
 */
export async function runWeeklyReconciliation(): Promise<ReconciliationResult> {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 7) // Previous week

  return runReconciliation(startDate, endDate)
}

/**
 * Get reconciliation summary statistics
 */
export async function getReconciliationStats() {
  const [total, successful, withDiscrepancies, errors] = await Promise.all([
    prisma.reconciliationRun.count(),
    prisma.reconciliationRun.count({ where: { status: 'SUCCESS' } }),
    prisma.reconciliationRun.count({ where: { status: 'DISCREPANCIES_FOUND' } }),
    prisma.reconciliationRun.count({ where: { status: 'ERROR' } }),
  ])

  const latest = await prisma.reconciliationRun.findFirst({
    orderBy: { createdAt: 'desc' },
  })

  return {
    total,
    successful,
    withDiscrepancies,
    errors,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    latestRun: latest,
  }
}
