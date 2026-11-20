/**
 * CSRF Protection
 * 
 * Cross-Site Request Forgery protection for state-changing operations.
 * 
 * Uses double-submit cookie pattern:
 * 1. Server generates token and sets in cookie
 * 2. Client includes token in request header
 * 3. Server verifies cookie matches header
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Set CSRF token cookie
 * 
 * Call this when rendering forms or API endpoints that need CSRF protection.
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return token
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value
}

/**
 * Verify CSRF token
 * 
 * Compares token in cookie with token in header.
 */
export async function verifyCsrfToken(request: NextRequest): Promise<boolean> {
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  // Both must exist and match
  if (!cookieToken || !headerToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return constantTimeCompare(cookieToken, headerToken)
}

/**
 * CSRF protection middleware
 * 
 * Use in API routes that modify state.
 * 
 * Usage:
 * ```
 * export async function POST(request: NextRequest) {
 *   const csrfResult = await csrfProtection(request)
 *   if (!csrfResult.valid) {
 *     return csrfResult.response
 *   }
 *   
 *   // Process request...
 * }
 * ```
 */
export async function csrfProtection(
  request: NextRequest
): Promise<{ valid: boolean; response?: NextResponse }> {
  const valid = await verifyCsrfToken(request)

  if (!valid) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      ),
    }
  }

  return { valid: true }
}

/**
 * CSRF exempt check
 * 
 * Some routes don't need CSRF protection:
 * - Webhooks (verified by signature)
 * - Public read-only APIs
 */
export function isCsrfExempt(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname

  // Webhook endpoints
  if (pathname.startsWith('/api/webhooks/')) {
    return true
  }

  // Public read-only endpoints
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return true
  }

  return false
}

/**
 * Constant-time string comparison
 * 
 * Prevents timing attacks on token comparison.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * CSRF token component helper
 * 
 * For use in forms.
 */
export async function getCsrfTokenForForm(): Promise<string> {
  let token = await getCsrfToken()
  
  if (!token) {
    token = await setCsrfToken()
  }

  return token
}

/**
 * CSRF meta tag HTML
 * 
 * For client-side AJAX requests.
 */
export async function getCsrfMetaTag(): Promise<string> {
  const token = await getCsrfTokenForForm()
  return `<meta name="csrf-token" content="${token}">`
}
