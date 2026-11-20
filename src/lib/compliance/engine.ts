/**
 * Compliance Engine
 * 
 * CRITICAL: ALL legal rules are database-driven, NEVER hard-coded.
 * This engine evaluates donation attempts against configurable rules.
 * 
 * Rules are editable only by COMPLIANCE role with:
 * - Change history (versions)
 * - Dual approval workflow
 * - Complete audit trail
 * - Legal basis references
 */

import { prisma } from '@/lib/db/prisma'
import type {
  ComplianceResult,
  RuleType,
  SanctionsStatus,
  ReviewStatus,
} from '@prisma/client'
import { normalizeEmail } from './utils'
import { screenSanctions } from './sanctions'
import { generateFingerprint } from './fingerprint'

export interface DonationAttempt {
  // Donor Information
  donorEmail: string
  donorFirstName: string
  donorLastName: string
  declaredCountry: string
  
  // Transaction
  amountCents: number
  currency: string
  
  // Payment Method
  paymentMethodType?: string // "card", "apple_pay", "google_pay"
  paymentMethodFingerprint?: string
  cardBin?: string
  cardCountry?: string
  cardType?: string // "credit", "debit", "prepaid", "corporate"
  
  // Attestations
  attestations: Record<string, {
    version: number
    text: string
    timestamp: Date
  }>
  
  // Context
  ipAddress?: string
  ipCountry?: string
  userAgent?: string
  deviceFingerprint?: string
}

export interface ComplianceCheckResult {
  result: ComplianceResult
  reasons: string[]
  reasonDetails: Record<string, any>
  checkId: string
  requiresReview: boolean
}

/**
 * Main compliance check function
 * Called before creating any payment intent
 */
export async function checkCompliance(
  attempt: DonationAttempt
): Promise<ComplianceCheckResult> {
  const emailNormalized = normalizeEmail(attempt.donorEmail)
  const donorFingerprint = generateFingerprint({
    email: emailNormalized,
    paymentMethodFingerprint: attempt.paymentMethodFingerprint,
    deviceFingerprint: attempt.deviceFingerprint,
  })

  // Check blocklist first
  const blocked = await prisma.donorBlocklist.findFirst({
    where: {
      OR: [
        { emailNormalized },
        { fingerprint: donorFingerprint },
      ],
    },
  })

  if (blocked) {
    return createDenyResult(
      attempt,
      emailNormalized,
      donorFingerprint,
      ['DONOR_BLOCKED'],
      { blockReason: blocked.reason, blockedAt: blocked.blockedAt }
    )
  }

  // Load active rules
  const rules = await prisma.complianceRule.findMany({
    where: {
      isActive: true,
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: new Date() } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  })

  const reasons: string[] = []
  const reasonDetails: Record<string, any> = {}
  const rulesApplied: any[] = []
  let result: ComplianceResult = 'ALLOW'

  // Check each rule type
  for (const rule of rules) {
    const ruleResult = await evaluateRule(rule, attempt, emailNormalized, donorFingerprint)
    
    rulesApplied.push({
      ruleId: rule.id,
      ruleType: rule.ruleType,
      name: rule.name,
      result: ruleResult.result,
      details: ruleResult.details,
    })

    if (ruleResult.result === 'DENY') {
      result = 'DENY'
      reasons.push(...ruleResult.reasons)
      Object.assign(reasonDetails, ruleResult.details)
    } else if (ruleResult.result === 'REVIEW' && result !== 'DENY') {
      result = 'REVIEW'
      reasons.push(...ruleResult.reasons)
      Object.assign(reasonDetails, ruleResult.details)
    }
  }

  // Calculate cumulative total
  const historicalTotal = await calculateDonorTotal(emailNormalized, donorFingerprint)
  const newTotal = historicalTotal + attempt.amountCents

  // Create compliance check record
  const check = await prisma.complianceCheck.create({
    data: {
      donorEmail: attempt.donorEmail,
      donorEmailNormalized: emailNormalized,
      donorFingerprint,
      donorIpAddress: attempt.ipAddress,
      donorCountry: attempt.ipCountry,
      declaredCountry: attempt.declaredCountry,
      
      amountCents: attempt.amountCents,
      currency: attempt.currency,
      
      paymentMethodType: attempt.paymentMethodType,
      paymentMethodFingerprint: attempt.paymentMethodFingerprint,
      cardBin: attempt.cardBin,
      cardCountry: attempt.cardCountry,
      cardType: attempt.cardType,
      
      attestations: attempt.attestations as any,
      
      result,
      reasons,
      reasonDetails: reasonDetails as any,
      
      rulesVersion: JSON.stringify(rules.map((r) => ({ id: r.id, version: r.updatedAt }))),
      rulesApplied: rulesApplied as any,
      
      donorHistoricalTotal: historicalTotal,
      donorNewTotal: newTotal,
      
      reviewStatus: result === 'REVIEW' ? 'PENDING' : 'NOT_APPLICABLE',
    },
  })

  return {
    result,
    reasons,
    reasonDetails,
    checkId: check.id,
    requiresReview: result === 'REVIEW',
  }
}

interface RuleEvaluationResult {
  result: 'ALLOW' | 'REVIEW' | 'DENY'
  reasons: string[]
  details: Record<string, any>
}

async function evaluateRule(
  rule: any,
  attempt: DonationAttempt,
  emailNormalized: string,
  donorFingerprint: string
): Promise<RuleEvaluationResult> {
  const config = rule.config as any

  switch (rule.ruleType as RuleType) {
    case 'AMOUNT_LIMIT':
      return evaluateAmountLimit(config, attempt)
    
    case 'CUMULATIVE_CAP':
      return await evaluateCumulativeCap(config, attempt, emailNormalized, donorFingerprint)
    
    case 'COUNTRY_RESTRICTION':
      return evaluateCountryRestriction(config, attempt)
    
    case 'ELIGIBILITY_CHECK':
      return evaluateEligibilityCheck(config, attempt)
    
    case 'FUNDRAISING_PERIOD':
      return evaluateFundraisingPeriod(config, attempt)
    
    case 'SANCTIONS_SCREENING':
      return await evaluateSanctionsScreening(config, attempt)
    
    case 'PROHIBITED_SOURCE':
      return evaluateProhibitedSource(config, attempt)
    
    case 'PRE_CAMPAIGN_BLOCK':
      return evaluatePreCampaignBlock(config, attempt)
    
    default:
      return { result: 'ALLOW', reasons: [], details: {} }
  }
}

function evaluateAmountLimit(
  config: any,
  attempt: DonationAttempt
): RuleEvaluationResult {
  const { minCents, maxCents } = config

  if (attempt.amountCents < minCents) {
    return {
      result: 'DENY',
      reasons: ['AMOUNT_BELOW_MINIMUM'],
      details: {
        minCents,
        attemptedCents: attempt.amountCents,
      },
    }
  }

  if (attempt.amountCents > maxCents) {
    return {
      result: 'DENY',
      reasons: ['AMOUNT_ABOVE_MAXIMUM'],
      details: {
        maxCents,
        attemptedCents: attempt.amountCents,
      },
    }
  }

  return { result: 'ALLOW', reasons: [], details: {} }
}

async function evaluateCumulativeCap(
  config: any,
  attempt: DonationAttempt,
  emailNormalized: string,
  donorFingerprint: string
): Promise<RuleEvaluationResult> {
  const { capCents, cycleType } = config

  const historicalTotal = await calculateDonorTotal(emailNormalized, donorFingerprint)
  const newTotal = historicalTotal + attempt.amountCents

  if (newTotal > capCents) {
    return {
      result: 'DENY',
      reasons: ['CUMULATIVE_CAP_EXCEEDED'],
      details: {
        capCents,
        historicalTotal,
        attemptedCents: attempt.amountCents,
        newTotal,
        remaining: Math.max(0, capCents - historicalTotal),
      },
    }
  }

  return { result: 'ALLOW', reasons: [], details: { historicalTotal, newTotal } }
}

function evaluateCountryRestriction(
  config: any,
  attempt: DonationAttempt
): RuleEvaluationResult {
  const { mode, countries } = config // mode: "allowlist" | "denylist"

  if (mode === 'denylist') {
    if (countries.includes(attempt.declaredCountry)) {
      return {
        result: 'DENY',
        reasons: ['COUNTRY_DENIED'],
        details: {
          country: attempt.declaredCountry,
          mode,
        },
      }
    }
    
    // Check IP country mismatch
    if (attempt.ipCountry && countries.includes(attempt.ipCountry)) {
      return {
        result: 'REVIEW',
        reasons: ['IP_COUNTRY_DENIED'],
        details: {
          declaredCountry: attempt.declaredCountry,
          ipCountry: attempt.ipCountry,
        },
      }
    }
  }

  if (mode === 'allowlist') {
    if (!countries.includes(attempt.declaredCountry)) {
      return {
        result: 'DENY',
        reasons: ['COUNTRY_NOT_ALLOWED'],
        details: {
          country: attempt.declaredCountry,
          mode,
        },
      }
    }
  }

  return { result: 'ALLOW', reasons: [], details: {} }
}

function evaluateEligibilityCheck(
  config: any,
  attempt: DonationAttempt
): RuleEvaluationResult {
  const { requiredAttestations } = config

  const missingAttestations = requiredAttestations.filter(
    (key: string) => !attempt.attestations[key]
  )

  if (missingAttestations.length > 0) {
    return {
      result: 'DENY',
      reasons: ['MISSING_ATTESTATIONS'],
      details: {
        missing: missingAttestations,
      },
    }
  }

  return { result: 'ALLOW', reasons: [], details: {} }
}

function evaluateFundraisingPeriod(
  config: any,
  attempt: DonationAttempt
): RuleEvaluationResult {
  const { startDate, endDate } = config
  const now = new Date()

  if (startDate && now < new Date(startDate)) {
    return {
      result: 'DENY',
      reasons: ['FUNDRAISING_NOT_STARTED'],
      details: {
        startDate,
        currentDate: now.toISOString(),
      },
    }
  }

  if (endDate && now > new Date(endDate)) {
    return {
      result: 'DENY',
      reasons: ['FUNDRAISING_ENDED'],
      details: {
        endDate,
        currentDate: now.toISOString(),
      },
    }
  }

  return { result: 'ALLOW', reasons: [], details: {} }
}

async function evaluateSanctionsScreening(
  config: any,
  attempt: DonationAttempt
): Promise<RuleEvaluationResult> {
  const { enabled, provider } = config

  if (!enabled) {
    return { result: 'ALLOW', reasons: [], details: { sanctionsSkipped: true } }
  }

  const screening = await screenSanctions({
    donorName: `${attempt.donorFirstName} ${attempt.donorLastName}`,
    donorEmail: attempt.donorEmail,
    donorCountry: attempt.declaredCountry,
    ipAddress: attempt.ipAddress,
    provider,
  })

  if (screening.status === 'MATCH') {
    return {
      result: 'DENY',
      reasons: ['SANCTIONS_MATCH'],
      details: {
        screeningId: screening.id,
        matchScore: screening.matchScore,
      },
    }
  }

  if (screening.status === 'POTENTIAL_MATCH') {
    return {
      result: 'REVIEW',
      reasons: ['SANCTIONS_POTENTIAL_MATCH'],
      details: {
        screeningId: screening.id,
        matchScore: screening.matchScore,
      },
    }
  }

  if (screening.status === 'ERROR') {
    return {
      result: 'REVIEW',
      reasons: ['SANCTIONS_SCREENING_ERROR'],
      details: {
        screeningId: screening.id,
      },
    }
  }

  return { result: 'ALLOW', reasons: [], details: { sanctionsScreeningId: screening.id } }
}

function evaluateProhibitedSource(
  config: any,
  attempt: DonationAttempt
): RuleEvaluationResult {
  const { blockCorporateCards, blockPrepaidCards, flagCountryMismatch } = config

  const reasons: string[] = []
  const details: Record<string, any> = {}

  if (blockCorporateCards && attempt.cardType === 'corporate') {
    return {
      result: 'DENY',
      reasons: ['CORPORATE_CARD_PROHIBITED'],
      details: { cardType: attempt.cardType },
    }
  }

  if (blockPrepaidCards && attempt.cardType === 'prepaid') {
    return {
      result: 'DENY',
      reasons: ['PREPAID_CARD_PROHIBITED'],
      details: { cardType: attempt.cardType },
    }
  }

  if (flagCountryMismatch && attempt.cardCountry && attempt.cardCountry !== attempt.declaredCountry) {
    reasons.push('CARD_COUNTRY_MISMATCH')
    details.declaredCountry = attempt.declaredCountry
    details.cardCountry = attempt.cardCountry
    
    return {
      result: 'REVIEW',
      reasons,
      details,
    }
  }

  return { result: 'ALLOW', reasons: [], details: {} }
}

function evaluatePreCampaignBlock(
  config: any,
  attempt: DonationAttempt
): RuleEvaluationResult {
  const { enabled, campaignStartDate } = config

  if (!enabled) {
    return { result: 'ALLOW', reasons: [], details: {} }
  }

  const now = new Date()
  const startDate = new Date(campaignStartDate)

  if (now < startDate) {
    return {
      result: 'DENY',
      reasons: ['PRE_CAMPAIGN_PERIOD'],
      details: {
        campaignStartDate,
        currentDate: now.toISOString(),
        message: 'Contributions cannot be accepted before the official campaign period begins',
      },
    }
  }

  return { result: 'ALLOW', reasons: [], details: {} }
}

async function calculateDonorTotal(
  emailNormalized: string,
  donorFingerprint: string
): Promise<number> {
  const completedChecks = await prisma.complianceCheck.findMany({
    where: {
      OR: [
        { donorEmailNormalized: emailNormalized },
        { donorFingerprint },
      ],
      result: 'ALLOW',
      contributionId: { not: null }, // Only count completed contributions
    },
    select: {
      amountCents: true,
    },
  })

  return completedChecks.reduce((sum, check) => sum + check.amountCents, 0)
}

async function createDenyResult(
  attempt: DonationAttempt,
  emailNormalized: string,
  donorFingerprint: string,
  reasons: string[],
  details: Record<string, any>
): Promise<ComplianceCheckResult> {
  const check = await prisma.complianceCheck.create({
    data: {
      donorEmail: attempt.donorEmail,
      donorEmailNormalized: emailNormalized,
      donorFingerprint,
      donorIpAddress: attempt.ipAddress,
      donorCountry: attempt.ipCountry,
      declaredCountry: attempt.declaredCountry,
      
      amountCents: attempt.amountCents,
      currency: attempt.currency,
      
      paymentMethodType: attempt.paymentMethodType,
      paymentMethodFingerprint: attempt.paymentMethodFingerprint,
      cardBin: attempt.cardBin,
      cardCountry: attempt.cardCountry,
      cardType: attempt.cardType,
      
      attestations: attempt.attestations as any,
      
      result: 'DENY',
      reasons,
      reasonDetails: details as any,
      
      rulesVersion: '',
      rulesApplied: [] as any,
      
      donorHistoricalTotal: 0,
      donorNewTotal: 0,
      
      reviewStatus: 'NOT_APPLICABLE',
    },
  })

  return {
    result: 'DENY',
    reasons,
    reasonDetails: details,
    checkId: check.id,
    requiresReview: false,
  }
}
