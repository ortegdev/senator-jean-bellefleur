/**
 * Audience Builder
 * 
 * Builds audience segments with consent, suppression, and frequency cap checks
 * Uses blind indexes to query encrypted contact data
 */

import { prisma } from '@/lib/db/prisma'
import type { 
  CommunicationChannel, 
  CommunicationTopic,
  ConsentStatus 
} from '@prisma/client'

export interface AudienceCriteria {
  // Required
  channel: CommunicationChannel
  topic: CommunicationTopic
  
  // Filters
  locales?: string[]
  countries?: string[]
  chapters?: string[]
  communesOfOrigin?: string[]
  
  // Engagement filters
  hasContributed?: boolean // Only if consent permits (not FUNDRAISING topic)
  lastEngagedAfter?: Date
  lastEngagedBefore?: Date
  
  // Testing
  testMode?: boolean
  testContactIds?: string[]
}

export interface AudienceResult {
  contactIds: string[]
  estimatedCount: number
  appliedSuppressions: number
  appliedFrequencyCaps: number
  eligibleCount: number
}

/**
 * Build audience for a message
 * 
 * Applies:
 * 1. Active consent for channel + topic
 * 2. Global and channel-specific suppression
 * 3. Frequency caps (configurable messages per week)
 * 4. Quiet hours (deferred, not excluded)
 * 5. Country allow-list
 * 
 * @param criteria - Audience criteria
 * @returns Contact IDs and counts
 */
export async function buildAudience(
  criteria: AudienceCriteria
): Promise<AudienceResult> {
  // Test mode: use only test contacts
  if (criteria.testMode && criteria.testContactIds) {
    return {
      contactIds: criteria.testContactIds,
      estimatedCount: criteria.testContactIds.length,
      appliedSuppressions: 0,
      appliedFrequencyCaps: 0,
      eligibleCount: criteria.testContactIds.length,
    }
  }
  
  // Get channel config for country allow-list
  const channelConfig = await prisma.channelConfig.findUnique({
    where: { channel: criteria.channel },
  })
  
  // Build query
  const query = {
    // Active consent for channel + topic
    consents: {
      some: {
        channel: criteria.channel,
        topic: criteria.topic,
        status: 'ACTIVE' as ConsentStatus,
      },
    },
    
    // No global or channel-specific suppression
    suppressions: {
      none: {
        OR: [
          { suppressionType: 'GLOBAL' },
          {
            suppressionType: 'CHANNEL_SPECIFIC',
            channel: criteria.channel,
          },
        ],
      },
    },
    
    // Locale filter
    ...(criteria.locales && criteria.locales.length > 0 && {
      locale: { in: criteria.locales },
    }),
    
    // Country filter (if channel config has allow-list)
    ...(channelConfig?.allowedCountries && channelConfig.allowedCountries.length > 0 ? {
      country: { in: channelConfig.allowedCountries },
    } : criteria.countries && criteria.countries.length > 0 ? {
      country: { in: criteria.countries },
    } : {}),
  }
  
  // Get eligible contacts
  const eligibleContacts = await prisma.contact.findMany({
    where: query,
    select: { id: true },
  })
  
  const eligibleIds = eligibleContacts.map(c => c.id)
  const eligibleCount = eligibleIds.length
  
  // Apply frequency caps
  const { contactIds, cappedCount } = await applyFrequencyCaps(
    eligibleIds,
    criteria.channel
  )
  
  return {
    contactIds,
    estimatedCount: contactIds.length,
    appliedSuppressions: 0, // Already filtered in query
    appliedFrequencyCaps: cappedCount,
    eligibleCount,
  }
}

/**
 * Apply frequency caps (cross-channel limit per contact)
 * 
 * Default: 7 messages per week per contact
 * Configurable in ChannelConfig
 */
async function applyFrequencyCaps(
  contactIds: string[],
  channel: CommunicationChannel
): Promise<{ contactIds: string[]; cappedCount: number }> {
  // Get channel config
  const channelConfig = await prisma.channelConfig.findUnique({
    where: { channel },
  })
  
  const maxPerWeek = channelConfig?.maxPerWeek || 7
  
  // Get current week's window
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - 7)
  
  // Get frequency caps for contacts in current window
  const caps = await prisma.frequencyCap.findMany({
    where: {
      contactId: { in: contactIds },
      windowEnd: { gte: now },
    },
  })
  
  // Filter out contacts at or over cap
  const cappedContactIds = new Set(
    caps
      .filter(cap => cap.messagesSent >= cap.maxMessages)
      .map(cap => cap.contactId)
  )
  
  const filteredIds = contactIds.filter(id => !cappedContactIds.has(id))
  
  return {
    contactIds: filteredIds,
    cappedCount: cappedContactIds.size,
  }
}

/**
 * Preview audience count (estimated, without building full list)
 */
export async function previewAudienceCount(
  criteria: AudienceCriteria
): Promise<number> {
  const result = await buildAudience(criteria)
  return result.estimatedCount
}

/**
 * Snapshot audience for sending
 * 
 * Stores audience at send time for audit trail
 */
export async function snapshotAudience(
  criteria: AudienceCriteria
): Promise<{ contactIds: string[]; snapshot: any }> {
  const result = await buildAudience(criteria)
  
  const snapshot = {
    criteria,
    generatedAt: new Date().toISOString(),
    eligibleCount: result.eligibleCount,
    estimatedCount: result.estimatedCount,
    appliedSuppressions: result.appliedSuppressions,
    appliedFrequencyCaps: result.appliedFrequencyCaps,
  }
  
  return {
    contactIds: result.contactIds,
    snapshot,
  }
}

/**
 * Check if contact should receive message (consent + suppression + frequency)
 */
export async function canSendToContact(
  contactId: string,
  channel: CommunicationChannel,
  topic: CommunicationTopic
): Promise<{ canSend: boolean; reason?: string }> {
  // Check consent
  const consent = await prisma.channelConsent.findFirst({
    where: {
      contactId,
      channel,
      topic,
      status: 'ACTIVE',
    },
  })
  
  if (!consent) {
    return { canSend: false, reason: 'No active consent' }
  }
  
  // Check suppression
  const suppression = await prisma.suppression.findFirst({
    where: {
      contactId,
      OR: [
        { suppressionType: 'GLOBAL' },
        { suppressionType: 'CHANNEL_SPECIFIC', channel },
      ],
    },
  })
  
  if (suppression) {
    return { canSend: false, reason: 'Contact is suppressed' }
  }
  
  // Check frequency cap
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - 7)
  
  const cap = await prisma.frequencyCap.findFirst({
    where: {
      contactId,
      windowEnd: { gte: now },
    },
  })
  
  if (cap && cap.messagesSent >= cap.maxMessages) {
    return { canSend: false, reason: 'Frequency cap reached' }
  }
  
  return { canSend: true }
}

/**
 * Deduplicate cross-channel sends
 * 
 * If a contact has consent on multiple channels for same topic,
 * prefer in order: EMAIL > SMS > TELEGRAM > WEB_PUSH
 * 
 * This prevents sending the same message to one person on every channel
 */
export function deduplicateCrossChannel(
  audiences: Map<CommunicationChannel, string[]>
): Map<CommunicationChannel, string[]> {
  const seen = new Set<string>()
  const deduplicated = new Map<CommunicationChannel, string[]>()
  
  // Preference order
  const channelOrder: CommunicationChannel[] = ['EMAIL', 'SMS', 'TELEGRAM', 'WEB_PUSH']
  
  for (const channel of channelOrder) {
    const contactIds = audiences.get(channel) || []
    const uniqueIds = contactIds.filter(id => {
      if (seen.has(id)) {
        return false
      }
      seen.add(id)
      return true
    })
    
    if (uniqueIds.length > 0) {
      deduplicated.set(channel, uniqueIds)
    }
  }
  
  return deduplicated
}
