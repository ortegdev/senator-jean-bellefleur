/**
 * Next.js Middleware
 * 
 * Security Headers:
 * - Strict CSP with nonces
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options / frame-ancestors
 * - Referrer-Policy
 * - Permissions-Policy
 * - X-Content-Type-Options
 * - X-XSS-Protection
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Use Web Crypto API (Edge Runtime compatible)
  const nonceArray = new Uint8Array(16)
  crypto.getRandomValues(nonceArray)
  const nonce = Buffer.from(nonceArray).toString('base64')

  // ============================================================================
  // Content Security Policy (Strict)
  // ============================================================================
  
  const cspDirectives = [
    // Default: only self
    "default-src 'self'",
    
    // Scripts: nonce-based with unsafe-inline fallback for Next.js
    // Modern browsers ignore 'unsafe-inline' when nonces are present
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' 'strict-dynamic'`,
    
    // Styles: nonce-based with unsafe-inline for Next.js styles
    `style-src 'self' 'unsafe-inline' 'nonce-${nonce}'`,
    
    // Images: self + data URIs (for inline images) + external payment providers
    "img-src 'self' data: https://*.stripe.com https://*.paypal.com",
    
    // Fonts: self only (self-hosted fonts)
    "font-src 'self'",
    
    // Connect: API calls to self + payment providers
    "connect-src 'self' https://*.stripe.com https://*.paypal.com https://api.stripe.com",
    
    // Media: self only
    "media-src 'self'",
    
    // Objects: none (no Flash, Java applets)
    "object-src 'none'",
    
    // Forms: can submit to self + payment providers
    "form-action 'self' https://*.stripe.com https://*.paypal.com",
    
    // Frame ancestors: disallow embedding (clickjacking protection)
    "frame-ancestors 'none'",
    
    // Base URI: restrict to self
    "base-uri 'self'",
    
    // Upgrade insecure requests
    "upgrade-insecure-requests",
    
    // Block mixed content
    "block-all-mixed-content",
  ]

  // Report violations in non-production
  if (process.env.NODE_ENV !== 'production') {
    cspDirectives.push("report-uri /api/csp-report")
  }

  response.headers.set(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  )

  // Store nonce for use in pages
  response.headers.set('X-CSP-Nonce', nonce)

  // ============================================================================
  // HTTP Strict Transport Security (HSTS)
  // ============================================================================
  
  // 2 years, include subdomains, preload eligible
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )

  // ============================================================================
  // Frame Protection
  // ============================================================================
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // ============================================================================
  // Referrer Policy
  // ============================================================================
  
  // Don't leak URLs to third parties
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  )

  // ============================================================================
  // Permissions Policy
  // ============================================================================
  
  // Disable unnecessary browser features
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC
    'payment=(self)', // Allow payment APIs only on our domain
  ]

  response.headers.set(
    'Permissions-Policy',
    permissionsPolicy.join(', ')
  )

  // ============================================================================
  // Additional Security Headers
  // ============================================================================
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection (legacy, but harmless)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // No DNS prefetching to third parties
  response.headers.set('X-DNS-Prefetch-Control', 'off')

  // No downloading files with different origin
  response.headers.set('X-Download-Options', 'noopen')

  // Disable client-side caching of sensitive pages
  if (request.nextUrl.pathname.startsWith('/admin')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  // ============================================================================
  // Deployment Protection (Non-Production)
  // ============================================================================
  
  // In preview/staging, add noindex
  if (
    process.env.VERCEL_ENV !== 'production' ||
    process.env.DEPLOYMENT_PROTECTED === 'true'
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

  return response
}

// ============================================================================
// Matcher Configuration
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
