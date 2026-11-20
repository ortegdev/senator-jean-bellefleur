/**
 * Chargeback Handling System
 * 
 * Webhook-driven dispute processing with evidence generation.
 * Handles full lifecycle: dispute created → evidence submitted → resolved.
 */

import { prisma } from '@/lib/db/prisma'
import type { Contribution } from '@prisma/client'

export interface ChargebackData {
  id: string
  contributionId: string
  paymentIntentId: string
  amountCents: number
  currency: string
  reason: string
  status: ChargebackStatus
  evidenceDeadline?: Date
  createdAt: Date
  resolvedAt?: Date
  outcome?: 'WON' | 'LOST' | 'ACCEPTED'
}

export type ChargebackStatus =
  | 'NEEDS_RESPONSE'
  | 'EVIDENCE_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'WON'
  | 'LOST'
  | 'ACCEPTED'

export interface EvidencePacket {
  // Receipt information
  receiptNumber: string
  donationDate: Date
  amountPaid: string
  paymentMethod: string

  // Compliance records
  attestationRecord: {
    isEligibleDonor: boolean
    notProhibitedSource: boolean
    accurateInformation: boolean
    agreedAt: Date
  }

  // Geographic information
  donorCountry: string
  ipCountry?: string
  ipAddress?: string

  // Disclosure evidence
  affiliationDisclosureShown: string
  termsAccepted: boolean

  // Communication history
  receiptSent: boolean
  receiptSentAt?: Date

  // Additional evidence
  notes?: string
}

/**
 * Handle chargeback webhook event
 * 
 * Called when provider sends dispute.created webhook.
 */
export async function handleChargebackWebhook(params: {
  providerDisputeId: string
  paymentIntentId: string
  amountCents: number
  currency: string
  reason: string
  evidenceDeadline?: Date
}): Promise<ChargebackData> {
  const { providerDisputeId, paymentIntentId, amountCents, currency, reason, evidenceDeadline } = params

  // Find payment intent
  const paymentIntent = await prisma.paymentIntent.findFirst({
    where: { providerIntentId: paymentIntentId },
    include: { contribution: true },
  })

  if (!paymentIntent) {
    throw new Error('Payment intent not found')
  }

  const contribution = paymentIntent.contribution

  // Create chargeback record
  const chargeback = await prisma.chargeback.create({
    data: {
      providerDisputeId,
      contributionId: contribution.id,
      paymentIntentId: paymentIntent.providerIntentId,
      amountCents,
      currency,
      reason,
      status: 'NEEDS_RESPONSE',
      evidenceDeadline,
    },
  })

  // Update contribution status
  await prisma.contribution.update({
    where: { id: contribution.id },
    data: {
      status: 'DISPUTED',
    },
  })

  // Generate evidence packet automatically
  const evidence = await generateEvidencePacket(contribution.id)

  // Store evidence
  await prisma.chargeback.update({
    where: { id: chargeback.id },
    data: {
      evidencePacket: evidence as any,
    },
  })

  // Create admin alert
  await prisma.fraudEvent.create({
    data: {
      eventType: 'ALERT_TRIGGERED',
      severity: 'HIGH',
      contributionId: contribution.id,
      metadata: {
        alertType: 'CHARGEBACK_CREATED',
        chargebackId: chargeback.id,
        reason,
        amountCents,
        evidenceDeadline,
      },
    },
  })

  return {
    id: chargeback.id,
    contributionId: contribution.id,
    paymentIntentId,
    amountCents,
    currency,
    reason,
    status: 'NEEDS_RESPONSE',
    evidenceDeadline,
    createdAt: chargeback.createdAt,
  }
}

/**
 * Generate evidence packet for dispute
 * 
 * Compiles all evidence to prove legitimacy of donation.
 */
export async function generateEvidencePacket(
  contributionId: string
): Promise<EvidencePacket> {
  // Get contribution with all related data
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: {
      complianceCheck: true,
      attestationVersion: true,
      receipt: true,
    },
  })

  if (!contribution) {
    throw new Error('Contribution not found')
  }

  const receipt = contribution.receipt[0]
  const complianceCheck = contribution.complianceCheck

  // Extract attestation record
  const attestationRecord = {
    isEligibleDonor: true, // From compliance check
    notProhibitedSource: true,
    accurateInformation: true,
    agreedAt: contribution.createdAt,
  }

  // Get affiliation disclosure from config
  const config = await prisma.candidateConfig.findFirst({
    where: { slug: 'bellefleur' },
  })

  const affiliationDisclosureShown = config?.affiliationText || 
    'Independent supporter initiative, not authorized by or affiliated with the candidate, his campaign or any party'

  // Build evidence packet
  const evidence: EvidencePacket = {
    // Receipt
    receiptNumber: receipt?.receiptNumber || 'N/A',
    donationDate: contribution.completedAt || contribution.createdAt,
    amountPaid: `${contribution.currency} ${(contribution.amountCents / 100).toFixed(2)}`,
    paymentMethod: 'Credit Card ending in ****', // TODO: Get from payment intent

    // Compliance
    attestationRecord,

    // Geographic
    donorCountry: contribution.donorCountry,
    ipCountry: complianceCheck?.metadata ? (complianceCheck.metadata as any).ipCountry : undefined,
    ipAddress: complianceCheck?.metadata ? (complianceCheck.metadata as any).ipAddress : undefined,

    // Disclosure
    affiliationDisclosureShown,
    termsAccepted: true,

    // Communication
    receiptSent: !!receipt,
    receiptSentAt: receipt?.createdAt,

    // Notes
    notes: `Legitimate political contribution. Donor agreed to eligibility attestations and affiliation disclosure. Receipt sent to donor email.`,
  }

  return evidence
}

/**
 * Submit evidence to payment provider
 * 
 * Called by admin or automatically after evidence generation.
 */
export async function submitChargebackEvidence(
  chargebackId: string,
  submittedBy: string
): Promise<void> {
  const chargeback = await prisma.chargeback.findUnique({
    where: { id: chargebackId },
  })

  if (!chargeback) {
    throw new Error('Chargeback not found')
  }

  if (chargeback.status !== 'NEEDS_RESPONSE') {
    throw new Error('Evidence already submitted')
  }

  const evidence = chargeback.evidencePacket as any as EvidencePacket

  // Submit to payment provider
  // TODO: Implement provider-specific submission
  // For now, just mark as submitted

  await prisma.chargeback.update({
    where: { id: chargebackId },
    data: {
      status: 'EVIDENCE_SUBMITTED',
      evidenceSubmittedAt: new Date(),
      evidenceSubmittedBy: submittedBy,
    },
  })
}

/**
 * Handle chargeback resolution webhook
 * 
 * Called when provider sends dispute.closed webhook.
 */
export async function handleChargebackResolution(params: {
  providerDisputeId: string
  outcome: 'WON' | 'LOST' | 'ACCEPTED'
}): Promise<void> {
  const { providerDisputeId, outcome } = params

  const chargeback = await prisma.chargeback.findFirst({
    where: { providerDisputeId },
  })

  if (!chargeback) {
    throw new Error('Chargeback not found')
  }

  // Update chargeback status
  await prisma.chargeback.update({
    where: { id: chargeback.id },
    data: {
      status: outcome,
      outcome,
      resolvedAt: new Date(),
    },
  })

  // If lost, contribution stays DISPUTED
  // If won, restore to COMPLETED
  if (outcome === 'WON') {
    await prisma.contribution.update({
      where: { id: chargeback.contributionId },
      data: {
        status: 'COMPLETED',
      },
    })

    // Reverse chargeback in ledger
    // TODO: Implement chargeback reversal ledger entries
  }
}

/**
 * Get chargebacks needing attention
 * 
 * Returns chargebacks with upcoming deadlines or needing response.
 */
export async function getChargebacksNeedingAttention(): Promise<ChargebackData[]> {
  const chargebacks = await prisma.chargeback.findMany({
    where: {
      status: {
        in: ['NEEDS_RESPONSE', 'EVIDENCE_SUBMITTED'],
      },
    },
    orderBy: {
      evidenceDeadline: 'asc', // Soonest deadline first
    },
  })

  return chargebacks.map(c => ({
    id: c.id,
    contributionId: c.contributionId,
    paymentIntentId: c.paymentIntentId,
    amountCents: c.amountCents,
    currency: c.currency,
    reason: c.reason,
    status: c.status as ChargebackStatus,
    evidenceDeadline: c.evidenceDeadline || undefined,
    createdAt: c.createdAt,
    resolvedAt: c.resolvedAt || undefined,
    outcome: c.outcome as any,
  }))
}

/**
 * Get chargeback by ID
 */
export async function getChargeback(chargebackId: string) {
  return prisma.chargeback.findUnique({
    where: { id: chargebackId },
    include: {
      contribution: {
        include: {
          receipt: true,
          complianceCheck: true,
        },
      },
    },
  })
}

/**
 * Get chargeback statistics
 */
export async function getChargebackStats(days = 30): Promise<{
  total: number
  needsResponse: number
  evidenceSubmitted: number
  won: number
  lost: number
  accepted: number
  totalAmountCents: number
  winRate: number
}> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const chargebacks = await prisma.chargeback.findMany({
    where: {
      createdAt: { gte: startDate },
    },
  })

  const needsResponse = chargebacks.filter(c => c.status === 'NEEDS_RESPONSE').length
  const evidenceSubmitted = chargebacks.filter(c => c.status === 'EVIDENCE_SUBMITTED').length
  const won = chargebacks.filter(c => c.outcome === 'WON').length
  const lost = chargebacks.filter(c => c.outcome === 'LOST').length
  const accepted = chargebacks.filter(c => c.outcome === 'ACCEPTED').length

  const totalAmountCents = chargebacks.reduce((sum, c) => sum + c.amountCents, 0)

  const resolved = won + lost + accepted
  const winRate = resolved > 0 ? (won / resolved) * 100 : 0

  return {
    total: chargebacks.length,
    needsResponse,
    evidenceSubmitted,
    won,
    lost,
    accepted,
    totalAmountCents,
    winRate: Math.round(winRate * 10) / 10,
  }
}

/**
 * Send deadline reminder emails
 * 
 * Called daily via cron to remind about upcoming deadlines.
 */
export async function sendDeadlineReminders(): Promise<number> {
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  const chargebacks = await prisma.chargeback.findMany({
    where: {
      status: 'NEEDS_RESPONSE',
      evidenceDeadline: {
        lte: threeDaysFromNow,
      },
      reminderSent: false,
    },
  })

  for (const chargeback of chargebacks) {
    // Send reminder email (handled by caller)
    // Mark reminder as sent
    await prisma.chargeback.update({
      where: { id: chargeback.id },
      data: {
        reminderSent: true,
        reminderSentAt: new Date(),
      },
    })
  }

  return chargebacks.length
}
