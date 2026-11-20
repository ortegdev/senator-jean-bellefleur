/**
 * Payment Orchestrator
 * 
 * High-level payment flow coordination:
 * 1. Check launch gate (DONATIONS_LIVE + not killed)
 * 2. Run compliance checks
 * 3. Create payment intent with provider
 * 4. Create contribution record
 * 5. On confirmation: record ledger entries
 * 6. Handle failures and refunds
 * 
 * This is the single entry point for all payment operations.
 */

import { prisma } from '@/lib/db/prisma'
import { checkLaunchGate } from '@/lib/launch-gate/check'
import { checkCompliance, type DonationAttempt } from '@/lib/compliance/engine'
import { getLatestAttestationVersion } from '@/lib/compliance/attestation'
import { getPaymentProvider } from './factory'
import { 
  recordDonation, 
  recordRefund, 
  recordChargeback,
  calculateBalanceSheet,
} from './ledger'
import type { PaymentStatus } from '@prisma/client'

export class PaymentOrchestrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'PaymentOrchestrationError'
  }
}

export interface CreatePaymentParams {
  // Donor info
  donorEmail: string
  donorFirstName: string
  donorLastName: string
  donorCountry: string
  donorPostalCode?: string

  // Amount
  amountCents: number
  currency: string

  // Compliance
  eligibilityAttestations: Record<string, {
    version: number
    text: string
    timestamp: Date
  }>
  
  // Context
  ipAddress?: string
  ipCountry?: string
  userAgent?: string
  
  // Privacy
  isAnonymous: boolean

  // Optional idempotency
  idempotencyKey?: string
}

export interface CreatePaymentResult {
  paymentIntentId: string
  contributionId: string
  complianceCheckId: string
  clientSecret?: string
  redirectUrl?: string
  requiresAction: boolean
}

export interface ConfirmPaymentParams {
  paymentIntentId: string
  paymentMethodId: string
}

export interface ConfirmPaymentResult {
  contributionId: string
  status: PaymentStatus
  failureReason?: string
}

/**
 * Create a payment intent with compliance checks
 * 
 * Steps:
 * 1. Check launch gate
 * 2. Run compliance checks
 * 3. If ALLOW: create payment intent with provider
 * 4. Create contribution and payment intent records
 * 5. Return client secret for frontend
 */
export async function createPayment(
  params: CreatePaymentParams
): Promise<CreatePaymentResult> {
  const { donorEmail, donorFirstName, donorLastName, donorCountry, donorPostalCode, amountCents, currency, eligibilityAttestations, isAnonymous, idempotencyKey, ipAddress, ipCountry, userAgent } = params

  // Step 1: Check launch gate
  const gateCheck = await checkLaunchGate()
  if (!gateCheck.donationsAllowed) {
    throw new PaymentOrchestrationError(
      'Donations are not currently available',
      'DONATIONS_NOT_LIVE',
      { mode: gateCheck.mode, killSwitchActive: gateCheck.killSwitchActive }
    )
  }

  // Step 2: Get latest attestation version
  const attestationVersion = await getLatestAttestationVersion()
  if (!attestationVersion) {
    throw new PaymentOrchestrationError(
      'No attestation version available',
      'ATTESTATION_VERSION_MISSING'
    )
  }

  // Step 3: Run compliance checks
  const complianceResult = await checkCompliance({
    donorEmail,
    donorFirstName,
    donorLastName,
    declaredCountry: donorCountry,
    amountCents,
    currency,
    attestations: eligibilityAttestations,
    ipAddress,
    ipCountry,
    userAgent,
  })

  if (complianceResult.result === 'DENY') {
    throw new PaymentOrchestrationError(
      'Contribution denied by compliance rules',
      'COMPLIANCE_DENIED',
      { 
        checkId: complianceResult.checkId,
        reasons: complianceResult.reasons,
      }
    )
  }

  if (complianceResult.result === 'REVIEW' || complianceResult.requiresReview) {
    throw new PaymentOrchestrationError(
      'Contribution requires manual review',
      'MANUAL_REVIEW_REQUIRED',
      { 
        checkId: complianceResult.checkId,
        reasons: complianceResult.reasons,
      }
    )
  }

  // Step 4: Create payment intent with provider
  const provider = getPaymentProvider()
  
  const checkoutResult = await provider.createCheckout({
    amountCents,
    currency,
    idempotencyKey,
    metadata: {
      complianceCheckId: complianceResult.checkId,
      attestationVersionId: attestationVersion[0]?.key || 'unknown',
      donorEmail,
      donorCountry,
    },
  })

  // Step 5: Create database records
  const contribution = await prisma.$transaction(async (tx) => {
    // Create contribution
    const contrib = await tx.contribution.create({
      data: {
        amountCents,
        currency,
        status: 'PENDING',
        donorEmail,
        donorFirstName,
        donorLastName,
        donorCountry,
        donorPostalCode,
        isAnonymous,
        complianceCheckId: complianceResult.checkId,
        attestationVersionId: attestationVersion[0]?.key || 'unknown',
      },
    })

    // Create payment intent record
    await tx.paymentIntent.create({
      data: {
        providerIntentId: checkoutResult.paymentIntentId,
        provider: provider.name,
        amountCents,
        currency,
        status: 'PENDING',
        contributionId: contrib.id,
        complianceCheckId: complianceResult.checkId,
        clientSecret: checkoutResult.clientSecret,
        metadata: {
          donorEmail,
          donorCountry,
        },
      },
    })

    return contrib
  })

  return {
    paymentIntentId: checkoutResult.paymentIntentId,
    contributionId: contribution.id,
    complianceCheckId: complianceResult.checkId,
    clientSecret: checkoutResult.clientSecret,
    redirectUrl: checkoutResult.redirectUrl,
    requiresAction: !!checkoutResult.redirectUrl,
  }
}

/**
 * Confirm a payment with payment method
 * 
 * Steps:
 * 1. Verify payment intent exists
 * 2. Confirm with provider
 * 3. Update contribution and payment intent status
 * 4. If successful: record ledger entries
 */
export async function confirmPayment(
  params: ConfirmPaymentParams
): Promise<ConfirmPaymentResult> {
  const { paymentIntentId, paymentMethodId } = params

  // Step 1: Get payment intent record
  const paymentIntent = await prisma.paymentIntent.findFirst({
    where: { providerIntentId: paymentIntentId },
    include: {
      contribution: true,
      complianceCheck: true,
    },
  })

  if (!paymentIntent) {
    throw new PaymentOrchestrationError(
      'Payment intent not found',
      'PAYMENT_INTENT_NOT_FOUND',
      { paymentIntentId }
    )
  }

  if (paymentIntent.status !== 'PENDING') {
    throw new PaymentOrchestrationError(
      `Payment intent already ${paymentIntent.status}`,
      'PAYMENT_ALREADY_PROCESSED',
      { paymentIntentId, status: paymentIntent.status }
    )
  }

  // Step 2: Confirm with provider
  const provider = getPaymentProvider(paymentIntent.provider)
  
  const confirmResult = await provider.confirm({
    paymentIntentId,
    paymentMethodId,
  })

  // Step 3: Update database based on result
  if (confirmResult.status === 'succeeded') {
    await prisma.$transaction(async (tx) => {
      // Update payment intent
      await tx.paymentIntent.update({
        where: { providerIntentId: paymentIntentId },
        data: {
          status: 'SUCCEEDED',
          confirmedAt: confirmResult.confirmedAt,
          paymentMethod: paymentMethodId,
        },
      })

      // Update contribution
      await tx.contribution.update({
        where: { id: paymentIntent.contributionId },
        data: {
          status: 'COMPLETED',
          completedAt: confirmResult.confirmedAt,
        },
      })
    })

    // Step 4: Record ledger entries
    // Get payment details to extract processing fee
    const paymentDetails = await provider.retrieve(paymentIntentId)
    const processingFeeCents = await calculateProcessingFee(
      paymentIntent.amountCents,
      paymentDetails
    )

    await recordDonation({
      contributionId: paymentIntent.contributionId,
      paymentIntentId: paymentIntent.providerIntentId,
      complianceCheckId: paymentIntent.complianceCheckId,
      attestationVersionId: paymentIntent.contribution.attestationVersionId,
      grossAmountCents: paymentIntent.amountCents,
      processingFeeCents,
      notes: 'Donation confirmed',
    })

    return {
      contributionId: paymentIntent.contributionId,
      status: 'SUCCEEDED',
    }
  } else {
    // Payment failed
    await prisma.$transaction(async (tx) => {
      await tx.paymentIntent.update({
        where: { providerIntentId: paymentIntentId },
        data: {
          status: 'FAILED',
          failureReason: confirmResult.failureReason,
        },
      })

      await tx.contribution.update({
        where: { id: paymentIntent.contributionId },
        data: {
          status: 'FAILED',
          failureReason: confirmResult.failureReason,
        },
      })
    })

    return {
      contributionId: paymentIntent.contributionId,
      status: 'FAILED',
      failureReason: confirmResult.failureReason,
    }
  }
}

/**
 * Refund a payment
 * 
 * Steps:
 * 1. Verify contribution is refundable
 * 2. Create refund with provider
 * 3. Update contribution status
 * 4. Record ledger entries
 */
export async function refundPayment(params: {
  contributionId: string
  amountCents?: number // Partial refund if specified
  reason: string
  requestedBy: string
}): Promise<void> {
  const { contributionId, amountCents, reason, requestedBy } = params

  // Step 1: Get contribution
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: {
      paymentIntent: true,
    },
  })

  if (!contribution) {
    throw new PaymentOrchestrationError(
      'Contribution not found',
      'CONTRIBUTION_NOT_FOUND',
      { contributionId }
    )
  }

  if (contribution.status !== 'COMPLETED') {
    throw new PaymentOrchestrationError(
      'Can only refund completed contributions',
      'INVALID_STATUS',
      { contributionId, status: contribution.status }
    )
  }

  const paymentIntent = contribution.paymentIntent.find(pi => pi.status === 'SUCCEEDED')
  if (!paymentIntent) {
    throw new PaymentOrchestrationError(
      'No successful payment intent found',
      'PAYMENT_INTENT_NOT_FOUND',
      { contributionId }
    )
  }

  // Step 2: Create refund with provider
  const provider = getPaymentProvider(paymentIntent.provider)
  
  const refundResult = await provider.refund({
    paymentIntentId: paymentIntent.providerIntentId,
    amountCents,
    reason,
  })

  // Step 3: Update contribution status
  await prisma.$transaction(async (tx) => {
    const refundAmountCents = refundResult.amountCents

    await tx.contribution.update({
      where: { id: contributionId },
      data: {
        status: refundAmountCents === contribution.amountCents ? 'REFUNDED' : 'COMPLETED',
        refundedCents: { increment: refundAmountCents },
      },
    })

    await tx.paymentIntent.update({
      where: { providerIntentId: paymentIntent.providerIntentId },
      data: {
        status: refundAmountCents === contribution.amountCents ? 'REFUNDED' : 'SUCCEEDED',
      },
    })
  })

  // Step 4: Record ledger entries
  // Assume no fee returned for simplicity (provider-specific)
  await recordRefund({
    contributionId,
    paymentIntentId: paymentIntent.providerIntentId,
    refundAmountCents: refundResult.amountCents,
    feeReturnedCents: 0,
    reason,
    notes: `Refund requested by ${requestedBy}: ${reason}`,
  })
}

/**
 * Handle a chargeback from provider webhook
 * 
 * Steps:
 * 1. Find contribution
 * 2. Update status to DISPUTED
 * 3. Record ledger entries
 */
export async function handleChargeback(params: {
  paymentIntentId: string
  chargebackAmountCents: number
  chargebackFeeCents: number
  reason?: string
}): Promise<void> {
  const { paymentIntentId, chargebackAmountCents, chargebackFeeCents, reason } = params

  // Step 1: Get payment intent
  const paymentIntent = await prisma.paymentIntent.findFirst({
    where: { providerIntentId: paymentIntentId },
    include: { contribution: true },
  })

  if (!paymentIntent) {
    throw new PaymentOrchestrationError(
      'Payment intent not found',
      'PAYMENT_INTENT_NOT_FOUND',
      { paymentIntentId }
    )
  }

  // Step 2: Update status
  await prisma.$transaction(async (tx) => {
    await tx.contribution.update({
      where: { id: paymentIntent.contributionId },
      data: {
        status: 'DISPUTED',
      },
    })

    await tx.paymentIntent.update({
      where: { providerIntentId: paymentIntentId },
      data: {
        status: 'DISPUTED',
      },
    })
  })

  // Step 3: Record ledger entries
  await recordChargeback({
    contributionId: paymentIntent.contributionId,
    paymentIntentId,
    chargebackAmountCents,
    chargebackFeeCents,
    reason,
    notes: `Chargeback filed: ${reason ?? 'no reason provided'}`,
  })
}

/**
 * Get available balance for transfers
 */
export async function getAvailableBalance(): Promise<{
  availableBalanceCents: number
  grossDonationsCents: number
  netDonationsCents: number
  processingFeesCents: number
  refundsCents: number
  chargebacksCents: number
  transfersOutCents: number
}> {
  const balanceSheet = await calculateBalanceSheet()
  
  return {
    availableBalanceCents: balanceSheet.availableBalanceCents,
    grossDonationsCents: balanceSheet.grossDonationsCents,
    netDonationsCents: balanceSheet.netDonationsCents,
    processingFeesCents: balanceSheet.processingFeesCents,
    refundsCents: balanceSheet.refundsCents,
    chargebacksCents: balanceSheet.chargebacksCents,
    transfersOutCents: balanceSheet.transfersOutCents,
  }
}

/**
 * Calculate processing fee from payment details
 * 
 * Provider-specific fee extraction.
 * Falls back to estimate if not available.
 */
async function calculateProcessingFee(
  amountCents: number,
  paymentDetails: any
): Promise<number> {
  // Try to get actual fee from provider
  if (paymentDetails.feeCents) {
    return paymentDetails.feeCents
  }

  // Fallback: Estimate Stripe fee (2.9% + 30¢)
  // TODO: Make this provider-specific
  return Math.round(amountCents * 0.029 + 30)
}
