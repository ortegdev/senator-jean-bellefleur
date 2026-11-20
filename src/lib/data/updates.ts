import { prisma } from '@/lib/db/prisma'
import { unstable_cache } from 'next/cache'
import { type Locale } from '@/i18n/config'

export interface PublishedUpdate {
  id: string
  slug: string
  title: string
  body: string
  featured: boolean
  pinned: boolean
  category: string | null
  tags: string[]
  imageUrl: string | null
  publishedAt: Date | null
}

/**
 * Get localized text from update
 */
function getLocalizedText(
  item: {
    titleHt: string
    titleFr: string
    titleEn: string
    bodyHt: string
    bodyFr: string
    bodyEn: string
  },
  locale: Locale,
  field: 'title' | 'body'
): string {
  const htField = `${field}Ht` as keyof typeof item
  const frField = `${field}Fr` as keyof typeof item
  const enField = `${field}En` as keyof typeof item

  if (locale === 'ht' && item[htField]) return item[htField] as string
  if (locale === 'fr' && item[frField]) return item[frField] as string
  if (locale === 'en' && item[enField]) return item[enField] as string

  return (item[enField] || item[frField] || item[htField] || '') as string
}

/**
 * Get all approved updates
 */
export const getPublishedUpdates = unstable_cache(
  async (locale: Locale, limit?: number): Promise<PublishedUpdate[]> => {
    try {
      const updates = await prisma.update.findMany({
        where: {
          status: 'APPROVED',
        },
        orderBy: [
          { pinned: 'desc' },
          { publishedAt: 'desc' },
        ],
        take: limit,
      })

      return updates.map((update) => ({
        id: update.id,
        slug: update.slug,
        title: getLocalizedText(update, locale, 'title'),
        body: getLocalizedText(update, locale, 'body'),
        featured: update.featured,
        pinned: update.pinned,
        category: update.category,
        tags: update.tags,
        imageUrl: update.imageUrl,
        publishedAt: update.publishedAt,
      }))
    } catch (error) {
      console.error('Error fetching published updates:', error)
      return []
    }
  },
  ['published-updates'],
  {
    revalidate: 300, // 5 minutes
    tags: ['updates'],
  }
)

/**
 * Get a single update by slug
 */
export async function getUpdateBySlug(
  slug: string,
  locale: Locale
): Promise<PublishedUpdate | null> {
  try {
    const update = await prisma.update.findUnique({
      where: {
        slug,
        status: 'APPROVED',
      },
    })

    if (!update) return null

    return {
      id: update.id,
      slug: update.slug,
      title: getLocalizedText(update, locale, 'title'),
      body: getLocalizedText(update, locale, 'body'),
      featured: update.featured,
      pinned: update.pinned,
      category: update.category,
      tags: update.tags,
      imageUrl: update.imageUrl,
      publishedAt: update.publishedAt,
    }
  } catch (error) {
    console.error(`Error fetching update ${slug}:`, error)
    return null
  }
}

/**
 * Publish an update (approval required)
 */
export async function publishUpdate(
  updateId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.update.update({
      where: { id: updateId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        publishedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error publishing update:', error)
    return {
      success: false,
      error: 'Failed to publish update',
    }
  }
}
