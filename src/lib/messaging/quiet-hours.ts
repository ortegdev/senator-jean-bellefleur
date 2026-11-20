/**
 * Quiet Hours Enforcement
 * 
 * Respects recipient time zones for SMS and other time-sensitive channels
 * Default: 8:00 - 21:00 local time
 * 
 * Email: no quiet hours (people read email on their own schedule)
 * SMS: strict quiet hours enforcement
 * Telegram/WebPush: optional quiet hours
 */

import type { CommunicationChannel } from '@prisma/client'

// Country to timezone mapping (simplified, use full IANA database in production)
const COUNTRY_TO_TIMEZONE: Record<string, string> = {
  'US': 'America/New_York', // Default to Eastern
  'CA': 'America/Toronto',
  'FR': 'Europe/Paris',
  'HT': 'America/Port-au-Prince',
  'DO': 'America/Santo_Domingo',
  // Add more as needed
}

export interface QuietHoursConfig {
  enabled: boolean
  startHour: number // 0-23
  endHour: number // 0-23
}

/**
 * Get quiet hours config for channel
 */
export function getQuietHoursConfig(
  channel: CommunicationChannel
): QuietHoursConfig {
  switch (channel) {
    case 'EMAIL':
      return { enabled: false, startHour: 21, endHour: 8 }
    
    case 'SMS':
      return { enabled: true, startHour: 21, endHour: 8 } // 9pm-8am quiet
    
    case 'TELEGRAM':
      return { enabled: true, startHour: 22, endHour: 7 } // 10pm-7am quiet
    
    case 'WEB_PUSH':
      return { enabled: true, startHour: 22, endHour: 7 }
    
    default:
      return { enabled: false, startHour: 21, endHour: 8 }
  }
}

/**
 * Check if current time is within quiet hours for recipient
 * 
 * @param country - Recipient country (ISO 3166-1 alpha-2)
 * @param timezone - Recipient timezone (IANA, optional)
 * @param channel - Communication channel
 * @returns true if in quiet hours (should NOT send)
 */
export function isInQuietHours(
  country: string | null,
  timezone: string | null,
  channel: CommunicationChannel
): boolean {
  const config = getQuietHoursConfig(channel)
  
  // If quiet hours not enabled for this channel, always allow
  if (!config.enabled) {
    return false
  }
  
  // Get timezone
  const tz = timezone || (country ? COUNTRY_TO_TIMEZONE[country] : null) || 'America/Port-au-Prince'
  
  // Get current hour in recipient timezone
  const now = new Date()
  const recipientHour = getHourInTimezone(now, tz)
  
  // Check if in quiet hours
  // Quiet hours: startHour (e.g., 21) to endHour (e.g., 8)
  // This wraps around midnight
  if (config.startHour > config.endHour) {
    // Wraps midnight: e.g., 21:00 - 08:00
    return recipientHour >= config.startHour || recipientHour < config.endHour
  } else {
    // Same day: e.g., 13:00 - 17:00 (unusual but supported)
    return recipientHour >= config.startHour && recipientHour < config.endHour
  }
}

/**
 * Get next available send time (after quiet hours)
 * 
 * Returns null if not in quiet hours (can send now)
 * Returns Date if should defer until later
 */
export function getNextAvailableSendTime(
  country: string | null,
  timezone: string | null,
  channel: CommunicationChannel
): Date | null {
  if (!isInQuietHours(country, timezone, channel)) {
    return null // Can send now
  }
  
  const config = getQuietHoursConfig(channel)
  const tz = timezone || (country ? COUNTRY_TO_TIMEZONE[country] : null) || 'America/Port-au-Prince'
  
  // Calculate next send time (endHour in recipient timezone)
  const now = new Date()
  const recipientHour = getHourInTimezone(now, tz)
  
  // Calculate hours until end of quiet hours
  let hoursUntilEnd: number
  if (config.startHour > config.endHour) {
    // Wraps midnight
    if (recipientHour >= config.startHour) {
      // After start, before midnight
      hoursUntilEnd = (24 - recipientHour) + config.endHour
    } else {
      // After midnight, before end
      hoursUntilEnd = config.endHour - recipientHour
    }
  } else {
    // Same day
    hoursUntilEnd = config.endHour - recipientHour
  }
  
  // Add hours to current time
  const nextSendTime = new Date(now.getTime() + hoursUntilEnd * 60 * 60 * 1000)
  
  return nextSendTime
}

/**
 * Get current hour in a specific timezone
 * 
 * @param date - Date to check
 * @param timezone - IANA timezone
 * @returns Hour (0-23)
 */
function getHourInTimezone(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    })
    
    const parts = formatter.formatToParts(date)
    const hourPart = parts.find(p => p.type === 'hour')
    
    return hourPart ? parseInt(hourPart.value, 10) : 0
  } catch (error) {
    console.error('[QuietHours] Timezone error:', timezone, error)
    return 0 // Fallback: assume midnight
  }
}

/**
 * Format quiet hours for display
 */
export function formatQuietHours(config: QuietHoursConfig): string {
  if (!config.enabled) {
    return 'No quiet hours'
  }
  
  return `${formatHour(config.startHour)} - ${formatHour(config.endHour)} (recipient local time)`
}

function formatHour(hour: number): string {
  const h = hour % 12 || 12
  const suffix = hour < 12 ? 'AM' : 'PM'
  return `${h}:00 ${suffix}`
}

/**
 * Test cases for quiet hours
 */
export const QUIET_HOURS_TEST_CASES = [
  {
    name: 'US Eastern, 3:00 AM (in quiet hours)',
    country: 'US',
    hour: 3,
    channel: 'SMS' as CommunicationChannel,
    expectedInQuietHours: true,
  },
  {
    name: 'US Eastern, 10:00 AM (not in quiet hours)',
    country: 'US',
    hour: 10,
    channel: 'SMS' as CommunicationChannel,
    expectedInQuietHours: false,
  },
  {
    name: 'Haiti, 11:00 PM (in quiet hours)',
    country: 'HT',
    hour: 23,
    channel: 'SMS' as CommunicationChannel,
    expectedInQuietHours: true,
  },
  {
    name: 'France, 2:00 PM (not in quiet hours)',
    country: 'FR',
    hour: 14,
    channel: 'SMS' as CommunicationChannel,
    expectedInQuietHours: false,
  },
  {
    name: 'Email, any time (no quiet hours)',
    country: 'US',
    hour: 2,
    channel: 'EMAIL' as CommunicationChannel,
    expectedInQuietHours: false,
  },
]
