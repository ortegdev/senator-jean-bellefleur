/**
 * Velocity Limits for Card-Testing Defense
 * 
 * Tracks payment attempts across multiple dimensions:
 * - Per IP address
 * - Per device fingerprint
 * - Per email address
 * - Per card fingerprint (last 4 digits + country)
 * 
 * Implements progressive backoff lockouts.
 */

import { getRateLimitStore } from '@/lib/rate-limit/store'
import { prisma } from '@/lib/db/prisma'

export interface VelocityCheckParams {
  ipAddress: string
  deviceFingerprint?: string
  email: string
  cardFingerprint: string // last4 + card country
  userAgent: string
}

export interface VelocityCheckResult {
  allowed: boolean
  reason?: string
  lockedUntil?: Date
  waitSeconds?: number
  limits: {
    ip: { current: number; max: number; window: string }
    device: { current: number; max: number; window: string }
    email: { current: number; max: number; window: string }
    card: { current: number; max: number; window: string }
  }
}

/**
 * Velocity Limits Configuration
 * 
 * Progressive limits across time windows.
 */
const LIMITS = {
  // Per IP address
  ip: {
    perMinute: 3,      // 3 attempts per minute
    perHour: 10,       // 10 attempts per hour
    perDay: 20,        // 20 attempts per day
  },

  // Per device fingerprint
  device: {
    perMinute: 3,
    perHour: 10,
    perDay: 20,
  },

  // Per email address
  email: {
    perMinute: 2,      // 2 attempts per minute
    perHour: 5,        // 5 attempts per hour
    perDay: 10,        // 10 attempts per day
  },

  // Per card fingerprint (last4 + country)
  card: {
    perMinute: 2,
    perHour: 5,
    perDay: 10,
  },
}

/**
 * Backoff Lockout Configuration
 * 
 * Progressive lockout durations after limit violations.
 */
const LOCKOUTS = {
  firstViolation: 5 * 60,      // 5 minutes
  secondViolation: 30 * 60,    // 30 minutes
  thirdViolation: 2 * 60 * 60, // 2 hours
  fourthViolation: 24 * 60 * 60, // 24 hours
}

/**
 * Check velocity limits before allowing payment attempt
 */
export async function checkVelocityLimits(
  params: VelocityCheckParams
): Promise<VelocityCheckResult> {
  const store = getRateLimitStore()

  // Check if any identifier is locked out
  const lockoutResult = await checkLockouts(params)
  if (!lockoutResult.allowed) {
    return lockoutResult
  }

  // Check all velocity limits
  const checks = await Promise.all([
    checkLimit(store, 'ip', params.ipAddress, LIMITS.ip),
    checkLimit(store, 'device', params.deviceFingerprint ?? 'unknown', LIMITS.device),
    checkLimit(store, 'email', params.email.toLowerCase(), LIMITS.email),
    checkLimit(store, 'card', params.cardFingerprint, LIMITS.card),
  ])

  const [ipCheck, deviceCheck, emailCheck, cardCheck] = checks

  // If any limit is exceeded, return denial
  const exceededCheck = checks.find(c => !c.allowed)
  if (exceededCheck) {
    // Record violation for progressive lockout
    await recordViolation(params, exceededCheck.dimension!)

    return {
      allowed: false,
      reason: exceededCheck.reason,
      limits: {
        ip: ipCheck,
        device: deviceCheck,
        email: emailCheck,
        card: cardCheck,
      },
    }
  }

  // All limits OK
  return {
    allowed: true,
    limits: {
      ip: ipCheck,
      device: deviceCheck,
      email: emailCheck,
      card: cardCheck,
    },
  }
}

/**
 * Record a payment attempt
 * 
 * Increments counters for all dimensions.
 */
export async function recordPaymentAttempt(
  params: VelocityCheckParams
): Promise<void> {
  const store = getRateLimitStore()

  await Promise.all([
    // IP counters
    store.increment(`velocity:ip:${params.ipAddress}:1m`, 60),
    store.increment(`velocity:ip:${params.ipAddress}:1h`, 3600),
    store.increment(`velocity:ip:${params.ipAddress}:1d`, 86400),

    // Device counters
    ...(params.deviceFingerprint ? [
      store.increment(`velocity:device:${params.deviceFingerprint}:1m`, 60),
      store.increment(`velocity:device:${params.deviceFingerprint}:1h`, 3600),
      store.increment(`velocity:device:${params.deviceFingerprint}:1d`, 86400),
    ] : []),

    // Email counters
    store.increment(`velocity:email:${params.email.toLowerCase()}:1m`, 60),
    store.increment(`velocity:email:${params.email.toLowerCase()}:1h`, 3600),
    store.increment(`velocity:email:${params.email.toLowerCase()}:1d`, 86400),

    // Card counters
    store.increment(`velocity:card:${params.cardFingerprint}:1m`, 60),
    store.increment(`velocity:card:${params.cardFingerprint}:1h`, 3600),
    store.increment(`velocity:card:${params.cardFingerprint}:1d`, 86400),
  ])
}

/**
 * Check a single dimension's limits
 */
async function checkLimit(
  store: any,
  dimension: string,
  identifier: string,
  limits: { perMinute: number; perHour: number; perDay: number }
): Promise<{
  allowed: boolean
  current: number
  max: number
  window: string
  reason?: string
  dimension?: string
}> {
  // Check minute limit
  const countMinute = await store.get(`velocity:${dimension}:${identifier}:1m`)
  if (countMinute >= limits.perMinute) {
    return {
      allowed: false,
      current: countMinute,
      max: limits.perMinute,
      window: '1 minute',
      reason: `Too many attempts from this ${dimension} (${countMinute}/${limits.perMinute} per minute)`,
      dimension,
    }
  }

  // Check hour limit
  const countHour = await store.get(`velocity:${dimension}:${identifier}:1h`)
  if (countHour >= limits.perHour) {
    return {
      allowed: false,
      current: countHour,
      max: limits.perHour,
      window: '1 hour',
      reason: `Too many attempts from this ${dimension} (${countHour}/${limits.perHour} per hour)`,
      dimension,
    }
  }

  // Check day limit
  const countDay = await store.get(`velocity:${dimension}:${identifier}:1d`)
  if (countDay >= limits.perDay) {
    return {
      allowed: false,
      current: countDay,
      max: limits.perDay,
      window: '1 day',
      reason: `Too many attempts from this ${dimension} (${countDay}/${limits.perDay} per day)`,
      dimension,
    }
  }

  // All OK
  return {
    allowed: true,
    current: Math.max(countMinute, countHour, countDay),
    max: limits.perDay,
    window: '1 day',
  }
}

/**
 * Check if any identifier is locked out
 */
async function checkLockouts(
  params: VelocityCheckParams
): Promise<VelocityCheckResult> {
  const store = getRateLimitStore()

  const lockoutKeys = [
    `lockout:ip:${params.ipAddress}`,
    ...(params.deviceFingerprint ? [`lockout:device:${params.deviceFingerprint}`] : []),
    `lockout:email:${params.email.toLowerCase()}`,
    `lockout:card:${params.cardFingerprint}`,
  ]

  for (const key of lockoutKeys) {
    const ttl = await store.ttl(key)
    if (ttl > 0) {
      const lockedUntil = new Date(Date.now() + ttl * 1000)
      return {
        allowed: false,
        reason: 'Temporarily locked due to excessive failed attempts',
        lockedUntil,
        waitSeconds: ttl,
        limits: {
          ip: { current: 0, max: 0, window: 'locked' },
          device: { current: 0, max: 0, window: 'locked' },
          email: { current: 0, max: 0, window: 'locked' },
          card: { current: 0, max: 0, window: 'locked' },
        },
      }
    }
  }

  return {
    allowed: true,
    limits: {
      ip: { current: 0, max: 0, window: '' },
      device: { current: 0, max: 0, window: '' },
      email: { current: 0, max: 0, window: '' },
      card: { current: 0, max: 0, window: '' },
    },
  }
}

/**
 * Record a velocity limit violation
 * 
 * Implements progressive backoff lockouts.
 */
async function recordViolation(
  params: VelocityCheckParams,
  dimension: string
): Promise<void> {
  const store = getRateLimitStore()

  const identifiers: Record<string, string> = {
    ip: params.ipAddress,
    device: params.deviceFingerprint ?? 'unknown',
    email: params.email.toLowerCase(),
    card: params.cardFingerprint,
  }

  const identifier = identifiers[dimension]
  if (!identifier) return

  // Get violation count
  const violationKey = `violations:${dimension}:${identifier}`
  const violations = await store.increment(violationKey, 86400 * 7) // Track for 7 days

  // Determine lockout duration based on violation count
  let lockoutDuration: number
  if (violations === 1) {
    lockoutDuration = LOCKOUTS.firstViolation
  } else if (violations === 2) {
    lockoutDuration = LOCKOUTS.secondViolation
  } else if (violations === 3) {
    lockoutDuration = LOCKOUTS.thirdViolation
  } else {
    lockoutDuration = LOCKOUTS.fourthViolation
  }

  // Apply lockout
  const lockoutKey = `lockout:${dimension}:${identifier}`
  await store.set(lockoutKey, '1', lockoutDuration)

  // Log violation
  console.warn(`[Velocity] Lockout applied: ${dimension}=${identifier}, duration=${lockoutDuration}s, violation #${violations}`)

  // Record in database for admin review
  await prisma.fraudEvent.create({
    data: {
      eventType: 'VELOCITY_VIOLATION',
      severity: violations > 2 ? 'HIGH' : 'MEDIUM',
      dimension,
      identifier,
      metadata: {
        violations,
        lockoutDuration,
        email: params.email,
        ipAddress: params.ipAddress,
      },
    },
  })
}

/**
 * Clear velocity counters (for testing or admin override)
 */
export async function clearVelocityCounters(
  dimension: 'ip' | 'device' | 'email' | 'card',
  identifier: string
): Promise<void> {
  const store = getRateLimitStore()

  await Promise.all([
    store.delete(`velocity:${dimension}:${identifier}:1m`),
    store.delete(`velocity:${dimension}:${identifier}:1h`),
    store.delete(`velocity:${dimension}:${identifier}:1d`),
    store.delete(`lockout:${dimension}:${identifier}`),
    store.delete(`violations:${dimension}:${identifier}`),
  ])
}

/**
 * Get velocity stats for monitoring
 */
export async function getVelocityStats(
  dimension: 'ip' | 'device' | 'email' | 'card',
  identifier: string
): Promise<{
  counters: {
    perMinute: number
    perHour: number
    perDay: number
  }
  locked: boolean
  lockedUntil?: Date
  violations: number
}> {
  const store = getRateLimitStore()

  const [countMinute, countHour, countDay, lockoutTtl, violations] = await Promise.all([
    store.get(`velocity:${dimension}:${identifier}:1m`),
    store.get(`velocity:${dimension}:${identifier}:1h`),
    store.get(`velocity:${dimension}:${identifier}:1d`),
    store.ttl(`lockout:${dimension}:${identifier}`),
    store.get(`violations:${dimension}:${identifier}`),
  ])

  return {
    counters: {
      perMinute: countMinute,
      perHour: countHour,
      perDay: countDay,
    },
    locked: lockoutTtl > 0,
    lockedUntil: lockoutTtl > 0 ? new Date(Date.now() + lockoutTtl * 1000) : undefined,
    violations,
  }
}
