/**
 * Candidate Data Access Layer
 * 
 * Single source of truth for candidate information.
 * All candidate data comes from the CandidateConfig table.
 */

import { prisma } from '@/lib/db/prisma'
import type { CandidateConfig } from '@prisma/client'

/**
 * Get the active candidate configuration
 * This is the single source of truth for all candidate information
 */
export async function getCandidateConfig(): Promise<CandidateConfig> {
  const config = await prisma.candidateConfig.findFirst({
    where: {
      slug: 'bellefleur', // Hardcoded for single-candidate site
    },
    orderBy: {
      version: 'desc', // Get latest version
    },
  })

  if (!config) {
    throw new Error('Candidate configuration not found. Please seed the database.')
  }

  return config
}

/**
 * Get candidate config by slug
 */
export async function getCandidateBySlug(slug: string): Promise<CandidateConfig | null> {
  return prisma.candidateConfig.findFirst({
    where: { slug },
    orderBy: {
      version: 'desc',
    },
  })
}

/**
 * Check if donations are currently enabled
 * Convenience function that checks the candidate config
 */
export async function isDonationsEnabled(): Promise<boolean> {
  const config = await getCandidateConfig()
  // Additional logic can be added here (e.g., check launch gate)
  return true // Placeholder - actual check happens in launch-gate module
}

/**
 * Get candidate's full name
 */
export async function getCandidateName(): Promise<string> {
  const config = await getCandidateConfig()
  return config.candidateName
}

/**
 * Get candidate's office and department
 */
export async function getCandidateOffice(): Promise<{
  office: string
  department: string
}> {
  const config = await getCandidateConfig()
  return {
    office: config.office,
    department: config.department,
  }
}
