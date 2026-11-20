/**
 * SMS Keyword Handler
 * 
 * Handles inbound SMS keywords per TCPA requirements:
 * - STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT → unsubscribe immediately
 * - HELP → return help text
 * - START → resubscribe if prior consent exists
 * 
 * Supports localized aliases (configured per locale)
 */

import { prisma } from '@/lib/db/prisma'
import { revokeConsent, getContactConsents } from '@/lib/communications/consent'
import { getPhoneBlindIndex } from '@/lib/crypto/field-encryption'

// Standard STOP keywords (case-insensitive)
const STOP_KEYWORDS = [
  'STOP',
  'STOPALL',
  'UNSUBSCRIBE',
  'CANCEL',
  'END',
  'QUIT',
  'ARRET', // French
  'RETE', // Creole
]

const HELP_KEYWORDS = ['HELP', 'INFO', 'AIDE']

const START_KEYWORDS = ['START', 'UNSTOP', 'YES', 'KÒMANSE']

export interface KeywordResponse {
  handled: boolean
  responseText?: string
  action?: 'UNSUBSCRIBE' | 'HELP' | 'RESUBSCRIBE'
}

/**
 * Handle inbound SMS keyword
 * 
 * @param phone - Sender phone (E.164 format)
 * @param text - Message text
 * @param locale - Preferred locale (for response text)
 * @returns Keyword response
 */
export async function handleSmsKeyword(
  phone: string,
  text: string,
  locale: string = 'en'
): Promise<KeywordResponse> {
  const keyword = text.trim().toUpperCase()
  
  // Check STOP keywords
  if (STOP_KEYWORDS.includes(keyword)) {
    await handleStop(phone)
    return {
      handled: true,
      responseText: getStopResponseText(locale),
      action: 'UNSUBSCRIBE',
    }
  }
  
  // Check HELP keywords
  if (HELP_KEYWORDS.includes(keyword)) {
    return {
      handled: true,
      responseText: getHelpText(locale),
      action: 'HELP',
    }
  }
  
  // Check START keywords
  if (START_KEYWORDS.includes(keyword)) {
    const resubscribed = await handleStart(phone)
    return {
      handled: true,
      responseText: resubscribed
        ? getStartSuccessText(locale)
        : getStartFailureText(locale),
      action: 'RESUBSCRIBE',
    }
  }
  
  // Not a recognized keyword
  return {
    handled: false,
  }
}

/**
 * Handle STOP keyword
 * 
 * Unsubscribes contact from SMS for all topics
 */
async function handleStop(phone: string): Promise<void> {
  const blindIndex = getPhoneBlindIndex(phone)
  
  // Find contact
  const contact = await prisma.contact.findFirst({
    where: { phoneBlindIndex: blindIndex },
  })
  
  if (!contact) {
    console.warn('[SMS Keywords] STOP received for unknown phone:', phone)
    return
  }
  
  // Revoke all SMS consents
  await prisma.channelConsent.updateMany({
    where: {
      contactId: contact.id,
      channel: 'SMS',
    },
    data: {
      status: 'UNSUBSCRIBED',
      revokedAt: new Date(),
      revocationReason: 'SMS STOP keyword',
    },
  })
  
  // Add channel-specific suppression
  await prisma.suppression.create({
    data: {
      contactId: contact.id,
      channel: 'SMS',
      suppressionType: 'CHANNEL_SPECIFIC',
      reason: 'SMS STOP keyword',
    },
  })
  
  console.log('[SMS Keywords] Contact unsubscribed via STOP:', contact.id)
}

/**
 * Handle START keyword
 * 
 * Resubscribes only if contact had prior consent
 * Cannot create new consent via START alone
 */
async function handleStart(phone: string): Promise<boolean> {
  const blindIndex = getPhoneBlindIndex(phone)
  
  // Find contact
  const contact = await prisma.contact.findFirst({
    where: { phoneBlindIndex: blindIndex },
  })
  
  if (!contact) {
    console.warn('[SMS Keywords] START received for unknown phone:', phone)
    return false
  }
  
  // Check if any prior consent exists (even if UNSUBSCRIBED)
  const priorConsents = await prisma.channelConsent.findMany({
    where: {
      contactId: contact.id,
      channel: 'SMS',
      status: 'UNSUBSCRIBED',
      grantedAt: { not: null }, // Had consent at some point
    },
  })
  
  if (priorConsents.length === 0) {
    console.warn('[SMS Keywords] START received but no prior consent:', contact.id)
    return false
  }
  
  // Reactivate consents
  await prisma.channelConsent.updateMany({
    where: {
      contactId: contact.id,
      channel: 'SMS',
      status: 'UNSUBSCRIBED',
    },
    data: {
      status: 'ACTIVE',
      revokedAt: null,
      revocationReason: null,
    },
  })
  
  // Remove channel-specific suppression
  await prisma.suppression.deleteMany({
    where: {
      contactId: contact.id,
      channel: 'SMS',
      suppressionType: 'CHANNEL_SPECIFIC',
    },
  })
  
  console.log('[SMS Keywords] Contact resubscribed via START:', contact.id)
  return true
}

/**
 * Get STOP response text (localized)
 */
function getStopResponseText(locale: string): string {
  const responses: Record<string, string> = {
    en: 'You have been unsubscribed from SMS messages. Reply START to resubscribe. Reply HELP for help.',
    fr: 'Vous avez été désabonné des messages SMS. Répondez START pour vous réabonner. Répondez AIDE pour obtenir de l\'aide.',
    ht: 'Ou dezabòne nan mesaj SMS yo. Reponn START pou re-abòne. Reponn HELP pou èd.',
  }
  
  return responses[locale] || responses.en
}

/**
 * Get HELP response text (localized)
 */
function getHelpText(locale: string): string {
  const candidateName = 'Jean Fritznel Bellefleur' // TODO: Get from config
  const supportEmail = 'hello@diaspora4bellefleur.example' // TODO: Get from config
  
  const responses: Record<string, string> = {
    en: `Diaspora4Bellefleur: SMS updates about ${candidateName}'s campaign. Reply STOP to unsubscribe. Help: ${supportEmail}. Msg&data rates may apply.`,
    fr: `Diaspora4Bellefleur: Mises à jour SMS sur la campagne de ${candidateName}. Répondez STOP pour vous désabonner. Aide: ${supportEmail}. Tarifs msg&données applicables.`,
    ht: `Diaspora4Bellefleur: Mizajou SMS sou kanpay ${candidateName}. Reponn STOP pou dezabòne. Èd: ${supportEmail}. Tarif mesaj&done ka aplike.`,
  }
  
  return responses[locale] || responses.en
}

/**
 * Get START success response text (localized)
 */
function getStartSuccessText(locale: string): string {
  const responses: Record<string, string> = {
    en: 'You have been resubscribed to SMS messages. Reply STOP to unsubscribe. Reply HELP for help.',
    fr: 'Vous avez été réabonné aux messages SMS. Répondez STOP pour vous désabonner. Répondez AIDE pour obtenir de l\'aide.',
    ht: 'Ou re-abòne nan mesaj SMS yo. Reponn STOP pou dezabòne. Reponn HELP pou èd.',
  }
  
  return responses[locale] || responses.en
}

/**
 * Get START failure response text (localized)
 */
function getStartFailureText(locale: string): string {
  const supportEmail = 'hello@diaspora4bellefleur.example' // TODO: Get from config
  
  const responses: Record<string, string> = {
    en: `We don't have a record of your consent. Please sign up at our website or contact ${supportEmail}.`,
    fr: `Nous n'avons pas de trace de votre consentement. Veuillez vous inscrire sur notre site ou contacter ${supportEmail}.`,
    ht: `Nou pa gen anrejistreman pou konsantman ou. Tanpri enskri sou sit entènèt nou oswa kontakte ${supportEmail}.`,
  }
  
  return responses[locale] || responses.en
}

/**
 * Webhook handler for inbound SMS (Twilio format)
 */
export async function handleInboundSmsWebhook(payload: any): Promise<string | null> {
  // Twilio webhook format
  const from = payload.From // E.164 phone
  const body = payload.Body // Message text
  
  if (!from || !body) {
    console.warn('[SMS Keywords] Invalid webhook payload:', payload)
    return null
  }
  
  // Get contact locale (default to 'en')
  const blindIndex = getPhoneBlindIndex(from)
  const contact = await prisma.contact.findFirst({
    where: { phoneBlindIndex: blindIndex },
  })
  
  const locale = contact?.locale || 'en'
  
  // Handle keyword
  const response = await handleSmsKeyword(from, body, locale)
  
  return response.handled ? response.responseText || null : null
}
