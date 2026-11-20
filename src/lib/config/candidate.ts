import { prisma } from '@/lib/db/prisma'
import { CandidateConfig } from '@prisma/client'

// Cache the config for 5 minutes in development, 1 hour in production
const CACHE_TTL = process.env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 5 * 60 * 1000

let cachedConfig: { data: CandidateConfig; timestamp: number } | null = null

/**
 * Get the candidate configuration
 * Uses in-memory cache to avoid repeated database queries
 */
export async function getCandidateConfig(): Promise<CandidateConfig> {
  // Check cache
  if (cachedConfig && Date.now() - cachedConfig.timestamp < CACHE_TTL) {
    return cachedConfig.data
  }

  // Fetch from database
  const config = await prisma.candidateConfig.findFirst({
    where: { slug: 'bellefleur' },
    orderBy: { createdAt: 'desc' },
  })

  if (!config) {
    throw new Error('Candidate configuration not found. Run database seed.')
  }

  // Update cache
  cachedConfig = {
    data: config,
    timestamp: Date.now(),
  }

  return config
}

/**
 * Invalidate the candidate config cache
 * Call this after updating the config in the database
 */
export function invalidateCandidateConfigCache() {
  cachedConfig = null
}
