import { currencyConfig } from '@/i18n/config'

/**
 * Format an amount in USD cents to display string
 */
export function formatUSD(cents: number, locale: string = 'en-US'): string {
  const dollars = cents / 100
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars)
}

/**
 * Get approximate amount in a different currency
 * Note: These are approximate rates for display only, not for actual conversion
 */
export function getApproximateAmount(
  usdCents: number,
  targetCurrency: keyof typeof currencyConfig.approximateRates
): number {
  const usdDollars = usdCents / 100
  const rate = currencyConfig.approximateRates[targetCurrency]
  return Math.round(usdDollars * rate * 100) / 100
}

/**
 * Format amount with approximate local currency display
 * Example: "$10.00 USD (Approximately 1,300 HTG)"
 */
export function formatWithApproximate(
  usdCents: number,
  targetCurrency: keyof typeof currencyConfig.approximateRates,
  locale: string = 'en-US'
): {
  usd: string
  approximate: string
  approximateAmount: number
} {
  const usd = formatUSD(usdCents, locale)
  const approximateAmount = getApproximateAmount(usdCents, targetCurrency)
  
  const approximate = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: targetCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(approximateAmount)

  return {
    usd,
    approximate,
    approximateAmount,
  }
}

/**
 * Get suggested approximate currency based on locale
 */
export function getSuggestedCurrency(
  locale: string
): keyof typeof currencyConfig.approximateRates | null {
  if (locale.startsWith('ht')) return 'HTG'
  if (locale.startsWith('fr')) return 'EUR'
  if (locale.startsWith('en') && locale.includes('CA')) return 'CAD'
  return null
}
