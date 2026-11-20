import { NextRequest, NextResponse } from 'next/server'
import { getModeInfo } from '@/lib/launch-gate/enforcement'

/**
 * Launch Mode Info Endpoint
 * 
 * Public endpoint that returns current mode information
 * Used by client to show/hide features
 */

export async function GET(_request: NextRequest) {
  try {
    const modeInfo = await getModeInfo()

    return NextResponse.json({
      success: true,
      data: modeInfo,
    })
  } catch (error) {
    console.error('Error getting mode info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
