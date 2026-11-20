/**
 * Consent Management System
 * 
 * Handles unbundled opt-ins with separate consent for:
 * - Email communications
 * - WhatsApp communications
 * - Public recognition
 * 
 * Compliance:
 * - GDPR (EU): Explicit consent required, granular opt-ins
 * - CCPA/CPRA (California): Right to opt-out
 * - CASL (Canada): Explicit consent for commercial electronic messages
 * - PIPEDA (Canada): Consent for collection/use/disclosure
 * - French data protection (CNIL)
 */

import { prisma } from '@/lib/db/prisma'

export type ConsentPurpose = 'EMAIL' | 'WHATSAPP' | 'PUBLIC_RECOGNITION' | 'ESSENTIAL'

export type ConsentStatus = 'GRANTED' | 'DENIED' | 'PENDING' | 'WITHDRAWN'

export type ConsentBasis =
  | 'EXPLICIT_CONSENT' // User explicitly opted in
  | 'IMPLIED_CONSENT' // Implied from transaction (CASL)
  | 'LEGITIMATE_INTEREST' // Business necessity (GDPR Article 6(1)(f))
  | 'CONTRACT' // Necessary for contract (GDPR Article 6(1)(b))
  | 'LEGAL_OBLIGATION' // Required by law

export interface ConsentRecord {
  id: string
  donorId: string
  purpose: ConsentPurpose
  status: ConsentStatus
  basis: ConsentBasis
  grantedAt: Date | null
  withdrawnAt: Date | null
  ipAddress: string | null
  userAgent: string | null
  locale: string
  consentText: string // What they agreed to
  version: string // Consent version for audit trail
}

/**
 * Get region-specific consent requirements
 */
export function getRegionConsentRequirements(country: string): {
  requiresExplicitConsent: boolean
  requiresDoubleOptIn: boolean
  allowsImpliedConsent: boolean
  requiresGranularConsent: boolean
} {
  const upperCountry = country.toUpperCase()

  // EU countries (GDPR)
  const euCountries = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ])

  if (euCountries.has(upperCountry) || upperCountry === 'GB') {
    return {
      requiresExplicitConsent: true,
      requiresDoubleOptIn: true,
      allowsImpliedConsent: false,
      requiresGranularConsent: true,
    }
  }

  // Canada (CASL/PIPEDA)
  if (upperCountry === 'CA') {
    return {
      requiresExplicitConsent: true,
      requiresDoubleOptIn: true, // Best practice for CASL
      allowsImpliedConsent: true, // Allowed for existing business relationship
      requiresGranularConsent: true,
    }
  }

  // California (CCPA/CPRA)
  if (upperCountry === 'US') {
    return {
      requiresExplicitConsent: false, // Opt-out model
      requiresDoubleOptIn: false,
      allowsImpliedConsent: true,
      requiresGranularConsent: true, // CPRA requires granularity
    }
  }

  // Default (conservative)
  return {
    requiresExplicitConsent: true,
    requiresDoubleOptIn: true,
    allowsImpliedConsent: false,
    requiresGranularConsent: true,
  }
}

/**
 * Get default consent text for purpose and locale
 */
export function getConsentText(
  purpose: ConsentPurpose,
  locale: string
): string {
  const texts: Record<string, Record<ConsentPurpose, string>> = {
    en: {
      EMAIL:
        'I consent to receive email updates about the candidacy of Jean Fritznel Bellefleur. I can unsubscribe at any time.',
      WHATSAPP:
        'I consent to receive WhatsApp messages about the candidacy of Jean Fritznel Bellefleur. I can opt out at any time by replying STOP.',
      PUBLIC_RECOGNITION:
        'I consent to having my name displayed publicly as a supporter. This is optional and does not affect my contribution.',
      ESSENTIAL:
        'Processing of this contribution is necessary to complete the transaction and provide a receipt.',
    },
    fr: {
      EMAIL:
        'Je consens à recevoir des mises à jour par e-mail concernant la candidature de Jean Fritznel Bellefleur. Je peux me désabonner à tout moment.',
      WHATSAPP:
        'Je consens à recevoir des messages WhatsApp concernant la candidature de Jean Fritznel Bellefleur. Je peux me désinscrire à tout moment en répondant STOP.',
      PUBLIC_RECOGNITION:
        'Je consens à ce que mon nom soit affiché publiquement en tant que supporter. Ceci est optionnel et n\'affecte pas ma contribution.',
      ESSENTIAL:
        'Le traitement de cette contribution est nécessaire pour compléter la transaction et fournir un reçu.',
    },
    ht: {
      EMAIL:
        'Mwen konsanti resevwa mizajou pa imèl konsènan kandidati Jean Fritznel Bellefleur. Mwen ka dezabòne nenpòt lè.',
      WHATSAPP:
        'Mwen konsanti resevwa mesaj WhatsApp konsènan kandidati Jean Fritznel Bellefleur. Mwen ka sispann resevwa yo nenpòt lè lè m reponn STOP.',
      PUBLIC_RECOGNITION:
        'Mwen konsanti pou yo afiche non m piblikman kòm yon sipòtè. Sa a opsyonèl epi li pa afekte kontribisyon mwen.',
      ESSENTIAL:
        'Tretman kontribisyon sa a nesesè pou konplete tranzaksyon an epi bay yon resi.',
    },
  }

  return texts[locale]?.[purpose] || texts.en[purpose]
}

/**
 * Record consent
 */
export async function recordConsent(params: {
  donorId: string
  purpose: ConsentPurpose
  status: ConsentStatus
  basis: ConsentBasis
  ipAddress: string | null
  userAgent: string | null
  locale: string
  version?: string
}): Promise<ConsentRecord> {
  const {
    donorId,
    purpose,
    status,
    basis,
    ipAddress,
    userAgent,
    locale,
    version = '1.0',
  } = params

  const consentText = getConsentText(purpose, locale)

  const consent = await prisma.consent.create({
    data: {
      donorId,
      purpose,
      status,
      basis,
      grantedAt: status === 'GRANTED' ? new Date() : null,
      withdrawnAt: status === 'WITHDRAWN' ? new Date() : null,
      ipAddress,
      userAgent,
      locale,
      consentText,
      version,
    },
  })

  return consent as ConsentRecord
}

/**
 * Update consent status
 */
export async function updateConsent(
  consentId: string,
  status: ConsentStatus
): Promise<void> {
  const updates: any = { status }

  if (status === 'GRANTED') {
    updates.grantedAt = new Date()
    updates.withdrawnAt = null
  } else if (status === 'WITHDRAWN' || status === 'DENIED') {
    updates.withdrawnAt = new Date()
  }

  await prisma.consent.update({
    where: { id: consentId },
    data: updates,
  })
}

/**
 * Withdraw consent (GDPR right to withdraw)
 */
export async function withdrawConsent(
  donorId: string,
  purpose: ConsentPurpose
): Promise<void> {
  await prisma.consent.updateMany({
    where: {
      donorId,
      purpose,
      status: 'GRANTED',
    },
    data: {
      status: 'WITHDRAWN',
      withdrawnAt: new Date(),
    },
  })
}

/**
 * Check if donor has active consent
 */
export async function hasActiveConsent(
  donorId: string,
  purpose: ConsentPurpose
): Promise<boolean> {
  const consent = await prisma.consent.findFirst({
    where: {
      donorId,
      purpose,
      status: 'GRANTED',
    },
  })

  return !!consent
}

/**
 * Get all consents for donor
 */
export async function getDonorConsents(donorId: string): Promise<ConsentRecord[]> {
  const consents = await prisma.consent.findMany({
    where: { donorId },
    orderBy: { grantedAt: 'desc' },
  })

  return consents as ConsentRecord[]
}

/**
 * Record essential consent (for transaction processing)
 * This is automatically granted based on contract/legal basis
 */
export async function recordEssentialConsent(params: {
  donorId: string
  ipAddress: string | null
  userAgent: string | null
  locale: string
}): Promise<void> {
  await recordConsent({
    ...params,
    purpose: 'ESSENTIAL',
    status: 'GRANTED',
    basis: 'CONTRACT', // Necessary for fulfilling the transaction
  })
}

/**
 * Record marketing consent (optional, explicit)
 */
export async function recordMarketingConsent(params: {
  donorId: string
  purposes: ConsentPurpose[]
  ipAddress: string | null
  userAgent: string | null
  locale: string
}): Promise<void> {
  const { donorId, purposes, ipAddress, userAgent, locale } = params

  for (const purpose of purposes) {
    if (purpose === 'ESSENTIAL') continue // Skip essential

    await recordConsent({
      donorId,
      purpose,
      status: 'GRANTED',
      basis: 'EXPLICIT_CONSENT',
      ipAddress,
      userAgent,
      locale,
    })
  }
}

/**
 * Check consent before sending communication
 */
export async function canSendCommunication(
  donorId: string,
  channel: 'email' | 'whatsapp'
): Promise<{ allowed: boolean; reason?: string }> {
  const purpose = channel === 'email' ? 'EMAIL' : 'WHATSAPP'

  const hasConsent = await hasActiveConsent(donorId, purpose)

  if (!hasConsent) {
    return {
      allowed: false,
      reason: `No active ${channel} consent`,
    }
  }

  return { allowed: true }
}

/**
 * Get consent statistics for admin dashboard
 */
export async function getConsentStatistics(): Promise<{
  email: { granted: number; pending: number; withdrawn: number }
  whatsapp: { granted: number; pending: number; withdrawn: number }
  publicRecognition: { granted: number; pending: number; withdrawn: number }
}> {
  const emailStats = await prisma.consent.groupBy({
    by: ['status'],
    where: { purpose: 'EMAIL' },
    _count: true,
  })

  const whatsappStats = await prisma.consent.groupBy({
    by: ['status'],
    where: { purpose: 'WHATSAPP' },
    _count: true,
  })

  const publicRecognitionStats = await prisma.consent.groupBy({
    by: ['status'],
    where: { purpose: 'PUBLIC_RECOGNITION' },
    _count: true,
  })

  const toStats = (stats: any[]) => ({
    granted: stats.find(s => s.status === 'GRANTED')?._count || 0,
    pending: stats.find(s => s.status === 'PENDING')?._count || 0,
    withdrawn: stats.find(s => s.status === 'WITHDRAWN')?._count || 0,
  })

  return {
    email: toStats(emailStats),
    whatsapp: toStats(whatsappStats),
    publicRecognition: toStats(publicRecognitionStats),
  }
}
