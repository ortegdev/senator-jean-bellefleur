/**
 * Compliance Utility Functions
 */

import crypto from 'crypto'

/**
 * Normalize email for duplicate detection
 * 
 * Rules:
 * - Lowercase entire email
 * - Remove dots from Gmail addresses (gmail ignores them)
 * - Remove +tags from any provider
 * - Trim whitespace
 */
export function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase()
  const [localPart, domain] = trimmed.split('@')
  
  if (!domain) {
    return trimmed
  }
  
  let normalized = localPart
  
  // Remove +tag
  if (normalized.includes('+')) {
    normalized = normalized.split('+')[0]
  }
  
  // Remove dots for Gmail
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    normalized = normalized.replace(/\./g, '')
  }
  
  return `${normalized}@${domain}`
}

/**
 * Generate donor fingerprint from multiple signals
 * Used to detect split payments across different emails
 */
export function generateFingerprint(signals: {
  email: string
  paymentMethodFingerprint?: string
  deviceFingerprint?: string
}): string {
  const parts = [
    signals.email,
    signals.paymentMethodFingerprint || '',
    signals.deviceFingerprint || '',
  ]
  
  const combined = parts.filter(Boolean).join('::')
  return crypto.createHash('sha256').update(combined).digest('hex')
}

/**
 * Parse IP address to country code (stub - integrate with real IP geolocation)
 */
export function ipToCountry(ipAddress: string): string | null {
  // TODO: Integrate with IP geolocation service (MaxMind, IPinfo, etc.)
  // For now, return null
  return null
}

/**
 * Validate card BIN (first 6 digits)
 */
export function isValidBin(bin: string): boolean {
  return /^\d{6}$/.test(bin)
}

/**
 * Detect card type from BIN (stub - integrate with BIN database)
 */
export function detectCardType(bin: string): {
  type: 'credit' | 'debit' | 'prepaid' | 'corporate' | 'unknown'
  country: string | null
} {
  // TODO: Integrate with BIN database service
  // For now, return unknown
  return {
    type: 'unknown',
    country: null,
  }
}

/**
 * Format currency amount for display
 */
export function formatAmount(cents: number, currency: string = 'USD'): string {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars)
}

/**
 * Get human-readable reason for compliance result
 */
export function getReasonMessage(reasonCode: string, details?: any): string {
  const messages: Record<string, string> = {
    DONOR_BLOCKED: 'This donor has been blocked from making contributions.',
    AMOUNT_BELOW_MINIMUM: `Contribution must be at least ${formatAmount(details?.minCents || 0)}.`,
    AMOUNT_ABOVE_MAXIMUM: `Contribution cannot exceed ${formatAmount(details?.maxCents || 0)}.`,
    CUMULATIVE_CAP_EXCEEDED: `You have reached the maximum contribution limit of ${formatAmount(details?.capCents || 0)} for this election cycle.`,
    COUNTRY_DENIED: `Contributions from ${details?.country || 'your country'} are not permitted.`,
    COUNTRY_NOT_ALLOWED: `Contributions from ${details?.country || 'your country'} are not permitted.`,
    IP_COUNTRY_DENIED: 'Your IP address location requires additional review.',
    MISSING_ATTESTATIONS: 'Required eligibility confirmations are missing.',
    FUNDRAISING_NOT_STARTED: 'Contributions will be accepted starting on the official campaign date.',
    FUNDRAISING_ENDED: 'The fundraising period has ended.',
    SANCTIONS_MATCH: 'This contribution requires additional verification.',
    SANCTIONS_POTENTIAL_MATCH: 'This contribution requires additional verification.',
    SANCTIONS_SCREENING_ERROR: 'Unable to verify donor information. Please try again.',
    CORPORATE_CARD_PROHIBITED: 'Corporate credit cards cannot be used for contributions.',
    PREPAID_CARD_PROHIBITED: 'Prepaid cards cannot be used for contributions.',
    CARD_COUNTRY_MISMATCH: 'Card issuing country does not match your declared country.',
    PRE_CAMPAIGN_PERIOD: 'Contributions cannot be accepted before the official campaign period begins.',
  }
  
  return messages[reasonCode] || 'This contribution requires review.'
}

/**
 * Mask sensitive data for logging
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  
  const masked = local.length <= 2 ? local : local[0] + '***' + local[local.length - 1]
  return `${masked}@${domain}`
}

export function maskCardBin(bin: string): string {
  return bin.substring(0, 2) + '****'
}

export function maskIpAddress(ip: string): string {
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`
  }
  return ip
}
