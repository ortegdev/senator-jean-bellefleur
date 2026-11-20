import { NextResponse } from 'next/server'
import { isDonationsLive, getCurrentMode } from './mode'

/**
 * Payment Route Enforcement
 * 
 * Server-side middleware that rejects payment requests
 * unless DONATIONS_LIVE is active.
 * 
 * Returns 403 Forbidden in INFO_ONLY, WAITLIST, or when kill switch is active.
 */

export async function enforcePaymentGate() {
  const donationsLive = await isDonationsLive()

  if (!donationsLive) {
    return NextResponse.json(
      {
        error: 'Donations are not currently available',
        code: 'DONATIONS_NOT_LIVE',
      },
      { status: 403 }
    )
  }

  return null // Allow request to proceed
}

/**
 * Waitlist Route Enforcement
 * 
 * Allows data collection only in WAITLIST or DONATIONS_LIVE modes
 */
export async function enforceWaitlistGate() {
  const mode = await getCurrentMode()

  if (mode === 'INFO_ONLY') {
    return NextResponse.json(
      {
        error: 'Waitlist signup not available in current mode',
        code: 'WAITLIST_NOT_AVAILABLE',
      },
      { status: 403 }
    )
  }

  return null // Allow request to proceed
}

/**
 * Get current mode info for client
 */
export async function getModeInfo() {
  const mode = await getCurrentMode()
  const donationsLive = await isDonationsLive()

  return {
    mode,
    donationsLive,
    waitlistAvailable: mode !== 'INFO_ONLY',
  }
}
