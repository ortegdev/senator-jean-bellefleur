import { prisma } from '@/lib/db/prisma'
import { unstable_cache } from 'next/cache'
import { type Locale } from '@/i18n/config'

export interface PublishedFAQ {
  id: string
  question: string
  answer: string
  sources: {
    id: string
    title: string
    url: string | null
    publisher: string | null
    notes: string | null
  }[]
  featured: boolean
  order: number
}

/**
 * Get published FAQs
 */
export const getPublishedFAQs = unstable_cache(
  async (locale: Locale, featuredOnly: boolean = false): Promise<PublishedFAQ[]> => {
    try {
      const faqs = await prisma.fAQ.findMany({
        where: {
          status: 'PUBLISHED',
          ...(featuredOnly && { featured: true }),
        },
        include: {
          sources: true,
        },
        orderBy: { order: 'asc' },
      })

      return faqs.map((faq) => ({
        id: faq.id,
        question: getLocalizedQuestion(faq, locale),
        answer: getLocalizedAnswer(faq, locale),
        sources: faq.sources.map((source) => ({
          id: source.id,
          title: source.title,
          url: source.url,
          publisher: source.publisher,
          notes: source.notes,
        })),
        featured: faq.featured,
        order: faq.order,
      }))
    } catch (error) {
      console.error('Error fetching published FAQs:', error)
      return []
    }
  },
  ['published-faqs'],
  {
    revalidate: 300, // 5 minutes
    tags: ['faq'],
  }
)

function getLocalizedQuestion(
  faq: {
    questionHt: string
    questionFr: string
    questionEn: string
  },
  locale: Locale
): string {
  if (locale === 'ht') return faq.questionHt
  if (locale === 'fr') return faq.questionFr
  return faq.questionEn
}

function getLocalizedAnswer(
  faq: {
    answerHt: string
    answerFr: string
    answerEn: string
  },
  locale: Locale
): string {
  if (locale === 'ht') return faq.answerHt
  if (locale === 'fr') return faq.answerFr
  return faq.answerEn
}

/**
 * Check if FAQ can be published (has at least one source for answer)
 */
export async function canPublishFAQ(faqId: string): Promise<boolean> {
  const sourceCount = await prisma.fAQSource.count({
    where: { faqId },
  })

  return sourceCount > 0
}

/**
 * Publish FAQ (admin action)
 */
export async function publishFAQ(
  faqId: string,
  publishedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const canPublish = await canPublishFAQ(faqId)

    if (!canPublish) {
      return {
        success: false,
        error: 'Cannot publish FAQ without at least one source for the answer',
      }
    }

    await prisma.fAQ.update({
      where: { id: faqId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error publishing FAQ:', error)
    return {
      success: false,
      error: 'Failed to publish FAQ',
    }
  }
}
