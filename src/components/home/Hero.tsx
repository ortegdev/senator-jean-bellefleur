import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { getCandidateConfig } from '@/lib/config/candidate'
import { getCurrentMode } from '@/lib/launch-gate/mode'
import { Button } from '@/components/ui/Button'
import { CoastlineConstellation } from '@/components/design/CoastlineConstellation'
import { LaunchMode } from '@prisma/client'

export async function Hero() {
  const config = await getCandidateConfig()
  const mode = await getCurrentMode()
  const t = useTranslations('home.hero')
  const tCta = useTranslations('cta')

  // Determine title based on candidacy status
  const isUnverified = config.candidacyStatus === 'UNVERIFIED'
  const title = isUnverified
    ? t('titleUnverified', { candidateName: config.candidateName })
    : t('title', { candidateName: config.candidateName })

  const subtitle = isUnverified ? t('subtitleUnverified') : t('subtitle')

  // Mode-dependent CTA
  const ctaConfig: Record<LaunchMode, { href: string; label: string }> = {
    INFO_ONLY: { href: '/about', label: tCta('infoOnly') },
    WAITLIST: { href: '/get-involved', label: tCta('waitlist') },
    DONATIONS_LIVE: { href: '/contribute', label: tCta('donationsLive') },
  }

  const primaryCta = ctaConfig[mode]

  return (
    <section className="relative overflow-hidden bg-sandPaper-50 pb-16 pt-20 sm:pb-20 sm:pt-24 lg:pb-24 lg:pt-32">
      {/* Coastline Constellation Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <CoastlineConstellation
          variant="horizontal"
          className="absolute inset-0 opacity-5"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Candidacy Status Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm ring-1 ring-ink-200">
              <svg
                className="h-4 w-4 text-deepLagoon-600"
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
                {config.candidacyStatus === 'UNVERIFIED' && 'Status: Not yet verified'}
                {config.candidacyStatus === 'REGISTERED_PRELIMINARY' &&
                  'Registered on preliminary list'}
                {config.candidacyStatus === 'ON_FINAL_LIST' && 'Confirmed on final ballot'}
                {config.candidacyStatus === 'NOT_ON_FINAL_LIST' && 'Not on final ballot'}
              </span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-ink-900 sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            {/* Support sentence */}
            <p className="mt-6 text-xl leading-relaxed text-ink-700">{subtitle}</p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link href={primaryCta.href}>
                <Button variant="primary" size="large">
                  {primaryCta.label}
                </Button>
              </Link>
              <Link href="/about" className="text-ink-600 hover:text-deepLagoon-700">
                <Button variant="secondary" size="large">
                  {t('secondaryCta')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Photo Slot */}
          <div className="flex items-center justify-center">
            {config.photoUrl ? (
              <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl shadow-xl">
                <img
                  src={config.photoUrl}
                  alt={config.candidateName}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-deepLagoon-900 to-deepLagoon-700 p-12 text-white shadow-xl">
                {/* Elegant typographic composition when no photo */}
                <div className="absolute inset-0 opacity-10">
                  <CoastlineConstellation variant="circular" />
                </div>
                <div className="relative flex h-full flex-col justify-center space-y-6">
                  <div className="font-display text-5xl font-bold leading-tight">
                    {config.candidateName.split(' ').map((name, i) => (
                      <div key={i}>{name}</div>
                    ))}
                  </div>
                  <div className="space-y-2 text-lg font-medium text-sandPaper-200">
                    <div>{config.office}</div>
                    <div>{config.department}</div>
                    <div>2027</div>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 text-xs text-sandPaper-400">
                  Photo pending approval
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
