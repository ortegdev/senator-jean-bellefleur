import { getTranslations } from 'next-intl/server'
import { getCandidateConfig } from '@/lib/config/candidate'
import { getCommunes } from '@/lib/data/communes'
import { CommuneIndex } from '@/components/nord-ouest/CommuneIndex'
import { SenateRaceBox } from '@/components/nord-ouest/SenateRaceBox'
import { type Locale } from '@/i18n/config'
import type { Metadata } from 'next'

interface NordOuestPageProps {
  params: Promise<{
    locale: Locale
  }>
}

export async function generateMetadata({
  params,
}: NordOuestPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'nordOuest' })

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  }
}

export default async function NordOuestPage({ params }: NordOuestPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'nordOuest' })
  
  const [config, communes] = await Promise.all([
    getCandidateConfig(),
    getCommunes(),
  ])

  // Group communes by arrondissement
  const byArrondissement = communes.reduce((acc, commune) => {
    if (!acc[commune.arrondissement]) {
      acc[commune.arrondissement] = []
    }
    acc[commune.arrondissement].push(commune)
    return acc
  }, {} as Record<string, typeof communes>)

  // Calculate total population (where available)
  const totalPopulation = communes.reduce((sum, c) => {
    return sum + (c.population2015 || 0)
  }, 0)

  const hasPopulationData = communes.some((c) => c.population2015 !== null)

  return (
    <div className="bg-sand-paper">
      {/* Hero Section */}
      <section className="bg-deep-lagoon py-16 text-sand-paper">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-display text-4xl font-bold md:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mt-6 text-xl text-sand-paper/90">
              {t('hero.subtitle')}
            </p>

            {/* Key Facts */}
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div>
                <div className="text-4xl font-bold text-sea-green">
                  {communes.length}
                </div>
                <div className="mt-2 text-sm uppercase tracking-wide text-sand-paper/70">
                  {t('hero.communes')}
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-sea-green">3</div>
                <div className="mt-2 text-sm uppercase tracking-wide text-sand-paper/70">
                  {t('hero.arrondissements')}
                </div>
              </div>
              {hasPopulationData && totalPopulation > 0 && (
                <div>
                  <div className="text-4xl font-bold text-sea-green">
                    {totalPopulation.toLocaleString(locale)}
                  </div>
                  <div className="mt-2 text-sm uppercase tracking-wide text-sand-paper/70">
                    {t('hero.population')}
                  </div>
                  <div className="mt-1 text-xs text-sand-paper/60">
                    {t('hero.populationNote')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <p className="text-lg leading-relaxed text-ink">
              {t('intro.paragraph1')}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink">
              {t('intro.paragraph2')}
            </p>
          </div>
        </div>
      </section>

      {/* Senate Race Box */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <SenateRaceBox config={config} locale={locale} />
          </div>
        </div>
      </section>

      {/* Commune Index */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center font-display text-3xl font-bold text-deep-lagoon md:text-4xl">
              {t('communeIndex.heading')}
            </h2>
            <p className="mb-12 text-center text-ink/70">
              {t('communeIndex.description')}
            </p>

            <CommuneIndex
              byArrondissement={byArrondissement}
              locale={locale}
            />
          </div>
        </div>
      </section>

      {/* Source Note */}
      <section className="border-t border-ink/10 py-8">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-lg bg-sea-green/10 p-6 text-sm">
              <h3 className="font-semibold text-deep-lagoon">
                {t('sources.heading')}
              </h3>
              <ul className="mt-3 space-y-2 text-ink/70">
                <li>
                  {t('sources.population')}:{' '}
                  <a
                    href="https://en.wikipedia.org/wiki/Nord-Ouest_(department)"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-coral hover:underline"
                  >
                    Wikipedia - Nord-Ouest (department)
                  </a>{' '}
                  ({t('sources.citingIHSI')})
                </li>
                <li>
                  {t('sources.calendar')}:{' '}
                  {t('sources.calendarNote')}
                </li>
              </ul>
              <p className="mt-4 text-xs italic text-ink/60">
                {t('sources.verificationNote')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
