import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import {
  getCurrentMode,
  isDonationsLive,
  validateDonationsLiveActivation,
  changeLaunchMode,
  activateKillSwitch,
  deactivateKillSwitch,
} from '@/lib/launch-gate/mode'
import {
  getChecklistStatus,
  updateChecklistItem,
  getIncompleteRequiredItems,
} from '@/lib/launch-gate/checklist'

describe('Launch Gate System', () => {
  let ownerUser: any

  beforeEach(async () => {
    // Create test owner user
    ownerUser = await prisma.user.create({
      data: {
        email: 'test-owner@example.com',
        name: 'Test Owner',
        role: 'OWNER',
        active: true,
      },
    })

    // Reset launch gate to default
    await prisma.launchGate.deleteMany()
    await prisma.launchGate.create({
      data: {
        id: 'test-gate',
        mode: 'INFO_ONLY',
        killSwitchActive: false,
      },
    })
  })

  describe('Mode Management', () => {
    it('starts in INFO_ONLY mode by default', async () => {
      const mode = await getCurrentMode()
      expect(mode).toBe('INFO_ONLY')
    })

    it('isDonationsLive returns false in INFO_ONLY', async () => {
      const live = await isDonationsLive()
      expect(live).toBe(false)
    })

    it('allows OWNER to change to WAITLIST', async () => {
      const result = await changeLaunchMode(
        'WAITLIST',
        ownerUser.id,
        ownerUser.email,
        'Testing mode change'
      )

      expect(result.success).toBe(true)

      const mode = await getCurrentMode()
      expect(mode).toBe('WAITLIST')
    })

    it('rejects non-OWNER from changing mode', async () => {
      const viewerUser = await prisma.user.create({
        data: {
          email: 'viewer@example.com',
          name: 'Viewer',
          role: 'VIEWER',
          active: true,
        },
      })

      const result = await changeLaunchMode(
        'WAITLIST',
        viewerUser.id,
        viewerUser.email,
        'Should fail'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Only OWNER')
    })

    it('audit logs mode changes', async () => {
      await changeLaunchMode(
        'WAITLIST',
        ownerUser.id,
        ownerUser.email,
        'Test reason'
      )

      const logs = await prisma.auditLog.findMany({
        where: { action: 'LAUNCH_MODE_CHANGED' },
      })

      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0]?.userEmail).toBe(ownerUser.email)
      expect(logs[0]?.reason).toBe('Test reason')
    })
  })

  describe('DONATIONS_LIVE Validation', () => {
    it('rejects DONATIONS_LIVE with UNVERIFIED candidacy', async () => {
      const validation = await validateDonationsLiveActivation()

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Candidacy status must be verified before activating donations')
    })

    it('rejects DONATIONS_LIVE with incomplete checklist', async () => {
      // Update candidacy status
      await prisma.candidateConfig.updateMany({
        where: { slug: 'bellefleur' },
        data: {
          candidacyStatus: 'REGISTERED_PRELIMINARY',
          candidacyEvidenceUrl: 'https://example.com/evidence.pdf',
        },
      })

      const validation = await validateDonationsLiveActivation()

      expect(validation.valid).toBe(false)
      expect(validation.errors.some(e => e.includes('required checklist items'))).toBe(true)
    })

    it('allows DONATIONS_LIVE when all requirements met', async () => {
      // Update candidacy
      await prisma.candidateConfig.updateMany({
        where: { slug: 'bellefleur' },
        data: {
          candidacyStatus: 'REGISTERED_PRELIMINARY',
          candidacyEvidenceUrl: 'https://example.com/evidence.pdf',
        },
      })

      // Mark all required checklist items as complete
      const items = await prisma.launchChecklistItem.findMany({
        where: { required: true },
      })

      for (const item of items) {
        await prisma.launchChecklistItem.update({
          where: { id: item.id },
          data: {
            checked: true,
            checkedBy: 'Test User',
            checkedAt: new Date(),
            documentRef: 'TEST-DOC-001',
          },
        })
      }

      const validation = await validateDonationsLiveActivation()
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('prevents activating DONATIONS_LIVE with validation errors', async () => {
      const result = await changeLaunchMode(
        'DONATIONS_LIVE',
        ownerUser.id,
        ownerUser.email,
        'Should fail'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot activate DONATIONS_LIVE')
    })
  })

  describe('Kill Switch', () => {
    beforeEach(async () => {
      // Set mode to DONATIONS_LIVE
      await prisma.launchGate.updateMany({
        data: { mode: 'DONATIONS_LIVE' },
      })

      // Complete all requirements
      await prisma.candidateConfig.updateMany({
        where: { slug: 'bellefleur' },
        data: {
          candidacyStatus: 'REGISTERED_PRELIMINARY',
          candidacyEvidenceUrl: 'https://example.com/evidence.pdf',
        },
      })

      await prisma.launchChecklistItem.updateMany({
        where: { required: true },
        data: {
          checked: true,
          checkedBy: 'Test',
          checkedAt: new Date(),
        },
      })
    })

    it('kill switch disables donations even in DONATIONS_LIVE', async () => {
      await activateKillSwitch(
        ownerUser.id,
        ownerUser.email,
        'Emergency stop'
      )

      const live = await isDonationsLive()
      expect(live).toBe(false)

      // Mode is still DONATIONS_LIVE but kill switch overrides
      const mode = await getCurrentMode()
      expect(mode).toBe('WAITLIST') // Returns WAITLIST when kill switch active
    })

    it('audit logs kill switch activation', async () => {
      await activateKillSwitch(
        ownerUser.id,
        ownerUser.email,
        'Test emergency'
      )

      const logs = await prisma.auditLog.findMany({
        where: { action: 'KILL_SWITCH_ACTIVATED' },
      })

      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0]?.reason).toBe('Test emergency')
    })

    it('allows deactivating kill switch', async () => {
      await activateKillSwitch(
        ownerUser.id,
        ownerUser.email,
        'Emergency'
      )

      await deactivateKillSwitch(
        ownerUser.id,
        ownerUser.email,
        'Emergency resolved'
      )

      const live = await isDonationsLive()
      expect(live).toBe(true)
    })

    it('rejects non-OWNER from kill switch operations', async () => {
      const viewerUser = await prisma.user.create({
        data: {
          email: 'viewer2@example.com',
          name: 'Viewer',
          role: 'VIEWER',
          active: true,
        },
      })

      const result = await activateKillSwitch(
        viewerUser.id,
        viewerUser.email,
        'Should fail'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Only OWNER')
    })
  })

  describe('Checklist Management', () => {
    it('calculates checklist status correctly', async () => {
      const status = await getChecklistStatus()

      expect(status.total).toBeGreaterThan(0)
      expect(status.required).toBeGreaterThan(0)
      expect(status.completed).toBe(0) // Initially none completed
      expect(status.allRequiredComplete).toBe(false)
    })

    it('allows OWNER to update checklist items', async () => {
      const items = await prisma.launchChecklistItem.findMany()
      const firstItem = items[0]

      if (!firstItem) throw new Error('No checklist items found')

      const result = await updateChecklistItem(
        firstItem.itemKey,
        {
          checked: true,
          checkedBy: 'Test Owner',
          documentRef: 'DOC-001',
          notes: 'Test completion',
        },
        ownerUser.id,
        ownerUser.email
      )

      expect(result.success).toBe(true)

      const updated = await prisma.launchChecklistItem.findUnique({
        where: { itemKey: firstItem.itemKey },
      })

      expect(updated?.checked).toBe(true)
      expect(updated?.checkedBy).toBe('Test Owner')
    })

    it('audit logs checklist updates', async () => {
      const items = await prisma.launchChecklistItem.findMany()
      const firstItem = items[0]

      if (!firstItem) throw new Error('No checklist items found')

      await updateChecklistItem(
        firstItem.itemKey,
        {
          checked: true,
          checkedBy: 'Test Owner',
        },
        ownerUser.id,
        ownerUser.email
      )

      const logs = await prisma.auditLog.findMany({
        where: { action: 'CHECKLIST_ITEM_UPDATED' },
      })

      expect(logs.length).toBeGreaterThan(0)
    })

    it('getIncompleteRequiredItems returns unchecked required items', async () => {
      const incomplete = await getIncompleteRequiredItems()

      expect(incomplete.length).toBeGreaterThan(0)
      incomplete.forEach(item => {
        expect(item.required).toBe(true)
        expect(item.checked).toBe(false)
      })
    })
  })
})
