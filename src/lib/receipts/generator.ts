/**
 * Receipt Generation System
 * 
 * Generates unique receipts for completed donations.
 * Includes all required information for donor records.
 */

import { prisma } from '@/lib/db/prisma'
import type { Contribution } from '@prisma/client'

export interface ReceiptData {
  // Unique identifier
  receiptId: string
  receiptNumber: string // Human-readable (e.g., "REC-2026-001234")

  // Donation details
  contributionId: string
  amountCents: number
  currency: string
  donationDate: Date

  // Payment method
  paymentType: string // "Credit Card", "Debit Card"
  last4: string
  cardBrand?: string

  // Donor info (limited)
  donorName: string
  donorEmail: string
  isAnonymous: boolean

  // Legal
  affiliationDisclosure: string
  taxDeductibleNote: string
  refundPolicy: string
  refundWindowDays: number

  // Refund link
  refundMagicLink: string
  refundExpiresAt: Date

  // Metadata
  generatedAt: Date
  locale: string
}

/**
 * Generate receipt for a completed contribution
 */
export async function generateReceipt(
  contributionId: string,
  locale: string = 'en'
): Promise<ReceiptData> {
  // Get contribution with related data
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: {
      paymentIntent: {
        where: { status: 'SUCCEEDED' },
        take: 1,
      },
    },
  })

  if (!contribution) {
    throw new Error('Contribution not found')
  }

  if (contribution.status !== 'COMPLETED') {
    throw new Error('Can only generate receipts for completed contributions')
  }

  const paymentIntent = contribution.paymentIntent[0]
  if (!paymentIntent) {
    throw new Error('No successful payment intent found')
  }

  // Get candidate config for disclosure text
  const config = await prisma.candidateConfig.findFirst({
    where: { slug: 'bellefleur' },
  })

  if (!config) {
    throw new Error('Candidate config not found')
  }

  // Generate unique receipt ID
  const receiptId = `rec_${Date.now()}_${Math.random().toString(36).slice(2)}`
  
  // Generate human-readable receipt number
  const year = contribution.createdAt.getFullYear()
  const sequence = await getNextReceiptSequence(year)
  const receiptNumber = `REC-${year}-${sequence.toString().padStart(6, '0')}`

  // Extract payment method details
  const paymentMethod = paymentIntent.paymentMethod || 'card'
  const last4 = extractLast4(paymentMethod)
  const cardBrand = extractCardBrand(paymentMethod)
  const paymentType = cardBrand ? `${cardBrand} Card` : 'Credit Card'

  // Get refund window from config (default 30 days)
  const refundWindowDays = parseInt(process.env.REFUND_WINDOW_DAYS || '30', 10)

  // Generate magic link for self-service refund
  const magicToken = await generateRefundMagicToken(contributionId)
  const refundMagicLink = `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/refund/${magicToken}`
  const refundExpiresAt = new Date(contribution.createdAt.getTime() + refundWindowDays * 24 * 60 * 60 * 1000)

  // Get localized text
  const affiliationDisclosure = getAffiliationDisclosure(config, locale)
  const taxDeductibleNote = getTaxDeductibleNote(locale)
  const refundPolicy = getRefundPolicy(refundWindowDays, locale)

  const receiptData: ReceiptData = {
    receiptId,
    receiptNumber,
    contributionId: contribution.id,
    amountCents: contribution.amountCents,
    currency: contribution.currency,
    donationDate: contribution.completedAt || contribution.createdAt,
    paymentType,
    last4,
    cardBrand,
    donorName: contribution.isAnonymous 
      ? 'Anonymous Donor' 
      : `${contribution.donorFirstName} ${contribution.donorLastName}`,
    donorEmail: contribution.donorEmail,
    isAnonymous: contribution.isAnonymous,
    affiliationDisclosure,
    taxDeductibleNote,
    refundPolicy,
    refundWindowDays,
    refundMagicLink,
    refundExpiresAt,
    generatedAt: new Date(),
    locale,
  }

  // Store receipt record
  await prisma.receipt.create({
    data: {
      contributionId: contribution.id,
      receiptNumber,
      receiptData: receiptData as any, // JSON field
      locale,
    },
  })

  return receiptData
}

/**
 * Get next receipt sequence number for the year
 */
async function getNextReceiptSequence(year: number): Promise<number> {
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year + 1, 0, 1)

  const count = await prisma.receipt.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lt: endOfYear,
      },
    },
  })

  return count + 1
}

/**
 * Generate magic token for self-service refund
 */
async function generateRefundMagicToken(contributionId: string): Promise<string> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await prisma.refundMagicLink.create({
    data: {
      contributionId,
      token,
      expiresAt,
    },
  })

  return token
}

/**
 * Extract last 4 digits from payment method
 */
function extractLast4(paymentMethod: string): string {
  // Payment method might be "pm_xxx" or "card_xxxx1234"
  // For now, return generic
  // In production, fetch from payment provider
  return '****'
}

/**
 * Extract card brand from payment method
 */
function extractCardBrand(paymentMethod: string): string | undefined {
  // In production, fetch from payment provider
  // For now, return undefined
  return undefined
}

/**
 * Get affiliation disclosure text for locale
 */
function getAffiliationDisclosure(config: any, locale: string): string {
  const text = config.affiliationText

  // In production, translate based on locale
  // For now, return English
  return text
}

/**
 * Get tax-deductible note for locale
 */
function getTaxDeductibleNote(locale: string): string {
  const notes: Record<string, string> = {
    en: 'This contribution is not tax-deductible as a charitable donation under U.S. federal tax law. Contributions to political campaigns are not tax-deductible.',
    fr: 'Cette contribution n\'est pas déductible d\'impôt en tant que don de bienfaisance en vertu de la loi fiscale fédérale américaine. Les contributions aux campagnes politiques ne sont pas déductibles d\'impôt.',
    ht: 'Kontribisyon sa a pa dedwi nan taks kòm yon don charitab anba lwa taks federal ameriken. Kontribisyon nan kanpay politik pa dedwi nan taks.',
  }

  return notes[locale] || notes.en
}

/**
 * Get refund policy text for locale
 */
function getRefundPolicy(windowDays: number, locale: string): string {
  const policies: Record<string, string> = {
    en: `You may request a refund within ${windowDays} days of your contribution. Use the link below to submit a refund request.`,
    fr: `Vous pouvez demander un remboursement dans les ${windowDays} jours suivant votre contribution. Utilisez le lien ci-dessous pour soumettre une demande de remboursement.`,
    ht: `Ou ka mande ranbousman nan ${windowDays} jou apre kontribisyon ou. Itilize lyen ki anba a pou soumèt yon demann ranbousman.`,
  }

  return policies[locale] || policies.en
}

/**
 * Get receipt by contribution ID
 */
export async function getReceipt(contributionId: string): Promise<ReceiptData | null> {
  const receipt = await prisma.receipt.findFirst({
    where: { contributionId },
    orderBy: { createdAt: 'desc' },
  })

  if (!receipt) {
    return null
  }

  return receipt.receiptData as any
}

/**
 * Get receipt by receipt number
 */
export async function getReceiptByNumber(receiptNumber: string): Promise<ReceiptData | null> {
  const receipt = await prisma.receipt.findUnique({
    where: { receiptNumber },
  })

  if (!receipt) {
    return null
  }

  return receipt.receiptData as any
}

/**
 * Format amount for display
 */
export function formatReceiptAmount(amountCents: number, currency: string, locale: string): string {
  const amount = amountCents / 100

  const formats: Record<string, Intl.NumberFormat> = {
    en: new Intl.NumberFormat('en-US', { style: 'currency', currency }),
    fr: new Intl.NumberFormat('fr-FR', { style: 'currency', currency }),
    ht: new Intl.NumberFormat('en-US', { style: 'currency', currency }), // Use US format for Creole
  }

  const formatter = formats[locale] || formats.en
  return formatter.format(amount)
}

/**
 * Format date for receipt
 */
export function formatReceiptDate(date: Date, locale: string): string {
  const formats: Record<string, Intl.DateTimeFormat> = {
    en: new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
    fr: new Intl.DateTimeFormat('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
    ht: new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
  }

  const formatter = formats[locale] || formats.en
  return formatter.format(date)
}
