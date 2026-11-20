/**
 * "My Support" Passwordless Access System
 * 
 * Magic-link authentication for donor self-service portal.
 * No passwords, no accounts - just email verification.
 * 
 * Donors can:
 * - View their contribution history
 * - Download receipts
 * - Manage communication preferences (consent)
 * - Request data export
 * - Request data deletion
 * - Update contact information
 */

import crypto from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { findDonorByEmail } from './encryption'

export interface MySupportSession {
  id: string
  donorId: string
  token: string
  createdAt: Date
  expiresAt: Date
  lastAccessedAt: Date
  ipAddress: string | null
  userAgent: string | null
}

/**
 * Generate magic link token
 */
function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create magic link for donor access
 */
export async function createMySupportMagicLink(params: {
  email: string
  ipAddress: string | null
  userAgent: string | null
  locale: string
}): Promise<{
  success: boolean
  token?: string
  expiresAt?: Date
  error?: string
}> {
  const { email, ipAddress, userAgent, locale } = params

  // Find donor by email (using blind index)
  const donor = await findDonorByEmail(email)

  if (!donor) {
    // Don't reveal if email exists (security best practice)
    return {
      success: true, // Always return success
      // No token sent if donor doesn't exist
    }
  }

  // Generate token
  const token = generateMagicLinkToken()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

  // Create session
  await prisma.mySupportSession.create({
    data: {
      donorId: donor.id,
      token,
      createdAt: new Date(),
      expiresAt,
      lastAccessedAt: new Date(),
      ipAddress,
      userAgent,
    },
  })

  // Send magic link email (handled by caller)
  return {
    success: true,
    token,
    expiresAt,
  }
}

/**
 * Verify magic link and create session
 */
export async function verifyMySupportMagicLink(
  token: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<{
  success: boolean
  sessionId?: string
  donorId?: string
  error?: string
}> {
  const session = await prisma.mySupportSession.findFirst({
    where: { token },
  })

  if (!session) {
    return { success: false, error: 'Invalid or expired link' }
  }

  if (new Date() > session.expiresAt) {
    return { success: false, error: 'Link has expired' }
  }

  // Update last accessed
  await prisma.mySupportSession.update({
    where: { id: session.id },
    data: {
      lastAccessedAt: new Date(),
      ipAddress,
      userAgent,
    },
  })

  return {
    success: true,
    sessionId: session.id,
    donorId: session.donorId,
  }
}

/**
 * Get active session
 */
export async function getMySupportSession(
  sessionId: string
): Promise<MySupportSession | null> {
  const session = await prisma.mySupportSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) {
    return null
  }

  // Check expiry
  if (new Date() > session.expiresAt) {
    return null
  }

  return session as MySupportSession
}

/**
 * Extend session expiry (on activity)
 */
export async function extendMySupportSession(sessionId: string): Promise<void> {
  const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

  await prisma.mySupportSession.update({
    where: { id: sessionId },
    data: {
      expiresAt: newExpiresAt,
      lastAccessedAt: new Date(),
    },
  })
}

/**
 * Invalidate session (logout)
 */
export async function invalidateMySupportSession(sessionId: string): Promise<void> {
  await prisma.mySupportSession.delete({
    where: { id: sessionId },
  })
}

/**
 * Cleanup expired sessions (cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.mySupportSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })

  return result.count
}

/**
 * Get donor's contribution history (for My Support page)
 */
export async function getMySupportContributions(donorId: string) {
  const contributions = await prisma.contribution.findMany({
    where: { donorId },
    include: {
      receipt: true,
      refunds: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return contributions.map(c => ({
    id: c.id,
    amountCents: c.amountCents,
    currency: c.currency,
    date: c.createdAt,
    status: c.status,
    receipt: c.receipt
      ? {
          receiptNumber: c.receipt.receiptNumber,
          receiptId: c.receipt.receiptId,
        }
      : null,
    refundStatus: c.refunds.length > 0 ? c.refunds[0].status : null,
    canRefund:
      c.status === 'COMPLETED' &&
      c.refunds.length === 0 &&
      Date.now() - c.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000, // 30 days
  }))
}

/**
 * Get donor's consent preferences (for My Support page)
 */
export async function getMySupportConsents(donorId: string) {
  const consents = await prisma.consent.findMany({
    where: {
      donorId,
      purpose: { in: ['EMAIL', 'WHATSAPP', 'PUBLIC_RECOGNITION'] },
    },
    orderBy: { grantedAt: 'desc' },
  })

  // Get latest for each purpose
  const latestConsents: Record<string, any> = {}

  for (const consent of consents) {
    if (!latestConsents[consent.purpose]) {
      latestConsents[consent.purpose] = consent
    }
  }

  return {
    email: latestConsents.EMAIL?.status === 'GRANTED',
    whatsapp: latestConsents.WHATSAPP?.status === 'GRANTED',
    publicRecognition: latestConsents.PUBLIC_RECOGNITION?.status === 'GRANTED',
  }
}

/**
 * Update consent preferences (from My Support page)
 */
export async function updateMySupportConsents(
  donorId: string,
  preferences: {
    email?: boolean
    whatsapp?: boolean
    publicRecognition?: boolean
  },
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  const { recordConsent, withdrawConsent } = await import('./consent')

  const updates = [
    { purpose: 'EMAIL' as const, granted: preferences.email },
    { purpose: 'WHATSAPP' as const, granted: preferences.whatsapp },
    { purpose: 'PUBLIC_RECOGNITION' as const, granted: preferences.publicRecognition },
  ]

  for (const { purpose, granted } of updates) {
    if (granted === undefined) continue

    if (granted) {
      await recordConsent({
        donorId,
        purpose,
        status: 'GRANTED',
        basis: 'EXPLICIT_CONSENT',
        ipAddress,
        userAgent,
        locale: 'en', // TODO: Get from session
      })
    } else {
      await withdrawConsent(donorId, purpose)
    }
  }
}

/**
 * Request data export (from My Support page)
 */
export async function requestDataExport(
  donorId: string,
  email: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const { createDataSubjectRequest } = await import('./data-subject-rights')

  const token = generateMagicLinkToken()

  try {
    const request = await createDataSubjectRequest({
      donorId,
      type: 'ACCESS',
      verificationToken: token,
    })

    // Send verification email (handled by caller)

    return {
      success: true,
      requestId: request.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create request',
    }
  }
}

/**
 * Request data deletion (from My Support page)
 */
export async function requestDataDeletion(
  donorId: string,
  email: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const { createDataSubjectRequest } = await import('./data-subject-rights')

  const token = generateMagicLinkToken()

  try {
    const request = await createDataSubjectRequest({
      donorId,
      type: 'ERASURE',
      verificationToken: token,
    })

    // Send verification email (handled by caller)

    return {
      success: true,
      requestId: request.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create request',
    }
  }
}
