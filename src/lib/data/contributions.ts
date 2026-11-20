import { prisma } from '@/lib/db/prisma'
import { unstable_cache } from 'next/cache'

export interface ContributionStats {
  totalRaisedCents: number
  totalSupporters: number
  uniqueCountries: number
  uniqueCommunes: number
  lastUpdated: Date
}

export interface CommuneSupporter {
  commune: string
  count: number
}

/**
 * Get contribution statistics (cached for 60 seconds)
 * Only returns data in DONATIONS_LIVE mode
 */
export const getContributionStats = unstable_cache(
  async (): Promise<ContributionStats | null> => {
    try {
      // Check if donations are live
      const gate = await prisma.launchGate.findFirst()
      if (gate?.mode !== 'DONATIONS_LIVE' || gate?.killSwitchActive) {
        return null
      }

      // Aggregate completed contributions only
      const [aggregation, uniqueCountries, uniqueCommunes] = await Promise.all([
        prisma.contribution.aggregate({
          where: {
            paymentStatus: 'COMPLETED',
          },
          _sum: {
            amountCents: true,
          },
          _count: {
            id: true,
          },
        }),
        prisma.contribution.groupBy({
          by: ['donorCountry'],
          where: {
            paymentStatus: 'COMPLETED',
          },
        }),
        // Assuming we track commune of origin in contribution metadata
        // For now, return 0 until we implement commune tracking
        Promise.resolve([]),
      ])

      return {
        totalRaisedCents: aggregation._sum.amountCents || 0,
        totalSupporters: aggregation._count.id || 0,
        uniqueCountries: uniqueCountries.length,
        uniqueCommunes: uniqueCommunes.length,
        lastUpdated: new Date(),
      }
    } catch (error) {
      console.error('Error fetching contribution stats:', error)
      return null
    }
  },
  ['contribution-stats'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['contributions'],
  }
)

/**
 * Get supporter counts by commune (aggregates only)
 * Only returns data if mode is DONATIONS_LIVE and data exists
 */
export const getCommuneSupporters = unstable_cache(
  async (): Promise<CommuneSupporter[]> => {
    try {
      // Check if donations are live
      const gate = await prisma.launchGate.findFirst()
      if (gate?.mode !== 'DONATIONS_LIVE' || gate?.killSwitchActive) {
        return []
      }

      // TODO: Implement commune tracking
      // This would require adding a communeOfOrigin field to Contribution model
      // For now, return empty array
      return []
    } catch (error) {
      console.error('Error fetching commune supporters:', error)
      return []
    }
  },
  ['commune-supporters'],
  {
    revalidate: 60,
    tags: ['contributions'],
  }
)
