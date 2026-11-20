import { prisma } from '@/lib/db/prisma'
import { unstable_cache } from 'next/cache'
import { type Locale } from '@/i18n/config'
import { ContentCategory } from '@prisma/client'

export interface PublishedContent {
  id: string
  slug: string
  category: ContentCategory
  text: string
  date: Date | null
  datePrecision: string
  quote: string | null
  confidence: string
  sources: {
    id: string
    title: string
    publisher: string
    url: string
    language: string
    accessedOn: Date
    fileUrl: string | null
  }[]
  order: number
}

/**
 * Get published content by category or categories
 * Returns content with sources, filtered by locale
 */
export const getPublishedContent = unstable_cache(
  async (
    category: ContentCategory | ContentCategory[],
    locale: Locale,
    limit?: number
  ): Promise<PublishedContent[]> => {
    try {
      const categories = Array.isArray(category) ? category : [category]

      const content = await prisma.content.findMany({
        where: {
          category: {
            in: categories,
          },
          status: 'PUBLISHED',
        },
        include: {
          sources: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [
          { date: 'asc' }, // Chronological order for timeline
          { order: 'asc' },
        ],
        take: limit,
      })

      // Map to locale-specific text
      return content.map((item) => ({
        id: item.id,
        slug: item.slug,
        category: item.category,
        text: getLocalizedText(item, locale),
        date: item.date,
        datePrecision: item.datePrecision,
        quote: item.quote,
        confidence: item.confidence,
        sources: item.sources.map((source) => ({
          id: source.id,
          title: source.title,
          publisher: source.publisher,
          url: source.url,
          language: source.language,
          accessedOn: source.accessedOn,
          fileUrl: source.fileUrl,
        })),
        order: item.order,
      }))
    } catch (error) {
      console.error('Error fetching published content:', error)
      return []
    }
  },
  ['published-content'],
  {
    revalidate: 300, // 5 minutes
    tags: ['content'],
  }
)

/**
 * Get localized text from content item
 */
function getLocalizedText(
  item: {
    textHt: string | null
    textFr: string | null
    textEn: string | null
  },
  locale: Locale
): string {
  if (locale === 'ht' && item.textHt) return item.textHt
  if (locale === 'fr' && item.textFr) return item.textFr
  if (locale === 'en' && item.textEn) return item.textEn

  // Fallback: try en, then fr, then ht
  return item.textEn || item.textFr || item.textHt || ''
}

/**
 * Check if content can be published (has at least one source)
 */
export async function canPublishContent(contentId: string): Promise<boolean> {
  const sourceCount = await prisma.contentSource.count({
    where: { contentId },
  })

  return sourceCount > 0
}

/**
 * Publish content (admin action)
 */
export async function publishContent(
  contentId: string,
  publishedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if has sources
    const canPublish = await canPublishContent(contentId)

    if (!canPublish) {
      return {
        success: false,
        error: 'Cannot publish content without at least one source',
      }
    }

    // Check for quote without source
    const content = await prisma.content.findUnique({
      where: { id: contentId },
    })

    if (content?.quote && !content.quoteSourced) {
      return {
        success: false,
        error: 'Cannot publish content with unsourced quote',
      }
    }

    await prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error publishing content:', error)
    return {
      success: false,
      error: 'Failed to publish content',
    }
  }
}
