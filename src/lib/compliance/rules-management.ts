/**
 * Compliance Rules Management
 * 
 * CRITICAL RULES:
 * 1. Only COMPLIANCE role can create/edit rules
 * 2. All changes require dual approval
 * 3. Complete audit trail
 * 4. Legal basis reference required
 * 5. Version history maintained
 */

import { prisma } from '@/lib/db/prisma'
import type {
  RuleType,
  RuleVersionStatus,
  ComplianceRule,
  ComplianceRuleVersion,
} from '@prisma/client'

export interface CreateRuleInput {
  name: string
  description: string
  ruleType: RuleType
  config: any
  legalBasisReference: string
  effectiveFrom: Date
  effectiveTo?: Date
  createdBy: string
  createdByEmail: string
}

export interface UpdateRuleInput {
  ruleId: string
  name?: string
  description?: string
  config?: any
  legalBasisReference?: string
  effectiveFrom?: Date
  effectiveTo?: Date
  updatedBy: string
  updatedByEmail: string
}

/**
 * Create a new compliance rule (DRAFT state)
 * Requires COMPLIANCE role
 */
export async function createRule(
  input: CreateRuleInput,
  userRole: string
): Promise<{ success: boolean; ruleId?: string; error?: string }> {
  if (userRole !== 'COMPLIANCE' && userRole !== 'OWNER') {
    return { success: false, error: 'Only COMPLIANCE role can create rules' }
  }

  // Create rule
  const rule = await prisma.complianceRule.create({
    data: {
      name: input.name,
      description: input.description,
      ruleType: input.ruleType,
      config: input.config as any,
      legalBasisReference: input.legalBasisReference,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      isActive: false, // Not active until approved
    },
  })

  // Create first version
  await prisma.complianceRuleVersion.create({
    data: {
      ruleId: rule.id,
      version: 1,
      name: input.name,
      description: input.description,
      ruleType: input.ruleType,
      config: input.config as any,
      legalBasisReference: input.legalBasisReference,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      isActive: false,
      status: 'DRAFT',
      createdBy: input.createdBy,
      createdByEmail: input.createdByEmail,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'COMPLIANCE_RULE_CREATED',
      entityType: 'ComplianceRule',
      entityId: rule.id,
      changes: {
        name: input.name,
        ruleType: input.ruleType,
      },
      userId: input.createdBy,
      userEmail: input.createdByEmail,
    },
  })

  return { success: true, ruleId: rule.id }
}

/**
 * Submit rule for first approval
 */
export async function submitForApproval(
  ruleId: string,
  userId: string,
  userEmail: string,
  userRole: string
): Promise<{ success: boolean; error?: string }> {
  if (userRole !== 'COMPLIANCE' && userRole !== 'OWNER') {
    return { success: false, error: 'Only COMPLIANCE role can submit rules' }
  }

  const latestVersion = await getLatestVersion(ruleId)
  
  if (!latestVersion) {
    return { success: false, error: 'Rule not found' }
  }

  if (latestVersion.status !== 'DRAFT') {
    return { success: false, error: 'Only DRAFT rules can be submitted' }
  }

  await prisma.complianceRuleVersion.update({
    where: { id: latestVersion.id },
    data: {
      status: 'PENDING_FIRST_APPROVAL',
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'COMPLIANCE_RULE_SUBMITTED',
      entityType: 'ComplianceRuleVersion',
      entityId: latestVersion.id,
      changes: {
        status: 'PENDING_FIRST_APPROVAL',
      },
      userId,
      userEmail,
    },
  })

  return { success: true }
}

/**
 * First approval (cannot be the creator)
 */
export async function firstApproval(
  ruleId: string,
  approverId: string,
  approverEmail: string,
  approverRole: string
): Promise<{ success: boolean; error?: string }> {
  if (approverRole !== 'COMPLIANCE' && approverRole !== 'OWNER') {
    return { success: false, error: 'Only COMPLIANCE role can approve rules' }
  }

  const latestVersion = await getLatestVersion(ruleId)
  
  if (!latestVersion) {
    return { success: false, error: 'Rule not found' }
  }

  if (latestVersion.status !== 'PENDING_FIRST_APPROVAL') {
    return { success: false, error: 'Rule is not pending first approval' }
  }

  // Cannot approve your own creation
  if (latestVersion.createdBy === approverId) {
    return { success: false, error: 'Cannot approve your own rule creation' }
  }

  await prisma.complianceRuleVersion.update({
    where: { id: latestVersion.id },
    data: {
      status: 'PENDING_SECOND_APPROVAL',
      approvedBy: approverId,
      approvedByEmail: approverEmail,
      approvedAt: new Date(),
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'COMPLIANCE_RULE_FIRST_APPROVED',
      entityType: 'ComplianceRuleVersion',
      entityId: latestVersion.id,
      changes: {
        status: 'PENDING_SECOND_APPROVAL',
        approvedBy: approverEmail,
      },
      userId: approverId,
      userEmail: approverEmail,
    },
  })

  return { success: true }
}

/**
 * Second approval (cannot be creator or first approver)
 */
export async function secondApproval(
  ruleId: string,
  approverId: string,
  approverEmail: string,
  approverRole: string
): Promise<{ success: boolean; error?: string }> {
  if (approverRole !== 'COMPLIANCE' && approverRole !== 'OWNER') {
    return { success: false, error: 'Only COMPLIANCE role can approve rules' }
  }

  const latestVersion = await getLatestVersion(ruleId)
  
  if (!latestVersion) {
    return { success: false, error: 'Rule not found' }
  }

  if (latestVersion.status !== 'PENDING_SECOND_APPROVAL') {
    return { success: false, error: 'Rule is not pending second approval' }
  }

  // Cannot approve your own creation or be first approver
  if (latestVersion.createdBy === approverId || latestVersion.approvedBy === approverId) {
    return { success: false, error: 'Cannot provide second approval if you created or first-approved this rule' }
  }

  await prisma.complianceRuleVersion.update({
    where: { id: latestVersion.id },
    data: {
      status: 'APPROVED',
      secondApprovedBy: approverId,
      secondApprovedByEmail: approverEmail,
      secondApprovedAt: new Date(),
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'COMPLIANCE_RULE_SECOND_APPROVED',
      entityType: 'ComplianceRuleVersion',
      entityId: latestVersion.id,
      changes: {
        status: 'APPROVED',
        secondApprovedBy: approverEmail,
      },
      userId: approverId,
      userEmail: approverEmail,
    },
  })

  return { success: true }
}

/**
 * Activate approved rule (make it live)
 */
export async function activateRule(
  ruleId: string,
  activatorId: string,
  activatorEmail: string,
  activatorRole: string
): Promise<{ success: boolean; error?: string }> {
  if (activatorRole !== 'COMPLIANCE' && activatorRole !== 'OWNER') {
    return { success: false, error: 'Only COMPLIANCE role can activate rules' }
  }

  const latestVersion = await getLatestVersion(ruleId)
  
  if (!latestVersion) {
    return { success: false, error: 'Rule not found' }
  }

  if (latestVersion.status !== 'APPROVED') {
    return { success: false, error: 'Only APPROVED rules can be activated' }
  }

  // Deactivate previous active version
  const previousActive = await prisma.complianceRuleVersion.findFirst({
    where: {
      ruleId,
      status: 'ACTIVE',
    },
  })

  if (previousActive) {
    await prisma.complianceRuleVersion.update({
      where: { id: previousActive.id },
      data: { status: 'SUPERSEDED' },
    })
  }

  // Activate new version
  await prisma.complianceRuleVersion.update({
    where: { id: latestVersion.id },
    data: {
      status: 'ACTIVE',
      isActive: true,
      activatedAt: new Date(),
      activatedBy: activatorId,
    },
  })

  // Update rule
  await prisma.complianceRule.update({
    where: { id: ruleId },
    data: {
      name: latestVersion.name,
      description: latestVersion.description,
      config: latestVersion.config,
      legalBasisReference: latestVersion.legalBasisReference,
      effectiveFrom: latestVersion.effectiveFrom,
      effectiveTo: latestVersion.effectiveTo,
      isActive: true,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'COMPLIANCE_RULE_ACTIVATED',
      entityType: 'ComplianceRule',
      entityId: ruleId,
      changes: {
        status: 'ACTIVE',
        activatedBy: activatorEmail,
      },
      userId: activatorId,
      userEmail: activatorEmail,
    },
  })

  return { success: true }
}

/**
 * Reject a rule version
 */
export async function rejectRule(
  ruleId: string,
  rejectorId: string,
  rejectorEmail: string,
  rejectorRole: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (rejectorRole !== 'COMPLIANCE' && rejectorRole !== 'OWNER') {
    return { success: false, error: 'Only COMPLIANCE role can reject rules' }
  }

  const latestVersion = await getLatestVersion(ruleId)
  
  if (!latestVersion) {
    return { success: false, error: 'Rule not found' }
  }

  if (!['PENDING_FIRST_APPROVAL', 'PENDING_SECOND_APPROVAL'].includes(latestVersion.status)) {
    return { success: false, error: 'Only pending rules can be rejected' }
  }

  await prisma.complianceRuleVersion.update({
    where: { id: latestVersion.id },
    data: {
      status: 'REJECTED',
      rejectedBy: rejectorId,
      rejectedByEmail: rejectorEmail,
      rejectedAt: new Date(),
      rejectionReason: reason,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'COMPLIANCE_RULE_REJECTED',
      entityType: 'ComplianceRuleVersion',
      entityId: latestVersion.id,
      changes: {
        status: 'REJECTED',
        rejectedBy: rejectorEmail,
        reason,
      },
      userId: rejectorId,
      userEmail: rejectorEmail,
      reason,
    },
  })

  return { success: true }
}

/**
 * Get latest version of a rule
 */
async function getLatestVersion(ruleId: string): Promise<ComplianceRuleVersion | null> {
  return await prisma.complianceRuleVersion.findFirst({
    where: { ruleId },
    orderBy: { version: 'desc' },
  })
}

/**
 * Get all versions of a rule
 */
export async function getRuleVersions(ruleId: string): Promise<ComplianceRuleVersion[]> {
  return await prisma.complianceRuleVersion.findMany({
    where: { ruleId },
    orderBy: { version: 'desc' },
  })
}

/**
 * Get all active rules
 */
export async function getActiveRules(): Promise<ComplianceRule[]> {
  return await prisma.complianceRule.findMany({
    where: {
      isActive: true,
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: new Date() } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Get rules pending approval
 */
export async function getPendingRules(): Promise<ComplianceRuleVersion[]> {
  return await prisma.complianceRuleVersion.findMany({
    where: {
      status: {
        in: ['PENDING_FIRST_APPROVAL', 'PENDING_SECOND_APPROVAL', 'APPROVED'],
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}
