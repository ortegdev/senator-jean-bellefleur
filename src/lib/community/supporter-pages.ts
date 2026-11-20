/**
 * Supporter Pages (/s/[slug])
 * 
 * Custom URLs with:
 * - Profanity, impersonation, reserved-name filters
 * - Short story (500 chars max)
 * - Privacy-safe attribution (counts only, no dollar amounts)
 * - Optional chapter leaderboard (opt-in)
 * - Moderation tools
 */

import { prisma } from '@/lib/db/prisma'
import { SupporterPageStatus, SupporterPageReportReason } from '@prisma/client'
import Filter from 'bad-words'

// Profanity filter
const profanityFilter = new Filter()

// Additional profanity patterns (case-insensitive)
const additionalProfanity = [
  // Add any language-specific profanity here
]

profanityFilter.addWords(...additionalProfanity)

// ============================================================================
// SLUG VALIDATION
// ============================================================================

export interface SlugValidationResult {
  valid: boolean
  error?: string
}

export async function validateSlug(slug: string): Promise<SlugValidationResult> {
  // Basic format check (alphanumeric, hyphens, 3-30 chars)
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return {
      valid: false,
      error: 'Slug must be lowercase, alphanumeric, hyphens allowed, 3-30 characters',
    }
  }

  if (slug.length < 3 || slug.length > 30) {
    return { valid: false, error: 'Slug must be between 3 and 30 characters' }
  }

  // Check reserved slugs
  const reserved = await prisma.reservedSlug.findUnique({ where: { slug } })
  if (reserved) {
    return { valid: false, error: `This name is reserved: ${reserved.reason}` }
  }

  // Check existing supporter pages
  const existing = await prisma.supporterPage.findUnique({ where: { slug } })
  if (existing) {
    return { valid: false, error: 'This name is already taken' }
  }

  // Check profanity
  if (profanityFilter.isProfane(slug)) {
    return { valid: false, error: 'This name contains inappropriate content' }
  }

  // Check for impersonation patterns
  const impersonationPatterns = [
    /bellefleur/i,
    /jean.*bellefleur/i,
    /fritznel/i,
    /senator/i,
    /senateur/i,
    /candidat/i,
    /campaign/i,
    /official/i,
  ]

  for (const pattern of impersonationPatterns) {
    if (pattern.test(slug)) {
      return { valid: false, error: 'This name could be confused with official accounts' }
    }
  }

  return { valid: true }
}

// ============================================================================
// SUPPORTER PAGE CREATION
// ============================================================================

export interface CreateSupporterPageInput {
  donorId: string
  slug: string
  displayName: string
  storyHt?: string
  storyFr?: string
  storyEn?: string
  showName?: boolean
  showRootsCommune?: boolean
  showChapterMembership?: boolean
}

export async function createSupporterPage(input: CreateSupporterPageInput) {
  // Validate slug
  const slugValidation = await validateSlug(input.slug)
  if (!slugValidation.valid) {
    throw new Error(slugValidation.error)
  }

  // Validate display name (no profanity)
  if (profanityFilter.isProfane(input.displayName)) {
    throw new Error('Display name contains inappropriate content')
  }

  // Validate story length (500 chars max per language)
  if (input.storyHt && input.storyHt.length > 500) {
    throw new Error('Story (Haitian Creole) must be 500 characters or less')
  }
  if (input.storyFr && input.storyFr.length > 500) {
    throw new Error('Story (French) must be 500 characters or less')
  }
  if (input.storyEn && input.storyEn.length > 500) {
    throw new Error('Story (English) must be 500 characters or less')
  }

  // Check donor doesn't already have a page
  const existing = await prisma.supporterPage.findUnique({
    where: { donorId: input.donorId },
  })
  if (existing) {
    throw new Error('Donor already has a supporter page')
  }

  // Create page
  const page = await prisma.supporterPage.create({
    data: {
      donorId: input.donorId,
      slug: input.slug,
      displayName: input.displayName,
      storyHt: input.storyHt,
      storyFr: input.storyFr,
      storyEn: input.storyEn,
      showName: input.showName ?? true,
      showRootsCommune: input.showRootsCommune ?? false,
      showChapterMembership: input.showChapterMembership ?? false,
      status: SupporterPageStatus.ACTIVE,
      publishedAt: new Date(),
      referralCount: 0,
      referralAmountCents: 0,
    },
  })

  return page
}

// ============================================================================
// SUPPORTER PAGE UPDATES
// ============================================================================

export interface UpdateSupporterPageInput {
  displayName?: string
  storyHt?: string
  storyFr?: string
  storyEn?: string
  showName?: boolean
  showRootsCommune?: boolean
  showChapterMembership?: boolean
}

export async function updateSupporterPage(pageId: string, input: UpdateSupporterPageInput) {
  const page = await prisma.supporterPage.findUnique({ where: { id: pageId } })
  if (!page) {
    throw new Error('Supporter page not found')
  }

  if (page.status === SupporterPageStatus.REMOVED) {
    throw new Error('Page is removed')
  }

  // Validate display name if provided
  if (input.displayName && profanityFilter.isProfane(input.displayName)) {
    throw new Error('Display name contains inappropriate content')
  }

  // Validate story length
  if (input.storyHt && input.storyHt.length > 500) {
    throw new Error('Story (Haitian Creole) must be 500 characters or less')
  }
  if (input.storyFr && input.storyFr.length > 500) {
    throw new Error('Story (French) must be 500 characters or less')
  }
  if (input.storyEn && input.storyEn.length > 500) {
    throw new Error('Story (English) must be 500 characters or less')
  }

  // Update page
  const updated = await prisma.supporterPage.update({
    where: { id: pageId },
    data: {
      displayName: input.displayName,
      storyHt: input.storyHt,
      storyFr: input.storyFr,
      storyEn: input.storyEn,
      showName: input.showName,
      showRootsCommune: input.showRootsCommune,
      showChapterMembership: input.showChapterMembership,
    },
  })

  return updated
}

// ============================================================================
// ATTRIBUTION TRACKING (Privacy-Safe)
// ============================================================================

export async function trackReferral(contributionId: string, referrerPageSlug: string | null) {
  // Create attribution record
  await prisma.attribution.create({
    data: {
      contributionId,
      referrerPageSlug,
      referralSource: referrerPageSlug ? 'supporter_page' : 'organic',
    },
  })

  // Increment referrer's counts if applicable
  if (referrerPageSlug) {
    const referrerPage = await prisma.supporterPage.findUnique({
      where: { slug: referrerPageSlug },
    })

    if (referrerPage) {
      const contribution = await prisma.contribution.findUnique({
        where: { id: contributionId },
      })

      if (contribution && contribution.paymentStatus === 'SUCCEEDED') {
        await prisma.supporterPage.update({
          where: { id: referrerPage.id },
          data: {
            referralCount: { increment: 1 },
            referralAmountCents: { increment: contribution.amountCents },
          },
        })
      }
    }
  }
}

export async function getSupporterPageStats(slug: string) {
  const page = await prisma.supporterPage.findUnique({
    where: { slug },
    include: {
      donor: {
        include: {
          contributions: {
            where: { paymentStatus: 'SUCCEEDED' },
          },
        },
      },
      chapterMemberships: {
        where: { status: 'ACTIVE' },
        include: {
          chapter: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!page) {
    return null
  }

  // Privacy-safe stats (counts only, no dollar amounts)
  return {
    slug: page.slug,
    displayName: page.showName ? page.displayName : 'Anonymous Supporter',
    contributionCount: page.donor.contributions.length,
    referralCount: page.referralCount,
    rootsCommune: page.showRootsCommune ? page.donor.rootsCommune : null,
    chapters: page.showChapterMembership
      ? page.chapterMemberships.map((m) => ({
          slug: m.chapter.slug,
          name: m.chapter.name,
        }))
      : [],
  }
}

// ============================================================================
// MODERATION
// ============================================================================

export interface ReportSupporterPageInput {
  supporterPageId: string
  reason: SupporterPageReportReason
  reasonDetails?: string
  reporterIp: string
  reporterEmail?: string
}

export async function reportSupporterPage(input: ReportSupporterPageInput) {
  const page = await prisma.supporterPage.findUnique({
    where: { id: input.supporterPageId },
  })

  if (!page) {
    throw new Error('Supporter page not found')
  }

  // Create report
  const report = await prisma.supporterPageReport.create({
    data: {
      supporterPageId: input.supporterPageId,
      reason: input.reason,
      reasonDetails: input.reasonDetails,
      reporterIp: input.reporterIp,
      reporterEmail: input.reporterEmail,
      status: 'PENDING',
    },
  })

  // Increment report count on page
  await prisma.supporterPage.update({
    where: { id: input.supporterPageId },
    data: {
      reportCount: { increment: 1 },
    },
  })

  return report
}

export async function suspendSupporterPage(
  pageId: string,
  adminId: string,
  reason: string
) {
  const page = await prisma.supporterPage.findUnique({ where: { id: pageId } })
  if (!page) {
    throw new Error('Supporter page not found')
  }

  if (page.suspended) {
    throw new Error('Page is already suspended')
  }

  const updated = await prisma.supporterPage.update({
    where: { id: pageId },
    data: {
      suspended: true,
      suspendedBy: adminId,
      suspendedAt: new Date(),
      suspensionReason: reason,
      status: SupporterPageStatus.SUSPENDED,
    },
  })

  return updated
}

export async function removeSupporterPage(pageId: string, adminId: string, reason: string) {
  const page = await prisma.supporterPage.findUnique({ where: { id: pageId } })
  if (!page) {
    throw new Error('Supporter page not found')
  }

  const updated = await prisma.supporterPage.update({
    where: { id: pageId },
    data: {
      status: SupporterPageStatus.REMOVED,
      suspendedBy: adminId,
      suspendedAt: new Date(),
      suspensionReason: reason,
    },
  })

  return updated
}

export async function unsuspendSupporterPage(pageId: string, adminId: string) {
  const page = await prisma.supporterPage.findUnique({ where: { id: pageId } })
  if (!page) {
    throw new Error('Supporter page not found')
  }

  if (!page.suspended) {
    throw new Error('Page is not suspended')
  }

  const updated = await prisma.supporterPage.update({
    where: { id: pageId },
    data: {
      suspended: false,
      suspendedBy: null,
      suspendedAt: null,
      suspensionReason: null,
      status: SupporterPageStatus.ACTIVE,
    },
  })

  return updated
}

// ============================================================================
// QUERIES
// ============================================================================

export async function getSupporterPageBySlug(slug: string) {
  return prisma.supporterPage.findUnique({
    where: { slug },
    include: {
      donor: {
        select: {
          rootsCommune: true,
          contributions: {
            where: { paymentStatus: 'SUCCEEDED' },
            select: {
              id: true,
              amountCents: true,
            },
          },
        },
      },
      chapterMemberships: {
        where: { status: 'ACTIVE' },
        include: {
          chapter: {
            select: {
              slug: true,
              name: true,
              city: true,
              country: true,
            },
          },
        },
      },
    },
  })
}

export async function getPendingReports() {
  return prisma.supporterPageReport.findMany({
    where: { status: 'PENDING' },
    include: {
      supporterPage: {
        select: {
          id: true,
          slug: true,
          displayName: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}
