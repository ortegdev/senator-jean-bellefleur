/**
 * Payment Provider Webhook Handler
 * 
 * Receives and processes webhook events from payment providers.
 * 
 * Features:
 * - Signature verification
 * - Idempotent processing (dedupe by provider event ID)
 * - Retry-safe handlers
 * - Automatic status updates
 * - Ledger entry creation
 * 
 * Security:
 * - Verifies webhook signature
 * - Rate limited by IP
 * - Logs all attempts
 * - No sensitive data in responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getPaymentProvider } from '@/lib/payments/factory'
import { handleChargeback } from '@/lib/payments/orchestrator'
import { recordDonation } from '@/lib/payments/ledger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteContext {
  params: {
    provider: string
  }
}

/**
 * POST /api/webhooks/[provider]
 * 
 * Webhook receiver endpoint.
 * Provider sends events here for payment status updates.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { provider: providerName } = context.params

  try {
    // Step 1: Get provider instance
    const provider = getPaymentProvider(providerName)

    // Step 2: Get raw body and signature
    const payload = await request.text()
    const signature = request.headers.get('stripe-signature') ?? 
                     request.headers.get('x-webhook-signature') ?? 
                     ''

    if (!signature) {
      console.error('[Webhook] Missing signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Step 3: Verify and parse webhook
    const webhookResult = await provider.handleWebhook({
      payload,
      signature,
    })

    // Step 4: Check if already processed (idempotency)
    if (!webhookResult.processed) {
      console.log(`[Webhook] Event ${webhookResult.eventId} already processed`)
      return NextResponse.json({ received: true, processed: false })
    }

    // Step 5: Store webhook event
    await prisma.webhookEvent.create({
      data: {
        provider: providerName,
        providerEventId: webhookResult.eventId,
        eventType: webhookResult.eventType,
        payload,
        signature,
        processed: true,
      },
    })

    // Step 6: Handle event based on type
    await handleWebhookEvent(webhookResult.eventType, webhookResult.data, providerName)

    return NextResponse.json({ received: true, processed: true })

  } catch (error: any) {
    console.error('[Webhook] Error processing webhook:', error)

    // Log failed webhook attempt
    try {
      await prisma.webhookEvent.create({
        data: {
          provider: providerName,
          providerEventId: `error_${Date.now()}`,
          eventType: 'error',
          payload: await request.text(),
          signature: request.headers.get('stripe-signature') ?? '',
          processed: false,
          error: error.message,
        },
      })
    } catch (logError) {
      console.error('[Webhook] Failed to log error:', logError)
    }

    // Return 400 for verification errors, 500 for others
    const status = error.name === 'WebhookVerificationError' ? 400 : 500
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status }
    )
  }
}

/**
 * Handle specific webhook event types
 */
async function handleWebhookEvent(
  eventType: string,
  data: any,
  providerName: string
): Promise<void> {
  console.log(`[Webhook] Handling ${eventType} from ${providerName}`)

  switch (eventType) {
    case 'payment_intent.succeeded':
    case 'charge.succeeded':
      await handlePaymentSucceeded(data, providerName)
      break

    case 'payment_intent.payment_failed':
    case 'charge.failed':
      await handlePaymentFailed(data, providerName)
      break

    case 'charge.refunded':
      await handlePaymentRefunded(data, providerName)
      break

    case 'charge.dispute.created':
    case 'payment_intent.disputed':
      await handleChargebackCreated(data, providerName)
      break

    case 'charge.dispute.closed':
      await handleChargebackClosed(data, providerName)
      break

    default:
      console.log(`[Webhook] Unhandled event type: ${eventType}`)
  }
}

/**
 * Handle successful payment webhook
 * 
 * This is a backup in case confirm() wasn't called or failed.
 * Updates payment intent and contribution status.
 * Records ledger entries if not already done.
 */
async function handlePaymentSucceeded(
  data: any,
  providerName: string
): Promise<void> {
  const paymentIntentId = data.id || data.payment_intent

  const paymentIntent = await prisma.paymentIntent.findFirst({
    where: { 
      providerIntentId: paymentIntentId,
      provider: providerName,
    },
    include: {
      contribution: true,
    },
  })

  if (!paymentIntent) {
    console.warn(`[Webhook] Payment intent not found: ${paymentIntentId}`)
    return
  }

  // If already succeeded, skip
  if (paymentIntent.status === 'SUCCEEDED') {
    console.log(`[Webhook] Payment ${paymentIntentId} already succeeded`)
    return
  }

  // Update payment intent and contribution
  await prisma.$transaction(async (tx) => {
    await tx.paymentIntent.update({
      where: { providerIntentId: paymentIntentId },
      data: {
        status: 'SUCCEEDED',
        confirmedAt: new Date(),
      },
    })

    await tx.contribution.update({
      where: { id: paymentIntent.contributionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })
  })

  // Check if ledger entries already exist
  const existingEntries = await prisma.ledgerEntry.count({
    where: { paymentIntentId: paymentIntent.providerIntentId },
  })

  if (existingEntries === 0) {
    // Record ledger entries
    const processingFeeCents = Math.round(paymentIntent.amountCents * 0.029 + 30) // Estimate
    
    await recordDonation({
      contributionId: paymentIntent.contributionId,
      paymentIntentId: paymentIntent.providerIntentId,
      complianceCheckId: paymentIntent.complianceCheckId,
      attestationVersionId: paymentIntent.contribution.attestationVersionId,
      grossAmountCents: paymentIntent.amountCents,
      processingFeeCents,
      notes: 'Donation confirmed via webhook',
    })
  }

  console.log(`[Webhook] Payment succeeded: ${paymentIntentId}`)
}

/**
 * Handle failed payment webhook
 */
async function handlePaymentFailed(
  data: any,
  providerName: string
): Promise<void> {
  const paymentIntentId = data.id || data.payment_intent
  const failureReason = data.failure_reason || data.failure_message || 'unknown'

  const paymentIntent = await prisma.paymentIntent.findFirst({
    where: { 
      providerIntentId: paymentIntentId,
      provider: providerName,
    },
  })

  if (!paymentIntent) {
    console.warn(`[Webhook] Payment intent not found: ${paymentIntentId}`)
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.paymentIntent.update({
      where: { providerIntentId: paymentIntentId },
      data: {
        status: 'FAILED',
        failureReason,
      },
    })

    await tx.contribution.update({
      where: { id: paymentIntent.contributionId },
      data: {
        status: 'FAILED',
        failureReason,
      },
    })
  })

  console.log(`[Webhook] Payment failed: ${paymentIntentId} - ${failureReason}`)
}

/**
 * Handle refund webhook
 */
async function handlePaymentRefunded(
  data: any,
  providerName: string
): Promise<void> {
  const paymentIntentId = data.id || data.payment_intent
  const refundAmountCents = data.amount_refunded || 0

  const paymentIntent = await prisma.paymentIntent.findFirst({
    where: { 
      providerIntentId: paymentIntentId,
      provider: providerName,
    },
    include: { contribution: true },
  })

  if (!paymentIntent) {
    console.warn(`[Webhook] Payment intent not found: ${paymentIntentId}`)
    return
  }

  const contribution = paymentIntent.contribution

  await prisma.$transaction(async (tx) => {
    const isFullRefund = refundAmountCents === contribution.amountCents

    await tx.paymentIntent.update({
      where: { providerIntentId: paymentIntentId },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'SUCCEEDED',
      },
    })

    await tx.contribution.update({
      where: { id: contribution.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'COMPLETED',
        refundedCents: { increment: refundAmountCents },
      },
    })
  })

  console.log(`[Webhook] Refund processed: ${paymentIntentId} - ${refundAmountCents} cents`)
}

/**
 * Handle chargeback created webhook
 */
async function handleChargebackCreated(
  data: any,
  providerName: string
): Promise<void> {
  const paymentIntentId = data.payment_intent || data.charge
  const chargebackAmountCents = data.amount || 0
  const chargebackFeeCents = data.fee || 1500 // Default $15 chargeback fee
  const reason = data.reason || 'unknown'

  await handleChargeback({
    paymentIntentId,
    chargebackAmountCents,
    chargebackFeeCents,
    reason,
  })

  console.log(`[Webhook] Chargeback created: ${paymentIntentId} - ${reason}`)
}

/**
 * Handle chargeback closed webhook (won or lost)
 */
async function handleChargebackClosed(
  data: any,
  providerName: string
): Promise<void> {
  const paymentIntentId = data.payment_intent || data.charge
  const status = data.status // 'won', 'lost', 'warning_closed'

  console.log(`[Webhook] Chargeback closed: ${paymentIntentId} - ${status}`)

  // If won, we could reverse the chargeback entries
  // For now, just log it
  // TODO: Implement chargeback reversal ledger entries
}
