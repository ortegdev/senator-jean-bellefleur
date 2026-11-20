import { NextRequest, NextResponse } from 'next/server'
import { enforceWaitlistGate } from '@/lib/launch-gate/enforcement'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * Waitlist Signup Endpoint
 * 
 * Protected by launch gate
 * Only available in WAITLIST or DONATIONS_LIVE modes
 */

const waitlistSchema = z.object({
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
  emailConsent: z.boolean().default(false),
  whatsappConsent: z.boolean().default(false),
  locale: z.string().default('en'),
  referralCode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // LAUNCH GATE ENFORCEMENT
  const gateResponse = await enforceWaitlistGate()
  if (gateResponse) {
    return gateResponse // 403 Forbidden
  }

  try {
    const body = await request.json()
    const validated = waitlistSchema.parse(body)

    // Require at least one contact method
    if (!validated.email && !validated.whatsapp) {
      return NextResponse.json(
        { error: 'At least one contact method (email or WhatsApp) is required' },
        { status: 400 }
      )
    }

    // Require consent for provided contact methods
    if (validated.email && !validated.emailConsent) {
      return NextResponse.json(
        { error: 'Email consent is required when providing email' },
        { status: 400 }
      )
    }

    if (validated.whatsapp && !validated.whatsappConsent) {
      return NextResponse.json(
        { error: 'WhatsApp consent is required when providing WhatsApp' },
        { status: 400 }
      )
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')

    // Create waitlist signup
    const signup = await prisma.waitlistSignup.create({
      data: {
        email: validated.email,
        whatsapp: validated.whatsapp,
        emailConsent: validated.emailConsent,
        whatsappConsent: validated.whatsappConsent,
        locale: validated.locale,
        referralCode: validated.referralCode,
        ipAddress,
        userAgent,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully added to waitlist',
      id: signup.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Waitlist signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
