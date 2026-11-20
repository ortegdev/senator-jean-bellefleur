/**
 * Chapter Management
 * 
 * Diaspora organizing hubs by city/country with:
 * - Admin approval workflow
 * - Aggregate member counts and amounts
 * - Optional organizer contact
 * - Local events
 * - Moderation
 */

import { prisma } from '@/lib/db/prisma'
import { ChapterStatus, MembershipStatus, EventStatus } from '@prisma/client'

// ============================================================================
// CHAPTER CREATION & APPROVAL
// ============================================================================

export interface CreateChapterInput {
  slug: string
  name: string
  city: string
  state?: string
  country: string
  organizerName: string
  organizerEmail: string
  organizerContactOptIn?: boolean
  descriptionHt?: string
  descriptionFr?: string
  descriptionEn?: string
}

export async function createChapterRequest(input: CreateChapterInput) {
  // Validate slug is unique and not reserved
  const existing = await prisma.chapter.findUnique({ where: { slug: input.slug } })
  if (existing) {
    throw new Error('Chapter slug already exists')
  }

  const reserved = await prisma.reservedSlug.findUnique({ where: { slug: input.slug } })
  if (reserved) {
    throw new Error(`Slug "${input.slug}" is reserved: ${reserved.reason}`)
  }

  // Create pending chapter request
  const chapter = await prisma.chapter.create({
    data: {
      slug: input.slug,
      name: input.name,
      city: input.city,
      state: input.state,
      country: input.country,
      status: ChapterStatus.PENDING,
      requestedBy: input.organizerEmail,
      organizerName: input.organizerName,
      organizerEmail: input.organizerEmail,
      organizerContactOptIn: input.organizerContactOptIn ?? false,
      descriptionHt: input.descriptionHt,
      descriptionFr: input.descriptionFr,
      descriptionEn: input.descriptionEn,
    },
  })

  return chapter
}

export async function approveChapter(chapterId: string, adminId: string, adminEmail: string) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } })
  if (!chapter) {
    throw new Error('Chapter not found')
  }

  if (chapter.status !== ChapterStatus.PENDING) {
    throw new Error('Chapter is not pending approval')
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Update chapter status
    const updated = await tx.chapter.update({
      where: { id: chapterId },
      data: {
        status: ChapterStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    })

    // Log moderation action
    await tx.chapterModerationLog.create({
      data: {
        chapterId,
        action: 'APPROVED',
        actionBy: adminId,
        actionByEmail: adminEmail,
        reason: 'Chapter approved by admin',
      },
    })

    return updated
  })

  return updated
}

export async function rejectChapter(
  chapterId: string,
  adminId: string,
  adminEmail: string,
  reason: string
) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } })
  if (!chapter) {
    throw new Error('Chapter not found')
  }

  if (chapter.status !== ChapterStatus.PENDING) {
    throw new Error('Chapter is not pending approval')
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Update chapter status
    const updated = await tx.chapter.update({
      where: { id: chapterId },
      data: {
        status: ChapterStatus.REJECTED,
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    })

    // Log moderation action
    await tx.chapterModerationLog.create({
      data: {
        chapterId,
        action: 'REJECTED',
        actionBy: adminId,
        actionByEmail: adminEmail,
        reason,
      },
    })

    return updated
  })

  return updated
}

// ============================================================================
// CHAPTER MEMBERSHIP
// ============================================================================

export async function joinChapter(supporterPageId: string, chapterId: string) {
  // Check chapter exists and allows join
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } })
  if (!chapter) {
    throw new Error('Chapter not found')
  }

  if (chapter.status !== ChapterStatus.APPROVED) {
    throw new Error('Chapter is not active')
  }

  if (!chapter.allowJoin) {
    throw new Error('Chapter is not accepting new members')
  }

  if (chapter.suspended) {
    throw new Error('Chapter is suspended')
  }

  // Check if already a member
  const existing = await prisma.chapterMembership.findUnique({
    where: {
      chapterId_supporterPageId: {
        chapterId,
        supporterPageId,
      },
    },
  })

  if (existing && existing.status === MembershipStatus.ACTIVE) {
    throw new Error('Already a member of this chapter')
  }

  // Create or reactivate membership
  const membership = await prisma.chapterMembership.upsert({
    where: {
      chapterId_supporterPageId: {
        chapterId,
        supporterPageId,
      },
    },
    update: {
      status: MembershipStatus.ACTIVE,
      leftAt: null,
      leftReason: null,
    },
    create: {
      chapterId,
      supporterPageId,
      status: MembershipStatus.ACTIVE,
    },
  })

  // Increment chapter member count
  await prisma.chapter.update({
    where: { id: chapterId },
    data: {
      memberCount: { increment: 1 },
    },
  })

  return membership
}

export async function leaveChapter(supporterPageId: string, chapterId: string, reason?: string) {
  const membership = await prisma.chapterMembership.findUnique({
    where: {
      chapterId_supporterPageId: {
        chapterId,
        supporterPageId,
      },
    },
  })

  if (!membership || membership.status !== MembershipStatus.ACTIVE) {
    throw new Error('Not a member of this chapter')
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Update membership
    const updated = await tx.chapterMembership.update({
      where: { id: membership.id },
      data: {
        status: MembershipStatus.LEFT,
        leftAt: new Date(),
        leftReason: reason,
      },
    })

    // Decrement chapter member count
    await tx.chapter.update({
      where: { id: chapterId },
      data: {
        memberCount: { decrement: 1 },
      },
    })

    return updated
  })

  return updated
}

// ============================================================================
// CHAPTER MODERATION
// ============================================================================

export async function suspendChapter(
  chapterId: string,
  adminId: string,
  adminEmail: string,
  reason: string
) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } })
  if (!chapter) {
    throw new Error('Chapter not found')
  }

  if (chapter.suspended) {
    throw new Error('Chapter is already suspended')
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.chapter.update({
      where: { id: chapterId },
      data: {
        suspended: true,
        suspendedBy: adminId,
        suspendedAt: new Date(),
        suspensionReason: reason,
      },
    })

    await tx.chapterModerationLog.create({
      data: {
        chapterId,
        action: 'SUSPENDED',
        actionBy: adminId,
        actionByEmail: adminEmail,
        reason,
      },
    })

    return updated
  })

  return updated
}

export async function unsuspendChapter(
  chapterId: string,
  adminId: string,
  adminEmail: string,
  reason: string
) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } })
  if (!chapter) {
    throw new Error('Chapter not found')
  }

  if (!chapter.suspended) {
    throw new Error('Chapter is not suspended')
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.chapter.update({
      where: { id: chapterId },
      data: {
        suspended: false,
        suspendedBy: null,
        suspendedAt: null,
        suspensionReason: null,
      },
    })

    await tx.chapterModerationLog.create({
      data: {
        chapterId,
        action: 'UNSUSPENDED',
        actionBy: adminId,
        actionByEmail: adminEmail,
        reason,
      },
    })

    return updated
  })

  return updated
}

// ============================================================================
// CHAPTER QUERIES
// ============================================================================

export async function getChapterBySlug(slug: string) {
  return prisma.chapter.findUnique({
    where: { slug },
    include: {
      events: {
        where: {
          status: EventStatus.PUBLISHED,
          eventDate: { gte: new Date() }, // Future events only
        },
        orderBy: { eventDate: 'asc' },
        take: 10,
      },
    },
  })
}

export async function getApprovedChapters() {
  return prisma.chapter.findMany({
    where: {
      status: ChapterStatus.APPROVED,
      suspended: false,
    },
    orderBy: [{ country: 'asc' }, { name: 'asc' }],
  })
}

export async function getPendingChapters() {
  return prisma.chapter.findMany({
    where: {
      status: ChapterStatus.PENDING,
    },
    orderBy: { requestedAt: 'asc' },
  })
}

export async function getChapterLeaderboard(chapterId: string, limit = 20) {
  // Get active memberships for this chapter, ordered by total contribution amount
  const memberships = await prisma.chapterMembership.findMany({
    where: {
      chapterId,
      status: MembershipStatus.ACTIVE,
    },
    include: {
      supporterPage: {
        select: {
          id: true,
          slug: true,
          displayName: true,
          showName: true,
          donor: {
            select: {
              contributions: {
                where: {
                  paymentStatus: 'SUCCEEDED',
                },
                select: {
                  amountCents: true,
                },
              },
            },
          },
        },
      },
    },
    take: limit,
  })

  // Calculate total for each member and sort
  const leaderboard = memberships
    .map((membership) => {
      const totalCents = membership.supporterPage.donor.contributions.reduce(
        (sum, c) => sum + c.amountCents,
        0
      )

      return {
        slug: membership.supporterPage.slug,
        displayName: membership.supporterPage.showName
          ? membership.supporterPage.displayName
          : 'Anonymous Supporter',
        contributionCount: membership.supporterPage.donor.contributions.length,
        // Privacy: show supporter count only, not dollar amounts
      }
    })
    .sort((a, b) => b.contributionCount - a.contributionCount)

  return leaderboard
}

// ============================================================================
// AGGREGATE CALCULATIONS (Run periodically)
// ============================================================================

export async function recalculateChapterAggregates(chapterId: string) {
  const memberships = await prisma.chapterMembership.findMany({
    where: {
      chapterId,
      status: MembershipStatus.ACTIVE,
    },
    include: {
      supporterPage: {
        include: {
          donor: {
            include: {
              contributions: {
                where: {
                  paymentStatus: 'SUCCEEDED',
                },
              },
            },
          },
        },
      },
    },
  })

  const memberCount = memberships.length
  const totalAmountCents = memberships.reduce((sum, m) => {
    const donorTotal = m.supporterPage.donor.contributions.reduce(
      (dsum, c) => dsum + c.amountCents,
      0
    )
    return sum + donorTotal
  }, 0)

  await prisma.chapter.update({
    where: { id: chapterId },
    data: {
      memberCount,
      totalAmountCents,
    },
  })

  return { memberCount, totalAmountCents }
}
