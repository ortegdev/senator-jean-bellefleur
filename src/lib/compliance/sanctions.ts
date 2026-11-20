/**
 * Sanctions Screening
 * 
 * Integrates with sanctions screening providers to check donors
 * against OFAC, UN, EU and other sanctions lists.
 * 
 * Providers:
 * - stub: For testing (always returns CLEAR)
 * - chainalysis: Chainalysis KYT
 * - dowjones: Dow Jones Risk & Compliance
 * - complyadvantage: ComplyAdvantage
 */

import { prisma } from '@/lib/db/prisma'
import type { SanctionsStatus } from '@prisma/client'

export interface SanctionsScreeningRequest {
  donorName: string
  donorEmail: string
  donorCountry?: string
  ipAddress?: string
  provider: string
}

export interface SanctionsScreeningResult {
  id: string
  status: SanctionsStatus
  matchScore?: number
  matchDetails?: any
}

/**
 * Screen donor against sanctions lists
 */
export async function screenSanctions(
  request: SanctionsScreeningRequest
): Promise<SanctionsScreeningResult> {
  // Select provider
  switch (request.provider) {
    case 'stub':
      return await stubScreening(request)
    
    case 'chainalysis':
      return await chainalysisScreening(request)
    
    case 'dowjones':
      return await dowJonesScreening(request)
    
    case 'complyadvantage':
      return await complyAdvantageScreening(request)
    
    default:
      return await stubScreening(request)
  }
}

/**
 * Stub provider for testing
 * Always returns CLEAR unless specific test patterns are used
 */
async function stubScreening(
  request: SanctionsScreeningRequest
): Promise<SanctionsScreeningResult> {
  // Test patterns for manual testing
  const testPatterns = {
    'SANCTIONS_MATCH': 'MATCH',
    'SANCTIONS_POTENTIAL': 'POTENTIAL_MATCH',
    'SANCTIONS_ERROR': 'ERROR',
  }
  
  let status: SanctionsStatus = 'CLEAR'
  let matchScore: number | undefined
  
  // Check for test patterns in name
  for (const [pattern, result] of Object.entries(testPatterns)) {
    if (request.donorName.toUpperCase().includes(pattern)) {
      status = result as SanctionsStatus
      matchScore = result === 'MATCH' ? 0.95 : result === 'POTENTIAL_MATCH' ? 0.65 : undefined
      break
    }
  }
  
  // Simulate countries with high-risk patterns
  const highRiskCountries = ['KP', 'IR', 'SY', 'CU', 'VE'] // North Korea, Iran, Syria, Cuba, Venezuela
  if (request.donorCountry && highRiskCountries.includes(request.donorCountry)) {
    if (status === 'CLEAR') {
      status = 'POTENTIAL_MATCH'
      matchScore = 0.55
    }
  }
  
  // Create screening record
  const screening = await prisma.sanctionsScreening.create({
    data: {
      donorName: request.donorName,
      donorEmail: request.donorEmail,
      donorCountry: request.donorCountry,
      ipAddress: request.ipAddress,
      
      provider: 'stub',
      providerRequestId: `stub-${Date.now()}`,
      
      status,
      matchScore,
      matchDetails: status !== 'CLEAR' ? {
        provider: 'stub',
        reason: 'Test pattern or high-risk country',
        timestamp: new Date().toISOString(),
      } : null,
    },
  })
  
  return {
    id: screening.id,
    status: screening.status,
    matchScore: screening.matchScore || undefined,
    matchDetails: screening.matchDetails,
  }
}

/**
 * Chainalysis KYT integration (placeholder)
 */
async function chainalysisScreening(
  request: SanctionsScreeningRequest
): Promise<SanctionsScreeningResult> {
  // TODO: Integrate with Chainalysis API
  // https://docs.chainalysis.com/
  
  console.log('Chainalysis screening not yet implemented, falling back to stub')
  return await stubScreening(request)
}

/**
 * Dow Jones Risk & Compliance integration (placeholder)
 */
async function dowJonesScreening(
  request: SanctionsScreeningRequest
): Promise<SanctionsScreeningResult> {
  // TODO: Integrate with Dow Jones API
  // https://developer.dowjones.com/
  
  console.log('Dow Jones screening not yet implemented, falling back to stub')
  return await stubScreening(request)
}

/**
 * ComplyAdvantage integration (placeholder)
 */
async function complyAdvantageScreening(
  request: SanctionsScreeningRequest
): Promise<SanctionsScreeningResult> {
  // TODO: Integrate with ComplyAdvantage API
  // https://docs.complyadvantage.com/
  
  console.log('ComplyAdvantage screening not yet implemented, falling back to stub')
  return await stubScreening(request)
}

/**
 * Get human-readable status message
 */
export function getSanctionsStatusMessage(status: SanctionsStatus): string {
  const messages: Record<SanctionsStatus, string> = {
    CLEAR: 'No sanctions matches found',
    POTENTIAL_MATCH: 'Potential sanctions match detected, requires review',
    MATCH: 'Sanctions match detected, contribution denied',
    ERROR: 'Sanctions screening failed, requires review',
    SKIPPED: 'Sanctions screening skipped',
  }
  
  return messages[status]
}
