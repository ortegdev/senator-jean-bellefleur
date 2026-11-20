/**
 * Compliance Test API
 * 
 * Simulates compliance checks for testing purposes.
 * COMPLIANCE role only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCompliance, type DonationAttempt } from '@/lib/compliance/engine'

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check for COMPLIANCE role
    // For now, allow all requests (this is a test endpoint)

    const body = await request.json()

    // Build test attempt
    const attempt: DonationAttempt = {
      donorEmail: body.donorEmail,
      donorFirstName: body.donorFirstName,
      donorLastName: body.donorLastName,
      declaredCountry: body.declaredCountry,
      
      amountCents: body.amountCents,
      currency: 'USD',
      
      paymentMethodType: 'card',
      cardType: body.cardType,
      cardCountry: body.cardCountry,
      
      attestations: {
        ageConfirm: {
          version: 1,
          text: 'I confirm that I am at least 18 years old',
          timestamp: new Date(),
        },
        legalConfirm: {
          version: 1,
          text: 'I confirm that this contribution complies with applicable election laws',
          timestamp: new Date(),
        },
        foreignAgentConfirm: {
          version: 1,
          text: 'I understand that this is an independent initiative',
          timestamp: new Date(),
        },
      },
      
      ipAddress: '8.8.8.8', // Test IP
      ipCountry: body.declaredCountry, // Assume IP matches declared for test
    }

    // Run compliance check
    const result = await checkCompliance(attempt)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Compliance test error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    )
  }
}
