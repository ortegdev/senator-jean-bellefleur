import { useTranslations } from 'next-intl'
import { type CandidateConfig } from '@prisma/client'
import { type Locale } from '@/i18n/config'
import { RevealOnScroll } from '@/components/client/RevealOnScroll'

interface ProfileSupporterProps {
  config: CandidateConfig
  locale: Locale
}

export function ProfileSupporter({ config, locale }: ProfileSupporterProps) {
  const t = useTranslations('profile.supporter')

  const values = [
    {
      title: t('value1Title'),
      body: t('value1Body'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      title: t('value2Title'),
      body: t('value2Body'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: t('value3Title'),
      body: t('value3Body'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  ]

  return (
    <RevealOnScroll>
      <section className="bg-gradient-to-br from-sandPaper-100 to-sandPaper-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Clear visual distinction */}
          <div className="rounded-2xl border-2 border-dashed border-coral-300 bg-white p-8 sm:p-12">
            {/* Disclaimer banner */}
            <div className="mb-8 flex items-start gap-4 rounded-lg bg-coral-50 p-4">
              <svg
                className="mt-0.5 h-6 w-6 flex-shrink-0 text-coral-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-coral-900">{t('heading')}</p>
                <p className="mt-1 text-sm text-coral-700">{t('disclaimer')}</p>
              </div>
            </div>

            {/* Content */}
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('whySupport')}
            </h2>

            <div className="mt-8 space-y-6">
              {values.map((value, index) => (
                <RevealOnScroll key={value.title} delay={index * 100}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-deepLagoon-100 p-3 text-deepLagoon-700">
                      {value.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-ink-900">{value.title}</h3>
                      <p className="mt-1 text-ink-600">{value.body}</p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>

            {/* Footer note */}
            <div className="mt-8 border-t border-ink-200 pt-6">
              <p className="text-xs italic text-ink-500">{t('notEndorsement')}</p>
            </div>
          </div>
        </div>
      </section>
    </RevealOnScroll>
  )
}
