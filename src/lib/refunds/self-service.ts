/**
 * Self-Service Refund System
 * 
 * Magic link-based refund requests within configurable window.
 * Creates admin tickets for approval.
 */

import { prisma } from '@/lib/db/prisma'

export interface RefundRequestParams {
  token: string
  reason: string
  reasonDetails?: string
  requestorIp: string
  userAgent: string
}

export interface RefundRequestResult {
  success: boolean
  error?: string
  ticketId?: string
  estimatedProcessingDays?: number
}

/**
 * Submit self-service refund request
 * 
 * Flow:
 * 1. Validate magic link token
 * 2. Check if within refund window
 * 3. Check contribution is refundable
 * 4. Create admin ticket
 * 5. Send confirmation email
 */
export async function submitRefundRequest(
  params: RefundRequestParams
): Promise<RefundRequestResult> {
  const { token, reason, reasonDetails, requestorIp, userAgent } = params

  // Step 1: Validate magic link
  const magicLink = await prisma.refundMagicLink.findUnique({
    where: { token },
    include: {
      contribution: {
        include: {
          receipt: true,
        },
      },
    },
  })

  if (!magicLink) {
    return {
      success: false,
      error: 'Invalid refund link',
    }
  }

  // Check if already used
  if (magicLink.usedAt) {
    return {
      success: false,
      error: 'This refund link has already been used',
    }
  }

  // Check if expired
  if (magicLink.expiresAt < new Date()) {
    return {
      success: false,
      error: 'This refund link has expired',
    }
  }

  const contribution = magicLink.contribution

  // Step 2: Check if refundable
  if (contribution.status !== 'COMPLETED') {
    return {
      success: false,
      error: 'This contribution cannot be refunded',
    }
  }

  if (contribution.refundedCents === contribution.amountCents) {
    return {
      success: false,
      error: 'This contribution has already been fully refunded',
    }
  }

  // Step 3: Check refund window
  const refundWindowDays = parseInt(process.env.REFUND_WINDOW_DAYS || '30', 10)
  const refundWindowEnd = new Date(contribution.createdAt.getTime() + refundWindowDays * 24 * 60 * 60 * 1000)

  if (new Date() > refundWindowEnd) {
    return {
      success: false,
      error: `Refund window has expired. Refunds must be requested within ${refundWindowDays} days of contribution.`,
    }
  }

  // Step 4: Create admin ticket
  const ticket = await prisma.refundTicket.create({
    data: {
      contributionId: contribution.id,
      requestedBy: contribution.donorEmail,
      requestorIp,
      userAgent,
      reason,
      reasonDetails,
      amountCents: contribution.amountCents - contribution.refundedCents,
      status: 'PENDING',
      source: 'SELF_SERVICE',
    },
  })

  // Mark magic link as used
  await prisma.refundMagicLink.update({
    where: { token },
    data: {
      usedAt: new Date(),
      usedIp: requestorIp,
    },
  })

  // Step 5: Send confirmation email (handled by caller)

  // Estimate processing time
  const estimatedProcessingDays = 3 // Business days

  return {
    success: true,
    ticketId: ticket.id,
    estimatedProcessingDays,
  }
}

/**
 * Get refund request by token
 * 
 * Used to show refund form with contribution details.
 */
export async function getRefundRequestInfo(token: string): Promise<{
  valid: boolean
  error?: string
  contribution?: {
    id: string
    amountCents: number
    currency: string
    donationDate: Date
    receiptNumber: string
  }
  expiresAt?: Date
}> {
  const magicLink = await prisma.refundMagicLink.findUnique({
    where: { token },
    include: {
      contribution: {
        include: {
          receipt: true,
        },
      },
    },
  })

  if (!magicLink) {
    return {
      valid: false,
      error: 'Invalid refund link',
    }
  }

  if (magicLink.usedAt) {
    return {
      valid: false,
      error: 'This refund link has already been used',
    }
  }

  if (magicLink.expiresAt < new Date()) {
    return {
      valid: false,
      error: 'This refund link has expired',
    }
  }

  const contribution = magicLink.contribution
  const receipt = contribution.receipt[0]

  return {
    valid: true,
    contribution: {
      id: contribution.id,
      amountCents: contribution.amountCents - contribution.refundedCents,
      currency: contribution.currency,
      donationDate: contribution.completedAt || contribution.createdAt,
      receiptNumber: receipt?.receiptNumber || 'N/A',
    },
    expiresAt: magicLink.expiresAt,
  }
}

/**
 * Process refund ticket (admin action)
 * 
 * Called when admin approves refund.
 */
export async function processRefundTicket(
  ticketId: string,
  approvedBy: string,
  notes?: string
): Promise<void> {
  const ticket = await prisma.refundTicket.findUnique({
    where: { id: ticketId },
    include: {
      contribution: true,
    },
  })

  if (!ticket) {
    throw new Error('Refund ticket not found')
  }

  if (ticket.status !== 'PENDING') {
    throw new Error('Refund ticket has already been processed')
  }

  // Update ticket status
  await prisma.refundTicket.update({
    where: { id: ticketId },
    data: {
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
      adminNotes: notes,
    },
  })

  // Process actual refund via payment orchestrator
  // This will update contribution status and create ledger entries
  const { refundPayment } = await import('@/lib/payments/orchestrator')
  
  await refundPayment({
    contributionId: ticket.contributionId,
    amountCents: ticket.amountCents,
    reason: ticket.reason,
    requestedBy: approvedBy,
  })

  // Update ticket as completed
  await prisma.refundTicket.update({
    where: { id: ticketId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  // Send refund approved email (handled by caller)
}

/**
 * Deny refund ticket (admin action)
 */
export async function denyRefundTicket(
  ticketId: string,
  deniedBy: string,
  denyReason: string
): Promise<void> {
  const ticket = await prisma.refundTicket.findUnique({
    where: { id: ticketId },
  })

  if (!ticket) {
    throw new Error('Refund ticket not found')
  }

  if (ticket.status !== 'PENDING') {
    throw new Error('Refund ticket has already been processed')
  }

  await prisma.refundTicket.update({
    where: { id: ticketId },
    data: {
      status: 'DENIED',
      deniedBy,
      deniedAt: new Date(),
      denyReason,
    },
  })

  // Send refund denied email (handled by caller)
}

/**
 * Get pending refund tickets for admin dashboard
 */
export async function getPendingRefundTickets() {
  return prisma.refundTicket.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      contribution: {
        select: {
          id: true,
          amountCents: true,
          currency: true,
          donorEmail: true,
          donorFirstName: true,
          donorLastName: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc', // Oldest first
    },
  })
}

/**
 * Get refund ticket by ID
 */
export async function getRefundTicket(ticketId: string) {
  return prisma.refundTicket.findUnique({
    where: { id: ticketId },
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
 * Get refund statistics
 */
export async function getRefundStats(days = 30): Promise<{
  total: number
  pending: number
  approved: number
  denied: number
  completed: number
  totalAmountCents: number
  averageProcessingHours: number
}> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const tickets = await prisma.refundTicket.findMany({
    where: {
      createdAt: { gte: startDate },
    },
  })

  const pending = tickets.filter(t => t.status === 'PENDING').length
  const approved = tickets.filter(t => t.status === 'APPROVED').length
  const denied = tickets.filter(t => t.status === 'DENIED').length
  const completed = tickets.filter(t => t.status === 'COMPLETED').length

  const totalAmountCents = tickets
    .filter(t => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amountCents, 0)

  // Calculate average processing time for completed tickets
  const completedTickets = tickets.filter(t => t.status === 'COMPLETED' && t.completedAt)
  const processingTimes = completedTickets.map(t => {
    const created = t.createdAt.getTime()
    const completed = t.completedAt!.getTime()
    return (completed - created) / (1000 * 60 * 60) // Hours
  })

  const averageProcessingHours = processingTimes.length > 0
    ? processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length
    : 0

  return {
    total: tickets.length,
    pending,
    approved,
    denied,
    completed,
    totalAmountCents,
    averageProcessingHours: Math.round(averageProcessingHours * 10) / 10,
  }
}
