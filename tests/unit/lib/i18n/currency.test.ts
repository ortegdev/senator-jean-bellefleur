import { describe, it, expect } from 'vitest'
import { formatUSD, getApproximateAmount, formatWithApproximate, getSuggestedCurrency } from '@/lib/i18n/currency'

describe('formatUSD', () => {
  it('formats cents to USD string', () => {
    expect(formatUSD(1000)).toBe('$10.00')
    expect(formatUSD(500)).toBe('$5.00')
    expect(formatUSD(99)).toBe('$0.99')
  })

  it('handles large amounts', () => {
    expect(formatUSD(1000000)).toBe('$10,000.00')
  })

  it('formats with different locales', () => {
    expect(formatUSD(1000, 'fr-FR')).toContain('10')
    expect(formatUSD(1000, 'en-US')).toBe('$10.00')
  })
})

describe('getApproximateAmount', () => {
  it('converts USD to HTG', () => {
    const htg = getApproximateAmount(1000, 'HTG') // $10 USD
    expect(htg).toBeCloseTo(1300, 0) // ~1300 HTG
  })

  it('converts USD to EUR', () => {
    const eur = getApproximateAmount(1000, 'EUR') // $10 USD
    expect(eur).toBeCloseTo(9.2, 1) // ~9.20 EUR
  })

  it('converts USD to CAD', () => {
    const cad = getApproximateAmount(1000, 'CAD') // $10 USD
    expect(cad).toBeCloseTo(13.5, 1) // ~13.50 CAD
  })
})

describe('formatWithApproximate', () => {
  it('returns USD and approximate HTG', () => {
    const result = formatWithApproximate(1000, 'HTG')
    
    expect(result.usd).toBe('$10.00')
    expect(result.approximate).toContain('1,300')
    expect(result.approximateAmount).toBeCloseTo(1300, 0)
  })

  it('formats approximate amount without decimals for HTG', () => {
    const result = formatWithApproximate(550, 'HTG')
    
    expect(result.approximateAmount).toBeCloseTo(715, 0)
  })
})

describe('getSuggestedCurrency', () => {
  it('suggests HTG for Haitian Creole', () => {
    expect(getSuggestedCurrency('ht')).toBe('HTG')
    expect(getSuggestedCurrency('ht-HT')).toBe('HTG')
  })

  it('suggests EUR for French', () => {
    expect(getSuggestedCurrency('fr')).toBe('EUR')
    expect(getSuggestedCurrency('fr-FR')).toBe('EUR')
  })

  it('suggests CAD for Canadian English', () => {
    expect(getSuggestedCurrency('en-CA')).toBe('CAD')
  })

  it('returns null for US English', () => {
    expect(getSuggestedCurrency('en')).toBeNull()
    expect(getSuggestedCurrency('en-US')).toBeNull()
  })
})
