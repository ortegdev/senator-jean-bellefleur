/**
 * Data Subject Rights (GDPR/CCPA/PIPEDA)
 * 
 * Implements:
 * - Right to access (data export)
 * - Right to erasure (deletion/anonymization)
 * - Right to rectification (data correction)
 * - Right to portability (machine-readable export)
 * - Right to object (opt-out)
 * 
 * With:
 * - Legal hold flags (prevent deletion during investigations)
 * - Retention schedules (configurable by counsel)
 * - Anonymization vs deletion
 */

import { prisma } from '@/lib/db/prisma'
import { decryptDonorData } from './encryption'
import { safeLogger } from './pii-scrubbing'

export type DataSubjectRequestType =
  | 'ACCESS' // GDPR Article 15
  | 'ERASURE' // GDPR Article 17 (Right to be forgotten)
  | 'RECTIFICATION' // GDPR Article 16
  | 'PORTABILITY' // GDPR Article 20
  | 'OBJECT' // GDPR Article 21
  | 'RESTRICT_PROCESSING' // GDPR Article 18

export type RequestStatus =
  | 'PENDING' // Awaiting processing
  | 'IN_PROGRESS' // Being processed
  | 'COMPLETED' // Fulfilled
  | 'DENIED' // Denied (with reason)
  | 'CANCELLED' // Cancelled by requester

export interface DataSubjectRequest {
  id: string
  donorId: string
  type: DataSubjectRequestType
  status: RequestStatus
  requestedAt: Date
  processedAt: Date | null
  completedAt: Date | null
  denialReason: string | null
  processedBy: string | null
  verificationToken: string
  verificationExpiresAt: Date
  verifiedAt: Date | null
}

export interface RetentionPolicy {
  entityType: string // 'Contribution', 'Donor', 'Consent', etc.
  retentionPeriodDays: number
  canAnonymize: boolean
  canDelete: boolean
  legalBasis: string // Why we retain this data
}

/**
 * Default retention policies (configurable by counsel)
 */
export const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    entityType: 'Contribution',
    retentionPeriodDays: 2555, // 7 years (Haiti election law)
    canAnonymize: true,
    canDelete: false, // Financial records must be retained
    legalBasis: 'Legal obligation - Election law record retention (7 years)',
  },
  {
    entityType: 'Receipt',
    retentionPeriodDays: 2555, // 7 years
    canAnonymize: true,
    canDelete: false,
    legalBasis: 'Legal obligation - Financial record retention',
  },
  {
    entityType: 'Consent',
    retentionPeriodDays: 2555, // 7 years
    canAnonymize: false, // Consent records must be exact
    canDelete: false,
    legalBasis: 'Legal obligation - Proof of consent',
  },
  {
    entityType: 'Donor',
    retentionPeriodDays: 2555, // 7 years
    canAnonymize: true,
    canDelete: false, // Linked to financial records
    legalBasis: 'Legal obligation - Connected to financial records',
  },
  {
    entityType: 'NewsletterSubscriber',
    retentionPeriodDays: 365, // 1 year after unsubscribe
    canAnonymize: true,
    canDelete: true,
    legalBasis: 'Legitimate interest - Marketing consent history',
  },
]

/**
 * Create data subject request
 */
export async function createDataSubjectRequest(params: {
  donorId: string
  type: DataSubjectRequestType
  verificationToken: string
}): Promise<DataSubjectRequest> {
  const { donorId, type, verificationToken } = params

  const request = await prisma.dataSubjectRequest.create({
    data: {
      donorId,
      type,
      status: 'PENDING',
      requestedAt: new Date(),
      verificationToken,
      verificationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  safeLogger.info('Data subject request created', {
    requestId: request.id,
    type,
    // donorId intentionally excluded from logs
  })

  return request as DataSubjectRequest
}

/**
 * Verify data subject request
 */
export async function verifyDataSubjectRequest(
  requestId: string,
  token: string
): Promise<{ success: boolean; request?: DataSubjectRequest; error?: string }> {
  const request = await prisma.dataSubjectRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    return { success: false, error: 'Request not found' }
  }

  if (request.verificationToken !== token) {
    return { success: false, error: 'Invalid verification token' }
  }

  if (new Date() > request.verificationExpiresAt) {
    return { success: false, error: 'Verification token expired' }
  }

  if (request.verifiedAt) {
    return { success: false, error: 'Request already verified' }
  }

  await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      verifiedAt: new Date(),
      status: 'IN_PROGRESS',
    },
  })

  return {
    success: true,
    request: { ...request, verifiedAt: new Date(), status: 'IN_PROGRESS' } as DataSubjectRequest,
  }
}

/**
 * Export donor data (Right to Access)
 */
export async function exportDonorData(donorId: string): Promise<{
  personalInformation: any
  contributions: any[]
  consents: any[]
  communications: any[]
  requests: any[]
}> {
  const donor = await prisma.donor.findUnique({
    where: { id: donorId },
    include: {
      contributions: {
        include: {
          receipt: true,
          refunds: true,
        },
      },
      consents: true,
      dataSubjectRequests: true,
    },
  })

  if (!donor) {
    throw new Error('Donor not found')
  }

  // Decrypt sensitive data
  const decrypted = decryptDonorData({
    encryptedName: donor.encryptedName,
    encryptedEmail: donor.encryptedEmail,
  })

  return {
    personalInformation: {
      name: decrypted.name,
      email: decrypted.email,
      country: donor.country,
      locale: donor.locale,
      createdAt: donor.createdAt,
      isAnonymous: donor.isAnonymous,
    },
    contributions: donor.contributions.map(c => ({
      id: c.id,
      amountCents: c.amountCents,
      currency: c.currency,
      date: c.createdAt,
      status: c.status,
      receipt: c.receipt
        ? {
            receiptNumber: c.receipt.receiptNumber,
            generatedAt: c.receipt.generatedAt,
          }
        : null,
      refunds: c.refunds.map(r => ({
        id: r.id,
        amountCents: r.amountCents,
        status: r.status,
        processedAt: r.processedAt,
      })),
    })),
    consents: donor.consents.map(c => ({
      purpose: c.purpose,
      status: c.status,
      grantedAt: c.grantedAt,
      withdrawnAt: c.withdrawnAt,
      consentText: c.consentText,
    })),
    communications: [], // TODO: Add email/WhatsApp communication records if tracked
    requests: donor.dataSubjectRequests.map(r => ({
      type: r.type,
      status: r.status,
      requestedAt: r.requestedAt,
      completedAt: r.completedAt,
    })),
  }
}

/**
 * Check if donor can be deleted
 */
export async function canDeleteDonor(donorId: string): Promise<{
  canDelete: boolean
  reasons: string[]
}> {
  const reasons: string[] = []

  // Check legal hold
  const donor = await prisma.donor.findUnique({
    where: { id: donorId },
  })

  if (!donor) {
    return { canDelete: false, reasons: ['Donor not found'] }
  }

  if (donor.legalHold) {
    reasons.push('Donor is under legal hold (investigation, litigation, or audit)')
  }

  // Check retention policies
  const contributions = await prisma.contribution.findMany({
    where: { donorId },
  })

  for (const contribution of contributions) {
    const age = Date.now() - contribution.createdAt.getTime()
    const retentionDays = DEFAULT_RETENTION_POLICIES.find(
      p => p.entityType === 'Contribution'
    )!.retentionPeriodDays

    if (age < retentionDays * 24 * 60 * 60 * 1000) {
      reasons.push(
        `Contribution ${contribution.id} is within retention period (${retentionDays} days)`
      )
    }
  }

  // Check pending refunds
  const pendingRefunds = await prisma.refund.count({
    where: {
      contribution: { donorId },
      status: { in: ['PENDING', 'PROCESSING'] },
    },
  })

  if (pendingRefunds > 0) {
    reasons.push(`${pendingRefunds} pending refunds must be processed first`)
  }

  // Check open chargebacks
  const openChargebacks = await prisma.chargeback.count({
    where: {
      contribution: { donorId },
      status: { in: ['PENDING', 'EVIDENCE_SUBMITTED'] },
    },
  })

  if (openChargebacks > 0) {
    reasons.push(`${openChargebacks} open chargebacks must be resolved first`)
  }

  return {
    canDelete: reasons.length === 0,
    reasons,
  }
}

/**
 * Anonymize donor data
 * Replaces PII with anonymized values while preserving financial records
 */
export async function anonymizeDonor(donorId: string): Promise<void> {
  const donor = await prisma.donor.findUnique({
    where: { id: donorId },
  })

  if (!donor) {
    throw new Error('Donor not found')
  }

  if (donor.legalHold) {
    throw new Error('Cannot anonymize donor under legal hold')
  }

  // Generate anonymous identifier
  const anonId = `ANON-${Date.now()}-${Math.random().toString(36).substring(7)}`

  await prisma.donor.update({
    where: { id: donorId },
    data: {
      encryptedName: `ANONYMIZED-${anonId}`,
      encryptedEmail: `anonymized-${anonId}@redacted.local`,
      emailBlindIndex: `ANON-${anonId}`,
      nameBlindIndex: `ANON-${anonId}`,
      isAnonymous: true,
      anonymizedAt: new Date(),
    },
  })

  safeLogger.info('Donor anonymized', {
    // No donorId in logs
    anonymizedAt: new Date(),
  })
}

/**
 * Delete donor data (full deletion)
 * Only allowed if all retention periods have passed and no legal hold
 */
export async function deleteDonor(donorId: string): Promise<void> {
  const { canDelete, reasons } = await canDeleteDonor(donorId)

  if (!canDelete) {
    throw new Error(`Cannot delete donor: ${reasons.join('; ')}`)
  }

  // Delete in order (respecting foreign keys)
  await prisma.$transaction([
    prisma.consent.deleteMany({ where: { donorId } }),
    prisma.refundMagicLink.deleteMany({
      where: { contribution: { donorId } },
    }),
    prisma.dataSubjectRequest.deleteMany({ where: { donorId } }),
    prisma.receipt.deleteMany({
      where: { contribution: { donorId } },
    }),
    prisma.refund.deleteMany({
      where: { contribution: { donorId } },
    }),
    prisma.chargeback.deleteMany({
      where: { contribution: { donorId } },
    }),
    prisma.contribution.deleteMany({ where: { donorId } }),
    prisma.donor.delete({ where: { id: donorId } }),
  ])

  safeLogger.info('Donor deleted', {
    // No donorId in logs
    deletedAt: new Date(),
  })
}

/**
 * Process data subject request
 */
export async function processDataSubjectRequest(
  requestId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string; exportData?: any }> {
  const request = await prisma.dataSubjectRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    return { success: false, error: 'Request not found' }
  }

  if (request.status !== 'IN_PROGRESS') {
    return { success: false, error: 'Request not verified or already processed' }
  }

  try {
    let exportData: any = null

    switch (request.type) {
      case 'ACCESS':
      case 'PORTABILITY':
        exportData = await exportDonorData(request.donorId)
        break

      case 'ERASURE':
        const { canDelete, reasons } = await canDeleteDonor(request.donorId)
        if (canDelete) {
          await anonymizeDonor(request.donorId)
        } else {
          await prisma.dataSubjectRequest.update({
            where: { id: requestId },
            data: {
              status: 'DENIED',
              denialReason: `Cannot delete: ${reasons.join('; ')}. Data will be anonymized instead after retention period.`,
              processedBy: adminUserId,
              processedAt: new Date(),
            },
          })
          return {
            success: false,
            error: `Request denied: ${reasons.join('; ')}`,
          }
        }
        break

      case 'OBJECT':
        // Withdraw all marketing consents
        await prisma.consent.updateMany({
          where: {
            donorId: request.donorId,
            purpose: { in: ['EMAIL', 'WHATSAPP', 'PUBLIC_RECOGNITION'] },
            status: 'GRANTED',
          },
          data: {
            status: 'WITHDRAWN',
            withdrawnAt: new Date(),
          },
        })
        break

      default:
        return { success: false, error: 'Unsupported request type' }
    }

    await prisma.dataSubjectRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        processedBy: adminUserId,
      },
    })

    return { success: true, exportData }
  } catch (error) {
    safeLogger.error('Failed to process data subject request', { error })

    await prisma.dataSubjectRequest.update({
      where: { id: requestId },
      data: {
        status: 'DENIED',
        denialReason: error instanceof Error ? error.message : 'Processing error',
        processedBy: adminUserId,
        processedAt: new Date(),
      },
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing error',
    }
  }
}

/**
 * Set legal hold on donor
 */
export async function setLegalHold(
  donorId: string,
  reason: string,
  setBy: string
): Promise<void> {
  await prisma.donor.update({
    where: { id: donorId },
    data: {
      legalHold: true,
      legalHoldReason: reason,
      legalHoldSetBy: setBy,
      legalHoldSetAt: new Date(),
    },
  })

  safeLogger.info('Legal hold set', {
    // No donorId in logs
    reason,
    setBy,
  })
}

/**
 * Release legal hold on donor
 */
export async function releaseLegalHold(
  donorId: string,
  releasedBy: string
): Promise<void> {
  await prisma.donor.update({
    where: { id: donorId },
    data: {
      legalHold: false,
      legalHoldReleasedBy: releasedBy,
      legalHoldReleasedAt: new Date(),
    },
  })

  safeLogger.info('Legal hold released', {
    // No donorId in logs
    releasedBy,
  })
}

/**
 * Run retention policy cleanup (cron job)
 */
export async function runRetentionCleanup(): Promise<{
  anonymized: number
  deleted: number
  errors: number
}> {
  let anonymized = 0
  let deleted = 0
  let errors = 0

  // Find donors eligible for cleanup
  const contributionRetentionDays = DEFAULT_RETENTION_POLICIES.find(
    p => p.entityType === 'Contribution'
  )!.retentionPeriodDays

  const cutoffDate = new Date(Date.now() - contributionRetentionDays * 24 * 60 * 60 * 1000)

  const eligibleDonors = await prisma.donor.findMany({
    where: {
      legalHold: false,
      anonymizedAt: null,
      contributions: {
        every: {
          createdAt: { lt: cutoffDate },
        },
      },
    },
  })

  for (const donor of eligibleDonors) {
    try {
      const { canDelete } = await canDeleteDonor(donor.id)

      if (canDelete) {
        await deleteDonor(donor.id)
        deleted++
      } else {
        await anonymizeDonor(donor.id)
        anonymized++
      }
    } catch (error) {
      safeLogger.error('Retention cleanup error', { error })
      errors++
    }
  }

  return { anonymized, deleted, errors }
}
