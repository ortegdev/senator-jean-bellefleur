import { useTranslations } from 'next-intl'
import { getCandidateConfig } from '@/lib/config/candidate'
import { AffiliationStatus } from '@prisma/client'

export async function AffiliationStrip() {
  const t = useTranslations('affiliation')
  const config = await getCandidateConfig()

  const messages: Record<AffiliationStatus, string> = {
    INDEPENDENT: t('independent'),
    AUTHORIZED: t('authorized', { candidateName: config.candidateName }),
    COORDINATED: t('coordinated', { candidateName: config.candidateName }),
  }

  const message = config.affiliationText || messages[config.affiliationStatus]

  const bgColors: Record<AffiliationStatus, string> = {
    INDEPENDENT: 'bg-ink-100 border-ink-200',
    AUTHORIZED: 'bg-seaGreen-50 border-seaGreen-200',
    COORDINATED: 'bg-saltGold-50 border-saltGold-200',
  }

  const textColors: Record<AffiliationStatus, string> = {
    INDEPENDENT: 'text-ink-800',
    AUTHORIZED: 'text-seaGreen-900',
    COORDINATED: 'text-saltGold-900',
  }

  return (
    <div
      className={`
        border-b ${bgColors[config.affiliationStatus]}
      `}
      role="banner"
      aria-label="Affiliation disclosure"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <p className={`text-xs sm:text-sm text-center ${textColors[config.affiliationStatus]}`}>
          {message}
        </p>
      </div>
    </div>
  )
}
