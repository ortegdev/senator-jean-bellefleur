/**
 * Currency formatting utilities
 */

export function formatCurrency(cents: number, currency: string = 'USD', locale?: string): string {
  const amount = cents / 100

  return new Intl.NumberFormat(locale || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function centsToDecimal(cents: number): number {
  return cents / 100
}

export function decimalToCents(decimal: number): number {
  return Math.round(decimal * 100)
}
