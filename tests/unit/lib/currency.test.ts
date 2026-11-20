import { describe, it, expect } from 'vitest'
import { formatCurrency, centsToDecimal, decimalToCents } from '@/lib/utils/currency'

describe('currency utilities', () => {
  describe('formatCurrency', () => {
    it('formats cents to dollars', () => {
      expect(formatCurrency(1500, 'USD')).toBe('$15.00')
    })

    it('formats zero correctly', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0.00')
    })

    it('formats large amounts', () => {
      expect(formatCurrency(100000, 'USD')).toBe('$1,000.00')
    })
  })

  describe('centsToDecimal', () => {
    it('converts cents to decimal', () => {
      expect(centsToDecimal(1500)).toBe(15.0)
    })
  })

  describe('decimalToCents', () => {
    it('converts decimal to cents', () => {
      expect(decimalToCents(15.0)).toBe(1500)
    })

    it('rounds to nearest cent', () => {
      expect(decimalToCents(15.555)).toBe(1556)
    })
  })
})
