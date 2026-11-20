import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { getCandidateConfig } from '@/lib/config/candidate'
import { getCurrentMode } from '@/lib/launch-gate/mode'
import { Button } from '@/components/ui/Button'
import { CoastlineConstellation } from '@/components/design/CoastlineConstellation'
import { RevealOnScroll } from '@/components/client/RevealOnScroll'
import { LaunchMode } from '@prisma/client'

export async function SignupBlock() {
  const config = await getCandidateConfig()
  const mode = await getCurrentMode()
  const t = useTranslations('home.signup')

  const content: Record<LaunchMode, { heading: string; description: string; cta: string; href: string }> = {
    INFO_ONLY: {
      heading: t('headingInfoOnly'),
      description: t('descriptionInfoOnly'),
      cta: t('ctaInfoOnly', { candidateName: config.candidateName }),
      href: '/about',
    },
    WAITLIST: {
      heading: t('headingWaitlist'),
      description: t('descriptionWaitlist'),
      cta: t('ctaWaitlist'),
      href: '/get-involved',
    },
    DONATIONS_LIVE: {
      heading: t('headingDonationsLive'),
      description: t('descriptionDonationsLive'),
      cta: t('ctaDonationsLive'),
      href: '/contribute',
    },
  }

  const { heading, description, cta, href } = content[mode]

  return (
    <RevealOnScroll>
      <section className="relative overflow-hidden bg-gradient-to-br from-deepLagoon-900 via-deepLagoon-800 to-deepLagoon-900 py-20">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <CoastlineConstellation variant="horizontal" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {heading}
          </h2>
          <p className="mt-6 text-xl text-sandPaper-100">{description}</p>

          <div className="mt-10">
            <Link href={href}>
              <Button
                variant="primary"
                size="large"
                className="bg-coral-500 text-white hover:bg-coral-600 shadow-xl"
              >
                {cta}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </RevealOnScroll>
  )
}
