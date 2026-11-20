import { useTranslations } from 'next-intl'
import { CandidateConfig } from '@prisma/client'

interface ContributeHeaderProps {
  config: CandidateConfig
  onBack?: () => void
}

export function ContributeHeader({ config, onBack }: ContributeHeaderProps) {
  const t = useTranslations('contribute')

  return (
    <header className="bg-white border-b border-deepLagoon-200 py-4">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo/wordmark */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-deepLagoon hover:text-seaGreen transition-colors p-2 -ml-2"
              aria-label={t('back')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <a href="/" className="font-display text-lg text-deepLagoon hover:text-seaGreen transition-colors">
            Diaspora4Bellefleur
          </a>
        </div>

        {/* Secure payment indicator */}
        <div className="flex items-center gap-2 text-sm text-ink/60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="hidden sm:inline">{t('securePayment')}</span>
        </div>
      </div>
    </header>
  )
}
