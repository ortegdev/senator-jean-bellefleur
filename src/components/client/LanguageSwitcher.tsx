'use client'

import { useParams } from 'next/navigation'
import { useTransition } from 'react'
import { useRouter, usePathname } from '@/i18n/routing'
import { locales, localeNames, localeFullNames, type Locale } from '@/i18n/config'
import { useTranslations } from 'next-intl'

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'list'
  className?: string
}

export function LanguageSwitcher({ variant = 'dropdown', className = '' }: LanguageSwitcherProps) {
  const t = useTranslations('language')
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [isPending, startTransition] = useTransition()

  const currentLocale = (params.locale as Locale) || 'ht'

  function handleLocaleChange(newLocale: Locale) {
    startTransition(() => {
      // Save preference to cookie
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
      
      // Navigate to same page in new locale
      router.replace(pathname, { locale: newLocale })
    })
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-sm font-medium text-ink-700">{t('selectLanguage')}</p>
        <div className="space-y-1">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              disabled={isPending}
              className={`
                w-full text-left px-4 py-3 rounded-lg transition-colors
                ${currentLocale === locale
                  ? 'bg-deepLagoon-100 text-deepLagoon-900 font-medium'
                  : 'hover:bg-sandPaper-200 text-ink-700'
                }
                ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-current={currentLocale === locale ? 'true' : undefined}
              aria-label={`Switch to ${localeFullNames[locale]}`}
            >
              <span className="text-base">{localeNames[locale]}</span>
              {currentLocale === locale && (
                <span className="ml-2 text-xs text-deepLagoon-700">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="language-select" className="sr-only">
        {t('switchLanguage')}
      </label>
      <select
        id="language-select"
        value={currentLocale}
        onChange={(e) => handleLocaleChange(e.target.value as Locale)}
        disabled={isPending}
        className="
          appearance-none bg-white border border-ink-300 rounded-md
          px-3 py-2 pr-8 text-sm font-medium text-ink-900
          hover:border-ink-400 focus:outline-none focus:ring-2 focus:ring-deepLagoon-500
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
        "
        aria-label={t('switchLanguage')}
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-ink-700">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  )
}
