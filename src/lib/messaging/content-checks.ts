/**
 * Content Checks
 * 
 * Validates message content before approval:
 * 1. Factual claims about candidate must have source references
 * 2. Fundraising asks must respect launch gate and pre-campaign rules
 * 3. Required disclosures (affiliation, sender ID, unsubscribe) are appended automatically
 */

import { prisma } from '@/lib/db/prisma'
import type { CommunicationTopic } from '@prisma/client'

export interface ContentCheckResult {
  passed: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Check if message can be approved
 * 
 * Blocks:
 * - Factual claims without sources
 * - Fundraising asks when launch gate forbids
 * - Fundraising asks before official campaign start (if pre-campaign rule active)
 */
export async function checkMessageContent(
  messageId: string,
  topic: CommunicationTopic
): Promise<ContentCheckResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Get message
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      variants: true,
    },
  })
  
  if (!message) {
    errors.push('Message not found')
    return { passed: false, errors, warnings }
  }
  
  // Check factual claims
  if (message.hasFactualClaims && !message.factualClaimsVerified) {
    errors.push('Message contains factual claims about the candidate that have not been verified with source references')
  }
  
  // Check fundraising asks
  if (topic === 'FUNDRAISING' || message.hasFundraisingAsk) {
    const fundraisingCheck = await checkFundraisingAllowed()
    
    if (!fundraisingCheck.allowed) {
      errors.push(fundraisingCheck.reason!)
    } else {
      message.fundraisingCheckPassed = true
    }
  }
  
  // Check required elements in variants
  for (const variant of message.variants) {
    const variantCheck = checkVariantContent(variant)
    errors.push(...variantCheck.errors)
    warnings.push(...variantCheck.warnings)
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check if fundraising asks are allowed
 * 
 * Checks:
 * 1. Launch gate mode (DONATIONS_LIVE required)
 * 2. Pre-campaign rule (if counsel requires waiting until campaign start)
 */
async function checkFundraisingAllowed(): Promise<{
  allowed: boolean
  reason?: string
}> {
  // Check launch gate
  const launchGate = await prisma.launchGate.findFirst()
  
  if (!launchGate || launchGate.mode !== 'DONATIONS_LIVE') {
    return {
      allowed: false,
      reason: 'Launch gate is not in DONATIONS_LIVE mode. Fundraising messages are not permitted.',
    }
  }
  
  if (launchGate.killSwitchActive) {
    return {
      allowed: false,
      reason: 'Launch gate kill switch is active. Fundraising messages are not permitted.',
    }
  }
  
  // Check pre-campaign rule
  const candidateConfig = await prisma.candidateConfig.findFirst({
    where: { slug: 'bellefleur' },
  })
  
  if (candidateConfig?.officialCampaignStart) {
    const now = new Date()
    if (now < candidateConfig.officialCampaignStart) {
      return {
        allowed: false,
        reason: `Fundraising messages cannot be sent before the official campaign start date (${candidateConfig.officialCampaignStart.toLocaleDateString()})`,
      }
    }
  }
  
  return { allowed: true }
}

/**
 * Check variant content for required elements
 */
function checkVariantContent(variant: any): {
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  const channel = variant.channel
  const locale = variant.locale
  
  // Email checks
  if (channel === 'EMAIL') {
    if (!variant.emailSubject) {
      errors.push(`Email subject is required for ${locale} variant`)
    }
    
    if (!variant.emailBodyHtml && !variant.emailBodyText) {
      errors.push(`Email body (HTML or text) is required for ${locale} variant`)
    }
    
    // Check for unsubscribe footer (will be appended automatically)
    if (variant.emailBodyHtml && !variant.emailBodyHtml.includes('{{unsubscribe_link}}')) {
      warnings.push(`Email HTML body for ${locale} is missing {{unsubscribe_link}} placeholder. It will be appended automatically.`)
    }
  }
  
  // SMS checks
  if (channel === 'SMS') {
    if (!variant.smsBody) {
      errors.push(`SMS body is required for ${locale} variant`)
    }
    
    if (variant.smsBody && variant.smsBody.length > 1600) {
      warnings.push(`SMS body for ${locale} is ${variant.smsBody.length} characters (${Math.ceil(variant.smsBody.length / 153)} segments). Consider shortening.`)
    }
  }
  
  // Telegram checks
  if (channel === 'TELEGRAM') {
    if (!variant.telegramBody) {
      errors.push(`Telegram body is required for ${locale} variant`)
    }
  }
  
  // Web Push checks
  if (channel === 'WEB_PUSH') {
    if (!variant.webPushTitle) {
      errors.push(`Web push title is required for ${locale} variant`)
    }
    
    if (!variant.webPushBody) {
      errors.push(`Web push body is required for ${locale} variant`)
    }
  }
  
  // WhatsApp Channel checks
  if (variant.whatsappChannelText) {
    if (variant.whatsappChannelText.length > 4096) {
      warnings.push(`WhatsApp Channel text for ${locale} exceeds recommended length (${variant.whatsappChannelText.length} chars)`)
    }
  }
  
  return { errors, warnings }
}

/**
 * Append required disclosures to message variant
 * 
 * Adds:
 * - Sender identification
 * - Affiliation disclosure
 * - Unsubscribe footer
 * 
 * These CANNOT be removed or modified by the user
 */
export async function appendDisclosures(
  variant: any,
  locale: string
): Promise<any> {
  const candidateConfig = await prisma.candidateConfig.findFirst({
    where: { slug: 'bellefleur' },
  })
  
  if (!candidateConfig) {
    throw new Error('Candidate config not found')
  }
  
  const orgName = 'Diaspora4Bellefleur'
  const affiliationText = candidateConfig.affiliationText
  
  // Get localized strings
  const unsubscribeText = getLocalizedText(locale, 'unsubscribe')
  const preferencesText = getLocalizedText(locale, 'preferences')
  
  // Append to email
  if (variant.channel === 'EMAIL') {
    const footer = `
---

${orgName}
${affiliationText}

[${preferencesText}]({{preferences_link}}) | [${unsubscribeText}]({{unsubscribe_link}})
`
    
    variant.emailBodyText = (variant.emailBodyText || '') + footer
    variant.emailBodyHtml = (variant.emailBodyHtml || '') + `
<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
  <p><strong>${orgName}</strong></p>
  <p>${affiliationText}</p>
  <p>
    <a href="{{preferences_link}}">${preferencesText}</a> |
    <a href="{{unsubscribe_link}}">${unsubscribeText}</a>
  </p>
</div>
`
  }
  
  // Append to SMS
  if (variant.channel === 'SMS') {
    const footer = `\n\n${orgName}. ${abbreviate(affiliationText)}. Reply STOP to opt out.`
    variant.smsBody = (variant.smsBody || '') + footer
  }
  
  // Append to Telegram
  if (variant.channel === 'TELEGRAM') {
    const footer = `\n\n${orgName}\n${affiliationText}\n\n/stop to unsubscribe`
    variant.telegramBody = (variant.telegramBody || '') + footer
  }
  
  return variant
}

/**
 * Abbreviate text for SMS (max 160 chars)
 */
function abbreviate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Get localized text
 */
function getLocalizedText(locale: string, key: string): string {
  const translations: Record<string, Record<string, string>> = {
    unsubscribe: {
      en: 'Unsubscribe',
      fr: 'Se désabonner',
      ht: 'Dezabòne',
    },
    preferences: {
      en: 'Update preferences',
      fr: 'Modifier les préférences',
      ht: 'Chanje preferans',
    },
  }
  
  return translations[key]?.[locale] || translations[key]?.['en'] || key
}
