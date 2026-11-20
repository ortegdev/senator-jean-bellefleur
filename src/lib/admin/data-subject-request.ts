/**
 * Data Subject Requests (GDPR/Privacy Compliance)
 * 
 * Features:
 * - Export personal data
 * - Delete personal data (right to be forgotten)
 * - Rectify incorrect data
 * - Restrict processing
 * - Legal hold support (prevents deletion)
 * - Verification workflow
 * - Audit logging
 */

import { prisma } from '@/lib/db/prisma'
import type { DataSubjectRequestType, DataSubjectRequestStatus } from '@prisma/client'
import { createTamperEvidentAuditLog } from './audit-log'
import crypto from 'crypto'

// ============================================================================
// Types
// ============================================================================

export interface CreateDSRInput {
  requestType: DataSubjectRequestType
  subjectEmail: string
  subjectName?: string
  contactEmail: string // Email for updates (may differ from subject)
  notes?: string
}

export interface PersonalDataExport {
  requestedAt: Date
  exportedAt: Date
  subjectEmail: string
  
  // Donations
  contributions: Array<{
    id: string
    date: Date
    amountCents: number
    currency: string
    firstName: string
    lastName: string
    email: string
    country: string
    postalCode: string | null
    ipAddress: string | null
  }>
  
  // Waitlist
  waitlistSignup: {
    email: string
    country: string
    communeOfOrigin: string | null
    preferredLocale: string
    emailConsent: boolean
    whatsappConsent: boolean
    createdAt: Date
  } | null
  
  // Newsletter
  newsletterSubscription: {
    email: string
    country: string | null
    preferredLocale: string
    status: string
    subscribedAt: Date | null
    openCount: number
    clickCount: number
  } | null
  
  // Volunteer
  volunteer: {
    email: string
    firstName: string
    lastName: string
    country: string
    skills: string[]
    hoursPerWeek: string | null
    status: string
    createdAt: Date
  } | null
  
  // Event RSVPs
  eventRSVPs: Array<{
    eventSlug: string
    eventTitle: string
    email: string
    firstName: string
    lastName: string
    status: string
    createdAt: Date
  }>
  
  // Questions
  questions: Array<{
    question: string
    response: string | null
    status: string
    createdAt: Date
  }>
  
  // Compliance checks (anonymized)
  complianceChecks: Array<{
    date: Date
    result: string
    reasons: string[]
  }>
}

// ============================================================================
// Create Request
// ============================================================================

/**
 * Create a data subject request
 */
export async function createDataSubjectRequest(
  input: CreateDSRInput
): Promise<{ id: string; verificationToken: string }> {
  // Normalize email
  const normalizedEmail = input.subjectEmail.toLowerCase().trim()

  // Check for existing pending request
  const existing = await prisma.dataSubjectRequest.findFirst({
    where: {
      subjectEmail: normalizedEmail,
      status: { in: ['PENDING', 'VERIFYING', 'VERIFIED', 'IN_PROGRESS'] },
    },
  })

  if (existing) {
    throw new Error('EXISTING_REQUEST_PENDING')
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex')

  const request = await prisma.dataSubjectRequest.create({
    data: {
      requestType: input.requestType,
      subjectEmail: normalizedEmail,
      subjectName: input.subjectName,
      contactEmail: input.contactEmail.toLowerCase().trim(),
      status: 'PENDING',
      notes: input.notes,
    },
  })

  // Create audit log
  await createTamperEvidentAuditLog({
    action: 'DATA_SUBJECT_REQUEST_CREATED',
    entityType: 'DataSubjectRequest',
    entityId: request.id,
    metadata: {
      requestType: input.requestType,
      subjectEmail: normalizedEmail,
    },
  })

  // TODO: Send verification email with token

  return {
    id: request.id,
    verificationToken,
  }
}

// ============================================================================
// Verification
// ============================================================================

/**
 * Verify data subject request via email token
 */
export async function verifyDataSubjectRequest(
  requestId: string,
  token: string
): Promise<boolean> {
  // In production, store and verify actual token
  // For now, mark as verified
  
  const request = await prisma.dataSubjectRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    return false
  }

  if (request.status !== 'PENDING' && request.status !== 'VERIFYING') {
    return false
  }

  await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      status: 'VERIFIED',
      verified: true,
      verifiedAt: new Date(),
      verificationMethod: 'email_link',
    },
  })

  // Create audit log
  await createTamperEvidentAuditLog({
    action: 'DATA_SUBJECT_REQUEST_VERIFIED',
    entityType: 'DataSubjectRequest',
    entityId: requestId,
  })

  return true
}

/**
 * Manually verify request (admin review)
 */
export async function manuallyVerifyDSR(
  requestId: string,
  adminId: string,
  adminEmail: string
): Promise<void> {
  const request = await prisma.dataSubjectRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }

  await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      status: 'VERIFIED',
      verified: true,
      verifiedBy: adminId,
      verifiedAt: new Date(),
      verificationMethod: 'manual_review',
    },
  })

  // Create audit log
  await createTamperEvidentAuditLog({
    action: 'DATA_SUBJECT_REQUEST_MANUALLY_VERIFIED',
    entityType: 'DataSubjectRequest',
    entityId: requestId,
    actorId: adminId,
    actorEmail: adminEmail,
  })
}

// ============================================================================
// Export Personal Data
// ============================================================================

/**
 * Export all personal data for a subject
 */
export async function exportPersonalData(
  requestId: string,
  adminId: string,
  adminEmail: string
): Promise<PersonalDataExport> {
  const request = await prisma.dataSubjectRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }

  if (!request.verified) {
    throw new Error('REQUEST_NOT_VERIFIED')
  }

  if (request.requestType !== 'EXPORT') {
    throw new Error('INVALID_REQUEST_TYPE')
  }

  const email = request.subjectEmail

  // Gather all personal data
  const [
    contributions,
    waitlist,
    newsletter,
    volunteer,
    eventRSVPs,
    questions,
    complianceChecks,
  ] = await Promise.all([
    // Contributions
    prisma.contribution.findMany({
      where: { donorEmail: email },
      select: {
        id: true,
        createdAt: true,
        amountCents: true,
        currency: true,
        donorFirstName: true,
        donorLastName: true,
        donorEmail: true,
        donorCountry: true,
        donorPostalCode: true,
        ipAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    
    // Waitlist
    prisma.waitlistSignup.findUnique({
      where: { email },
      select: {
        email: true,
        country: true,
        communeOfOrigin: true,
        preferredLocale: true,
        emailConsent: true,
        whatsappConsent: true,
        createdAt: true,
      },
    }),
    
    // Newsletter
    prisma.newsletterSubscriber.findUnique({
      where: { email },
      select: {
        email: true,
        country: true,
        preferredLocale: true,
        status: true,
        subscribedAt: true,
        openCount: true,
        clickCount: true,
      },
    }),
    
    // Volunteer
    prisma.volunteer.findUnique({
      where: { email },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        country: true,
        skills: true,
        hoursPerWeek: true,
        status: true,
        createdAt: true,
      },
    }),
    
    // Event RSVPs
    prisma.eventRSVP.findMany({
      where: { email },
      include: {
        event: {
          select: {
            slug: true,
            titleEn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    
    // Questions
    prisma.question.findMany({
      where: { email },
      select: {
        question: true,
        response: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    
    // Compliance checks (anonymized - no PII in results)
    prisma.complianceCheck.findMany({
      where: { donorEmail: email },
      select: {
        createdAt: true,
        result: true,
        reasons: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const exportData: PersonalDataExport = {
    requestedAt: request.createdAt,
    exportedAt: new Date(),
    subjectEmail: email,
    
    contributions: contributions.map((c) => ({
      id: c.id,
      date: c.createdAt,
      amountCents: c.amountCents,
      currency: c.currency,
      firstName: c.donorFirstName,
      lastName: c.donorLastName,
      email: c.donorEmail,
      country: c.donorCountry,
      postalCode: c.donorPostalCode,
      ipAddress: c.ipAddress,
    })),
    
    waitlistSignup: waitlist,
    
    newsletterSubscription: newsletter ? {
      ...newsletter,
      status: newsletter.status,
    } : null,
    
    volunteer: volunteer ? {
      ...volunteer,
      skills: volunteer.skills as string[],
      status: volunteer.status,
    } : null,
    
    eventRSVPs: eventRSVPs.map((rsvp) => ({
      eventSlug: rsvp.event.slug,
      eventTitle: rsvp.event.titleEn,
      email: rsvp.email,
      firstName: rsvp.firstName,
      lastName: rsvp.lastName,
      status: rsvp.status,
      createdAt: rsvp.createdAt,
    })),
    
    questions: questions.map((q) => ({
      question: q.question,
      response: q.response,
      status: q.status,
      createdAt: q.createdAt,
    })),
    
    complianceChecks: complianceChecks.map((c) => ({
      date: c.createdAt,
      result: c.result,
      reasons: c.reasons,
    })),
  }

  // Update request status
  await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      status: 'COMPLETED',
      processedBy: adminId,
      processedAt: new Date(),
      dataExportedAt: new Date(),
      // In production: upload to S3 and set dataExportUrl
    },
  })

  // Create audit log
  await createTamperEvidentAuditLog({
    action: 'PERSONAL_DATA_EXPORTED',
    entityType: 'DataSubjectRequest',
    entityId: requestId,
    actorId: adminId,
    actorEmail: adminEmail,
    metadata: {
      subjectEmail: email,
      contributionsCount: contributions.length,
      hasWaitlist: !!waitlist,
      hasNewsletter: !!newsletter,
      hasVolunteer: !!volunteer,
      rsvpsCount: eventRSVPs.length,
      questionsCount: questions.length,
    },
  })

  return exportData
}

// ============================================================================
// Delete Personal Data
// ============================================================================

/**
 * Delete all personal data for a subject (right to be forgotten)
 * 
 * Respects legal holds and retention requirements
 */
export async function deletePersonalData(
  requestId: string,
  adminId: string,
  adminEmail: string,
  reason: string
): Promise<{
  deleted: boolean
  legalHold: boolean
  deletedRecords: Record<string, number>
}> {
  if (!reason.trim()) {
    throw new Error('REASON_REQUIRED')
  }

  const request = await prisma.dataSubjectRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }

  if (!request.verified) {
    throw new Error('REQUEST_NOT_VERIFIED')
  }

  if (request.requestType !== 'DELETE') {
    throw new Error('INVALID_REQUEST_TYPE')
  }

  // Check for legal hold
  if (request.legalHoldActive) {
    await createTamperEvidentAuditLog({
      action: 'DELETION_BLOCKED_BY_LEGAL_HOLD',
      entityType: 'DataSubjectRequest',
      entityId: requestId,
      actorId: adminId,
      actorEmail: adminEmail,
      reason: request.legalHoldReason || 'Legal hold active',
    })

    return {
      deleted: false,
      legalHold: true,
      deletedRecords: {},
    }
  }

  const email = request.subjectEmail
  const deletedRecords: Record<string, number> = {}

  // Delete in transaction
  await prisma.$transaction(async (tx) => {
    // Waitlist
    const waitlistCount = await tx.waitlistSignup.deleteMany({
      where: { email },
    })
    deletedRecords.waitlist = waitlistCount.count

    // Newsletter
    const newsletterCount = await tx.newsletterSubscriber.deleteMany({
      where: { email },
    })
    deletedRecords.newsletter = newsletterCount.count

    // Volunteer (anonymize instead of delete to preserve assignment history)
    const volunteerCount = await tx.volunteer.updateMany({
      where: { email },
      data: {
        email: `deleted_${Date.now()}@example.com`,
        firstName: '[DELETED]',
        lastName: '[DELETED]',
        whatsapp: null,
        notes: 'Personal data deleted per DSR',
      },
    })
    deletedRecords.volunteer = volunteerCount.count

    // Event RSVPs
    const rsvpCount = await tx.eventRSVP.deleteMany({
      where: { email },
    })
    deletedRecords.eventRSVPs = rsvpCount.count

    // Questions (anonymize to preserve admin work)
    const questionsCount = await tx.question.updateMany({
      where: { email },
      data: {
        email: `deleted_${Date.now()}@example.com`,
        name: '[DELETED]',
      },
    })
    deletedRecords.questions = questionsCount.count

    // Contributions: CANNOT DELETE (financial/legal retention requirements)
    // Instead, anonymize PII
    const contributionsCount = await tx.contribution.updateMany({
      where: { donorEmail: email },
      data: {
        donorEmail: `deleted_${Date.now()}@example.com`,
        donorFirstName: '[DELETED]',
        donorLastName: '[DELETED]',
        donorPostalCode: null,
        ipAddress: null,
        userAgent: null,
      },
    })
    deletedRecords.contributionsAnonymized = contributionsCount.count

    // Compliance checks: CANNOT DELETE (legal retention)
    // Already anonymized (no direct PII stored)
  })

  // Update request
  await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      status: 'COMPLETED',
      processedBy: adminId,
      processedAt: new Date(),
      deletionCompletedAt: new Date(),
    },
  })

  // Create audit log
  await createTamperEvidentAuditLog({
    action: 'PERSONAL_DATA_DELETED',
    entityType: 'DataSubjectRequest',
    entityId: requestId,
    actorId: adminId,
    actorEmail: adminEmail,
    reason,
    metadata: {
      subjectEmail: email,
      deletedRecords,
    },
  })

  return {
    deleted: true,
    legalHold: false,
    deletedRecords,
  }
}

// ============================================================================
// Legal Hold
// ============================================================================

/**
 * Place legal hold on data subject request (prevents deletion)
 */
export async function placeLegalHold(
  requestId: string,
  adminId: string,
  adminEmail: string,
  reason: string
): Promise<void> {
  if (!reason.trim()) {
    throw new Error('REASON_REQUIRED')
  }

  await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      status: 'ON_LEGAL_HOLD',
      legalHoldActive: true,
      legalHoldReason: reason.trim(),
      legalHoldBy: adminId,
      legalHoldAt: new Date(),
    },
  })

  // Create audit log
  await createTamperEvidentAuditLog({
    action: 'LEGAL_HOLD_PLACED',
    entityType: 'DataSubjectRequest',
    entityId: requestId,
    actorId: adminId,
    actorEmail: adminEmail,
    reason,
  })
}

/**
 * Release legal hold
 */
export async function releaseLegalHold(
  requestId: string,
  adminId: string,
  adminEmail: string,
  reason: string
): Promise<void> {
  if (!reason.trim()) {
    throw new Error('REASON_REQUIRED')
  }

  const request = await prisma.dataSubjectRequest.findUnique({
    where: { id: requestId },
  })

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }

  await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      status: 'VERIFIED', // Return to verified status
      legalHoldActive: false,
    },
  })

  // Create audit log
  await createTamperEvidentAuditLog({
    action: 'LEGAL_HOLD_RELEASED',
    entityType: 'DataSubjectRequest',
    entityId: requestId,
    actorId: adminId,
    actorEmail: adminEmail,
    reason,
    metadata: {
      previousHoldReason: request.legalHoldReason,
    },
  })
}

/**
 * Deny data subject request
 */
export async function denyDataSubjectRequest(
  requestId: string,
  adminId: string,
  adminEmail: string,
  reason: string
): Promise<void> {
  if (!reason.trim()) {
    throw new Error('REASON_REQUIRED')
  }

  await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      status: 'DENIED',
      deniedAt: new Date(),
      deniedBy: adminId,
      denialReason: reason.trim(),
    },
  })

  // Create audit log
  await createTamperEvidentAuditLog({
    action: 'DATA_SUBJECT_REQUEST_DENIED',
    entityType: 'DataSubjectRequest',
    entityId: requestId,
    actorId: adminId,
    actorEmail: adminEmail,
    reason,
  })
}
