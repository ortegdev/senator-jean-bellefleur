/**
 * API Rate Limiting Middleware
 * 
 * Protects public APIs from abuse.
 * 
 * Rate limits by:
 * - IP address (primary)
 * - API key (if authenticated)
 * - Route-specific limits
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitStore } from './store'

export interface RateLimitConfig {
  /**
   * Identifier for this rate limit (e.g., 'api:payments:create')
   */
  key: string

  /**
   * Maximum requests per window
   */
  limit: number

  /**
   * Window duration in seconds
   */
  windowSeconds: number

  /**
   * Custom identifier function (defaults to IP address)
   */
  getIdentifier?: (request: NextRequest) => string | Promise<string>

  /**
   * Skip rate limiting for certain requests
   */
  skip?: (request: NextRequest) => boolean | Promise<boolean>
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
  retryAfter?: number
}

/**
 * Rate limit middleware for API routes
 * 
 * Usage in API route:
 * ```
 * const rateLimitResult = await rateLimit(request, {
 *   key: 'api:payments:create',
 *   limit: 10,
 *   windowSeconds: 60,
 * })
 * 
 * if (!rateLimitResult.allowed) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { 
 *       status: 429,
 *       headers: {
 *         'X-RateLimit-Limit': rateLimitResult.limit.toString(),
 *         'X-RateLimit-Remaining': '0',
 *         'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
 *         'Retry-After': (rateLimitResult.retryAfter ?? 60).toString(),
 *       },
 *     }
 *   )
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const store = getRateLimitStore()

  // Check if should skip
  if (config.skip && (await config.skip(request))) {
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    }
  }

  // Get identifier
  const identifier = config.getIdentifier
    ? await config.getIdentifier(request)
    : getIpAddress(request)

  const key = `ratelimit:${config.key}:${identifier}`

  // Increment counter
  const count = await store.increment(key, config.windowSeconds)

  // Check if exceeded
  const allowed = count <= config.limit
  const remaining = Math.max(0, config.limit - count)

  // Get TTL for reset time
  const ttl = await store.ttl(key)
  const resetAt = new Date(Date.now() + (ttl > 0 ? ttl * 1000 : config.windowSeconds * 1000))

  return {
    allowed,
    limit: config.limit,
    remaining,
    resetAt,
    retryAfter: ttl > 0 ? ttl : config.windowSeconds,
  }
}

/**
 * Create rate limit response with headers
 */
export function rateLimitResponse(
  result: RateLimitResult,
  message = 'Too many requests. Please try again later.'
): NextResponse {
  return NextResponse.json(
    { 
      error: message,
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
        'Retry-After': (result.retryAfter ?? 60).toString(),
      },
    }
  )
}

/**
 * Get IP address from request
 * 
 * Checks Cloudflare, Vercel, and standard headers.
 */
export function getIpAddress(request: NextRequest): string {
  // Cloudflare
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  // Vercel
  const vercelIp = request.headers.get('x-real-ip')
  if (vercelIp) return vercelIp

  // Standard
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return 'unknown'
}

/**
 * Pre-configured rate limit configs for common routes
 */
export const RATE_LIMITS = {
  // Payment creation: 10 per minute
  paymentCreate: {
    key: 'api:payments:create',
    limit: 10,
    windowSeconds: 60,
  },

  // Payment confirmation: 20 per minute
  paymentConfirm: {
    key: 'api:payments:confirm',
    limit: 20,
    windowSeconds: 60,
  },

  // Webhooks: 1000 per minute (high volume)
  webhook: {
    key: 'api:webhook',
    limit: 1000,
    windowSeconds: 60,
  },

  // Public API: 100 per hour
  publicApi: {
    key: 'api:public',
    limit: 100,
    windowSeconds: 3600,
  },

  // Auth endpoints: 5 per minute
  auth: {
    key: 'api:auth',
    limit: 5,
    windowSeconds: 60,
  },

  // Email verification: 3 per hour
  emailVerify: {
    key: 'api:email:verify',
    limit: 3,
    windowSeconds: 3600,
  },
} as const

/**
 * Adaptive rate limiting
 * 
 * Reduces limits for IPs with recent violations.
 */
export async function adaptiveRateLimit(
  request: NextRequest,
  baseConfig: RateLimitConfig
): Promise<RateLimitResult> {
  const store = getRateLimitStore()
  const identifier = baseConfig.getIdentifier
    ? await baseConfig.getIdentifier(request)
    : getIpAddress(request)

  // Check for recent violations
  const violations = await store.get(`violations:ip:${identifier}`)

  // Reduce limit based on violations
  let adjustedLimit = baseConfig.limit
  if (violations >= 3) {
    adjustedLimit = Math.floor(baseConfig.limit * 0.25) // 75% reduction
  } else if (violations >= 2) {
    adjustedLimit = Math.floor(baseConfig.limit * 0.5) // 50% reduction
  } else if (violations >= 1) {
    adjustedLimit = Math.floor(baseConfig.limit * 0.75) // 25% reduction
  }

  return rateLimit(request, {
    ...baseConfig,
    limit: adjustedLimit,
  })
}

/**
 * Burst protection
 * 
 * Allows bursts but enforces sustained rate limit.
 * 
 * Example: 10 per minute sustained, but allow burst of 20 in first 10 seconds.
 */
export async function burstRateLimit(
  request: NextRequest,
  config: {
    key: string
    burstLimit: number
    burstWindowSeconds: number
    sustainedLimit: number
    sustainedWindowSeconds: number
  }
): Promise<RateLimitResult> {
  // Check burst limit
  const burstResult = await rateLimit(request, {
    key: `${config.key}:burst`,
    limit: config.burstLimit,
    windowSeconds: config.burstWindowSeconds,
  })

  if (!burstResult.allowed) {
    return burstResult
  }

  // Check sustained limit
  return rateLimit(request, {
    key: `${config.key}:sustained`,
    limit: config.sustainedLimit,
    windowSeconds: config.sustainedWindowSeconds,
  })
}

/**
 * Global rate limit across all routes
 * 
 * Prevents a single IP from overwhelming the entire API.
 */
export async function globalRateLimit(
  request: NextRequest
): Promise<RateLimitResult> {
  return rateLimit(request, {
    key: 'global',
    limit: 1000, // 1000 requests per hour across all routes
    windowSeconds: 3600,
  })
}
