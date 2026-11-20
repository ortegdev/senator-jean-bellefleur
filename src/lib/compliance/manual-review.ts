/**
 * Manual Review Queue
 * 
 * Handles contributions flagged for manual review by compliance engine.
 * COMPLIANCE role can review and make final decisions.
 */

import { prisma } from '@/lib/db/prisma'
import type { ReviewDecision, ComplianceCheck } from '@prisma/client'

export interface ReviewInput {
  checkId: string
  decision: ReviewDecision
  notes: string
  reviewerId: string
  reviewerEmail: string
}

/**
 * Get items pending review
 */
export async function getPendingReviews(): Promise<ComplianceCheck[]> {
  return await prisma.complianceCheck.findMany({
    where: {
      result: 'REVIEW',
      reviewStatus: 'PENDING',
    },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Get items currently in review
 */
export async function getInReviewItems(): Promise<ComplianceCheck[]> {
  return await prisma.complianceCheck.findMany({
    where: {
      result: 'REVIEW',
      reviewStatus: 'IN_REVIEW',
    },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Get resolved reviews
 */
export async function getResolvedReviews(limit: number = 50): Promise<ComplianceCheck[]> {
  return await prisma.complianceCheck.findMany({
    where: {
      result: 'REVIEW',
      reviewStatus: 'RESOLVED',
    },
    orderBy: { reviewedAt: 'desc' },
    take: limit,
  })
}

/**
 * Assign review to a user
 */
export async function assignReview(
  checkId: string,
  assigneeId: string,
  assigneeEmail: string,
  assignerRole: string
): Promise<{ success: boolean; error?: string }> {
  if (assignerRole !== 'COMPLIANCE' && assignerRole !== 'OWNER') {
    return { success: false, error: 'Only COMPLIANCE role can assign reviews' }
  }

  const check = await prisma.complianceCheck.findUnique({
    where: { id: checkId },
  })

  if (!check) {
    return { success: false, error: 'Check not found' }
  }

  if (check.reviewStatus !== 'PENDING') {
    return { success: false, error: 'Check is not pending review' }
  }

  await prisma.complianceCheck.update({
    where: { id: checkId },
    data: {
      reviewStatus: 'IN_REVIEW',
      assignedTo: assigneeId,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'COMPLIANCE_REVIEW_ASSIGNED',
      entityType: 'ComplianceCheck',
      entityId: checkId,
      changes: {
        assignedTo: assigneeEmail,
      },
      userId: assigneeId,
      userEmail: assigneeEmail,
    },
  })

  return { success: true }
}

/**
 * Complete manual review
 */
export async function completeReview(
  input: ReviewInput,
  reviewerRole: string
): Promise<{ success: boolean; error?: string }> {
  if (reviewerRole !== 'COMPLIANCE' && reviewerRole !== 'OWNER') {
    return { success: false, error: 'Only COMPLIANCE role can complete reviews' }
  }

  const check = await prisma.complianceCheck.findUnique({
    where: { id: input.checkId },
  })

  if (!check) {
    return { success: false, error: 'Check not found' }
  }

  if (check.reviewStatus !== 'IN_REVIEW' && check.reviewStatus !== 'PENDING') {
    return { success: false, error: 'Check is not pending or in review' }
  }

  // Update check
  await prisma.complianceCheck.update({
    where: { id: input.checkId },
    data: {
      reviewStatus: 'RESOLVED',
      reviewedBy: input.reviewerId,
      reviewedAt: new Date(),
      reviewDecision: input.decision,
      reviewNotes: input.notes,
    },
  })

  // Handle decision
  if (input.decision === 'APPROVE') {
    // Update result to ALLOW so payment can proceed
    await prisma.complianceCheck.update({
      where: { id: input.checkId },
      data: {
        result: 'ALLOW',
      },
    })
  } else if (input.decision === 'DENY_PERMANENTLY') {
    // Add to blocklist
    await prisma.donorBlocklist.create({
      data: {
        emailNormalized: check.donorEmailNormalized,
        fingerprint: check.donorFingerprint,
        reason: input.notes,
        blockedBy: input.reviewerId,
        blockedByEmail: input.reviewerEmail,
      },
    })
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'COMPLIANCE_REVIEW_COMPLETED',
      entityType: 'ComplianceCheck',
      entityId: input.checkId,
      changes: {
        decision: input.decision,
        reviewedBy: input.reviewerEmail,
      },
      userId: input.reviewerId,
      userEmail: input.reviewerEmail,
      reason: input.notes,
    },
  })

  return { success: true }
}

/**
 * Get review statistics
 */
export async function getReviewStats(): Promise<{
  pending: number
  inReview: number
  resolvedToday: number
  resolvedThisWeek: number
}> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 7)

  const [pending, inReview, resolvedToday, resolvedThisWeek] = await Promise.all([
    prisma.complianceCheck.count({
      where: {
        result: 'REVIEW',
        reviewStatus: 'PENDING',
      },
    }),
    prisma.complianceCheck.count({
      where: {
        result: 'REVIEW',
        reviewStatus: 'IN_REVIEW',
      },
    }),
    prisma.complianceCheck.count({
      where: {
        result: 'REVIEW',
        reviewStatus: 'RESOLVED',
        reviewedAt: { gte: todayStart },
      },
    }),
    prisma.complianceCheck.count({
      where: {
        result: 'REVIEW',
        reviewStatus: 'RESOLVED',
        reviewedAt: { gte: weekStart },
      },
    }),
  ])

  return {
    pending,
    inReview,
    resolvedToday,
    resolvedThisWeek,
  }
}

/**
 * Get donor history
 */
export async function getDonorHistory(emailNormalized: string): Promise<{
  checks: ComplianceCheck[]
  totalAttempts: number
  totalAllowed: number
  totalDenied: number
  totalReview: number
  totalContributed: number
}> {
  const checks = await prisma.complianceCheck.findMany({
    where: {
      donorEmailNormalized: emailNormalized,
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalAttempts = checks.length
  const totalAllowed = checks.filter((c) => c.result === 'ALLOW').length
  const totalDenied = checks.filter((c) => c.result === 'DENY').length
  const totalReview = checks.filter((c) => c.result === 'REVIEW').length
  
  const totalContributed = checks
    .filter((c) => c.result === 'ALLOW' && c.contributionId)
    .reduce((sum, c) => sum + c.amountCents, 0)

  return {
    checks,
    totalAttempts,
    totalAllowed,
    totalDenied,
    totalReview,
    totalContributed,
  }
}

/**
 * Escalate to legal/compliance officer
 */
export async function escalateReview(
  checkId: string,
  escalatorId: string,
  escalatorEmail: string,
  escalatorRole: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (escalatorRole !== 'COMPLIANCE' && escalatorRole !== 'OWNER') {
    return { success: false, error: 'Only COMPLIANCE role can escalate reviews' }
  }

  const check = await prisma.complianceCheck.findUnique({
    where: { id: checkId },
  })

  if (!check) {
    return { success: false, error: 'Check not found' }
  }

  await prisma.complianceCheck.update({
    where: { id: checkId },
    data: {
      reviewDecision: 'ESCALATE',
      reviewNotes: `Escalated: ${reason}`,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'COMPLIANCE_REVIEW_ESCALATED',
      entityType: 'ComplianceCheck',
      entityId: checkId,
      changes: {
        escalatedBy: escalatorEmail,
      },
      userId: escalatorId,
      userEmail: escalatorEmail,
      reason,
    },
  })

  return { success: true }
}
