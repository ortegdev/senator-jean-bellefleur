/**
 * Consent Management
 * 
 * Handles per-channel, per-topic consent tracking with encryption
 * Double opt-in for Email and SMS
 * Compliance with GDPR, TCPA
 */

import { prisma } from '@/lib/db/prisma'
import { 
  encryptEmail, 
  encryptPhone, 
  encryptName, 
  getEmailBlindIndex, 
  getPhoneBlindIndex 
} from '@/lib/crypto/field-encryption'
import type { 
  CommunicationChannel, 
  CommunicationTopic, 
  ConsentStatus 
} from '@prisma/client'

export interface ConsentRecord {
  channel: CommunicationChannel
  topic: CommunicationTopic
  status: ConsentStatus
  grantedAt: Date | null
  ipAddress?: string
  userAgent?: string
  consentTextVersion?: string
}

export interface ContactInfo {
  name?: string
  email?: string
  phone?: string
  locale?: string
  country?: string
}

/**
 * Create or update contact with consent
 * 
 * @param info - Contact information (plaintext)
 * @param consents - Array of consent records
 * @returns Contact ID
 */
export async function createOrUpdateContact(
  info: ContactInfo,
  consents: ConsentRecord[]
): Promise<string> {
  // Validate required fields
  if (!info.email && !info.phone) {
    throw new Error('Either email or phone is required')
  }
  
  // Encrypt fields
  const emailData = info.email ? await encryptEmail(info.email) : null
  const phoneData = info.phone ? await encryptPhone(info.phone) : null
  const nameEncrypted = info.name ? await encryptName(info.name) : null
  
  // Find or create contact by blind index
  const searchIndex = emailData?.blindIndex || phoneData!.blindIndex
  const searchField = emailData ? 'emailBlindIndex' : 'phoneBlindIndex'
  
  let contact = await prisma.contact.findFirst({
    where: { [searchField]: searchIndex },
  })
  
  if (!contact) {
    // Create new contact
    contact = await prisma.contact.create({
      data: {
        nameEncrypted,
        emailEncrypted: emailData?.encrypted,
        emailBlindIndex: emailData?.blindIndex,
        phoneEncrypted: phoneData?.encrypted,
        phoneBlindIndex: phoneData?.blindIndex,
        locale: info.locale || 'en',
        country: info.country,
      },
    })
  } else {
    // Update existing contact
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        nameEncrypted: nameEncrypted || contact.nameEncrypted,
        emailEncrypted: emailData?.encrypted || contact.emailEncrypted,
        emailBlindIndex: emailData?.blindIndex || contact.emailBlindIndex,
        phoneEncrypted: phoneData?.encrypted || contact.phoneEncrypted,
        phoneBlindIndex: phoneData?.blindIndex || contact.phoneBlindIndex,
        locale: info.locale || contact.locale,
        country: info.country || contact.country,
      },
    })
  }
  
  // Create or update consent records
  for (const consent of consents) {
    await prisma.channelConsent.upsert({
      where: {
        contactId_channel_topic: {
          contactId: contact.id,
          channel: consent.channel,
          topic: consent.topic,
        },
      },
      create: {
        contactId: contact.id,
        channel: consent.channel,
        topic: consent.topic,
        status: consent.status,
        grantedAt: consent.grantedAt,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        consentTextVersionId: consent.consentTextVersion,
      },
      update: {
        status: consent.status,
        grantedAt: consent.grantedAt || undefined,
        ipAddress: consent.ipAddress || undefined,
        userAgent: consent.userAgent || undefined,
      },
    })
  }
  
  return contact.id
}

/**
 * Check if contact has active consent for channel/topic
 */
export async function hasConsent(
  email: string,
  channel: CommunicationChannel,
  topic: CommunicationTopic
): Promise<boolean> {
  const blindIndex = getEmailBlindIndex(email)
  
  const consent = await prisma.channelConsent.findFirst({
    where: {
      contact: {
        emailBlindIndex: blindIndex,
      },
      channel,
      topic,
      status: 'ACTIVE',
    },
  })
  
  return !!consent
}

/**
 * Revoke consent (unsubscribe)
 */
export async function revokeConsent(
  email: string,
  channel: CommunicationChannel,
  topic: CommunicationTopic,
  reason?: string
): Promise<void> {
  const blindIndex = getEmailBlindIndex(email)
  
  const contact = await prisma.contact.findFirst({
    where: { emailBlindIndex: blindIndex },
  })
  
  if (!contact) {
    throw new Error('Contact not found')
  }
  
  await prisma.channelConsent.updateMany({
    where: {
      contactId: contact.id,
      channel,
      topic,
    },
    data: {
      status: 'UNSUBSCRIBED',
      revokedAt: new Date(),
      revocationReason: reason,
    },
  })
}

/**
 * Revoke all consents for contact (global unsubscribe)
 */
export async function revokeAllConsents(
  email: string,
  reason?: string
): Promise<void> {
  const blindIndex = getEmailBlindIndex(email)
  
  const contact = await prisma.contact.findFirst({
    where: { emailBlindIndex: blindIndex },
  })
  
  if (!contact) {
    throw new Error('Contact not found')
  }
  
  await prisma.channelConsent.updateMany({
    where: {
      contactId: contact.id,
    },
    data: {
      status: 'UNSUBSCRIBED',
      revokedAt: new Date(),
      revocationReason: reason || 'Global unsubscribe',
    },
  })
  
  // Add global suppression
  await prisma.suppression.create({
    data: {
      contactId: contact.id,
      suppressionType: 'GLOBAL',
      reason: reason || 'Global unsubscribe',
    },
  })
}

/**
 * Check if contact is suppressed (globally or for specific channel)
 */
export async function isSuppressed(
  email: string,
  channel?: CommunicationChannel
): Promise<boolean> {
  const blindIndex = getEmailBlindIndex(email)
  
  const contact = await prisma.contact.findFirst({
    where: { emailBlindIndex: blindIndex },
  })
  
  if (!contact) {
    return false // No contact = not suppressed (but also no consent)
  }
  
  const suppression = await prisma.suppression.findFirst({
    where: {
      contactId: contact.id,
      OR: [
        { suppressionType: 'GLOBAL' },
        channel ? { channel, suppressionType: 'CHANNEL_SPECIFIC' } : {},
      ],
    },
  })
  
  return !!suppression
}

/**
 * Get all active consents for contact
 */
export async function getContactConsents(
  email: string
): Promise<Array<{ channel: CommunicationChannel; topic: CommunicationTopic }>> {
  const blindIndex = getEmailBlindIndex(email)
  
  const consents = await prisma.channelConsent.findMany({
    where: {
      contact: {
        emailBlindIndex: blindIndex,
      },
      status: 'ACTIVE',
    },
    select: {
      channel: true,
      topic: true,
    },
  })
  
  return consents
}

/**
 * Record a bounce (email delivery failure)
 */
export async function recordBounce(
  email: string,
  channel: CommunicationChannel,
  bounceType: 'HARD' | 'SOFT' | 'COMPLAINT',
  reason?: string
): Promise<void> {
  const blindIndex = getEmailBlindIndex(email)
  
  const contact = await prisma.contact.findFirst({
    where: { emailBlindIndex: blindIndex },
  })
  
  if (!contact) {
    return // No contact to update
  }
  
  // Update consent status
  await prisma.channelConsent.updateMany({
    where: {
      contactId: contact.id,
      channel,
    },
    data: {
      status: bounceType === 'HARD' || bounceType === 'COMPLAINT' ? 'BOUNCED' : 'UNSUBSCRIBED',
    },
  })
  
  // Add suppression for hard bounces and complaints
  if (bounceType === 'HARD' || bounceType === 'COMPLAINT') {
    await prisma.suppression.create({
      data: {
        contactId: contact.id,
        channel,
        suppressionType: 'CHANNEL_SPECIFIC',
        reason: `${bounceType} bounce: ${reason || 'Unknown'}`,
      },
    })
  }
}

/**
 * Log message sent
 * 
 * NOTE: Does NOT store message body for FUNDRAISING topic
 */
export async function logMessage(
  contactId: string,
  channel: CommunicationChannel,
  topic: CommunicationTopic,
  subject?: string,
  body?: string
): Promise<string> {
  // Never log body for fundraising messages
  const bodyToStore = topic === 'FUNDRAISING' ? null : body
  
  const log = await prisma.messageLog.create({
    data: {
      contactId,
      channel,
      topic,
      subject,
      body: bodyToStore,
      status: 'SENT',
      sentAt: new Date(),
    },
  })
  
  return log.id
}
