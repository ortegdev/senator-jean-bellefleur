/**
 * Unsubscribe API
 * 
 * Revokes consent for specific channel/topic or globally
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { revokeConsent, revokeAllConsents } from '@/lib/communications/consent'

const unsubscribeSchema = z.object({
  email: z.string().email(),
  channel: z.enum(['EMAIL', 'SMS', 'TELEGRAM', 'WEB_PUSH']).optional(),
  topic: z.enum(['NEWS', 'EVENTS', 'FUNDRAISING', 'VOLUNTEER']).optional(),
  global: z.boolean().default(false),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = unsubscribeSchema.parse(body)
    
    if (data.global) {
      // Revoke all consents
      await revokeAllConsents(data.email, data.reason)
    } else {
      // Revoke specific channel/topic
      if (!data.channel || !data.topic) {
        return NextResponse.json(
          { error: 'Channel and topic required for specific unsubscribe' },
          { status: 400 }
        )
      }
      
      await revokeConsent(
        data.email,
        data.channel,
        data.topic,
        data.reason
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'You have been unsubscribed',
    })
  } catch (error) {
    console.error('[Unsubscribe] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Unsubscribe failed' },
      { status: 500 }
    )
  }
}

// GET endpoint for one-click unsubscribe links
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    const channel = request.nextUrl.searchParams.get('channel')
    const topic = request.nextUrl.searchParams.get('topic')
    const global = request.nextUrl.searchParams.get('global') === 'true'
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    if (global) {
      await revokeAllConsents(email, 'One-click unsubscribe')
    } else if (channel && topic) {
      await revokeConsent(
        email,
        channel as any,
        topic as any,
        'One-click unsubscribe'
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid unsubscribe parameters' },
        { status: 400 }
      )
    }
    
    // Redirect to confirmation page
    return NextResponse.redirect(
      new URL('/unsubscribed', request.url)
    )
  } catch (error) {
    console.error('[Unsubscribe GET] Error:', error)
    return NextResponse.json(
      { error: 'Unsubscribe failed' },
      { status: 500 }
    )
  }
}
