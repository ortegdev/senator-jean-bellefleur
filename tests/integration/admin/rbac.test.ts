/**
 * RBAC Permission Tests
 * 
 * Tests:
 * - Permission boundaries (low-role users calling privileged actions fail)
 * - MFA requirements for privileged roles
 * - PII reveal requires reason and is rate-limited
 * - Dual approval for user management
 * - Session revocation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import type { AdminRole, AdminContext } from '@/lib/admin/rbac'
import {
  hasPermission,
  requirePermission,
  requiresMFA,
  checkPIIRevealLimit,
  recordPIIReveal,
  inviteAdminUser,
  approveAdminUser,
  secondApproveAdminUser,
  changeAdminRole,
  removeAdminUser,
  revokeAdminSession,
} from '@/lib/admin/rbac'

describe('RBAC Permission System', () => {
  // Test admin users
  const testAdmins = {
    owner: {
      id: 'owner-test-id',
      email: 'owner@test.example.com',
      name: 'Test Owner',
      role: 'OWNER' as AdminRole,
      mfaEnabled: true,
      mfaVerified: true,
      sessionId: 'session-owner',
    },
    compliance: {
      id: 'compliance-test-id',
      email: 'compliance@test.example.com',
      name: 'Test Compliance',
      role: 'COMPLIANCE' as AdminRole,
      mfaEnabled: true,
      mfaVerified: true,
      sessionId: 'session-compliance',
    },
    editor: {
      id: 'editor-test-id',
      email: 'editor@test.example.com',
      name: 'Test Editor',
      role: 'EDITOR' as AdminRole,
      mfaEnabled: false,
      mfaVerified: false,
      sessionId: 'session-editor',
    },
    readOnly: {
      id: 'readonly-test-id',
      email: 'readonly@test.example.com',
      name: 'Test Read Only',
      role: 'READ_ONLY' as AdminRole,
      mfaEnabled: false,
      mfaVerified: false,
      sessionId: 'session-readonly',
    },
  }

  // Clean up test data
  afterEach(async () => {
    await prisma.adminUser.deleteMany({
      where: { email: { contains: '@test.example.com' } },
    })
    await prisma.pIIReveal.deleteMany({
      where: { adminEmail: { contains: '@test.example.com' } },
    })
  })

  describe('Permission Boundaries', () => {
    it('should allow OWNER to change launch mode', () => {
      const check = hasPermission(testAdmins.owner, 'changeLaunchMode')
      expect(check.allowed).toBe(true)
    })

    it('should deny EDITOR to change launch mode', () => {
      const check = hasPermission(testAdmins.editor, 'changeLaunchMode')
      expect(check.allowed).toBe(false)
      expect(check.reason).toBe('INSUFFICIENT_PERMISSIONS')
    })

    it('should deny READ_ONLY to change launch mode', () => {
      const check = hasPermission(testAdmins.readOnly, 'changeLaunchMode')
      expect(check.allowed).toBe(false)
    })

    it('should allow COMPLIANCE to manage compliance', () => {
      const check = hasPermission(testAdmins.compliance, 'manageCompliance')
      expect(check.allowed).toBe(true)
    })

    it('should deny EDITOR to manage compliance', () => {
      const check = hasPermission(testAdmins.editor, 'manageCompliance')
      expect(check.allowed).toBe(false)
    })

    it('should allow COMPLIANCE to reveal PII', () => {
      const check = hasPermission(testAdmins.compliance, 'revealPII')
      expect(check.allowed).toBe(true)
    })

    it('should deny EDITOR to reveal PII', () => {
      const check = hasPermission(testAdmins.editor, 'revealPII')
      expect(check.allowed).toBe(false)
    })

    it('should deny READ_ONLY to export data', () => {
      const check = hasPermission(testAdmins.readOnly, 'exportData')
      expect(check.allowed).toBe(false)
    })

    it('should throw when requirePermission fails', () => {
      expect(() => {
        requirePermission(testAdmins.readOnly, 'changeLaunchMode')
      }).toThrow('INSUFFICIENT_PERMISSIONS')
    })
  })

  describe('MFA Requirements', () => {
    it('should require MFA for OWNER role', () => {
      expect(requiresMFA('OWNER')).toBe(true)
    })

    it('should require MFA for COMPLIANCE role', () => {
      expect(requiresMFA('COMPLIANCE')).toBe(true)
    })

    it('should require MFA for FINANCE role', () => {
      expect(requiresMFA('FINANCE')).toBe(true)
    })

    it('should not require MFA for EDITOR role', () => {
      expect(requiresMFA('EDITOR')).toBe(false)
    })

    it('should not require MFA for MODERATOR role', () => {
      expect(requiresMFA('MODERATOR')).toBe(false)
    })

    it('should not require MFA for READ_ONLY role', () => {
      expect(requiresMFA('READ_ONLY')).toBe(false)
    })

    it('should deny privileged action without MFA verification', () => {
      const ownerWithoutMFA = {
        ...testAdmins.owner,
        mfaVerified: false,
      }

      const check = hasPermission(ownerWithoutMFA, 'changeLaunchMode')
      expect(check.allowed).toBe(false)
      expect(check.reason).toBe('MFA_REQUIRED')
      expect(check.requiresMFA).toBe(true)
    })
  })

  describe('PII Reveal Controls', () => {
    beforeEach(async () => {
      // Create test admin in database
      await prisma.adminUser.create({
        data: {
          id: testAdmins.compliance.id,
          email: testAdmins.compliance.email,
          name: testAdmins.compliance.name,
          role: testAdmins.compliance.role,
          active: true,
          mfaEnabled: true,
          piiRevealCount: 0,
          piiRevealResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
    })

    it('should require reason for PII reveal', async () => {
      await expect(
        recordPIIReveal(
          testAdmins.compliance,
          'Contribution',
          'contribution-123',
          ['email', 'name'],
          '' // Empty reason
        )
      ).rejects.toThrow('REASON_REQUIRED')
    })

    it('should successfully record PII reveal with reason', async () => {
      await recordPIIReveal(
        testAdmins.compliance,
        'Contribution',
        'contribution-123',
        ['email', 'name', 'address'],
        'Investigation of fraud alert #456'
      )

      const reveal = await prisma.pIIReveal.findFirst({
        where: {
          adminId: testAdmins.compliance.id,
          entityType: 'Contribution',
          entityId: 'contribution-123',
        },
      })

      expect(reveal).toBeDefined()
      expect(reveal!.fields).toEqual(['email', 'name', 'address'])
      expect(reveal!.reason).toBe('Investigation of fraud alert #456')
    })

    it('should enforce rate limit (50 per day)', async () => {
      // Set reveal count to 49
      await prisma.adminUser.update({
        where: { id: testAdmins.compliance.id },
        data: { piiRevealCount: 49 },
      })

      // 50th reveal: should succeed
      await recordPIIReveal(
        testAdmins.compliance,
        'Contribution',
        'contrib-50',
        ['email'],
        'Legitimate reason'
      )

      // Check limit
      const limitCheck = await checkPIIRevealLimit(testAdmins.compliance.id)
      expect(limitCheck.allowed).toBe(false)
      expect(limitCheck.remaining).toBe(0)

      // 51st reveal: should fail
      await expect(
        recordPIIReveal(
          testAdmins.compliance,
          'Contribution',
          'contrib-51',
          ['email'],
          'Another reason'
        )
      ).rejects.toThrow('PII_REVEAL_LIMIT_EXCEEDED')
    })

    it('should reset rate limit after 24 hours', async () => {
      // Set count to 50 and reset time in past
      await prisma.adminUser.update({
        where: { id: testAdmins.compliance.id },
        data: {
          piiRevealCount: 50,
          piiRevealResetAt: new Date(Date.now() - 1000), // 1 second ago
        },
      })

      // Check limit - should reset
      const limitCheck = await checkPIIRevealLimit(testAdmins.compliance.id)
      expect(limitCheck.allowed).toBe(true)
      expect(limitCheck.remaining).toBe(50)

      // Should be able to reveal again
      await recordPIIReveal(
        testAdmins.compliance,
        'Contribution',
        'contrib-after-reset',
        ['email'],
        'After reset'
      )

      // Verify counter was reset
      const admin = await prisma.adminUser.findUnique({
        where: { id: testAdmins.compliance.id },
      })
      expect(admin!.piiRevealCount).toBe(1)
    })
  })

  describe('User Management with Dual Approval', () => {
    beforeEach(async () => {
      // Create test admins
      await prisma.adminUser.createMany({
        data: [
          {
            id: testAdmins.owner.id,
            email: testAdmins.owner.email,
            name: testAdmins.owner.name,
            role: testAdmins.owner.role,
            active: true,
            mfaEnabled: true,
          },
          {
            id: 'second-owner-id',
            email: 'second-owner@test.example.com',
            name: 'Second Owner',
            role: 'OWNER',
            active: true,
            mfaEnabled: true,
          },
        ],
      })
    })

    it('should invite EDITOR without requiring approval', async () => {
      const result = await inviteAdminUser(testAdmins.owner, {
        email: 'new-editor@test.example.com',
        name: 'New Editor',
        role: 'EDITOR',
      })

      expect(result.requiresApproval).toBe(false)

      const user = await prisma.adminUser.findUnique({
        where: { id: result.id },
      })

      expect(user!.active).toBe(true) // Active immediately
      expect(user!.approvedBy).toBeNull() // No approval needed
    })

    it('should invite OWNER requiring dual approval', async () => {
      const result = await inviteAdminUser(testAdmins.owner, {
        email: 'new-owner@test.example.com',
        name: 'New Owner',
        role: 'OWNER',
      })

      expect(result.requiresApproval).toBe(true)

      const user = await prisma.adminUser.findUnique({
        where: { id: result.id },
      })

      expect(user!.active).toBe(false) // Not active until approved
      expect(user!.invitedBy).toBe(testAdmins.owner.id)
    })

    it('should require first approval for privileged role', async () => {
      const inviteResult = await inviteAdminUser(testAdmins.owner, {
        email: 'new-compliance@test.example.com',
        name: 'New Compliance',
        role: 'COMPLIANCE',
      })

      const secondOwner = {
        ...testAdmins.owner,
        id: 'second-owner-id',
        email: 'second-owner@test.example.com',
      }

      const approveResult = await approveAdminUser(secondOwner, inviteResult.id)

      expect(approveResult.requiresSecondApproval).toBe(true)

      const user = await prisma.adminUser.findUnique({
        where: { id: inviteResult.id },
      })

      expect(user!.approvedBy).toBe(secondOwner.id)
      expect(user!.active).toBe(false) // Still not active
    })

    it('should prevent approving your own invitation', async () => {
      const inviteResult = await inviteAdminUser(testAdmins.owner, {
        email: 'self-approve@test.example.com',
        name: 'Self Approve',
        role: 'COMPLIANCE',
      })

      await expect(
        approveAdminUser(testAdmins.owner, inviteResult.id)
      ).rejects.toThrow('CANNOT_APPROVE_OWN_INVITATION')
    })

    it('should activate user after second approval', async () => {
      // Invite
      const inviteResult = await inviteAdminUser(testAdmins.owner, {
        email: 'dual-approval@test.example.com',
        name: 'Dual Approval',
        role: 'OWNER',
      })

      const secondOwner = {
        ...testAdmins.owner,
        id: 'second-owner-id',
        email: 'second-owner@test.example.com',
      }

      // First approval
      await approveAdminUser(secondOwner, inviteResult.id)

      // Create third owner for second approval
      await prisma.adminUser.create({
        data: {
          id: 'third-owner-id',
          email: 'third-owner@test.example.com',
          name: 'Third Owner',
          role: 'OWNER',
          active: true,
          mfaEnabled: true,
        },
      })

      const thirdOwner = {
        ...testAdmins.owner,
        id: 'third-owner-id',
        email: 'third-owner@test.example.com',
      }

      // Second approval
      await secondApproveAdminUser(thirdOwner, inviteResult.id)

      const user = await prisma.adminUser.findUnique({
        where: { id: inviteResult.id },
      })

      expect(user!.active).toBe(true) // Now active
      expect(user!.secondApprovedBy).toBe(thirdOwner.id)
    })

    it('should prevent same person doing both approvals', async () => {
      const inviteResult = await inviteAdminUser(testAdmins.owner, {
        email: 'same-approver@test.example.com',
        name: 'Same Approver',
        role: 'COMPLIANCE',
      })

      const secondOwner = {
        ...testAdmins.owner,
        id: 'second-owner-id',
        email: 'second-owner@test.example.com',
      }

      // First approval
      await approveAdminUser(secondOwner, inviteResult.id)

      // Try second approval with same person
      await expect(
        secondApproveAdminUser(secondOwner, inviteResult.id)
      ).rejects.toThrow('CANNOT_BE_SAME_APPROVER')
    })

    it('should require reason for role change', async () => {
      await prisma.adminUser.create({
        data: {
          id: 'role-change-test',
          email: 'role-change@test.example.com',
          name: 'Role Change Test',
          role: 'EDITOR',
          active: true,
        },
      })

      await expect(
        changeAdminRole(
          testAdmins.owner,
          'role-change-test',
          'COMPLIANCE',
          '' // Empty reason
        )
      ).rejects.toThrow('REASON_REQUIRED')
    })

    it('should prevent changing own role', async () => {
      await expect(
        changeAdminRole(
          testAdmins.owner,
          testAdmins.owner.id,
          'EDITOR',
          'Downgrading myself'
        )
      ).rejects.toThrow('CANNOT_CHANGE_OWN_ROLE')
    })

    it('should prevent removing yourself', async () => {
      await expect(
        removeAdminUser(
          testAdmins.owner,
          testAdmins.owner.id,
          'Removing myself'
        )
      ).rejects.toThrow('CANNOT_REMOVE_SELF')
    })

    it('should deactivate user on removal', async () => {
      await prisma.adminUser.create({
        data: {
          id: 'remove-test',
          email: 'remove@test.example.com',
          name: 'Remove Test',
          role: 'EDITOR',
          active: true,
        },
      })

      await removeAdminUser(
        testAdmins.owner,
        'remove-test',
        'No longer needed'
      )

      const user = await prisma.adminUser.findUnique({
        where: { id: 'remove-test' },
      })

      expect(user!.active).toBe(false)
      expect(user!.suspended).toBe(true)
      expect(user!.suspensionReason).toContain('Removed')
    })
  })

  describe('Session Management', () => {
    beforeEach(async () => {
      await prisma.adminUser.create({
        data: {
          id: testAdmins.editor.id,
          email: testAdmins.editor.email,
          name: testAdmins.editor.name,
          role: testAdmins.editor.role,
          active: true,
        },
      })

      await prisma.adminSession.create({
        data: {
          id: 'test-session-1',
          userId: testAdmins.editor.id,
          token: 'test-token-1',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
    })

    it('should require reason for session revocation', async () => {
      await expect(
        revokeAdminSession(
          testAdmins.owner,
          'test-session-1',
          '' // Empty reason
        )
      ).rejects.toThrow('REASON_REQUIRED')
    })

    it('should revoke session with reason', async () => {
      await revokeAdminSession(
        testAdmins.owner,
        'test-session-1',
        'Security audit - revoking all sessions'
      )

      const session = await prisma.adminSession.findUnique({
        where: { id: 'test-session-1' },
      })

      expect(session!.revoked).toBe(true)
      expect(session!.revokedBy).toBe(testAdmins.owner.id)
      expect(session!.revokeReason).toBe('Security audit - revoking all sessions')
    })
  })
})
