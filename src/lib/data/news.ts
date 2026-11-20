import { prisma } from '@/lib/db/prisma'
import { unstable_cache } from 'next/cache'
import { type Locale } from '@/i18n/config'

export interface PublishedNewsArticle {
  id: string
  url: string
  headline: string
  outlet: string
  publishedAt: Date
  language: string
  contentType: string
  matchTier: string
  metaDescription: string | null
  domain: string
}

/**
 * Get published news articles for ticker (ABOUT tier only, newest first)
 */
export const getTickerArticles = unstable_cache(
  async (limit: number = 8): Promise<PublishedNewsArticle[]> => {
    try {
      const articles = await prisma.newsArticle.findMany({
        where: {
          status: 'PUBLISHED',
          matchTier: 'ABOUT', // Only main-subject articles
          hiddenAt: null, // Not hidden
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: limit,
      })

      return articles.map((article) => ({
        id: article.id,
        url: article.url,
        headline: article.headline,
        outlet: article.outlet,
        publishedAt: article.publishedAt,
        language: article.language,
        contentType: article.contentType,
        matchTier: article.matchTier,
        metaDescription: article.metaDescription,
        domain: article.domain,
      }))
    } catch (error) {
      console.error('Error fetching ticker articles:', error)
      return []
    }
  },
  ['news-ticker'],
  {
    revalidate: 600, // 10 minutes
    tags: ['news'],
  }
)

/**
 * Get all published news articles with filters for the list view
 */
export async function getNewsArticles(options?: {
  language?: string
  contentType?: string
  year?: number
  outlet?: string
  matchTier?: 'ABOUT' | 'MENTION'
  cursor?: string
  limit?: number
}): Promise<{
  articles: PublishedNewsArticle[]
  nextCursor: string | null
  hasMore: boolean
}> {
  const limit = options?.limit || 20

  try {
    const where: any = {
      status: 'PUBLISHED',
      hiddenAt: null,
    }

    if (options?.language) {
      where.language = options.language
    }

    if (options?.contentType) {
      where.contentType = options.contentType
    }

    if (options?.year) {
      const yearStart = new Date(`${options.year}-01-01`)
      const yearEnd = new Date(`${options.year}-12-31T23:59:59`)
      where.publishedAt = {
        gte: yearStart,
        lte: yearEnd,
      }
    }

    if (options?.outlet) {
      where.outlet = options.outlet
    }

    if (options?.matchTier) {
      where.matchTier = options.matchTier
    }

    if (options?.cursor) {
      where.id = {
        lt: options.cursor, // Cursor-based pagination
      }
    }

    const articles = await prisma.newsArticle.findMany({
      where,
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit + 1, // Fetch one extra to check if there's more
    })

    const hasMore = articles.length > limit
    const items = hasMore ? articles.slice(0, limit) : articles
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return {
      articles: items.map((article) => ({
        id: article.id,
        url: article.url,
        headline: article.headline,
        outlet: article.outlet,
        publishedAt: article.publishedAt,
        language: article.language,
        contentType: article.contentType,
        matchTier: article.matchTier,
        metaDescription: article.metaDescription,
        domain: article.domain,
      })),
      nextCursor,
      hasMore,
    }
  } catch (error) {
    console.error('Error fetching news articles:', error)
    return {
      articles: [],
      nextCursor: null,
      hasMore: false,
    }
  }
}

/**
 * Get unique outlets for filter dropdown
 */
export const getNewsOutlets = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const outlets = await prisma.newsArticle.findMany({
        where: {
          status: 'PUBLISHED',
          hiddenAt: null,
        },
        select: {
          outlet: true,
        },
        distinct: ['outlet'],
        orderBy: {
          outlet: 'asc',
        },
      })

      return outlets.map((o) => o.outlet)
    } catch (error) {
      console.error('Error fetching outlets:', error)
      return []
    }
  },
  ['news-outlets'],
  {
    revalidate: 3600, // 1 hour
    tags: ['news'],
  }
)

/**
 * Get unique years for filter dropdown
 */
export const getNewsYears = unstable_cache(
  async (): Promise<number[]> => {
    try {
      const articles = await prisma.newsArticle.findMany({
        where: {
          status: 'PUBLISHED',
          hiddenAt: null,
        },
        select: {
          publishedAt: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      })

      const years = new Set(
        articles.map((a) => new Date(a.publishedAt).getFullYear())
      )

      return Array.from(years).sort((a, b) => b - a)
    } catch (error) {
      console.error('Error fetching years:', error)
      return []
    }
  },
  ['news-years'],
  {
    revalidate: 3600, // 1 hour
    tags: ['news'],
  }
)

/**
 * Check if NEWS_SHOW_SNIPPETS is enabled
 */
export function showSnippets(): boolean {
  return process.env.NEWS_SHOW_SNIPPETS === 'true'
}

/**
 * Get article age in hours
 */
export function getArticleAgeHours(publishedAt: Date): number {
  const now = new Date()
  const diff = now.getTime() - new Date(publishedAt).getTime()
  return diff / (1000 * 60 * 60)
}

/**
 * Check if article is "breaking" (within 24 hours)
 */
export function isBreaking(publishedAt: Date): boolean {
  return getArticleAgeHours(publishedAt) <= 24
}

/**
 * Check if article is "new" (within 48 hours)
 */
export function isNew(publishedAt: Date): boolean {
  return getArticleAgeHours(publishedAt) <= 48
}
