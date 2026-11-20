import { prisma } from '@/lib/db/prisma'
import { unstable_cache } from 'next/cache'

/**
 * Get all communes for Nord-Ouest department
 * Returns communes ordered by arrondissement and display order
 */
export const getCommunes = unstable_cache(
  async () => {
    try {
      const communes = await prisma.commune.findMany({
        orderBy: [{ order: 'asc' }],
      })

      return communes
    } catch (error) {
      console.error('Error fetching communes:', error)
      return []
    }
  },
  ['communes'],
  {
    revalidate: 3600, // 1 hour
    tags: ['communes'],
  }
)

/**
 * Get a single commune by slug
 */
export async function getCommune(slug: string) {
  try {
    const commune = await prisma.commune.findUnique({
      where: { slug },
    })

    return commune
  } catch (error) {
    console.error(`Error fetching commune ${slug}:`, error)
    return null
  }
}

/**
 * Update supporter count for a commune
 * Called when new contributions are made
 */
export async function updateCommuneSupporterCount(
  communeSlug: string,
  count: number
) {
  try {
    await prisma.commune.update({
      where: { slug: communeSlug },
      data: { supporterCount: count },
    })
  } catch (error) {
    console.error(
      `Error updating supporter count for ${communeSlug}:`,
      error
    )
  }
}
