/**
 * Chapter Integration Tests
 * 
 * Tests:
 * - Chapter creation and approval workflow
 * - Membership management
 * - Aggregate calculations
 * - Moderation (suspend/unsuspend)
 * - Fake chapter creation prevention
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import {
  createChapterRequest,
  approveChapter,
  rejectChapter,
  joinChapter,
  leaveChapter,
  suspendChapter,
  unsuspendChapter,
  recalculateChapterAggregates,
  getChapterLeaderboard,
} from '@/lib/community/chapters'
import { createSupporterPage } from '@/lib/community/supporter-pages'
import { ChapterStatus, MembershipStatus } from '@prisma/client'

describe('Chapter Integration Tests', () => {
  let testDonorId: string
  let testSupporterPageId: string

  beforeEach(async () => {
    // Create test donor
    const donor = await prisma.donor.create({
      data: {
        encryptedName: 'encrypted-test-name',
        encryptedEmail: 'encrypted-test-email',
        emailBlindIndex: `test-email-${Date.now()}`,
        nameBlindIndex: `test-name-${Date.now()}`,
        country: 'US',
        locale: 'en',
      },
    })
    testDonorId = donor.id

    // Create test supporter page
    const page = await prisma.supporterPage.create({
      data: {
        donorId: testDonorId,
        slug: `test-supporter-${Date.now()}`,
        displayName: 'Test Supporter',
        status: 'ACTIVE',
      },
    })
    testSupporterPageId = page.id
  })

  afterEach(async () => {
    // Cleanup
    await prisma.chapterMembership.deleteMany({})
    await prisma.chapterModerationLog.deleteMany({})
    await prisma.chapter.deleteMany({ where: { slug: { startsWith: 'test-chapter-' } } })
    await prisma.supporterPage.deleteMany({ where: { slug: { startsWith: 'test-supporter-' } } })
    await prisma.donor.deleteMany({ where: { id: testDonorId } })
  })

  describe('Chapter Creation', () => {
    it('should create pending chapter request', async () => {
      const chapter = await createChapterRequest({
        slug: 'test-chapter-miami',
        name: 'Miami, FL',
        city: 'Miami',
        state: 'FL',
        country: 'US',
        organizerName: 'John Doe',
        organizerEmail: 'john@example.com',
        organizerContactOptIn: true,
      })

      expect(chapter.slug).toBe('test-chapter-miami')
      expect(chapter.status).toBe(ChapterStatus.PENDING)
      expect(chapter.organizerEmail).toBe('john@example.com')
      expect(chapter.organizerContactOptIn).toBe(true)
    })

    it('should reject duplicate slug', async () => {
      await createChapterRequest({
        slug: 'test-chapter-duplicate',
        name: 'Test Chapter',
        city: 'Test City',
        country: 'US',
        organizerName: 'Organizer',
        organizerEmail: 'org@example.com',
      })

      await expect(
        createChapterRequest({
          slug: 'test-chapter-duplicate',
          name: 'Another Chapter',
          city: 'Another City',
          country: 'US',
          organizerName: 'Another Organizer',
          organizerEmail: 'another@example.com',
        })
      ).rejects.toThrow('Chapter slug already exists')
    })

    it('should reject reserved slug', async () => {
      // Create reserved slug
      await prisma.reservedSlug.create({
        data: {
          slug: 'test-reserved',
          reason: 'Test reservation',
        },
      })

      await expect(
        createChapterRequest({
          slug: 'test-reserved',
          name: 'Test Chapter',
          city: 'Test City',
          country: 'US',
          organizerName: 'Organizer',
          organizerEmail: 'org@example.com',
        })
      ).rejects.toThrow('reserved')

      await prisma.reservedSlug.delete({ where: { slug: 'test-reserved' } })
    })
  })

  describe('Chapter Approval Workflow', () => {
    it('should approve pending chapter', async () => {
      const chapter = await createChapterRequest({
        slug: 'test-chapter-approve',
        name: 'Approval Test',
        city: 'Test City',
        country: 'US',
        organizerName: 'Organizer',
        organizerEmail: 'org@example.com',
      })

      const approved = await approveChapter(chapter.id, 'admin-123', 'admin@example.com')

      expect(approved.status).toBe(ChapterStatus.APPROVED)
      expect(approved.approvedBy).toBe('admin-123')
      expect(approved.approvedAt).toBeTruthy()

      // Check moderation log
      const logs = await prisma.chapterModerationLog.findMany({
        where: { chapterId: chapter.id },
      })
      expect(logs).toHaveLength(1)
      expect(logs[0].action).toBe('APPROVED')
    })

    it('should reject pending chapter with reason', async () => {
      const chapter = await createChapterRequest({
        slug: 'test-chapter-reject',
        name: 'Rejection Test',
        city: 'Test City',
        country: 'US',
        organizerName: 'Organizer',
        organizerEmail: 'org@example.com',
      })

      const rejected = await rejectChapter(
        chapter.id,
        'admin-123',
        'admin@example.com',
        'Duplicate chapter in same city'
      )

      expect(rejected.status).toBe(ChapterStatus.REJECTED)
      expect(rejected.rejectedBy).toBe('admin-123')
      expect(rejected.rejectionReason).toBe('Duplicate chapter in same city')

      // Check moderation log
      const logs = await prisma.chapterModerationLog.findMany({
        where: { chapterId: chapter.id },
      })
      expect(logs).toHaveLength(1)
      expect(logs[0].action).toBe('REJECTED')
    })

    it('should prevent approving non-pending chapter', async () => {
      const chapter = await createChapterRequest({
        slug: 'test-chapter-already-approved',
        name: 'Already Approved',
        city: 'Test City',
        country: 'US',
        organizerName: 'Organizer',
        organizerEmail: 'org@example.com',
      })

      await approveChapter(chapter.id, 'admin-123', 'admin@example.com')

      await expect(
        approveChapter(chapter.id, 'admin-456', 'admin2@example.com')
      ).rejects.toThrow('not pending approval')
    })
  })

  describe('Chapter Membership', () => {
    let approvedChapter: any

    beforeEach(async () => {
      const chapter = await createChapterRequest({
        slug: 'test-chapter-membership',
        name: 'Membership Test',
        city: 'Test City',
        country: 'US',
        organizerName: 'Organizer',
        organizerEmail: 'org@example.com',
      })

      approvedChapter = await approveChapter(chapter.id, 'admin-123', 'admin@example.com')
    })

    it('should allow supporter to join chapter', async () => {
      const membership = await joinChapter(testSupporterPageId, approvedChapter.id)

      expect(membership.supporterPageId).toBe(testSupporterPageId)
      expect(membership.chapterId).toBe(approvedChapter.id)
      expect(membership.status).toBe(MembershipStatus.ACTIVE)

      // Check member count incremented
      const updated = await prisma.chapter.findUnique({ where: { id: approvedChapter.id } })
      expect(updated!.memberCount).toBe(1)
    })

    it('should prevent joining non-approved chapter', async () => {
      const pendingChapter = await createChapterRequest({
        slug: 'test-chapter-pending',
        name: 'Pending Chapter',
        city: 'Test City',
        country: 'US',
        organizerName: 'Organizer',
        organizerEmail: 'org@example.com',
      })

      await expect(joinChapter(testSupporterPageId, pendingChapter.id)).rejects.toThrow(
        'not active'
      )
    })

    it('should prevent joining suspended chapter', async () => {
      await suspendChapter(
        approvedChapter.id,
        'admin-123',
        'admin@example.com',
        'Test suspension'
      )

      await expect(joinChapter(testSupporterPageId, approvedChapter.id)).rejects.toThrow(
        'suspended'
      )
    })

    it('should allow leaving chapter', async () => {
      await joinChapter(testSupporterPageId, approvedChapter.id)

      const left = await leaveChapter(testSupporterPageId, approvedChapter.id, 'No longer active')

      expect(left.status).toBe(MembershipStatus.LEFT)
      expect(left.leftReason).toBe('No longer active')

      // Check member count decremented
      const updated = await prisma.chapter.findUnique({ where: { id: approvedChapter.id } })
      expect(updated!.memberCount).toBe(0)
    })

    it('should prevent rejoining without reactivation', async () => {
      await joinChapter(testSupporterPageId, approvedChapter.id)

      await expect(joinChapter(testSupporterPageId, approvedChapter.id)).rejects.toThrow(
        'Already a member'
      )
    })

    it('should allow rejoining after leaving', async () => {
      await joinChapter(testSupporterPageId, approvedChapter.id)
      await leaveChapter(testSupporterPageId, approvedChapter.id)

      const rejoined = await joinChapter(testSupporterPageId, approvedChapter.id)

      expect(rejoined.status).toBe(MembershipStatus.ACTIVE)
    })
  })

  describe('Chapter Moderation', () => {
    let approvedChapter: any

    beforeEach(async () => {
      const chapter = await createChapterRequest({
        slug: 'test-chapter-moderation',
        name: 'Moderation Test',
        city: 'Test City',
        country: 'US',
        organizerName: 'Organizer',
        organizerEmail: 'org@example.com',
      })

      approvedChapter = await approveChapter(chapter.id, 'admin-123', 'admin@example.com')
    })

    it('should suspend chapter with reason', async () => {
      const suspended = await suspendChapter(
        approvedChapter.id,
        'admin-123',
        'admin@example.com',
        'Violation of terms'
      )

      expect(suspended.suspended).toBe(true)
      expect(suspended.suspensionReason).toBe('Violation of terms')

      // Check moderation log
      const logs = await prisma.chapterModerationLog.findMany({
        where: { chapterId: approvedChapter.id, action: 'SUSPENDED' },
      })
      expect(logs).toHaveLength(1)
    })

    it('should unsuspend chapter', async () => {
      await suspendChapter(
        approvedChapter.id,
        'admin-123',
        'admin@example.com',
        'Violation of terms'
      )

      const unsuspended = await unsuspendChapter(
        approvedChapter.id,
        'admin-456',
        'admin2@example.com',
        'Issue resolved'
      )

      expect(unsuspended.suspended).toBe(false)
      expect(unsuspended.suspensionReason).toBeNull()

      // Check moderation log
      const logs = await prisma.chapterModerationLog.findMany({
        where: { chapterId: approvedChapter.id, action: 'UNSUSPENDED' },
      })
      expect(logs).toHaveLength(1)
    })
  })

  describe('Chapter Aggregates', () => {
    it('should calculate member count and total amount', async () => {
      const chapter = await createChapterRequest({
        slug: 'test-chapter-aggregates',
        name: 'Aggregates Test',
        city: 'Test City',
        country: 'US',
        organizerName: 'Organizer',
        organizerEmail: 'org@example.com',
      })

      const approvedChapter = await approveChapter(chapter.id, 'admin-123', 'admin@example.com')

      // Create members with contributions
      for (let i = 0; i < 3; i++) {
        const donor = await prisma.donor.create({
          data: {
            encryptedName: `encrypted-donor-${i}`,
            encryptedEmail: `encrypted-email-${i}`,
            emailBlindIndex: `email-${Date.now()}-${i}`,
            nameBlindIndex: `name-${Date.now()}-${i}`,
            country: 'US',
          },
        })

        const page = await prisma.supporterPage.create({
          data: {
            donorId: donor.id,
            slug: `test-member-${Date.now()}-${i}`,
            displayName: `Member ${i}`,
            status: 'ACTIVE',
          },
        })

        await joinChapter(page.id, approvedChapter.id)

        // Create contribution
        await prisma.contribution.create({
          data: {
            donorEmail: `member${i}@example.com`,
            donorFirstName: 'Test',
            donorLastName: `Member${i}`,
            donorCountry: 'US',
            amountCents: 1000 * (i + 1), // $10, $20, $30
            paymentProvider: 'stripe',
            paymentIntentId: `pi_test_${Date.now()}_${i}`,
            paymentStatus: 'SUCCEEDED',
          },
        })
      }

      // Recalculate aggregates
      const aggregates = await recalculateChapterAggregates(approvedChapter.id)

      expect(aggregates.memberCount).toBe(3)
      expect(aggregates.totalAmountCents).toBe(6000) // $60 total

      // Verify database updated
      const updated = await prisma.chapter.findUnique({ where: { id: approvedChapter.id } })
      expect(updated!.memberCount).toBe(3)
      expect(updated!.totalAmountCents).toBe(6000)

      // Cleanup
      await prisma.contribution.deleteMany({
        where: { donorEmail: { startsWith: 'member' } },
      })
    })
  })

  describe('Chapter Leaderboard', () => {
    it('should return leaderboard with privacy-safe counts', async () => {
      const chapter = await createChapterRequest({
        slug: 'test-chapter-leaderboard',
        name: 'Leaderboard Test',
        city: 'Test City',
        country: 'US',
        organizerName: 'Organizer',
        organizerEmail: 'org@example.com',
      })

      const approvedChapter = await approveChapter(chapter.id, 'admin-123', 'admin@example.com')

      // Create members with varying contribution counts
      const memberData = [
        { slug: 'member-1', name: 'Member One', contributions: 3 },
        { slug: 'member-2', name: 'Member Two', contributions: 1 },
        { slug: 'member-3', name: 'Member Three', contributions: 5 },
      ]

      for (const data of memberData) {
        const donor = await prisma.donor.create({
          data: {
            encryptedName: `encrypted-${data.slug}`,
            encryptedEmail: `encrypted-email-${data.slug}`,
            emailBlindIndex: `email-${Date.now()}-${data.slug}`,
            nameBlindIndex: `name-${Date.now()}-${data.slug}`,
            country: 'US',
          },
        })

        const page = await prisma.supporterPage.create({
          data: {
            donorId: donor.id,
            slug: data.slug,
            displayName: data.name,
            status: 'ACTIVE',
          },
        })

        await joinChapter(page.id, approvedChapter.id)

        // Create contributions
        for (let i = 0; i < data.contributions; i++) {
          await prisma.contribution.create({
            data: {
              donorEmail: `${data.slug}@example.com`,
              donorFirstName: 'Test',
              donorLastName: data.slug,
              donorCountry: 'US',
              amountCents: 1000,
              paymentProvider: 'stripe',
              paymentIntentId: `pi_${Date.now()}_${data.slug}_${i}`,
              paymentStatus: 'SUCCEEDED',
            },
          })
        }
      }

      const leaderboard = await getChapterLeaderboard(approvedChapter.id)

      expect(leaderboard).toHaveLength(3)
      
      // Should be ordered by contribution count (desc)
      expect(leaderboard[0].slug).toBe('member-3')
      expect(leaderboard[0].contributionCount).toBe(5)
      
      expect(leaderboard[1].slug).toBe('member-1')
      expect(leaderboard[1].contributionCount).toBe(3)
      
      expect(leaderboard[2].slug).toBe('member-2')
      expect(leaderboard[2].contributionCount).toBe(1)

      // Verify NO dollar amounts in leaderboard (privacy)
      leaderboard.forEach((entry) => {
        expect(entry).not.toHaveProperty('totalAmountCents')
        expect(entry).not.toHaveProperty('amountCents')
      })

      // Cleanup
      await prisma.contribution.deleteMany({
        where: { donorEmail: { contains: 'member-' } },
      })
    })
  })
})
