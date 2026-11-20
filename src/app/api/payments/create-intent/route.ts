import { NextRequest, NextResponse } from 'next/server'
import { enforcePaymentGate } from '@/lib/launch-gate/enforcement'
import { z } from 'zod'

/**
 * Create Payment Intent Endpoint
 * 
 * CRITICAL: Protected by launch gate
 * Returns 403 if not in DONATIONS_LIVE mode
 */

const createIntentSchema = z.object({
  amountCents: z.number().int().positive().min(500).max(100000),
  donorEmail: z.string().email(),
  locale: z.string().default('en'),
})

export async function POST(request: NextRequest) {
  // LAUNCH GATE ENFORCEMENT
  const gateResponse = await enforcePaymentGate()
  if (gateResponse) {
    return gateResponse // 403 Forbidden
  }

  try {
    const body = await request.json()
    const validated = createIntentSchema.parse(body)

    // TODO: Implement payment intent creation
    // This is where you'd call the payment provider adapter

    return NextResponse.json({
      success: true,
      message: 'Payment intent creation would happen here',
      data: validated,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
