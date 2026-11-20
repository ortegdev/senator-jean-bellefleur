import { getTranslations } from 'next-intl/server'
import { getContributionStats } from '@/lib/data/contributions'
import { getCandidateConfig } from '@/lib/config/candidate'
import { formatUSD } from '@/lib/i18n/currency'
import { formatRelativeTime } from '@/lib/i18n/dates'
import { type Locale } from '@/i18n/config'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { RevealOnScroll } from '@/components/client/RevealOnScroll'

interface LiveProgressProps {
  locale: Locale
}

export async function LiveProgress({ locale }: LiveProgressProps) {
  const t = await getTranslations('home.progress')
  const stats = await getContributionStats()
  const config = await getCandidateConfig()

  // Only show in DONATIONS_LIVE mode and when we have data
  if (!stats || stats.totalRaisedCents === 0) {
    return null
  }

  const hasGoal = config.fundraisingGoalCents && config.fundraisingGoalCents > 0
  const progressPercent = hasGoal
    ? Math.min(100, (stats.totalRaisedCents / config.fundraisingGoalCents!) * 100)
    : 0

  return (
    <RevealOnScroll>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
              {t('heading')}
            </h2>
          </div>

          {/* Stats Grid */}
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Amount Raised */}
            <div className="rounded-xl border border-ink-200 bg-gradient-to-br from-deepLagoon-50 to-white p-6 text-center shadow-sm">
              <div className="text-sm font-medium uppercase tracking-wide text-deepLagoon-700">
                {t('raised')}
              </div>
              <div className="mt-2 font-display text-4xl font-bold text-deepLagoon-900">
                {formatUSD(stats.totalRaisedCents, locale)}
              </div>
              {hasGoal && (
                <div className="mt-1 text-sm text-ink-600">
                  {t('ofGoal', { goal: formatUSD(config.fundraisingGoalCents!, locale) })}
                </div>
              )}
            </div>

            {/* Supporters */}
            <div className="rounded-xl border border-ink-200 bg-gradient-to-br from-seaGreen-50 to-white p-6 text-center shadow-sm">
              <div className="text-sm font-medium uppercase tracking-wide text-seaGreen-700">
                {t('supporters')}
              </div>
              <div className="mt-2 font-display text-4xl font-bold text-seaGreen-900">
                {stats.totalSupporters.toLocaleString()}
              </div>
            </div>

            {/* Countries */}
            <div className="rounded-xl border border-ink-200 bg-gradient-to-br from-coral-50 to-white p-6 text-center shadow-sm">
              <div className="text-sm font-medium uppercase tracking-wide text-coral-700">
                {t('countries')}
              </div>
              <div className="mt-2 font-display text-4xl font-bold text-coral-900">
                {stats.uniqueCountries}
              </div>
            </div>

            {/* Communes */}
            <div className="rounded-xl border border-ink-200 bg-gradient-to-br from-saltGold-50 to-white p-6 text-center shadow-sm">
              <div className="text-sm font-medium uppercase tracking-wide text-saltGold-700">
                {t('communes')}
              </div>
              <div className="mt-2 font-display text-4xl font-bold text-saltGold-900">
                {stats.uniqueCommunes || '—'}
              </div>
            </div>
          </div>

          {/* Progress Bar (if goal exists) */}
          {hasGoal && (
            <div className="mt-8">
              <ProgressBar
                value={progressPercent}
                max={100}
                label={`${progressPercent.toFixed(1)}% of goal`}
                size="large"
              />
            </div>
          )}

          {/* Last Updated */}
          <div className="mt-6 text-center text-sm text-ink-500">
            {t('lastUpdated', {
              time: formatRelativeTime(stats.lastUpdated, locale),
            })}
          </div>
        </div>
      </section>
    </RevealOnScroll>
  )
}
