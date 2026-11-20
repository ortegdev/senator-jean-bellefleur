/**
 * CORS Configuration
 * 
 * Strict CORS policy for API endpoints.
 * Only allows requests from official domain.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Allowed origins
 * 
 * Production: Only official domain
 * Development: localhost
 */
function getAllowedOrigins(): string[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL

  if (process.env.NODE_ENV === 'production') {
    // Production: Only official domain
    return siteUrl ? [siteUrl] : []
  } else {
    // Development: localhost
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      ...(siteUrl ? [siteUrl] : []),
    ]
  }
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false

  const allowedOrigins = getAllowedOrigins()
  return allowedOrigins.includes(origin)
}

/**
 * CORS middleware for API routes
 * 
 * Usage:
 * ```
 * export async function POST(request: NextRequest) {
 *   const corsResult = corsProtection(request)
 *   if (!corsResult.allowed) {
 *     return corsResult.response
 *   }
 *   
 *   // Process request...
 *   const response = NextResponse.json({ success: true })
 *   
 *   // Add CORS headers
 *   return addCorsHeaders(response, request)
 * }
 * ```
 */
export function corsProtection(
  request: NextRequest
): { allowed: boolean; response?: NextResponse } {
  const origin = request.headers.get('origin')

  // OPTIONS requests (preflight)
  if (request.method === 'OPTIONS') {
    if (!origin || !isOriginAllowed(origin)) {
      return {
        allowed: false,
        response: new NextResponse(null, { status: 403 }),
      }
    }

    return {
      allowed: true,
      response: new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      }),
    }
  }

  // Check origin for non-OPTIONS requests
  if (origin && !isOriginAllowed(origin)) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'CORS policy: Origin not allowed' },
        { status: 403 }
      ),
    }
  }

  return { allowed: true }
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin')

  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Vary', 'Origin')
  }

  return response
}

/**
 * CORS exempt check
 * 
 * Some routes don't need CORS (same-origin only):
 * - Admin pages
 * - Internal APIs
 */
export function isCorsExempt(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname

  // Admin routes (same-origin only)
  if (pathname.startsWith('/admin/')) {
    return true
  }

  // Internal API routes
  if (pathname.startsWith('/api/internal/')) {
    return true
  }

  return false
}

/**
 * Strict CORS for sensitive endpoints
 * 
 * For payment and auth endpoints: require exact origin match.
 */
export function strictCorsProtection(
  request: NextRequest
): { allowed: boolean; response?: NextResponse } {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Require origin header
  if (!origin) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Origin header required' },
        { status: 403 }
      ),
    }
  }

  // Check origin is allowed
  if (!isOriginAllowed(origin)) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403 }
      ),
    }
  }

  // Check referer matches origin (additional security)
  if (referer && !referer.startsWith(origin)) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Referer mismatch' },
        { status: 403 }
      ),
    }
  }

  return { allowed: true }
}
