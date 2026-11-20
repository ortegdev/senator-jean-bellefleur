/**
 * Launch Gate Checks
 * 
 * Server-side enforcement of launch gate status.
 * Determines if donations/payments are currently allowed.
 */

import { prisma } from '@/lib/db/prisma'
import type { LaunchMode } from '@prisma/client'

export interface LaunchGateStatus {
  donationsAllowed: boolean
  waitlistAvailable: boolean
  mode: LaunchMode
  killSwitchActive: boolean
  reason?: string
}

/**
 * Check if donations are currently allowed
 * 
 * Returns false if:
 * - Mode is not DONATIONS_LIVE
 * - Kill switch is active
 * - Candidacy status is UNVERIFIED
 * - Required checklist items are incomplete
 */
export async function checkLaunchGate(): Promise<LaunchGateStatus> {
  try {
    // Get launch config (there should only be one record)
    const config = await prisma.launchConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    if (!config) {
      return {
        donationsAllowed: false,
        waitlistAvailable: false,
        mode: 'INFO_ONLY',
        killSwitchActive: false,
        reason: 'Launch configuration not found',
      }
    }

    // Check kill switch first (highest priority)
    if (config.killSwitchActive) {
      return {
        donationsAllowed: false,
        waitlistAvailable: config.mode !== 'INFO_ONLY',
        mode: config.mode,
        killSwitchActive: true,
        reason: config.killSwitchReason || 'Emergency stop activated',
      }
    }

    // Check mode
    if (config.mode === 'INFO_ONLY') {
      return {
        donationsAllowed: false,
        waitlistAvailable: false,
        mode: config.mode,
        killSwitchActive: false,
        reason: 'Site is in information-only mode',
      }
    }

    if (config.mode === 'WAITLIST') {
      return {
        donationsAllowed: false,
        waitlistAvailable: true,
        mode: config.mode,
        killSwitchActive: false,
        reason: 'Donations not yet live - waitlist available',
      }
    }

    // Mode is DONATIONS_LIVE - check additional requirements
    const candidateConfig = await prisma.candidateConfig.findFirst({
      where: { slug: 'bellefleur' },
      orderBy: { version: 'desc' },
    })

    if (!candidateConfig) {
      return {
        donationsAllowed: false,
        waitlistAvailable: true,
        mode: config.mode,
        killSwitchActive: false,
        reason: 'Candidate configuration not found',
      }
    }

    // Check candidacy status
    if (candidateConfig.candidacyStatus === 'UNVERIFIED') {
      return {
        donationsAllowed: false,
        waitlistAvailable: true,
        mode: config.mode,
        killSwitchActive: false,
        reason: 'Candidacy status must be verified before accepting donations',
      }
    }

    // All checks passed
    return {
      donationsAllowed: true,
      waitlistAvailable: true,
      mode: config.mode,
      killSwitchActive: false,
    }
  } catch (error) {
    console.error('Error checking launch gate:', error)
    return {
      donationsAllowed: false,
      waitlistAvailable: false,
      mode: 'INFO_ONLY',
      killSwitchActive: false,
      reason: 'Error checking launch gate status',
    }
  }
}

/**
 * Convenience function that throws if donations not allowed
 * Use this in payment routes to fail fast
 */
export async function requireDonationsLive(): Promise<void> {
  const status = await checkLaunchGate()
  
  if (!status.donationsAllowed) {
    throw new Error(status.reason || 'Donations are not currently available')
  }
}

/**
 * Check if a specific mode is active
 */
export async function isMode(mode: LaunchMode): Promise<boolean> {
  const config = await prisma.launchConfig.findFirst({
    orderBy: { updatedAt: 'desc' },
  })
  
  return config?.mode === mode
}

/**
 * Get current launch mode
 */
export async function getCurrentMode(): Promise<LaunchMode> {
  const config = await prisma.launchConfig.findFirst({
    orderBy: { updatedAt: 'desc' },
  })
  
  return config?.mode || 'INFO_ONLY'
}
