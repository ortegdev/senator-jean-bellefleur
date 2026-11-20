/**
 * Fraud Risk Scoring System
 * 
 * Calculates risk scores based on multiple signals:
 * - Velocity patterns (many rapid attempts)
 * - Disposable email addresses
 * - Country mismatches (billing vs IP)
 * - Repeated payment failures
 * - Prior chargebacks from same identifiers
 * - Suspicious patterns (round amounts, etc.)
 * 
 * Risk levels:
 * - LOW (0-29): Allow automatically
 * - MEDIUM (30-59): Require email confirmation
 * - HIGH (60-100): Route to manual review
 */

import { prisma } from '@/lib/db/prisma'
import { getRateLimitStore } from '@/lib/rate-limit/store'

export interface RiskScoreParams {
  // Donor info
  email: string
  country: string
  amountCents: number

  // Device/network
  ipAddress: string
  ipCountry?: string
  deviceFingerprint?: string
  userAgent: string

  // Payment
  cardCountry?: string
  cardFingerprint?: string

  // History
  donorFingerprint: string
}

export interface RiskScoreResult {
  score: number // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  factors: RiskFactor[]
  requiresEmailConfirmation: boolean
  requiresManualReview: boolean
}

export interface RiskFactor {
  factor: string
  points: number
  description: string
}

/**
 * Calculate fraud risk score
 */
export async function calculateRiskScore(
  params: RiskScoreParams
): Promise<RiskScoreResult> {
  const factors: RiskFactor[] = []
  let totalScore = 0

  // Factor 1: Velocity check (0-25 points)
  const velocityPoints = await checkVelocityRisk(params)
  if (velocityPoints > 0) {
    factors.push({
      factor: 'velocity',
      points: velocityPoints,
      description: velocityPoints > 15
        ? 'High volume of recent attempts'
        : 'Multiple recent attempts',
    })
    totalScore += velocityPoints
  }

  // Factor 2: Disposable email (0-20 points)
  const disposablePoints = checkDisposableEmail(params.email)
  if (disposablePoints > 0) {
    factors.push({
      factor: 'disposable_email',
      points: disposablePoints,
      description: 'Disposable or temporary email address',
    })
    totalScore += disposablePoints
  }

  // Factor 3: Country mismatches (0-20 points)
  const countryPoints = checkCountryMismatches(params)
  if (countryPoints > 0) {
    factors.push({
      factor: 'country_mismatch',
      points: countryPoints,
      description: 'Billing country does not match IP or card country',
    })
    totalScore += countryPoints
  }

  // Factor 4: Recent failures (0-25 points)
  const failurePoints = await checkRecentFailures(params)
  if (failurePoints > 0) {
    factors.push({
      factor: 'recent_failures',
      points: failurePoints,
      description: failurePoints > 15
        ? 'Multiple recent failed attempts'
        : 'Recent failed payment',
    })
    totalScore += failurePoints
  }

  // Factor 5: Prior chargebacks (0-30 points)
  const chargebackPoints = await checkPriorChargebacks(params)
  if (chargebackPoints > 0) {
    factors.push({
      factor: 'prior_chargebacks',
      points: chargebackPoints,
      description: 'Previous chargebacks from this donor',
    })
    totalScore += chargebackPoints
  }

  // Factor 6: Suspicious patterns (0-15 points)
  const patternPoints = checkSuspiciousPatterns(params)
  if (patternPoints > 0) {
    factors.push({
      factor: 'suspicious_pattern',
      points: patternPoints,
      description: 'Unusual transaction pattern detected',
    })
    totalScore += patternPoints
  }

  // Cap at 100
  totalScore = Math.min(100, totalScore)

  // Determine risk level
  const level = 
    totalScore >= 60 ? 'HIGH' :
    totalScore >= 30 ? 'MEDIUM' :
    'LOW'

  return {
    score: totalScore,
    level,
    factors,
    requiresEmailConfirmation: level === 'MEDIUM',
    requiresManualReview: level === 'HIGH',
  }
}

/**
 * Check velocity risk (0-25 points)
 * 
 * High velocity indicates card testing.
 */
async function checkVelocityRisk(params: RiskScoreParams): Promise<number> {
  const store = getRateLimitStore()

  // Check attempts in last hour across all dimensions
  const [ipCount, emailCount, cardCount] = await Promise.all([
    store.get(`velocity:ip:${params.ipAddress}:1h`),
    store.get(`velocity:email:${params.email.toLowerCase()}:1h`),
    params.cardFingerprint 
      ? store.get(`velocity:card:${params.cardFingerprint}:1h`)
      : Promise.resolve(0),
  ])

  const maxCount = Math.max(ipCount, emailCount, cardCount)

  if (maxCount >= 10) return 25
  if (maxCount >= 7) return 20
  if (maxCount >= 5) return 15
  if (maxCount >= 3) return 10
  if (maxCount >= 2) return 5

  return 0
}

/**
 * Check for disposable email (0-20 points)
 * 
 * Disposable emails are commonly used for fraud.
 */
function checkDisposableEmail(email: string): number {
  const domain = email.toLowerCase().split('@')[1]

  // Common disposable email domains
  const disposableDomains = [
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'fakeinbox.com',
    'maildrop.cc',
    'yopmail.com',
    'getnada.com',
  ]

  if (disposableDomains.includes(domain)) {
    return 20
  }

  // Check for suspicious patterns
  if (
    domain.includes('temp') ||
    domain.includes('disposable') ||
    domain.includes('throwaway') ||
    domain.match(/^[0-9]+mail\./)
  ) {
    return 15
  }

  return 0
}

/**
 * Check country mismatches (0-20 points)
 * 
 * Mismatches between billing, IP, and card countries are suspicious.
 */
function checkCountryMismatches(params: RiskScoreParams): number {
  const { country, ipCountry, cardCountry } = params

  let mismatches = 0

  if (ipCountry && ipCountry !== country) {
    mismatches++
  }

  if (cardCountry && cardCountry !== country) {
    mismatches++
  }

  if (ipCountry && cardCountry && ipCountry !== cardCountry) {
    mismatches++
  }

  if (mismatches >= 3) return 20
  if (mismatches === 2) return 15
  if (mismatches === 1) return 10

  return 0
}

/**
 * Check recent payment failures (0-25 points)
 * 
 * Many failed attempts suggest card testing.
 */
async function checkRecentFailures(params: RiskScoreParams): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Count failed contributions from same donor fingerprint
  const failedCount = await prisma.contribution.count({
    where: {
      donorFingerprint: params.donorFingerprint,
      status: 'FAILED',
      createdAt: { gte: oneDayAgo },
    },
  })

  if (failedCount >= 10) return 25
  if (failedCount >= 5) return 20
  if (failedCount >= 3) return 15
  if (failedCount >= 2) return 10
  if (failedCount >= 1) return 5

  return 0
}

/**
 * Check prior chargebacks (0-30 points)
 * 
 * Previous chargebacks are a strong fraud signal.
 */
async function checkPriorChargebacks(params: RiskScoreParams): Promise<number> {
  // Check for chargebacks from same donor fingerprint
  const chargebackCount = await prisma.contribution.count({
    where: {
      donorFingerprint: params.donorFingerprint,
      status: 'DISPUTED',
    },
  })

  if (chargebackCount >= 3) return 30
  if (chargebackCount === 2) return 25
  if (chargebackCount === 1) return 20

  // Check for chargebacks from same email
  const emailChargebacks = await prisma.contribution.count({
    where: {
      donorEmail: params.email.toLowerCase(),
      status: 'DISPUTED',
    },
  })

  if (emailChargebacks >= 2) return 25
  if (emailChargebacks === 1) return 15

  return 0
}

/**
 * Check suspicious patterns (0-15 points)
 * 
 * Unusual patterns that suggest testing or fraud.
 */
function checkSuspiciousPatterns(params: RiskScoreParams): number {
  let points = 0

  // Round amounts in small increments (card testing pattern)
  if (params.amountCents <= 1000 && params.amountCents % 100 === 0) {
    points += 10 // $1, $2, $3, etc. (common in card testing)
  }

  // Exact $5 or $10 (very common card testing amounts)
  if (params.amountCents === 500 || params.amountCents === 1000) {
    points += 5
  }

  // Suspicious user agent patterns
  if (
    !params.userAgent ||
    params.userAgent.includes('curl') ||
    params.userAgent.includes('python') ||
    params.userAgent.includes('bot')
  ) {
    points += 10
  }

  return Math.min(15, points)
}

/**
 * Record risk score for analytics
 */
export async function recordRiskScore(
  contributionId: string,
  result: RiskScoreResult
): Promise<void> {
  await prisma.fraudEvent.create({
    data: {
      eventType: 'RISK_SCORE_CALCULATED',
      severity: result.level === 'HIGH' ? 'HIGH' : result.level === 'MEDIUM' ? 'MEDIUM' : 'LOW',
      contributionId,
      metadata: {
        score: result.score,
        level: result.level,
        factors: result.factors,
      },
    },
  })
}

/**
 * Get risk score statistics
 */
export async function getRiskScoreStats(days = 7): Promise<{
  total: number
  byLevel: { LOW: number; MEDIUM: number; HIGH: number }
  averageScore: number
  topFactors: Array<{ factor: string; count: number }>
}> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const events = await prisma.fraudEvent.findMany({
    where: {
      eventType: 'RISK_SCORE_CALCULATED',
      createdAt: { gte: startDate },
    },
  })

  const byLevel = {
    LOW: events.filter(e => (e.metadata as any).level === 'LOW').length,
    MEDIUM: events.filter(e => (e.metadata as any).level === 'MEDIUM').length,
    HIGH: events.filter(e => (e.metadata as any).level === 'HIGH').length,
  }

  const scores = events.map(e => (e.metadata as any).score as number)
  const averageScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0

  // Count factor occurrences
  const factorCounts = new Map<string, number>()
  events.forEach(e => {
    const factors = (e.metadata as any).factors as RiskFactor[]
    factors.forEach(f => {
      factorCounts.set(f.factor, (factorCounts.get(f.factor) ?? 0) + 1)
    })
  })

  const topFactors = Array.from(factorCounts.entries())
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    total: events.length,
    byLevel,
    averageScore: Math.round(averageScore),
    topFactors,
  }
}
