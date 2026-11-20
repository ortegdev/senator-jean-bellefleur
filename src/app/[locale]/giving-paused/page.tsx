import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/Button'
import { CoastlineConstellation } from '@/components/design/CoastlineConstellation'
import { Header } from '@/components/layout/Header'
import { AffiliationStrip } from '@/components/layout/AffiliationStrip'
import { Footer } from '@/components/layout/Footer'

export default function GivingPausedPage() {
  const t = useTranslations('errors')

  return (
    <>
      <Header />
      <AffiliationStrip />
      
      <div className="min-h-[calc(100vh-16rem)] bg-sandPaper-50 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
          <CoastlineConstellation variant="circular" />
        </div>

        <div className="relative max-w-md w-full text-center space-y-6">
          {/* Pause Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-saltGold-100 p-4">
              <svg
                className="h-12 w-12 text-saltGold-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-ink-900">
              {t('givingPausedTitle')}
            </h1>
            <p className="text-base text-ink-600">
              {t('givingPausedDescription')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/">
              <Button variant="primary" size="medium">
                {t('returnHome')}
              </Button>
            </Link>
            <Link href="/get-involved">
              <Button variant="secondary" size="medium">
                {t('checkStatus')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
