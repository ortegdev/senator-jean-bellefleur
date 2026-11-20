import { dateLocales, type Locale } from '@/i18n/config'

/**
 * Format a date using the locale's date formatting preferences
 */
export function formatDate(
  date: Date | string | number,
  locale: Locale,
  style: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const localeCode = dateLocales[locale]

  const options: Intl.DateTimeFormatOptions = {
    short: { year: 'numeric', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  }[style]

  return new Intl.DateTimeFormat(localeCode, options).format(dateObj)
}

/**
 * Format a date-time with time included
 */
export function formatDateTime(
  date: Date | string | number,
  locale: Locale,
  includeSeconds: boolean = false
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const localeCode = dateLocales[locale]

  return new Intl.DateTimeFormat(localeCode, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  }).format(dateObj)
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Locale
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const localeCode = dateLocales[locale]
  const now = new Date()
  const diffMs = dateObj.getTime() - now.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' })

  if (Math.abs(diffYears) >= 1) {
    return rtf.format(diffYears, 'year')
  } else if (Math.abs(diffMonths) >= 1) {
    return rtf.format(diffMonths, 'month')
  } else if (Math.abs(diffWeeks) >= 1) {
    return rtf.format(diffWeeks, 'week')
  } else if (Math.abs(diffDays) >= 1) {
    return rtf.format(diffDays, 'day')
  } else if (Math.abs(diffHours) >= 1) {
    return rtf.format(diffHours, 'hour')
  } else if (Math.abs(diffMinutes) >= 1) {
    return rtf.format(diffMinutes, 'minute')
  } else {
    return rtf.format(diffSeconds, 'second')
  }
}

/**
 * Format a date range
 */
export function formatDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  locale: Locale
): string {
  const startObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate
  const endObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate
  const localeCode = dateLocales[locale]

  return new Intl.DateTimeFormat(localeCode, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).formatRange(startObj, endObj)
}
