import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/Button'
import { CoastlineConstellation } from '@/components/design/CoastlineConstellation'

export default function NotFound() {
  const t = useTranslations('errors')

  return (
    <div className="min-h-screen bg-sandPaper-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
        <CoastlineConstellation variant="circular" />
      </div>

      <div className="relative max-w-md w-full text-center space-y-6">
        {/* 404 */}
        <div className="space-y-2">
          <p className="text-6xl font-bold text-deepLagoon-900">404</p>
          <h1 className="text-2xl font-bold text-ink-900">
            {t('pageNotFound')}
          </h1>
          <p className="text-base text-ink-600">
            {t('pageNotFoundDescription')}
          </p>
        </div>

        {/* Action */}
        <div className="pt-4">
          <Link href="/">
            <Button variant="primary" size="medium">
              {t('returnHome')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
