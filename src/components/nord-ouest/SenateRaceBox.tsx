import { useTranslations } from 'next-intl'
import { type CandidateConfig } from '@prisma/client'

interface SenateRaceBoxProps {
  config: CandidateConfig
  locale: string
}

export function SenateRaceBox({ config, locale }: SenateRaceBoxProps) {
  const t = useTranslations('nordOuest.senateRace')

  const formatDate = (date: Date | null) => {
    if (!date) return null
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  const firstRound = formatDate(config.firstRoundDate)
  const secondRound = formatDate(config.secondRoundDate)
  const campaignStart = formatDate(config.officialCampaignStart)

  const hasDates = firstRound || secondRound || campaignStart

  return (
    <div className="rounded-lg border-2 border-deep-lagoon/20 bg-white p-8 shadow-md">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-deep-lagoon text-sand-paper"
          aria-hidden="true"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-display text-2xl font-bold text-deep-lagoon">
            {t('heading')}
          </h3>

          {hasDates ? (
            <div className="mt-6 space-y-4">
              {firstRound && (
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-ink/60">
                    {t('firstRound')}
                  </div>
                  <div className="mt-1 text-lg font-bold text-deep-lagoon">
                    {firstRound}
                  </div>
                  {config.firstRoundDateNote && (
                    <div className="mt-1 text-xs text-ink/60">
                      {config.firstRoundDateNote}
                    </div>
                  )}
                </div>
              )}

              {secondRound && (
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-ink/60">
                    {t('secondRound')}
                  </div>
                  <div className="mt-1 text-lg font-bold text-deep-lagoon">
                    {secondRound}
                  </div>
                  {config.secondRoundDateNote && (
                    <div className="mt-1 text-xs text-ink/60">
                      {config.secondRoundDateNote}
                    </div>
                  )}
                </div>
              )}

              {campaignStart && (
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-ink/60">
                    {t('campaignStart')}
                  </div>
                  <div className="mt-1 text-lg font-bold text-deep-lagoon">
                    {campaignStart}
                  </div>
                </div>
              )}

              {/* Verification Note */}
              <div className="mt-6 rounded-md bg-salt-gold/10 p-4 text-sm">
                <div className="flex gap-2">
                  <svg
                    className="h-5 w-5 shrink-0 text-salt-gold"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold text-ink">
                      {t('reportedDates')}
                    </div>
                    <div className="mt-1 text-xs text-ink/70">
                      {t('reportedDatesNote')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-ink/70">{t('noDates')}</p>
          )}

          {/* Note about seats */}
          <div className="mt-6 border-t border-ink/10 pt-6 text-sm text-ink/60">
            {t('seatsNote')}
          </div>
        </div>
      </div>
    </div>
  )
}
