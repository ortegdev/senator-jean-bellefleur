/**
 * Bot Protection System
 * 
 * Accessible bot protection with non-visual alternative.
 * 
 * Uses Cloudflare Turnstile (or similar) for visual challenge,
 * with honeypot + timing analysis as accessible fallback.
 * 
 * WCAG 2.2 compliant: Does not rely solely on visual challenges.
 */

import { getRateLimitStore } from '@/lib/rate-limit/store'

export interface BotCheckParams {
  // Turnstile/hCaptcha token (if available)
  captchaToken?: string

  // Honeypot field (should be empty)
  honeypot?: string

  // Form timing (milliseconds from page load to submit)
  formTiming?: number

  // Client-side proof of work (optional)
  proofOfWork?: string

  // Request metadata
  ipAddress: string
  userAgent: string
}

export interface BotCheckResult {
  passed: boolean
  reason?: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

/**
 * Check if request is from a bot
 * 
 * Multi-layered approach:
 * 1. Turnstile/hCaptcha token verification (if present)
 * 2. Honeypot field check
 * 3. Form timing analysis
 * 4. User agent analysis
 * 5. Proof of work (if required)
 */
export async function checkBotProtection(
  params: BotCheckParams
): Promise<BotCheckResult> {
  // Layer 1: Captcha token verification (highest confidence)
  if (params.captchaToken) {
    const captchaResult = await verifyCaptchaToken(params.captchaToken, params.ipAddress)
    if (captchaResult.success) {
      return {
        passed: true,
        confidence: 'HIGH',
      }
    } else {
      return {
        passed: false,
        reason: 'Captcha verification failed',
        confidence: 'HIGH',
      }
    }
  }

  // Layer 2: Honeypot check (high confidence)
  if (params.honeypot && params.honeypot.trim() !== '') {
    return {
      passed: false,
      reason: 'Honeypot field was filled (bot detected)',
      confidence: 'HIGH',
    }
  }

  // Layer 3: Form timing analysis (medium confidence)
  if (params.formTiming !== undefined) {
    // Too fast: likely a bot (< 2 seconds)
    if (params.formTiming < 2000) {
      return {
        passed: false,
        reason: 'Form submitted too quickly (bot suspected)',
        confidence: 'MEDIUM',
      }
    }

    // Too slow without interaction: possible bot (> 30 minutes)
    if (params.formTiming > 30 * 60 * 1000) {
      return {
        passed: false,
        reason: 'Form session expired',
        confidence: 'LOW',
      }
    }
  }

  // Layer 4: User agent analysis (low confidence)
  const userAgentCheck = checkUserAgent(params.userAgent)
  if (!userAgentCheck.passed) {
    return {
      passed: false,
      reason: userAgentCheck.reason,
      confidence: 'LOW',
    }
  }

  // Layer 5: Proof of work (if required for high-risk IPs)
  if (params.proofOfWork) {
    const powResult = await verifyProofOfWork(params.proofOfWork, params.ipAddress)
    if (!powResult.valid) {
      return {
        passed: false,
        reason: 'Proof of work verification failed',
        confidence: 'MEDIUM',
      }
    }
  }

  // All checks passed
  return {
    passed: true,
    confidence: params.captchaToken ? 'HIGH' : 'MEDIUM',
  }
}

/**
 * Verify Turnstile/hCaptcha token
 */
async function verifyCaptchaToken(
  token: string,
  ipAddress: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = 
    process.env.TURNSTILE_SECRET_KEY || 
    process.env.HCAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.warn('[BotProtection] No captcha secret key configured')
    return { success: true } // Fail open in development
  }

  try {
    // Determine provider
    const isTurnstile = !!process.env.TURNSTILE_SECRET_KEY
    const verifyUrl = isTurnstile
      ? 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
      : 'https://hcaptcha.com/siteverify'

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ipAddress,
      }),
    })

    const data = await response.json()

    return {
      success: data.success === true,
      error: data['error-codes']?.[0],
    }
  } catch (error: any) {
    console.error('[BotProtection] Captcha verification error:', error)
    return { success: true } // Fail open on error
  }
}

/**
 * Check user agent for bot patterns
 */
function checkUserAgent(userAgent: string): { passed: boolean; reason?: string } {
  if (!userAgent) {
    return {
      passed: false,
      reason: 'Missing user agent',
    }
  }

  // Known bot patterns
  const botPatterns = [
    /bot/i,
    /crawl/i,
    /spider/i,
    /scrape/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java(?!script)/i,
    /headless/i,
    /phantom/i,
    /selenium/i,
  ]

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return {
        passed: false,
        reason: 'Bot user agent detected',
      }
    }
  }

  return { passed: true }
}

/**
 * Verify client-side proof of work
 * 
 * Requires client to solve a computational challenge.
 * Accessible alternative to visual captchas.
 */
async function verifyProofOfWork(
  proof: string,
  ipAddress: string
): Promise<{ valid: boolean }> {
  try {
    const [nonce, hash] = proof.split(':')
    
    if (!nonce || !hash) {
      return { valid: false }
    }

    // Verify hash starts with required number of zeros
    const requiredZeros = 4 // Adjust difficulty
    const expectedPrefix = '0'.repeat(requiredZeros)

    if (!hash.startsWith(expectedPrefix)) {
      return { valid: false }
    }

    // Verify hash is correct for nonce + IP
    const challenge = `${ipAddress}:${nonce}`
    const expectedHash = await sha256(challenge)

    return { valid: expectedHash === hash }
  } catch (error) {
    console.error('[BotProtection] Proof of work verification error:', error)
    return { valid: false }
  }
}

/**
 * SHA-256 hash
 */
async function sha256(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Fallback for Node.js
  const crypto = await import('crypto')
  return crypto.createHash('sha256').update(input).digest('hex')
}

/**
 * Check if IP should require proof of work
 * 
 * Based on recent suspicious activity.
 */
export async function shouldRequireProofOfWork(ipAddress: string): Promise<boolean> {
  const store = getRateLimitStore()

  // Check for recent failures or violations
  const [failureCount, violationCount] = await Promise.all([
    store.get(`failures:ip:${ipAddress}:1h`),
    store.get(`violations:ip:${ipAddress}`),
  ])

  // Require PoW if many recent failures or any violations
  return failureCount >= 3 || violationCount > 0
}

/**
 * Generate proof of work challenge for client
 */
export async function generateProofOfWorkChallenge(
  ipAddress: string
): Promise<{
  challenge: string
  difficulty: number
  expiresAt: Date
}> {
  const store = getRateLimitStore()
  const challenge = `${ipAddress}:${Date.now()}`
  const difficulty = 4 // Number of leading zeros required
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  // Store challenge
  await store.set(`pow:${ipAddress}`, challenge, 300)

  return {
    challenge,
    difficulty,
    expiresAt,
  }
}

/**
 * Honeypot field HTML
 * 
 * Invisible to humans, visible to bots.
 */
export const HONEYPOT_FIELD_HTML = `
<div style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
  <label for="website">Website (leave blank)</label>
  <input 
    type="text" 
    id="website" 
    name="website" 
    tabindex="-1" 
    autocomplete="off"
  />
</div>
`.trim()

/**
 * Client-side timing tracker snippet
 * 
 * Records form load and submit times.
 */
export const FORM_TIMING_SCRIPT = `
<script>
  (function() {
    const formLoadTime = Date.now();
    const form = document.querySelector('form');
    
    if (form) {
      form.addEventListener('submit', function() {
        const formTiming = Date.now() - formLoadTime;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'formTiming';
        input.value = formTiming;
        form.appendChild(input);
      });
    }
  })();
</script>
`.trim()
