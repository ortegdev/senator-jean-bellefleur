import { prisma } from '@/lib/db/prisma'
import type { LaunchMode } from '@prisma/client'

/**
 * Launch Gate Mode Management
 * 
 * CRITICAL RULES:
 * 1. Only OWNER role can change modes
 * 2. DONATIONS_LIVE requires complete checklist
 * 3. All mode changes are audit-logged
 * 4. Kill switch takes precedence
 */

export async function getCurrentMode(): Promise<LaunchMode> {
  const gate = await prisma.launchGate.findFirst()

  if (!gate) {
    // Create default gate if none exists
    const newGate = await prisma.launchGate.create({
      data: {
        mode: 'INFO_ONLY',
      },
    })
    return newGate.mode
  }

  // Kill switch takes precedence
  if (gate.killSwitchActive) {
    return 'WAITLIST'
  }

  return gate.mode
}

export async function isKillSwitchActive(): Promise<boolean> {
  const gate = await prisma.launchGate.findFirst()
  return gate?.killSwitchActive ?? false
}

export async function isDonationsLive(): Promise<boolean> {
  const mode = await getCurrentMode()
  const killSwitch = await isKillSwitchActive()
  return mode === 'DONATIONS_LIVE' && !killSwitch
}

export async function canCollectWaitlistData(): Promise<boolean> {
  const mode = await getCurrentMode()
  return mode === 'WAITLIST' || mode === 'DONATIONS_LIVE'
}

/**
 * Validate if DONATIONS_LIVE can be activated
 */
export async function validateDonationsLiveActivation(): Promise<{
  valid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  // Check candidacy status
  const candidate = await prisma.candidateConfig.findFirst({
    where: { slug: 'bellefleur' },
  })

  if (!candidate) {
    errors.push('Candidate configuration not found')
    return { valid: false, errors }
  }

  if (candidate.candidacyStatus === 'UNVERIFIED') {
    errors.push('Candidacy status must be verified before activating donations')
  }

  if (!candidate.candidacyEvidenceUrl) {
    errors.push('Candidacy evidence must be attached')
  }

  // Check all required checklist items are complete
  const incompleteItems = await prisma.launchChecklistItem.findMany({
    where: {
      required: true,
      checked: false,
    },
  })

  if (incompleteItems.length > 0) {
    errors.push(
      `${incompleteItems.length} required checklist items are incomplete: ${incompleteItems.map((i) => i.title).join(', ')}`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Change launch mode (OWNER only)
 */
export async function changeLaunchMode(
  newMode: LaunchMode,
  userId: string,
  userEmail: string,
  reason: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  // Validate user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || user.role !== 'OWNER') {
    return { success: false, error: 'Only OWNER role can change launch mode' }
  }

  // Special validation for DONATIONS_LIVE
  if (newMode === 'DONATIONS_LIVE') {
    const validation = await validateDonationsLiveActivation()
    if (!validation.valid) {
      return {
        success: false,
        error: `Cannot activate DONATIONS_LIVE: ${validation.errors.join('; ')}`,
      }
    }
  }

  const gate = await prisma.launchGate.findFirst()

  if (!gate) {
    return { success: false, error: 'Launch gate not initialized' }
  }

  const oldMode = gate.mode

  // Update mode
  await prisma.launchGate.update({
    where: { id: gate.id },
    data: {
      mode: newMode,
      modeChangedBy: userEmail,
      modeChangedAt: new Date(),
      modeChangeReason: reason,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'LAUNCH_MODE_CHANGED',
      entityType: 'LaunchGate',
      entityId: gate.id,
      changes: {
        old: oldMode,
        new: newMode,
      },
      userId,
      userEmail,
      ipAddress,
      reason,
    },
  })

  return { success: true }
}

/**
 * Activate kill switch (OWNER only)
 * Instantly returns to WAITLIST mode
 */
export async function activateKillSwitch(
  userId: string,
  userEmail: string,
  reason: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  // Validate user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || user.role !== 'OWNER') {
    return { success: false, error: 'Only OWNER role can activate kill switch' }
  }

  const gate = await prisma.launchGate.findFirst()

  if (!gate) {
    return { success: false, error: 'Launch gate not initialized' }
  }

  // Activate kill switch
  await prisma.launchGate.update({
    where: { id: gate.id },
    data: {
      killSwitchActive: true,
      killSwitchReason: reason,
      killSwitchBy: userEmail,
      killSwitchAt: new Date(),
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'KILL_SWITCH_ACTIVATED',
      entityType: 'LaunchGate',
      entityId: gate.id,
      changes: {
        killSwitchActive: true,
        reason,
      },
      userId,
      userEmail,
      ipAddress,
      reason,
    },
  })

  return { success: true }
}

/**
 * Deactivate kill switch (OWNER only)
 */
export async function deactivateKillSwitch(
  userId: string,
  userEmail: string,
  reason: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  // Validate user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || user.role !== 'OWNER') {
    return { success: false, error: 'Only OWNER role can deactivate kill switch' }
  }

  const gate = await prisma.launchGate.findFirst()

  if (!gate) {
    return { success: false, error: 'Launch gate not initialized' }
  }

  // Deactivate kill switch
  await prisma.launchGate.update({
    where: { id: gate.id },
    data: {
      killSwitchActive: false,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'KILL_SWITCH_DEACTIVATED',
      entityType: 'LaunchGate',
      entityId: gate.id,
      changes: {
        killSwitchActive: false,
      },
      userId,
      userEmail,
      ipAddress,
      reason,
    },
  })

  return { success: true }
}
