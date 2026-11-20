import { useTranslations } from 'next-intl'
import { CandidateConfig } from '@prisma/client'
import { AffiliationBadge } from '@/components/brand/AffiliationBadge'

interface InfoOnlyPanelProps {
  config: CandidateConfig
}

export function InfoOnlyPanel({ config }: InfoOnlyPanelProps) {
  const t = useTranslations('contribute')

  return (
    <div className="min-h-screen bg-sandPaper-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Reduced header */}
        <header className="mb-8">
          <a href="/" className="inline-flex items-center text-deepLagoon hover:text-seaGreen transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('backToHome')}
          </a>
        </header>

        {/* Info panel */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="font-display text-3xl sm:text-4xl text-ink mb-4">
            {t('infoOnly.title')}
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-ink/80 mb-6">
              {t('infoOnly.description', { candidateName: config.candidateName })}
            </p>

            <div className="bg-sandPaper rounded-lg p-6 mb-6">
              <h2 className="font-display text-xl text-ink mb-3">
                {t('infoOnly.statusHeading')}
              </h2>
              <p className="text-ink/70">
                {t('infoOnly.statusMessage')}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="font-display text-lg text-ink">
                {t('infoOnly.learnMoreHeading')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="/bellefleur" className="text-seaGreen hover:text-deepLagoon transition-colors">
                    {t('infoOnly.linkProfile')}
                  </a>
                </li>
                <li>
                  <a href="/nord-ouest" className="text-seaGreen hover:text-deepLagoon transition-colors">
                    {t('infoOnly.linkDepartment')}
                  </a>
                </li>
                <li>
                  <a href="/issues" className="text-seaGreen hover:text-deepLagoon transition-colors">
                    {t('infoOnly.linkIssues')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Affiliation disclosure */}
          <div className="mt-8 pt-6 border-t border-deepLagoon-200">
            <AffiliationBadge
              status={config.affiliationStatus}
              text={config.affiliationText}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
