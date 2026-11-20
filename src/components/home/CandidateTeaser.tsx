import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { getCandidateConfig } from '@/lib/config/candidate'
import { Button } from '@/components/ui/Button'
import { RevealOnScroll } from '@/components/client/RevealOnScroll'

export async function CandidateTeaser() {
  const config = await getCandidateConfig()
  const t = await getTranslations('home.candidateTeaser')

  return (
    <RevealOnScroll>
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-deepLagoon-900 to-deepLagoon-700 shadow-xl">
            <div className="px-6 py-16 sm:px-16 lg:flex lg:items-center lg:justify-between">
              <div className="lg:w-0 lg:flex-1">
                <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                  {t('heading', { candidateName: config.candidateName })}
                </h2>
                <p className="mt-4 max-w-3xl text-lg text-sandPaper-100">
                  {t('placeholder')}
                </p>
              </div>
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                <Link href="/about">
                  <Button variant="secondary" size="large" className="bg-white text-deepLagoon-900 hover:bg-sandPaper-100">
                    {t('readProfile')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </RevealOnScroll>
  )
}
