/**
 * Email Verification (Double Opt-In)
 * 
 * Confirms email address and activates consent
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }
    
    // Find consent by verification token
    const consent = await prisma.channelConsent.findFirst({
      where: {
        verificationToken: token,
        status: 'PENDING',
      },
    })
    
    if (!consent) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }
    
    // Update consent status to ACTIVE
    await prisma.channelConsent.update({
      where: { id: consent.id },
      data: {
        status: 'ACTIVE',
        verifiedAt: new Date(),
        verificationToken: null, // Clear token after use
      },
    })
    
    // Redirect to success page
    return NextResponse.redirect(
      new URL('/newsletter/verified', request.url)
    )
  } catch (error) {
    console.error('[Email Verification] Error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
