export const locales = ['ht', 'fr', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ht'

// Locale names in their native language
export const localeNames: Record<Locale, string> = {
  ht: 'Kreyòl Ayisyen',
  fr: 'Français',
  en: 'English',
}

// Locale full names for accessibility
export const localeFullNames: Record<Locale, string> = {
  ht: 'Haitian Creole',
  fr: 'French',
  en: 'English',
}

// Country codes where each locale is primary (for detection)
export const localeRegions: Record<Locale, string[]> = {
  ht: ['HT'], // Haiti
  fr: ['FR', 'BE', 'CH', 'CA'], // France, Belgium, Switzerland, Canada
  en: ['US', 'GB', 'CA', 'AU', 'NZ'], // US, UK, Canada, Australia, New Zealand
}

// Locale text direction (for future RTL support)
export const localeDir: Record<Locale, 'ltr' | 'rtl'> = {
  ht: 'ltr',
  fr: 'ltr',
  en: 'ltr',
}

// Currency display configuration
export const currencyConfig = {
  primary: 'USD' as const,
  // Approximate exchange rates for display only (updated manually)
  approximateRates: {
    HTG: 130, // Haitian Gourde (approximate)
    EUR: 0.92, // Euro
    CAD: 1.35, // Canadian Dollar
  },
}

// Date formatting locale codes (BCP 47)
export const dateLocales: Record<Locale, string> = {
  ht: 'ht-HT',
  fr: 'fr-FR',
  en: 'en-US',
}
