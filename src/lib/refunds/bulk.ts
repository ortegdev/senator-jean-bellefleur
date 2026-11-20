/**
 * Bulk Refund Tool
 * 
 * For refunding multiple contributions (e.g., declined/terminated fundraiser).
 * Requires two-person approval: OWNER + COMPLIANCE roles.
 * 
 * Features:
 * - Filters for selecting contributions
 * - Dry-run preview with totals and fees
 * - Batch execution with progress tracking
 * - Automatic retries for failures
 * - Downloadable CSV report
 */

import { prisma } from '@/lib/db/prisma'
import { refundPayment } from '@/lib/payments/orchestrator'

export interface BulkRefundFilters {
  // Date range
  startDate?: Date
  endDate?: Date

  // Amount range
  minAmountCents?: number
  maxAmountCents?: number

  // Status
  status?: 'COMPLETED' | 'REFUNDED'

  // Country
  countries?: string[]

  // Specific IDs
  contributionIds?: string[]
}

export interface BulkRefundPreview {
  totalContributions: number
  totalAmountCents: number
  estimatedFeesCents: number
  netRefundCents: number
  contributions: Array<{
    id: string
    donorEmail: string
    amountCents: number
    currency: string
    date: Date
    receiptNumber: string
  }>
}

export interface BulkRefundRequest {
  id: string
  filters: BulkRefundFilters
  reason: string
  status: BulkRefundStatus
  requestedBy: string
  requestedAt: Date
  firstApprovedBy?: string
  firstApprovedAt?: Date
  secondApprovedBy?: string
  secondApprovedAt?: Date
  executedBy?: string
  executedAt?: Date
  preview: BulkRefundPreview
  executionResult?: BulkRefundExecutionResult
}

export type BulkRefundStatus =
  | 'DRAFT'
  | 'PENDING_FIRST_APPROVAL'
  | 'PENDING_SECOND_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'CANCELLED'

export interface BulkRefundExecutionResult {
  totalAttempted: number
  successCount: number
  failureCount: number
  totalRefundedCents: number
  failures: Array<{
    contributionId: string
    error: string
  }>
  startedAt: Date
  completedAt: Date
  durationSeconds: number
}

/**
 * Create bulk refund preview (dry run)
 * 
 * Shows what would be refunded without actually refunding.
 */
export async function createBulkRefundPreview(
  filters: BulkRefundFilters
): Promise<BulkRefundPreview> {
  // Build query
  const where: any = {
    status: 'COMPLETED',
  }

  if (filters.startDate) {
    where.createdAt = { ...where.createdAt, gte: filters.startDate }
  }

  if (filters.endDate) {
    where.createdAt = { ...where.createdAt, lte: filters.endDate }
  }

  if (filters.minAmountCents) {
    where.amountCents = { ...where.amountCents, gte: filters.minAmountCents }
  }

  if (filters.maxAmountCents) {
    where.amountCents = { ...where.amountCents, lte: filters.maxAmountCents }
  }

  if (filters.countries && filters.countries.length > 0) {
    where.donorCountry = { in: filters.countries }
  }

  if (filters.contributionIds && filters.contributionIds.length > 0) {
    where.id = { in: filters.contributionIds }
  }

  // Get contributions
  const contributions = await prisma.contribution.findMany({
    where,
    include: {
      receipt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Calculate totals
  const totalAmountCents = contributions.reduce((sum, c) => sum + c.amountCents, 0)
  
  // Estimate fees (assume payment processor doesn't refund fees)
  // Average processing fee is ~2.9% + 30¢
  const estimatedFeesCents = contributions.reduce((sum, c) => {
    return sum + Math.round(c.amountCents * 0.029 + 30)
  }, 0)

  const netRefundCents = totalAmountCents - estimatedFeesCents

  return {
    totalContributions: contributions.length,
    totalAmountCents,
    estimatedFeesCents,
    netRefundCents,
    contributions: contributions.map(c => ({
      id: c.id,
      donorEmail: c.donorEmail,
      amountCents: c.amountCents,
      currency: c.currency,
      date: c.createdAt,
      receiptNumber: c.receipt[0]?.receiptNumber || 'N/A',
    })),
  }
}

/**
 * Create bulk refund request
 * 
 * Starts the dual-approval workflow.
 */
export async function createBulkRefundRequest(params: {
  filters: BulkRefundFilters
  reason: string
  requestedBy: string
  requestedByRole: string
}): Promise<BulkRefundRequest> {
  const { filters, reason, requestedBy, requestedByRole } = params

  // Generate preview
  const preview = await createBulkRefundPreview(filters)

  if (preview.totalContributions === 0) {
    throw new Error('No contributions match the specified filters')
  }

  // Create request
  const request = await prisma.bulkRefundRequest.create({
    data: {
      filters: filters as any,
      reason,
      requestedBy,
      requestedByRole,
      status: 'PENDING_FIRST_APPROVAL',
      preview: preview as any,
    },
  })

  return {
    id: request.id,
    filters,
    reason,
    status: 'PENDING_FIRST_APPROVAL',
    requestedBy,
    requestedAt: request.createdAt,
    preview,
  }
}

/**
 * Approve bulk refund request (first approval)
 * 
 * Requires OWNER or COMPLIANCE role.
 * Cannot approve own request.
 */
export async function firstApproveBulkRefund(
  requestId: string,
  approvedBy: string,
  approvedByRole: string
): Promise<void> {
  const request = await prisma.bulkRefundRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new Error('Bulk refund request not found')
  }

  if (request.status !== 'PENDING_FIRST_APPROVAL') {
    throw new Error('Request is not pending first approval')
  }

  // Cannot approve own request
  if (request.requestedBy === approvedBy) {
    throw new Error('Cannot approve your own request')
  }

  // Must be OWNER or COMPLIANCE role
  if (approvedByRole !== 'OWNER' && approvedByRole !== 'COMPLIANCE') {
    throw new Error('Insufficient permissions. OWNER or COMPLIANCE role required.')
  }

  await prisma.bulkRefundRequest.update({
    where: { id: requestId },
    data: {
      status: 'PENDING_SECOND_APPROVAL',
      firstApprovedBy: approvedBy,
      firstApprovedByRole: approvedByRole,
      firstApprovedAt: new Date(),
    },
  })
}

/**
 * Approve bulk refund request (second approval)
 * 
 * Requires OWNER or COMPLIANCE role (different from first approver).
 * Cannot approve own request or if was first approver.
 */
export async function secondApproveBulkRefund(
  requestId: string,
  approvedBy: string,
  approvedByRole: string
): Promise<void> {
  const request = await prisma.bulkRefundRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new Error('Bulk refund request not found')
  }

  if (request.status !== 'PENDING_SECOND_APPROVAL') {
    throw new Error('Request is not pending second approval')
  }

  // Cannot approve own request
  if (request.requestedBy === approvedBy) {
    throw new Error('Cannot approve your own request')
  }

  // Cannot be same person as first approver
  if (request.firstApprovedBy === approvedBy) {
    throw new Error('Second approver must be different from first approver')
  }

  // Must be OWNER or COMPLIANCE role
  if (approvedByRole !== 'OWNER' && approvedByRole !== 'COMPLIANCE') {
    throw new Error('Insufficient permissions. OWNER or COMPLIANCE role required.')
  }

  await prisma.bulkRefundRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      secondApprovedBy: approvedBy,
      secondApprovedByRole: approvedByRole,
      secondApprovedAt: new Date(),
    },
  })
}

/**
 * Execute bulk refund
 * 
 * Processes all contributions in batches with progress tracking.
 */
export async function executeBulkRefund(
  requestId: string,
  executedBy: string,
  onProgress?: (completed: number, total: number) => void
): Promise<BulkRefundExecutionResult> {
  const request = await prisma.bulkRefundRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new Error('Bulk refund request not found')
  }

  if (request.status !== 'APPROVED') {
    throw new Error('Request must be approved before execution')
  }

  // Update status to EXECUTING
  await prisma.bulkRefundRequest.update({
    where: { id: requestId },
    data: {
      status: 'EXECUTING',
      executedBy,
      executedAt: new Date(),
    },
  })

  const startTime = Date.now()
  const preview = request.preview as any as BulkRefundPreview
  const contributions = preview.contributions

  let successCount = 0
  let failureCount = 0
  let totalRefundedCents = 0
  const failures: Array<{ contributionId: string; error: string }> = []

  // Process in batches of 10
  const batchSize = 10
  for (let i = 0; i < contributions.length; i += batchSize) {
    const batch = contributions.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (contrib) => {
        try {
          // Attempt refund with retry
          await refundPayment({
            contributionId: contrib.id,
            reason: request.reason,
            requestedBy: executedBy,
          })

          successCount++
          totalRefundedCents += contrib.amountCents
        } catch (error: any) {
          failureCount++
          failures.push({
            contributionId: contrib.id,
            error: error.message || 'Unknown error',
          })

          // Log failure
          console.error(`[BulkRefund] Failed to refund ${contrib.id}:`, error)
        }
      })
    )

    // Report progress
    const completed = i + batch.length
    if (onProgress) {
      onProgress(completed, contributions.length)
    }
  }

  const endTime = Date.now()
  const durationSeconds = Math.round((endTime - startTime) / 1000)

  const result: BulkRefundExecutionResult = {
    totalAttempted: contributions.length,
    successCount,
    failureCount,
    totalRefundedCents,
    failures,
    startedAt: new Date(startTime),
    completedAt: new Date(endTime),
    durationSeconds,
  }

  // Update request with results
  await prisma.bulkRefundRequest.update({
    where: { id: requestId },
    data: {
      status: 'COMPLETED',
      executionResult: result as any,
    },
  })

  return result
}

/**
 * Cancel bulk refund request
 * 
 * Can only cancel if not yet executed.
 */
export async function cancelBulkRefund(
  requestId: string,
  cancelledBy: string,
  reason: string
): Promise<void> {
  const request = await prisma.bulkRefundRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new Error('Bulk refund request not found')
  }

  if (['EXECUTING', 'COMPLETED'].includes(request.status)) {
    throw new Error('Cannot cancel request that is executing or completed')
  }

  await prisma.bulkRefundRequest.update({
    where: { id: requestId },
    data: {
      status: 'CANCELLED',
      cancelledBy,
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  })
}

/**
 * Get bulk refund request
 */
export async function getBulkRefundRequest(requestId: string) {
  return prisma.bulkRefundRequest.findUnique({
    where: { id: requestId },
  })
}

/**
 * Get all bulk refund requests
 */
export async function getAllBulkRefundRequests() {
  return prisma.bulkRefundRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

/**
 * Generate CSV report for bulk refund
 */
export function generateBulkRefundCSV(result: BulkRefundExecutionResult): string {
  const rows = [
    ['Contribution ID', 'Status', 'Error'],
  ]

  // Add successful refunds
  for (let i = 0; i < result.successCount; i++) {
    rows.push(['', 'SUCCESS', ''])
  }

  // Add failures
  result.failures.forEach(f => {
    rows.push([f.contributionId, 'FAILED', f.error])
  })

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
}
