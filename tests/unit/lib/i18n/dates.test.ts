import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime, formatRelativeTime, formatDateRange } from '@/lib/i18n/dates'

describe('formatDate', () => {
  const testDate = new Date('2027-03-15T12:00:00Z')

  it('formats date in short style', () => {
    const formatted = formatDate(testDate, 'en', 'short')
    expect(formatted).toContain('2027')
    expect(formatted).toContain('3')
    expect(formatted).toContain('15')
  })

  it('formats date in medium style', () => {
    const formatted = formatDate(testDate, 'en', 'medium')
    expect(formatted).toContain('Mar')
    expect(formatted).toContain('2027')
  })

  it('formats date in long style', () => {
    const formatted = formatDate(testDate, 'en', 'long')
    expect(formatted).toContain('March')
    expect(formatted).toContain('2027')
  })

  it('formats date in full style', () => {
    const formatted = formatDate(testDate, 'en', 'full')
    expect(formatted).toContain('Monday')
    expect(formatted).toContain('March')
  })

  it('formats with different locales', () => {
    const htFormatted = formatDate(testDate, 'ht', 'medium')
    const frFormatted = formatDate(testDate, 'fr', 'medium')
    const enFormatted = formatDate(testDate, 'en', 'medium')

    // All should contain year
    expect(htFormatted).toContain('2027')
    expect(frFormatted).toContain('2027')
    expect(enFormatted).toContain('2027')
  })

  it('handles string dates', () => {
    const formatted = formatDate('2027-03-15', 'en', 'medium')
    expect(formatted).toContain('2027')
  })

  it('handles timestamp dates', () => {
    const formatted = formatDate(testDate.getTime(), 'en', 'medium')
    expect(formatted).toContain('2027')
  })
})

describe('formatDateTime', () => {
  const testDate = new Date('2027-03-15T14:30:45Z')

  it('formats date with time', () => {
    const formatted = formatDateTime(testDate, 'en')
    expect(formatted).toContain('2027')
    // Time will vary by timezone, just check format exists
    expect(formatted.length).toBeGreaterThan(10)
  })

  it('includes seconds when requested', () => {
    const formatted = formatDateTime(testDate, 'en', true)
    expect(formatted.length).toBeGreaterThan(10)
  })
})

describe('formatRelativeTime', () => {
  it('formats recent past', () => {
    const date = new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    const formatted = formatRelativeTime(date, 'en')
    expect(formatted).toContain('minute')
  })

  it('formats near future', () => {
    const date = new Date(Date.now() + 1000 * 60 * 60 * 2) // 2 hours from now
    const formatted = formatRelativeTime(date, 'en')
    expect(formatted).toContain('hour')
  })

  it('formats days', () => {
    const date = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
    const formatted = formatRelativeTime(date, 'en')
    expect(formatted).toContain('day')
  })
})

describe('formatDateRange', () => {
  it('formats a date range', () => {
    const start = new Date('2027-03-01')
    const end = new Date('2027-03-15')
    const formatted = formatDateRange(start, end, 'en')
    
    expect(formatted).toContain('2027')
    expect(formatted).toContain('Mar')
  })

  it('formats range across months', () => {
    const start = new Date('2027-02-15')
    const end = new Date('2027-03-15')
    const formatted = formatDateRange(start, end, 'en')
    
    expect(formatted.length).toBeGreaterThan(10)
  })
})
