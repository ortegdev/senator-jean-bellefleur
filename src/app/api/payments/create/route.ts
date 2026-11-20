/**
 * Create Payment Intent API
 * 
 * POST /api/payments/create
 * 
 * Creates a payment intent after compliance checks.
 * Returns client secret or redirect URL for frontend.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createPayment, PaymentOrchestrationError } from '@/lib/payments/orchestrator'

const createPaymentSchema = z.object({
  // Donor information
  donor: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    country: z.string().length(2),
    postalCode: z.string().optional(),
    addressLine1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),

  // Amount
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).toUpperCase(),

  // Eligibility attestations
  eligibilityAttestations: z.object({
    isEligibleDonor: z.boolean(),
    notProhibitedSource: z.boolean(),
    accurateInformation: z.boolean(),
  }),

  // Privacy
  isAnonymous: z.boolean(),

  // Optional idempotency
  idempotencyKey: z.string().optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body = await request.json()
    const parsed = createPaymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    // Create payment intent
    const result = await createPayment(parsed.data)

    return NextResponse.json({
      success: true,
      paymentIntentId: result.paymentIntentId,
      contributionId: result.contributionId,
      complianceCheckId: result.complianceCheckId,
      clientSecret: result.clientSecret,
      redirectUrl: result.redirectUrl,
      requiresAction: result.requiresAction,
    })

  } catch (error: any) {
    console.error('[API] Create payment error:', error)

    // Handle known errors
    if (error instanceof PaymentOrchestrationError) {
      const statusCode = 
        error.code === 'DONATIONS_NOT_LIVE' ? 403 :
        error.code === 'COMPLIANCE_DENIED' ? 403 :
        error.code === 'MANUAL_REVIEW_REQUIRED' ? 202 :
        400

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: statusCode }
      )
    }

    // Generic error
    return NextResponse.json(
      { 
        error: 'Failed to create payment',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
