/**
 * Roots by Commune
 * 
 * Supporters optionally pick the commune their family comes from.
 * Displays:
 * - The 10 Nord-Ouest communes
 * - "Other Nord-Ouest"
 * - "Elsewhere in Haiti"
 * 
 * Features:
 * - Aggregate counts only (privacy-safe)
 * - Small-count suppression (configurable minimum)
 * - Feeds home page and Nord-Ouest page
 */

import { prisma } from '@/lib/db/prisma'

// Configurable minimum count for display (privacy protection)
const ROOTS_MIN_COUNT = parseInt(process.env.ROOTS_MIN_COUNT || '5', 10)

// Nord-Ouest communes (from candidate config)
const NORD_OUEST_COMMUNES = [
  'mole-saint-nicolas',
  'baie-de-henne',
  'bombardopolis',
  'jean-rabel',
  'port-de-paix',
  'bassin-bleu',
  'chansolme',
  'la-tortue',
  'saint-louis-du-nord',
  'anse-a-foleur',
]

// Special categories
const SPECIAL_COMMUNES = ['other', 'elsewhere'] // "Other Nord-Ouest", "Elsewhere in Haiti"

// ============================================================================
// COMMUNE NAMES (Localized)
// ============================================================================

const COMMUNE_NAMES: Record<string, { ht: string; fr: string; en: string }> = {
  'mole-saint-nicolas': {
    ht: 'Môl Sen Nikola',
    fr: 'Môle-Saint-Nicolas',
    en: 'Môle-Saint-Nicolas',
  },
  'baie-de-henne': {
    ht: 'Bèdenn',
    fr: 'Baie-de-Henne',
    en: 'Baie-de-Henne',
  },
  bombardopolis: {
    ht: 'Bonbadopolis',
    fr: 'Bombardopolis',
    en: 'Bombardopolis',
  },
  'jean-rabel': {
    ht: 'Jan Rabèl',
    fr: 'Jean-Rabel',
    en: 'Jean-Rabel',
  },
  'port-de-paix': {
    ht: 'Pòdepè',
    fr: 'Port-de-Paix',
    en: 'Port-de-Paix',
  },
  'bassin-bleu': {
    ht: 'Basenblè',
    fr: 'Bassin-Bleu',
    en: 'Bassin-Bleu',
  },
  chansolme: {
    ht: 'Chansòlm',
    fr: 'Chansolme',
    en: 'Chansolme',
  },
  'la-tortue': {
    ht: 'Lati',
    fr: 'La Tortue',
    en: 'La Tortue (Tortuga)',
  },
  'saint-louis-du-nord': {
    ht: 'Sen Lwi dinò',
    fr: 'Saint-Louis-du-Nord',
    en: 'Saint-Louis-du-Nord',
  },
  'anse-a-foleur': {
    ht: 'Ansaflè',
    fr: 'Anse-à-Foleur',
    en: 'Anse-à-Foleur',
  },
  other: {
    ht: 'Lòt kominote Nòdwès',
    fr: 'Autre commune du Nord-Ouest',
    en: 'Other Nord-Ouest commune',
  },
  elsewhere: {
    ht: 'Lòt kote nan Ayiti',
    fr: 'Ailleurs en Haïti',
    en: 'Elsewhere in Haiti',
  },
}

// ============================================================================
// SET ROOTS FOR DONOR
// ============================================================================

export async function setDonorRoots(donorId: string, communeSlug: string | null) {
  // Validate commune slug
  if (communeSlug !== null) {
    const validCommunes = [...NORD_OUEST_COMMUNES, ...SPECIAL_COMMUNES]
    if (!validCommunes.includes(communeSlug)) {
      throw new Error('Invalid commune slug')
    }
  }

  // Update donor
  const donor = await prisma.donor.update({
    where: { id: donorId },
    data: {
      rootsCommune: communeSlug,
    },
  })

  // Note: Aggregates are recalculated periodically, not on every update
  // This prevents race conditions and reduces database load

  return donor
}

// ============================================================================
// RECALCULATE AGGREGATES (Run periodically via cron)
// ============================================================================

export async function recalculateRootsAggregates() {
  console.log('[Roots] Recalculating commune aggregates...')

  const allCommunes = [...NORD_OUEST_COMMUNES, ...SPECIAL_COMMUNES]

  for (const communeSlug of allCommunes) {
    // Count donors with this roots commune who have made successful contributions
    const count = await prisma.donor.count({
      where: {
        rootsCommune: communeSlug,
        contributions: {
          some: {
            paymentStatus: 'SUCCEEDED',
          },
        },
      },
    })

    // Check if count should be suppressed (below minimum)
    const isSuppressed = count < ROOTS_MIN_COUNT

    // Upsert aggregate
    await prisma.rootsAggregate.upsert({
      where: { communeSlug },
      update: {
        supporterCount: count,
        isSuppressed,
        lastCalculatedAt: new Date(),
      },
      create: {
        communeSlug,
        supporterCount: count,
        isSuppressed,
        lastCalculatedAt: new Date(),
      },
    })

    console.log(
      `[Roots] ${communeSlug}: ${count} supporters ${isSuppressed ? '(suppressed)' : ''}`
    )
  }

  console.log('[Roots] Recalculation complete')
}

// ============================================================================
// GET DISPLAYABLE AGGREGATES
// ============================================================================

export interface RootsAggregateDisplay {
  communeSlug: string
  nameHt: string
  nameFr: string
  nameEn: string
  supporterCount: number | null // null if suppressed
  displayText: {
    ht: string
    fr: string
    en: string
  }
}

export async function getDisplayableRootsAggregates(): Promise<RootsAggregateDisplay[]> {
  const aggregates = await prisma.rootsAggregate.findMany({
    orderBy: { supporterCount: 'desc' },
  })

  return aggregates.map((agg) => {
    const names = COMMUNE_NAMES[agg.communeSlug] || {
      ht: agg.communeSlug,
      fr: agg.communeSlug,
      en: agg.communeSlug,
    }

    // Suppress count if below minimum
    const displayCount = agg.isSuppressed ? null : agg.supporterCount

    // Generate display text
    const displayText = {
      ht:
        displayCount !== null
          ? `${displayCount} sipòtè${displayCount !== 1 ? '' : ''}`
          : `Mwens pase ${ROOTS_MIN_COUNT}`,
      fr:
        displayCount !== null
          ? `${displayCount} supporteur${displayCount !== 1 ? 's' : ''}`
          : `Moins de ${ROOTS_MIN_COUNT}`,
      en:
        displayCount !== null
          ? `${displayCount} supporter${displayCount !== 1 ? 's' : ''}`
          : `Fewer than ${ROOTS_MIN_COUNT}`,
    }

    return {
      communeSlug: agg.communeSlug,
      nameHt: names.ht,
      nameFr: names.fr,
      nameEn: names.en,
      supporterCount: displayCount,
      displayText,
    }
  })
}

// ============================================================================
// GET NORD-OUEST AGGREGATES (For Nord-Ouest page)
// ============================================================================

export async function getNordOuestRootsAggregates(): Promise<RootsAggregateDisplay[]> {
  const allAggregates = await getDisplayableRootsAggregates()

  // Filter to Nord-Ouest communes only (not "elsewhere")
  return allAggregates.filter(
    (agg) => NORD_OUEST_COMMUNES.includes(agg.communeSlug) || agg.communeSlug === 'other'
  )
}

// ============================================================================
// GET TOTAL SUPPORTERS (All communes)
// ============================================================================

export async function getTotalSupportersWithRoots(): Promise<number> {
  const aggregates = await prisma.rootsAggregate.findMany()

  return aggregates.reduce((sum, agg) => sum + agg.supporterCount, 0)
}

// ============================================================================
// COMMUNE OPTIONS FOR FORMS
// ============================================================================

export interface CommuneOption {
  value: string
  labelHt: string
  labelFr: string
  labelEn: string
}

export function getCommuneOptions(): CommuneOption[] {
  const allCommunes = [...NORD_OUEST_COMMUNES, ...SPECIAL_COMMUNES]

  return allCommunes.map((slug) => {
    const names = COMMUNE_NAMES[slug] || { ht: slug, fr: slug, en: slug }

    return {
      value: slug,
      labelHt: names.ht,
      labelFr: names.fr,
      labelEn: names.en,
    }
  })
}

// ============================================================================
// PRIVACY VALIDATION
// ============================================================================

/**
 * Verify that small-count suppression is working correctly
 * 
 * Used in tests to ensure we never expose counts below minimum
 */
export async function verifySmallCountSuppression(): Promise<{
  valid: boolean
  violations: string[]
}> {
  const aggregates = await prisma.rootsAggregate.findMany()

  const violations: string[] = []

  for (const agg of aggregates) {
    if (agg.supporterCount < ROOTS_MIN_COUNT && !agg.isSuppressed) {
      violations.push(
        `Commune ${agg.communeSlug} has count ${agg.supporterCount} < ${ROOTS_MIN_COUNT} but is not suppressed`
      )
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  }
}
