import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/Button'
import { CoastlineConstellation } from '@/components/design/CoastlineConstellation'
import { type CandidateConfig } from '@prisma/client'
import { type Locale } from '@/i18n/config'

interface ProfileIntroProps {
  config: CandidateConfig
  locale: Locale
}

export function ProfileIntro({ config, locale }: ProfileIntroProps) {
  const t = useTranslations('profile.intro')

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <CoastlineConstellation variant="horizontal" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Candidacy status badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-deepLagoon-50 px-4 py-2 text-sm font-medium text-deepLagoon-800 ring-1 ring-deepLagoon-200">
          <svg
            className="h-4 w-4"
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
          <span>
            {config.candidacyStatus === 'UNVERIFIED' && t('statusUnverified')}
            {config.candidacyStatus === 'REGISTERED_PRELIMINARY' && t('statusPreliminary')}
            {config.candidacyStatus === 'ON_FINAL_LIST' && t('statusFinal')}
            {config.candidacyStatus === 'NOT_ON_FINAL_LIST' && t('statusNotOnList')}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl font-bold leading-tight text-ink-900 sm:text-5xl lg:text-6xl">
          {config.candidateName}
        </h1>

        {/* Office and Department */}
        <p className="mt-4 text-2xl text-ink-700">
          {t('candidateFor', {
            office: config.office,
            department: config.department,
          })}
        </p>

        {/* Description */}
        <div className="mt-8 prose prose-lg max-w-none text-ink-600">
          <p>{t('description')}</p>
        </div>

        {/* Notice about content */}
        <div className="mt-8 rounded-xl border-2 border-dashed border-ink-200 bg-sandPaper-50 p-6">
          <div className="flex items-start gap-4">
            <svg
              className="mt-0.5 h-6 w-6 flex-shrink-0 text-deepLagoon-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-ink-900">{t('sourcedTitle')}</h3>
              <p className="mt-1 text-sm text-ink-600">{t('sourcedDescription')}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href="/#signup">
            <Button variant="primary" size="medium">
              {t('ctaSupport')}
            </Button>
          </Link>
          <a href="#report-error">
            <Button variant="secondary" size="medium">
              {t('ctaReportError')}
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
