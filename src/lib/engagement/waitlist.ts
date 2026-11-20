/**
 * Waitlist System
 * 
 * Launch notification signup with:
 * - Email and optional WhatsApp
 * - Country and commune of origin
 * - Language preference
 * - Unbundled consent
 * - Double opt-in for email
 * - Rate limits and spam protection
 * - Stored consent proof
 */

import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

// ============================================================================
// RATE LIMITING
// ============================================================================

const RATE_LIMIT_WINDOW = 3600000 // 1 hour in ms
const MAX_SIGNUPS_PER_IP = 5
const MAX_SIGNUPS_PER_EMAIL = 3

/**
 * Check rate limits for IP and email
 */
async function checkRateLimits(email: string, ipAddress: string): Promise<void> {
  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW)

  // Check IP rate limit
  const ipCount = await prisma.waitlistSignup.count({
    where: {
      consentIpAddress: ipAddress,
      createdAt: { gte: oneHourAgo },
    },
  })

  if (ipCount >= MAX_SIGNUPS_PER_IP) {
    throw new Error('Too many signup attempts from this IP address. Please try again later.')
  }

  // Check email rate limit
  const emailCount = await prisma.waitlistSignup.count({
    where: {
      email,
      createdAt: { gte: oneHourAgo },
    },
  })

  if (emailCount >= MAX_SIGNUPS_PER_EMAIL) {
    throw new Error('Too many signup attempts with this email. Please try again later.')
  }
}

// ============================================================================
// SPAM PROTECTION
// ============================================================================

/**
 * Basic spam detection heuristics
 */
function detectSpam(email: string, userAgent?: string): boolean {
  // Check for suspicious email patterns
  const suspiciousPatterns = [
    /^test\d+@/i,
    /^spam@/i,
    /^noreply@/i,
    /^\d{10,}@/, // Long number prefix
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) {
      return true
    }
  }

  // Check for missing or suspicious user agent
  if (!userAgent || userAgent.length < 10) {
    return true
  }

  return false
}

// ============================================================================
// WAITLIST SIGNUP
// ============================================================================

export interface WaitlistSignupInput {
  email: string
  whatsapp?: string
  country: string // ISO 3166-1 alpha-2
  communeOfOrigin?: string
  preferredLocale: 'ht' | 'fr' | 'en'
  emailConsent: boolean
  whatsappConsent: boolean
  ipAddress: string
  userAgent?: string
  referralCode?: string
  source?: string
}

/**
 * Create waitlist signup with double opt-in
 */
export async function createWaitlistSignup(input: WaitlistSignupInput) {
  // Validate email
  if (!input.email || !input.email.includes('@')) {
    throw new Error('Valid email address is required')
  }

  // Validate consent
  if (!input.emailConsent && !input.whatsappConsent) {
    throw new Error('At least one consent (email or WhatsApp) is required')
  }

  if (input.whatsappConsent && !input.whatsapp) {
    throw new Error('WhatsApp number is required for WhatsApp consent')
  }

  // Rate limiting
  await checkRateLimits(input.email, input.ipAddress)

  // Spam detection
  if (detectSpam(input.email, input.userAgent)) {
    throw new Error('Signup appears to be spam. Please contact support if this is an error.')
  }

  // Check if already signed up
  const existing = await prisma.waitlistSignup.findUnique({
    where: { email: input.email },
  })

  if (existing) {
    if (existing.emailVerified) {
      throw new Error('This email is already on the waitlist')
    } else {
      // Resend verification email
      await sendVerificationEmail(existing.id, input.email, input.preferredLocale)
      return { requiresVerification: true, alreadyExists: true }
    }
  }

  // Generate consent text (exact text shown to user)
  const consentText = generateConsentText(input.preferredLocale, {
    emailConsent: input.emailConsent,
    whatsappConsent: input.whatsappConsent,
  })

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex')

  // Create signup
  const signup = await prisma.waitlistSignup.create({
    data: {
      email: input.email,
      whatsapp: input.whatsapp,
      country: input.country,
      communeOfOrigin: input.communeOfOrigin,
      preferredLocale: input.preferredLocale,
      emailConsent: input.emailConsent,
      whatsappConsent: input.whatsappConsent,
      emailConsentedAt: input.emailConsent ? new Date() : null,
      whatsappConsentedAt: input.whatsappConsent ? new Date() : null,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      consentIpAddress: input.ipAddress,
      consentUserAgent: input.userAgent,
      consentText,
      referralCode: input.referralCode,
      source: input.source,
    },
  })

  // Send verification email
  await sendVerificationEmail(signup.id, input.email, input.preferredLocale)

  return { requiresVerification: true, signupId: signup.id }
}

// ============================================================================
// CONSENT TEXT GENERATION
// ============================================================================

function generateConsentText(
  locale: 'ht' | 'fr' | 'en',
  consents: { emailConsent: boolean; whatsappConsent: boolean }
): string {
  const texts = {
    ht: {
      intro: 'Ou aksepte pou resevwa:',
      email: '✓ Notifikasyon pa imèl lè sit wèb la lanse',
      whatsapp: '✓ Notifikasyon pa WhatsApp',
      footer:
        'Ou ka retire konsantman ou nenpòt lè. Nou pap pataje enfòmasyon ou ak lòt moun.',
    },
    fr: {
      intro: 'Vous consentez à recevoir :',
      email: '✓ Notifications par e-mail lors du lancement du site',
      whatsapp: '✓ Notifications par WhatsApp',
      footer:
        'Vous pouvez retirer votre consentement à tout moment. Nous ne partagerons pas vos informations.',
    },
    en: {
      intro: 'You consent to receive:',
      email: '✓ Email notifications when the site launches',
      whatsapp: '✓ WhatsApp notifications',
      footer:
        'You can withdraw your consent at any time. We will not share your information.',
    },
  }

  const t = texts[locale]
  const parts = [t.intro]

  if (consents.emailConsent) parts.push(t.email)
  if (consents.whatsappConsent) parts.push(t.whatsapp)
  parts.push(t.footer)

  return parts.join('\n')
}

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

/**
 * Send verification email (double opt-in)
 */
async function sendVerificationEmail(
  signupId: string,
  email: string,
  locale: 'ht' | 'fr' | 'en'
) {
  const signup = await prisma.waitlistSignup.findUnique({
    where: { id: signupId },
  })

  if (!signup || !signup.emailVerificationToken) {
    throw new Error('Signup not found or token missing')
  }

  const verificationUrl = `${process.env.SITE_URL}/${locale}/verify-email?token=${signup.emailVerificationToken}`

  const subjects = {
    ht: 'Konfime adrès imèl ou pou Diaspora4Bellefleur',
    fr: 'Confirmez votre adresse e-mail pour Diaspora4Bellefleur',
    en: 'Confirm your email for Diaspora4Bellefleur',
  }

  const bodies = {
    ht: `
Mèsi pou w enteresan nan Diaspora4Bellefleur!

Tanpri klike sou lyen sa a pou konfime adrès imèl ou:

${verificationUrl}

Lyen sa a ap eksplire nan 24 èdtan.

Si ou pa mande sa, ou ka inyore imèl sa a.
    `,
    fr: `
Merci de votre intérêt pour Diaspora4Bellefleur !

Veuillez cliquer sur ce lien pour confirmer votre adresse e-mail :

${verificationUrl}

Ce lien expirera dans 24 heures.

Si vous n'avez pas demandé cela, vous pouvez ignorer cet e-mail.
    `,
    en: `
Thank you for your interest in Diaspora4Bellefleur!

Please click this link to confirm your email address:

${verificationUrl}

This link will expire in 24 hours.

If you didn't request this, you can ignore this email.
    `,
  }

  // Send email using email service (to be implemented)
  // For now, this is a placeholder
  console.log(`[Waitlist] Verification email sent to ${email}`)
  console.log(`Subject: ${subjects[locale]}`)
  console.log(`Body: ${bodies[locale]}`)

  // In production, use sendEmail() function from email service
}

/**
 * Verify email with token
 */
export async function verifyWaitlistEmail(token: string) {
  const signup = await prisma.waitlistSignup.findUnique({
    where: { emailVerificationToken: token },
  })

  if (!signup) {
    throw new Error('Invalid verification token')
  }

  if (signup.emailVerified) {
    return { alreadyVerified: true }
  }

  // Check if token expired (24 hours)
  const tokenAge = Date.now() - signup.createdAt.getTime()
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

  if (tokenAge > TWENTY_FOUR_HOURS) {
    throw new Error('Verification token has expired. Please sign up again.')
  }

  // Verify email
  await prisma.waitlistSignup.update({
    where: { id: signup.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null, // Clear token after use
    },
  })

  return { verified: true, email: signup.email }
}

// ============================================================================
// UNSUBSCRIBE
// ============================================================================

/**
 * Unsubscribe from waitlist
 */
export async function unsubscribeFromWaitlist(email: string) {
  const signup = await prisma.waitlistSignup.findUnique({
    where: { email },
  })

  if (!signup) {
    throw new Error('Email not found in waitlist')
  }

  if (signup.unsubscribed) {
    return { alreadyUnsubscribed: true }
  }

  await prisma.waitlistSignup.update({
    where: { email },
    data: {
      unsubscribed: true,
      unsubscribedAt: new Date(),
    },
  })

  return { unsubscribed: true }
}

// ============================================================================
// SEND LAUNCH NOTIFICATION
// ============================================================================

/**
 * Send launch notification to all verified, subscribed waitlist members
 */
export async function sendLaunchNotifications(locale?: 'ht' | 'fr' | 'en') {
  const where: any = {
    emailVerified: true,
    unsubscribed: false,
    notified: false,
  }

  if (locale) {
    where.preferredLocale = locale
  }

  const signups = await prisma.waitlistSignup.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  })

  console.log(`[Waitlist] Sending launch notifications to ${signups.length} members`)

  let sentCount = 0

  for (const signup of signups) {
    try {
      await sendLaunchNotificationEmail(signup)

      // Mark as notified
      await prisma.waitlistSignup.update({
        where: { id: signup.id },
        data: {
          notified: true,
          notifiedAt: new Date(),
        },
      })

      sentCount++
    } catch (error) {
      console.error(`[Waitlist] Failed to send to ${signup.email}:`, error)
    }
  }

  return { total: signups.length, sent: sentCount }
}

/**
 * Send individual launch notification
 */
async function sendLaunchNotificationEmail(signup: any) {
  const locale = signup.preferredLocale as 'ht' | 'fr' | 'en'

  const subjects = {
    ht: 'Sit wèb Diaspora4Bellefleur lanse kounye a!',
    fr: 'Le site Diaspora4Bellefleur est maintenant lancé !',
    en: 'Diaspora4Bellefleur site is now live!',
  }

  const bodies = {
    ht: `
Bonjou!

Nou kontan pou n di w: sit wèb Diaspora4Bellefleur lanse kounye a!

Vizite sit nou an: ${process.env.SITE_URL}

Mèsi pou sipò ou!
    `,
    fr: `
Bonjour !

Nous sommes heureux de vous annoncer que le site Diaspora4Bellefleur est maintenant lancé !

Visitez notre site : ${process.env.SITE_URL}

Merci pour votre soutien !
    `,
    en: `
Hello!

We're excited to announce that the Diaspora4Bellefleur site is now live!

Visit our site: ${process.env.SITE_URL}

Thank you for your support!
    `,
  }

  console.log(`[Waitlist] Sending launch notification to ${signup.email}`)
  console.log(`Subject: ${subjects[locale]}`)
  console.log(`Body: ${bodies[locale]}`)

  // In production, use sendEmail() function
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get waitlist statistics
 */
export async function getWaitlistStats() {
  const [
    total,
    verified,
    notified,
    unsubscribed,
    byCountry,
    byCommune,
    byLocale,
  ] = await Promise.all([
    prisma.waitlistSignup.count(),
    prisma.waitlistSignup.count({ where: { emailVerified: true } }),
    prisma.waitlistSignup.count({ where: { notified: true } }),
    prisma.waitlistSignup.count({ where: { unsubscribed: true } }),
    prisma.waitlistSignup.groupBy({
      by: ['country'],
      _count: true,
      orderBy: { _count: { country: 'desc' } },
    }),
    prisma.waitlistSignup.groupBy({
      by: ['communeOfOrigin'],
      _count: true,
      where: { communeOfOrigin: { not: null } },
      orderBy: { _count: { communeOfOrigin: 'desc' } },
    }),
    prisma.waitlistSignup.groupBy({
      by: ['preferredLocale'],
      _count: true,
      orderBy: { _count: { preferredLocale: 'desc' } },
    }),
  ])

  return {
    total,
    verified,
    notified,
    unsubscribed,
    pending: total - verified,
    byCountry: byCountry.map((c) => ({ country: c.country, count: c._count })),
    byCommune: byCommune.map((c) => ({ commune: c.communeOfOrigin, count: c._count })),
    byLocale: byLocale.map((l) => ({ locale: l.preferredLocale, count: l._count })),
  }
}

/**
 * Export waitlist signups (audit-logged)
 */
export async function exportWaitlistSignups(params: {
  exportedBy: string
  exportedByEmail: string
  exportedByRole: string
  reason: string
  ipAddress?: string
  filters?: {
    country?: string
    communeOfOrigin?: string
    preferredLocale?: string
    verified?: boolean
    notified?: boolean
  }
}) {
  const where: any = {}

  if (params.filters?.country) {
    where.country = params.filters.country
  }
  if (params.filters?.communeOfOrigin) {
    where.communeOfOrigin = params.filters.communeOfOrigin
  }
  if (params.filters?.preferredLocale) {
    where.preferredLocale = params.filters.preferredLocale
  }
  if (params.filters?.verified !== undefined) {
    where.emailVerified = params.filters.verified
  }
  if (params.filters?.notified !== undefined) {
    where.notified = params.filters.notified
  }

  const signups = await prisma.waitlistSignup.findMany({
    where,
    select: {
      email: true,
      whatsapp: true,
      country: true,
      communeOfOrigin: true,
      preferredLocale: true,
      emailVerified: true,
      emailVerifiedAt: true,
      notified: true,
      notifiedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Create audit log
  await prisma.subscriberExport.create({
    data: {
      exportType: 'waitlist',
      format: 'json',
      filters: params.filters || {},
      recordCount: signups.length,
      exportedBy: params.exportedBy,
      exportedByEmail: params.exportedByEmail,
      exportedByRole: params.exportedByRole,
      ipAddress: params.ipAddress,
      reason: params.reason,
    },
  })

  return signups
}
