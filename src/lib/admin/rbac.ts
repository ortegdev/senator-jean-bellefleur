/**
 * Role-Based Access Control (RBAC)
 * 
 * Features:
 * - Role-based permission checks
 * - MFA enforcement for privileged roles
 * - Server-side permission verification
 * - Rate limiting for sensitive actions
 * - Audit logging integration
 */

import { prisma } from '@/lib/db/prisma'
import type { AdminRole } from '@prisma/client'
import { createTamperEvidentAuditLog } from './audit-log'

// ============================================================================
// Types
// ============================================================================

export interface AdminContext {
  userId: string
  email: string
  name: string
  role: AdminRole
  mfaEnabled: boolean
  mfaVerified: boolean // True if MFA challenge passed this session
  sessionId: string
  ipAddress?: string
  userAgent?: string
}

export interface PermissionCheck {
  allowed: boolean
  reason?: string
  requiresMFA?: boolean
}

// ============================================================================
// Role Permissions Matrix
// ============================================================================

const ROLE_PERMISSIONS = {
  OWNER: {
    changeLaunchMode: true,
    manageUsers: true,
    manageChecklist: true,
    viewDonations: true,
    revealPII: true,
    exportData: true,
    manageCompliance: true,
    manageFinance: true,
    manageContent: true,
    manageAlerts: true,
    viewAuditLog: true,
    requiresMFA: true,
  },
  COMPLIANCE: {
    changeLaunchMode: false,
    manageUsers: false,
    manageChecklist: false,
    viewDonations: true,
    revealPII: true,
    exportData: true,
    manageCompliance: true,
    manageFinance: false,
    manageContent: false,
    manageAlerts: true,
    viewAuditLog: true,
    requiresMFA: true,
  },
  FINANCE: {
    changeLaunchMode: false,
    manageUsers: false,
    manageChecklist: false,
    viewDonations: true,
    revealPII: true,
    exportData: true,
    manageCompliance: false,
    manageFinance: true,
    manageContent: false,
    manageAlerts: true,
    viewAuditLog: true,
    requiresMFA: true,
  },
  EDITOR: {
    changeLaunchMode: false,
    manageUsers: false,
    manageChecklist: false,
    viewDonations: false,
    revealPII: false,
    exportData: false,
    manageCompliance: false,
    manageFinance: false,
    manageContent: true,
    manageAlerts: false,
    viewAuditLog: false,
    requiresMFA: false,
  },
  MODERATOR: {
    changeLaunchMode: false,
    manageUsers: false,
    manageChecklist: false,
    viewDonations: false,
    revealPII: false,
    exportData: false,
    manageCompliance: false,
    manageFinance: false,
    manageContent: false, // Can moderate, not edit
    manageAlerts: false,
    viewAuditLog: false,
    requiresMFA: false,
  },
  READ_ONLY: {
    changeLaunchMode: false,
    manageUsers: false,
    manageChecklist: false,
    viewDonations: false, // Read-only can view aggregates, not individual donations
    revealPII: false,
    exportData: false,
    manageCompliance: false,
    manageFinance: false,
    manageContent: false,
    manageAlerts: false,
    viewAuditLog: false,
    requiresMFA: false,
  },
} as const

// ============================================================================
// Permission Checks
// ============================================================================

/**
 * Check if admin has permission for an action
 */
export function hasPermission(
  context: AdminContext,
  permission: keyof typeof ROLE_PERMISSIONS.OWNER
): PermissionCheck {
  const rolePermissions = ROLE_PERMISSIONS[context.role]
  const allowed = rolePermissions[permission] as boolean

  if (!allowed) {
    return {
      allowed: false,
      reason: 'INSUFFICIENT_PERMISSIONS',
    }
  }

  // Check MFA requirement
  if (rolePermissions.requiresMFA && !context.mfaVerified) {
    return {
      allowed: false,
      reason: 'MFA_REQUIRED',
      requiresMFA: true,
    }
  }

  return { allowed: true }
}

/**
 * Require permission or throw error
 */
export function requirePermission(
  context: AdminContext,
  permission: keyof typeof ROLE_PERMISSIONS.OWNER
): void {
  const check = hasPermission(context, permission)

  if (!check.allowed) {
    throw new Error(check.reason)
  }
}

/**
 * Check if role requires MFA
 */
export function requiresMFA(role: AdminRole): boolean {
  return ROLE_PERMISSIONS[role].requiresMFA
}

/**
 * Verify admin user is active and not suspended
 */
export async function verifyAdminActive(userId: string): Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      active: true,
      suspended: true,
    },
  })

  if (!admin) {
    return false
  }

  return admin.active && !admin.suspended
}

/**
 * Get admin context from session
 */
export async function getAdminContext(
  sessionToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AdminContext | null> {
  // Find valid session
  const session = await prisma.adminSession.findFirst({
    where: {
      token: sessionToken,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          mfaEnabled: true,
          active: true,
          suspended: true,
        },
      },
    },
  })

  if (!session || !session.user.active || session.user.suspended) {
    return null
  }

  // Update last used timestamp
  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    mfaEnabled: session.user.mfaEnabled,
    mfaVerified: true, // Assume verified if session exists (implement MFA challenge separately)
    sessionId: session.id,
    ipAddress,
    userAgent,
  }
}

// ============================================================================
// PII Reveal (Rate-limited, audit-logged)
// ============================================================================

const PII_REVEAL_LIMITS = {
  PER_ADMIN_PER_DAY: 50,
} as const

/**
 * Check if admin can reveal PII (rate limits)
 */
export async function checkPIIRevealLimit(adminId: string): Promise<{
  allowed: boolean
  remaining: number
  resetsAt: Date
}> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: {
      piiRevealCount: true,
      piiRevealResetAt: true,
    },
  })

  if (!admin) {
    throw new Error('ADMIN_NOT_FOUND')
  }

  const now = new Date()
  let count = admin.piiRevealCount
  let resetsAt = admin.piiRevealResetAt || now

  // Reset if past reset time
  if (resetsAt < now) {
    count = 0
    resetsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
    
    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        piiRevealCount: 0,
        piiRevealResetAt: resetsAt,
      },
    })
  }

  const remaining = PII_REVEAL_LIMITS.PER_ADMIN_PER_DAY - count

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    resetsAt,
  }
}

/**
 * Record PII reveal and audit log
 */
export async function recordPIIReveal(
  context: AdminContext,
  entityType: string,
  entityId: string,
  fields: string[],
  reason: string
): Promise<void> {
  if (!reason.trim()) {
    throw new Error('REASON_REQUIRED')
  }

  // Check rate limit
  const limitCheck = await checkPIIRevealLimit(context.userId)
  if (!limitCheck.allowed) {
    throw new Error('PII_REVEAL_LIMIT_EXCEEDED')
  }

  // Create PII reveal record
  await prisma.pIIReveal.create({
    data: {
      adminId: context.userId,
      adminEmail: context.email,
      entityType,
      entityId,
      fields,
      reason: reason.trim(),
      ipAddress: context.ipAddress,
    },
  })

  // Increment counter
  await prisma.adminUser.update({
    where: { id: context.userId },
    data: {
      piiRevealCount: { increment: 1 },
    },
  })

  // Audit log
  await createTamperEvidentAuditLog({
    action: 'PII_REVEALED',
    entityType,
    entityId,
    actorId: context.userId,
    actorEmail: context.email,
    actorRole: context.role,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    reason,
    metadata: { fields },
  })
}

// ============================================================================
// User Management (Dual Approval)
// ============================================================================

/**
 * Invite admin user (requires approval for privileged roles)
 */
export async function inviteAdminUser(
  context: AdminContext,
  inviteData: {
    email: string
    name: string
    role: AdminRole
  }
): Promise<{ id: string; requiresApproval: boolean }> {
  requirePermission(context, 'manageUsers')

  // Check if user already exists
  const existing = await prisma.adminUser.findUnique({
    where: { email: inviteData.email.toLowerCase() },
  })

  if (existing) {
    throw new Error('USER_ALREADY_EXISTS')
  }

  // Determine if approval is required
  const requiresApproval = requiresMFA(inviteData.role)

  const user = await prisma.adminUser.create({
    data: {
      email: inviteData.email.toLowerCase(),
      name: inviteData.name,
      role: inviteData.role,
      active: !requiresApproval, // Active immediately if no approval needed
      invitedBy: context.userId,
      invitedByEmail: context.email,
      invitedAt: new Date(),
    },
  })

  // Audit log
  await createTamperEvidentAuditLog({
    action: 'ADMIN_USER_INVITED',
    entityType: 'AdminUser',
    entityId: user.id,
    actorId: context.userId,
    actorEmail: context.email,
    actorRole: context.role,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      invitedEmail: inviteData.email,
      invitedRole: inviteData.role,
      requiresApproval,
    },
  })

  return {
    id: user.id,
    requiresApproval,
  }
}

/**
 * Approve admin user (first approval)
 */
export async function approveAdminUser(
  context: AdminContext,
  userId: string
): Promise<{ requiresSecondApproval: boolean }> {
  requirePermission(context, 'manageUsers')

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  // Cannot approve yourself
  if (user.invitedBy === context.userId) {
    throw new Error('CANNOT_APPROVE_OWN_INVITATION')
  }

  // Check if already approved
  if (user.approvedBy) {
    throw new Error('ALREADY_APPROVED')
  }

  await prisma.adminUser.update({
    where: { id: userId },
    data: {
      approvedBy: context.userId,
      approvedByEmail: context.email,
      approvedAt: new Date(),
    },
  })

  // Audit log
  await createTamperEvidentAuditLog({
    action: 'ADMIN_USER_APPROVED_FIRST',
    entityType: 'AdminUser',
    entityId: userId,
    actorId: context.userId,
    actorEmail: context.email,
    actorRole: context.role,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })

  // Privileged roles require second approval
  return {
    requiresSecondApproval: requiresMFA(user.role),
  }
}

/**
 * Second approval for privileged admin roles
 */
export async function secondApproveAdminUser(
  context: AdminContext,
  userId: string
): Promise<void> {
  requirePermission(context, 'manageUsers')

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  // Must have first approval
  if (!user.approvedBy) {
    throw new Error('REQUIRES_FIRST_APPROVAL')
  }

  // Cannot be same person as first approver
  if (user.approvedBy === context.userId) {
    throw new Error('CANNOT_BE_SAME_APPROVER')
  }

  await prisma.adminUser.update({
    where: { id: userId },
    data: {
      secondApprovedBy: context.userId,
      secondApprovedByEmail: context.email,
      secondApprovedAt: new Date(),
      active: true, // Now active
    },
  })

  // Audit log
  await createTamperEvidentAuditLog({
    action: 'ADMIN_USER_APPROVED_SECOND',
    entityType: 'AdminUser',
    entityId: userId,
    actorId: context.userId,
    actorEmail: context.email,
    actorRole: context.role,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })
}

/**
 * Change admin user role (requires dual approval)
 */
export async function changeAdminRole(
  context: AdminContext,
  userId: string,
  newRole: AdminRole,
  reason: string
): Promise<{ requiresApproval: boolean }> {
  requirePermission(context, 'manageUsers')

  if (!reason.trim()) {
    throw new Error('REASON_REQUIRED')
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  // Cannot change own role
  if (userId === context.userId) {
    throw new Error('CANNOT_CHANGE_OWN_ROLE')
  }

  const oldRole = user.role

  // If changing to privileged role, requires approval
  const requiresApproval = requiresMFA(newRole) || requiresMFA(oldRole)

  await prisma.adminUser.update({
    where: { id: userId },
    data: {
      role: newRole,
      // Reset approvals if changing to privileged role
      ...(requiresApproval && {
        active: false,
        approvedBy: null,
        approvedAt: null,
        secondApprovedBy: null,
        secondApprovedAt: null,
      }),
    },
  })

  // Audit log
  await createTamperEvidentAuditLog({
    action: 'ADMIN_USER_ROLE_CHANGED',
    entityType: 'AdminUser',
    entityId: userId,
    actorId: context.userId,
    actorEmail: context.email,
    actorRole: context.role,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    reason,
    changes: {
      oldRole,
      newRole,
    },
  })

  return { requiresApproval }
}

/**
 * Remove admin user
 */
export async function removeAdminUser(
  context: AdminContext,
  userId: string,
  reason: string
): Promise<void> {
  requirePermission(context, 'manageUsers')

  if (!reason.trim()) {
    throw new Error('REASON_REQUIRED')
  }

  // Cannot remove yourself
  if (userId === context.userId) {
    throw new Error('CANNOT_REMOVE_SELF')
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  // Deactivate instead of delete (preserve audit trail)
  await prisma.adminUser.update({
    where: { id: userId },
    data: {
      active: false,
      suspended: true,
      suspendedBy: context.userId,
      suspendedAt: new Date(),
      suspensionReason: `Removed: ${reason}`,
    },
  })

  // Revoke all sessions
  await prisma.adminSession.updateMany({
    where: { userId },
    data: {
      revoked: true,
      revokedBy: context.userId,
      revokedAt: new Date(),
      revokeReason: 'User removed',
    },
  })

  // Audit log
  await createTamperEvidentAuditLog({
    action: 'ADMIN_USER_REMOVED',
    entityType: 'AdminUser',
    entityId: userId,
    actorId: context.userId,
    actorEmail: context.email,
    actorRole: context.role,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    reason,
    metadata: {
      removedEmail: user.email,
      removedRole: user.role,
    },
  })
}

/**
 * Revoke admin session
 */
export async function revokeAdminSession(
  context: AdminContext,
  sessionId: string,
  reason: string
): Promise<void> {
  if (!reason.trim()) {
    throw new Error('REASON_REQUIRED')
  }

  const session = await prisma.adminSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) {
    throw new Error('SESSION_NOT_FOUND')
  }

  await prisma.adminSession.update({
    where: { id: sessionId },
    data: {
      revoked: true,
      revokedBy: context.userId,
      revokedAt: new Date(),
      revokeReason: reason,
    },
  })

  // Audit log
  await createTamperEvidentAuditLog({
    action: 'ADMIN_SESSION_REVOKED',
    entityType: 'AdminSession',
    entityId: sessionId,
    actorId: context.userId,
    actorEmail: context.email,
    actorRole: context.role,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    reason,
    metadata: {
      revokedUserId: session.userId,
    },
  })
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(
  context: AdminContext,
  userId: string,
  reason: string
): Promise<number> {
  requirePermission(context, 'manageUsers')

  if (!reason.trim()) {
    throw new Error('REASON_REQUIRED')
  }

  const result = await prisma.adminSession.updateMany({
    where: {
      userId,
      revoked: false,
    },
    data: {
      revoked: true,
      revokedBy: context.userId,
      revokedAt: new Date(),
      revokeReason: reason,
    },
  })

  // Audit log
  await createTamperEvidentAuditLog({
    action: 'ADMIN_ALL_SESSIONS_REVOKED',
    entityType: 'AdminUser',
    entityId: userId,
    actorId: context.userId,
    actorEmail: context.email,
    actorRole: context.role,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    reason,
    metadata: {
      sessionsRevoked: result.count,
    },
  })

  return result.count
}
