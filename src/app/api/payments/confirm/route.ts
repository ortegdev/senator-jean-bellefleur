/**
 * Confirm Payment API
 * 
 * POST /api/payments/confirm
 * 
 * Confirms a payment intent with payment method.
 * Creates ledger entries on success.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { confirmPayment, PaymentOrchestrationError } from '@/lib/payments/orchestrator'

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
  paymentMethodId: z.string().min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body = await request.json()
    const parsed = confirmPaymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    // Confirm payment
    const result = await confirmPayment(parsed.data)

    if (result.status === 'SUCCEEDED') {
      return NextResponse.json({
        success: true,
        contributionId: result.contributionId,
        status: result.status,
      })
    } else {
      return NextResponse.json({
        success: false,
        contributionId: result.contributionId,
        status: result.status,
        failureReason: result.failureReason,
      })
    }

  } catch (error: any) {
    console.error('[API] Confirm payment error:', error)

    // Handle known errors
    if (error instanceof PaymentOrchestrationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      { 
        error: 'Failed to confirm payment',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
