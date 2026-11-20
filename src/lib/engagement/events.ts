/**
 * Events and RSVP System
 * 
 * Features:
 * - Event creation and management
 * - RSVP with capacity limits and waitlist
 * - Time zone handling
 * - Calendar file generation (.ics)
 * - Check-in tracking
 * - Multilingual support
 */

import { prisma } from '@/lib/db/prisma'
import type { 
  EventLocationType, 
  EventStatus, 
  RSVPStatus 
} from '@prisma/client'

// ============================================================================
// Types
// ============================================================================

export interface CreateEventInput {
  slug: string
  titleHt: string
  titleFr: string
  titleEn: string
  descriptionHt: string
  descriptionFr: string
  descriptionEn: string
  startDateTime: Date
  endDateTime: Date
  timeZone: string // IANA time zone, e.g., "America/Port-au-Prince"
  locationType: EventLocationType
  locationDetails?: string // Address or video link
  rsvpEnabled: boolean
  rsvpCapacity?: number // null = unlimited
  requiresApproval: boolean
  chapterId?: string
}

export interface CreateRSVPInput {
  eventId: string
  email: string
  firstName: string
  lastName: string
  guests: number // Number of additional guests (0 = just the registrant)
  dietaryRestrictions?: string
  accessibilityNeeds?: string
  consentIpAddress?: string
  consentUserAgent?: string
}

export interface EventStats {
  totalEvents: number
  upcomingEvents: number
  pastEvents: number
  totalRSVPs: number
  confirmedRSVPs: number
  checkedInCount: number
  averageAttendance: number
}

// ============================================================================
// Rate Limiting
// ============================================================================

const RSVP_RATE_LIMITS = {
  PER_IP_PER_HOUR: 10,
  PER_EMAIL_PER_EVENT: 1, // Only one RSVP per email per event
} as const

async function checkRSVPRateLimits(
  eventId: string,
  email: string,
  ipAddress?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  // Check for duplicate RSVP (same email, same event)
  const existing = await prisma.eventRSVP.findFirst({
    where: {
      eventId,
      email: email.toLowerCase(),
    },
  })

  if (existing) {
    return {
      allowed: false,
      reason: 'ALREADY_REGISTERED_FOR_EVENT',
    }
  }

  // Check IP rate limit (if provided)
  if (ipAddress) {
    const ipCount = await prisma.eventRSVP.count({
      where: {
        consentIpAddress: ipAddress,
        createdAt: { gte: oneHourAgo },
      },
    })

    if (ipCount >= RSVP_RATE_LIMITS.PER_IP_PER_HOUR) {
      return {
        allowed: false,
        reason: 'TOO_MANY_RSVPS_FROM_IP',
      }
    }
  }

  return { allowed: true }
}

// ============================================================================
// Validation
// ============================================================================

function validateEventInput(input: CreateEventInput): void {
  // Slug validation
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(input.slug)) {
    throw new Error('INVALID_SLUG_FORMAT')
  }

  // Required multilingual fields
  if (!input.titleHt?.trim() || !input.titleFr?.trim() || !input.titleEn?.trim()) {
    throw new Error('ALL_TITLE_TRANSLATIONS_REQUIRED')
  }

  if (!input.descriptionHt?.trim() || !input.descriptionFr?.trim() || !input.descriptionEn?.trim()) {
    throw new Error('ALL_DESCRIPTION_TRANSLATIONS_REQUIRED')
  }

  // Date validation
  if (input.startDateTime >= input.endDateTime) {
    throw new Error('END_MUST_BE_AFTER_START')
  }

  // RSVP capacity validation
  if (input.rsvpEnabled && input.rsvpCapacity !== undefined && input.rsvpCapacity < 1) {
    throw new Error('CAPACITY_MUST_BE_POSITIVE')
  }

  // Location details required for IN_PERSON and HYBRID
  if ((input.locationType === 'IN_PERSON' || input.locationType === 'HYBRID') && !input.locationDetails?.trim()) {
    throw new Error('LOCATION_DETAILS_REQUIRED')
  }

  // Time zone validation (basic check for IANA format)
  if (!input.timeZone.includes('/')) {
    throw new Error('INVALID_TIMEZONE_FORMAT')
  }
}

function validateRSVPInput(input: CreateRSVPInput): void {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(input.email)) {
    throw new Error('INVALID_EMAIL_FORMAT')
  }

  // Name validation
  if (!input.firstName?.trim()) {
    throw new Error('FIRST_NAME_REQUIRED')
  }

  if (!input.lastName?.trim()) {
    throw new Error('LAST_NAME_REQUIRED')
  }

  // Guests validation
  if (input.guests < 0 || input.guests > 10) {
    throw new Error('GUESTS_OUT_OF_RANGE')
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Create a new event
 */
export async function createEvent(
  input: CreateEventInput,
  createdBy: string
): Promise<{ id: string; slug: string }> {
  validateEventInput(input)

  // Check for slug uniqueness
  const existing = await prisma.event.findUnique({
    where: { slug: input.slug },
  })

  if (existing) {
    throw new Error('SLUG_ALREADY_EXISTS')
  }

  const event = await prisma.event.create({
    data: {
      slug: input.slug,
      titleHt: input.titleHt.trim(),
      titleFr: input.titleFr.trim(),
      titleEn: input.titleEn.trim(),
      descriptionHt: input.descriptionHt.trim(),
      descriptionFr: input.descriptionFr.trim(),
      descriptionEn: input.descriptionEn.trim(),
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      timeZone: input.timeZone,
      locationType: input.locationType,
      locationDetails: input.locationDetails?.trim(),
      rsvpEnabled: input.rsvpEnabled,
      rsvpCapacity: input.rsvpCapacity,
      requiresApproval: input.requiresApproval,
      chapterId: input.chapterId,
      status: 'DRAFT',
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'EVENT_CREATED',
      entityType: 'Event',
      entityId: event.id,
      userId: createdBy,
      changes: {
        slug: input.slug,
        titleEn: input.titleEn,
        startDateTime: input.startDateTime,
      },
    },
  })

  return {
    id: event.id,
    slug: event.slug,
  }
}

/**
 * Update event status
 */
export async function updateEventStatus(
  eventId: string,
  status: EventStatus,
  updatedBy: string
): Promise<void> {
  await prisma.event.update({
    where: { id: eventId },
    data: { status },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'EVENT_STATUS_UPDATED',
      entityType: 'Event',
      entityId: eventId,
      userId: updatedBy,
      changes: { status },
    },
  })
}

/**
 * Create an RSVP
 */
export async function createRSVP(
  input: CreateRSVPInput
): Promise<{ id: string; status: RSVPStatus }> {
  validateRSVPInput(input)

  // Rate limit check
  const rateLimitCheck = await checkRSVPRateLimits(
    input.eventId,
    input.email,
    input.consentIpAddress
  )

  if (!rateLimitCheck.allowed) {
    throw new Error(rateLimitCheck.reason)
  }

  // Get event details
  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
    include: {
      _count: {
        select: {
          rsvps: {
            where: {
              status: { in: ['CONFIRMED', 'PENDING'] },
            },
          },
        },
      },
    },
  })

  if (!event) {
    throw new Error('EVENT_NOT_FOUND')
  }

  if (!event.rsvpEnabled) {
    throw new Error('RSVP_NOT_ENABLED')
  }

  if (event.status !== 'PUBLISHED') {
    throw new Error('EVENT_NOT_PUBLISHED')
  }

  // Check capacity
  const totalPartySize = 1 + input.guests
  let rsvpStatus: RSVPStatus = event.requiresApproval ? 'PENDING' : 'CONFIRMED'

  if (event.rsvpCapacity !== null) {
    // Calculate current confirmed count (including guests)
    const confirmedRSVPs = await prisma.eventRSVP.findMany({
      where: {
        eventId: input.eventId,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: { guests: true },
    })

    const currentCount = confirmedRSVPs.reduce(
      (sum, rsvp) => sum + 1 + rsvp.guests,
      0
    )

    if (currentCount + totalPartySize > event.rsvpCapacity) {
      rsvpStatus = 'WAITLIST'
    }
  }

  const rsvp = await prisma.eventRSVP.create({
    data: {
      eventId: input.eventId,
      email: input.email.toLowerCase(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      guests: input.guests,
      dietaryRestrictions: input.dietaryRestrictions?.trim(),
      accessibilityNeeds: input.accessibilityNeeds?.trim(),
      status: rsvpStatus,
      consentIpAddress: input.consentIpAddress,
      consentUserAgent: input.consentUserAgent,
      consentTimestamp: new Date(),
    },
  })

  return {
    id: rsvp.id,
    status: rsvp.status,
  }
}

/**
 * Update RSVP status
 */
export async function updateRSVPStatus(
  rsvpId: string,
  status: RSVPStatus,
  updatedBy: string
): Promise<void> {
  await prisma.eventRSVP.update({
    where: { id: rsvpId },
    data: { status },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'RSVP_STATUS_UPDATED',
      entityType: 'EventRSVP',
      entityId: rsvpId,
      userId: updatedBy,
      changes: { status },
    },
  })
}

/**
 * Check in attendee
 */
export async function checkInAttendee(
  rsvpId: string,
  checkedInBy: string
): Promise<void> {
  const rsvp = await prisma.eventRSVP.findUnique({
    where: { id: rsvpId },
  })

  if (!rsvp) {
    throw new Error('RSVP_NOT_FOUND')
  }

  if (rsvp.status !== 'CONFIRMED') {
    throw new Error('RSVP_NOT_CONFIRMED')
  }

  await prisma.eventRSVP.update({
    where: { id: rsvpId },
    data: {
      checkedIn: true,
      checkedInAt: new Date(),
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'ATTENDEE_CHECKED_IN',
      entityType: 'EventRSVP',
      entityId: rsvpId,
      userId: checkedInBy,
    },
  })
}

/**
 * Generate calendar file (.ics) for an event
 */
export function generateCalendarFile(event: {
  titleEn: string
  descriptionEn: string
  startDateTime: Date
  endDateTime: Date
  timeZone: string
  locationType: EventLocationType
  locationDetails?: string | null
}): string {
  // Format dates for iCal (YYYYMMDDTHHMMSS)
  const formatICalDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  }

  const uid = `${Date.now()}@diaspora4bellefleur.com`
  const dtstamp = formatICalDate(new Date())
  const dtstart = formatICalDate(event.startDateTime)
  const dtend = formatICalDate(event.endDateTime)

  // Build location string
  let location = ''
  if (event.locationType === 'IN_PERSON' && event.locationDetails) {
    location = event.locationDetails
  } else if (event.locationType === 'VIRTUAL' && event.locationDetails) {
    location = `Online: ${event.locationDetails}`
  } else if (event.locationType === 'HYBRID' && event.locationDetails) {
    location = event.locationDetails
  }

  // Escape special characters for iCal
  const escape = (str: string): string => {
    return str.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n')
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Diaspora4Bellefleur//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escape(event.titleEn)}`,
    `DESCRIPTION:${escape(event.descriptionEn)}`,
    ...(location ? [`LOCATION:${escape(location)}`] : []),
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return icsContent
}

/**
 * Get event statistics
 */
export async function getEventStats(): Promise<EventStats> {
  const now = new Date()

  const [
    events,
    rsvps,
    checkedIn,
  ] = await Promise.all([
    prisma.event.findMany({
      where: { status: { in: ['PUBLISHED', 'PAST'] } },
      select: {
        startDateTime: true,
        _count: {
          select: {
            rsvps: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
    }),
    prisma.eventRSVP.count(),
    prisma.eventRSVP.count({
      where: { checkedIn: true },
    }),
  ])

  const upcoming = events.filter((e) => e.startDateTime > now).length
  const past = events.filter((e) => e.startDateTime <= now).length

  const confirmed = events.reduce((sum, e) => sum + e._count.rsvps, 0)

  const pastEventsWithRSVPs = events.filter(
    (e) => e.startDateTime <= now && e._count.rsvps > 0
  )

  const averageAttendance =
    pastEventsWithRSVPs.length > 0
      ? checkedIn / pastEventsWithRSVPs.length
      : 0

  return {
    totalEvents: events.length,
    upcomingEvents: upcoming,
    pastEvents: past,
    totalRSVPs: rsvps,
    confirmedRSVPs: confirmed,
    checkedInCount: checkedIn,
    averageAttendance: Math.round(averageAttendance * 10) / 10,
  }
}

/**
 * Export RSVPs for an event (audit-logged)
 */
export async function exportEventRSVPs(
  eventId: string,
  exportedBy: {
    userId: string
    userEmail: string
    userRole: string
  },
  reason: string
): Promise<Array<{
  email: string
  firstName: string
  lastName: string
  guests: number
  status: string
  dietaryRestrictions: string | null
  accessibilityNeeds: string | null
  checkedIn: boolean
  createdAt: Date
}>> {
  if (!reason.trim()) {
    throw new Error('EXPORT_REASON_REQUIRED')
  }

  const rsvps = await prisma.eventRSVP.findMany({
    where: { eventId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      guests: true,
      status: true,
      dietaryRestrictions: true,
      accessibilityNeeds: true,
      checkedIn: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Audit log the export
  await prisma.subscriberExport.create({
    data: {
      exportType: 'EVENT_RSVPS',
      format: 'JSON',
      filters: { eventId },
      recordCount: rsvps.length,
      exportedBy: exportedBy.userId,
      exportedByEmail: exportedBy.userEmail,
      exportedByRole: exportedBy.userRole,
      reason: reason.trim(),
    },
  })

  return rsvps
}
