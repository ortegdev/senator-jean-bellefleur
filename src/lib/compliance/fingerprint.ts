/**
 * Donor Fingerprinting
 * 
 * Combines multiple signals to detect split payments across different emails.
 * Used for cumulative cap enforcement.
 */

import crypto from 'crypto'

export interface FingerprintSignals {
  email: string
  paymentMethodFingerprint?: string
  deviceFingerprint?: string
}

/**
 * Generate a stable fingerprint from multiple signals
 */
export function generateFingerprint(signals: FingerprintSignals): string {
  const parts = [
    signals.email,
    signals.paymentMethodFingerprint || '',
    signals.deviceFingerprint || '',
  ]
  
  const combined = parts.filter(Boolean).join('::')
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32)
}

/**
 * Extract device fingerprint from request (client-side collected)
 * 
 * This would be collected client-side using libraries like FingerprintJS
 * and passed with the payment request.
 * 
 * Signals include:
 * - User agent
 * - Screen resolution
 * - Timezone
 * - Canvas fingerprint
 * - WebGL fingerprint
 * - Audio fingerprint
 */
export interface DeviceSignals {
  userAgent: string
  screenResolution?: string
  timezone?: string
  language?: string
  platform?: string
  canvasHash?: string
  webglHash?: string
}

export function hashDeviceSignals(signals: DeviceSignals): string {
  const parts = [
    signals.userAgent,
    signals.screenResolution || '',
    signals.timezone || '',
    signals.language || '',
    signals.platform || '',
    signals.canvasHash || '',
    signals.webglHash || '',
  ]
  
  const combined = parts.filter(Boolean).join('::')
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32)
}

/**
 * Payment method fingerprint (provided by payment provider)
 * 
 * Stripe example: uses card fingerprint from token
 * This is a stable identifier for a specific card
 */
export function extractPaymentMethodFingerprint(paymentMethod: any): string | undefined {
  // Stripe provides card.fingerprint
  if (paymentMethod?.card?.fingerprint) {
    return paymentMethod.card.fingerprint
  }
  
  // Other providers may have similar mechanisms
  return undefined
}
