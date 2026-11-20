import { prisma } from '@/lib/db/prisma'
import { unstable_cache } from 'next/cache'
import { type Locale } from '@/i18n/config'

export interface PublishedIssue {
  id: string
  slug: string
  title: string
  summary: string | null
  body: string | null
  isOfficialPosition: boolean
  supporterSummary: boolean
  featured: boolean
  category: string | null
  tags: string[]
  sources: {
    id: string
    title: string
    url: string
    publisher: string | null
    date: Date | null
  }[]
  approvedAt: Date | null
}

/**
 * Get localized text from issue
 */
function getLocalizedText(
  item: {
    titleHt: string
    titleFr: string
    titleEn: string
    summaryHt: string | null
    summaryFr: string | null
    summaryEn: string | null
    bodyHt: string | null
    bodyFr: string | null
    bodyEn: string | null
  },
  locale: Locale,
  field: 'title' | 'summary' | 'body'
): string {
  const htField = `${field}Ht` as keyof typeof item
  const frField = `${field}Fr` as keyof typeof item
  const enField = `${field}En` as keyof typeof item

  if (locale === 'ht' && item[htField]) return item[htField] as string
  if (locale === 'fr' && item[frField]) return item[frField] as string
  if (locale === 'en' && item[enField]) return item[enField] as string

  // Fallback: try en, then fr, then ht
  return (item[enField] || item[frField] || item[htField] || '') as string
}

/**
 * Get all approved/published issues
 */
export const getPublishedIssues = unstable_cache(
  async (locale: Locale): Promise<PublishedIssue[]> => {
    try {
      const issues = await prisma.issue.findMany({
        where: {
          status: 'APPROVED',
        },
        include: {
          sources: true,
        },
        orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      })

      return issues.map((issue) => ({
        id: issue.id,
        slug: issue.slug,
        title: getLocalizedText(issue, locale, 'title'),
        summary: getLocalizedText(issue, locale, 'summary'),
        body: getLocalizedText(issue, locale, 'body'),
        isOfficialPosition: issue.isOfficialPosition,
        supporterSummary: issue.supporterSummary,
        featured: issue.featured,
        category: issue.category,
        tags: issue.tags,
        sources: issue.sources.map((source) => ({
          id: source.id,
          title: source.title,
          url: source.url,
          publisher: source.publisher,
          date: source.date,
        })),
        approvedAt: issue.approvedAt,
      }))
    } catch (error) {
      console.error('Error fetching published issues:', error)
      return []
    }
  },
  ['published-issues'],
  {
    revalidate: 300, // 5 minutes
    tags: ['issues'],
  }
)

/**
 * Get a single issue by slug
 */
export async function getIssueBySlug(
  slug: string,
  locale: Locale
): Promise<PublishedIssue | null> {
  try {
    const issue = await prisma.issue.findUnique({
      where: {
        slug,
        status: 'APPROVED',
      },
      include: {
        sources: true,
      },
    })

    if (!issue) return null

    return {
      id: issue.id,
      slug: issue.slug,
      title: getLocalizedText(issue, locale, 'title'),
      summary: getLocalizedText(issue, locale, 'summary'),
      body: getLocalizedText(issue, locale, 'body'),
      isOfficialPosition: issue.isOfficialPosition,
      supporterSummary: issue.supporterSummary,
      featured: issue.featured,
      category: issue.category,
      tags: issue.tags,
      sources: issue.sources.map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
        publisher: source.publisher,
        date: source.date,
      })),
      approvedAt: issue.approvedAt,
    }
  } catch (error) {
    console.error(`Error fetching issue ${slug}:`, error)
    return null
  }
}

/**
 * Check if an issue can be published
 * Requires at least one source if any position is attributed to the candidate
 */
export async function canPublishIssue(issueId: string): Promise<boolean> {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { sources: true },
  })

  if (!issue) return false

  // If it's a supporter summary (not attributed to candidate), sources are optional
  if (issue.supporterSummary && !issue.isOfficialPosition) {
    return true
  }

  // If any position is attributed to candidate, must have at least one source
  return issue.sources.length > 0
}

/**
 * Publish an issue (OWNER only)
 */
export async function publishIssue(
  issueId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const canPublish = await canPublishIssue(issueId)

    if (!canPublish) {
      return {
        success: false,
        error:
          'Cannot publish issue with candidate positions without sources',
      }
    }

    await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        publishedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error publishing issue:', error)
    return {
      success: false,
      error: 'Failed to publish issue',
    }
  }
}
