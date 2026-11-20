/**
 * Newsletter Signup API
 * 
 * Creates contact with consent, triggers double opt-in email
 * NEVER accepts pre-checked consents without user action
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOrUpdateContact } from '@/lib/communications/consent'
import type { ConsentRecord } from '@/lib/communications/consent'
import { randomBytes } from 'crypto'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  locale: z.string().default('en'),
  consents: z.object({
    news: z.boolean(),
    events: z.boolean(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate
    const body = await request.json()
    const data = signupSchema.parse(body)
    
    // Require at least one consent
    if (!data.consents.news && !data.consents.events) {
      return NextResponse.json(
        { error: 'Please select at least one topic' },
        { status: 400 }
      )
    }
    
    // Build consent records
    const consents: ConsentRecord[] = []
    
    if (data.consents.news) {
      consents.push({
        channel: 'EMAIL',
        topic: 'NEWS',
        status: 'PENDING', // Awaiting double opt-in
        grantedAt: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        consentTextVersion: 'v1', // TODO: Get from ConsentTextVersion table
      })
    }
    
    if (data.consents.events) {
      consents.push({
        channel: 'EMAIL',
        topic: 'EVENTS',
        status: 'PENDING',
        grantedAt: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        consentTextVersion: 'v1',
      })
    }
    
    // Create contact with consents
    const contactId = await createOrUpdateContact(
      {
        email: data.email,
        locale: data.locale,
      },
      consents
    )
    
    // TODO: Send double opt-in email
    // For now, just log
    console.log('[Newsletter] Double opt-in email needed for:', data.email)
    
    return NextResponse.json({
      success: true,
      message: 'Please check your email to confirm your subscription',
    })
  } catch (error) {
    console.error('[Newsletter Signup] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Signup failed. Please try again.' },
      { status: 500 }
    )
  }
}
