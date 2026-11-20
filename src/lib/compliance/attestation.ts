/**
 * Attestation Management
 * 
 * Manages versioned eligibility attestations that donors must agree to.
 * Attestations are reviewed by counsel and versioned for audit trail.
 */

import { prisma } from '@/lib/db/prisma'

export interface AttestationVersion {
  key: string
  version: number
  text: {
    en: string
    fr: string
    ht: string
  }
  legalBasis?: string
}

/**
 * Get the latest active version of all required attestations
 */
export async function getLatestAttestationVersion(): Promise<AttestationVersion[] | null> {
  try {
    const attestations = await prisma.eligibilityAttestation.findMany({
      where: {
        isActive: true,
        isRequired: true,
      },
      orderBy: [
        { key: 'asc' },
        { version: 'desc' },
      ],
    })

    if (attestations.length === 0) {
      return null
    }

    // Deduplicate by key, keeping only the highest version
    const uniqueAttestations = new Map<string, typeof attestations[0]>()
    
    for (const attestation of attestations) {
      const existing = uniqueAttestations.get(attestation.key)
      if (!existing || attestation.version > existing.version) {
        uniqueAttestations.set(attestation.key, attestation)
      }
    }

    return Array.from(uniqueAttestations.values()).map(att => ({
      key: att.key,
      version: att.version,
      text: att.text as { en: string; fr: string; ht: string },
      legalBasis: att.legalBasis || undefined,
    }))
  } catch (error) {
    console.error('Failed to get latest attestation version:', error)
    return null
  }
}

/**
 * Get a specific attestation by key and version
 */
export async function getAttestation(key: string, version?: number): Promise<AttestationVersion | null> {
  try {
    const query: any = {
      where: {
        key,
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    }

    if (version !== undefined) {
      query.where.version = version
    }

    const attestation = await prisma.eligibilityAttestation.findFirst(query)

    if (!attestation) {
      return null
    }

    return {
      key: attestation.key,
      version: attestation.version,
      text: attestation.text as { en: string; fr: string; ht: string },
      legalBasis: attestation.legalBasis || undefined,
    }
  } catch (error) {
    console.error(`Failed to get attestation ${key}:`, error)
    return null
  }
}

/**
 * Get all active attestations (including optional ones)
 */
export async function getAllActiveAttestations(): Promise<AttestationVersion[]> {
  try {
    const attestations = await prisma.eligibilityAttestation.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { key: 'asc' },
        { version: 'desc' },
      ],
    })

    // Deduplicate by key
    const uniqueAttestations = new Map<string, typeof attestations[0]>()
    
    for (const attestation of attestations) {
      const existing = uniqueAttestations.get(attestation.key)
      if (!existing || attestation.version > existing.version) {
        uniqueAttestations.set(attestation.key, attestation)
      }
    }

    return Array.from(uniqueAttestations.values()).map(att => ({
      key: att.key,
      version: att.version,
      text: att.text as { en: string; fr: string; ht: string },
      legalBasis: att.legalBasis || undefined,
    }))
  } catch (error) {
    console.error('Failed to get all active attestations:', error)
    return []
  }
}
