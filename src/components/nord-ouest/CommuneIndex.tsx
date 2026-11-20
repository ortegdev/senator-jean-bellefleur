import { useTranslations } from 'next-intl'
import { type Commune } from '@prisma/client'

interface CommuneIndexProps {
  byArrondissement: Record<string, Commune[]>
  locale: string
}

export function CommuneIndex({ byArrondissement, locale }: CommuneIndexProps) {
  const t = useTranslations('nordOuest.communeIndex')

  const arrondissements = [
    'Môle-Saint-Nicolas',
    'Port-de-Paix',
    'Saint-Louis-du-Nord',
  ]

  return (
    <div className="space-y-12">
      {arrondissements.map((arrondissement) => {
        const communes = byArrondissement[arrondissement] || []

        return (
          <div key={arrondissement}>
            <h3 className="mb-6 font-display text-2xl font-bold text-deep-lagoon">
              {t('arrondissementOf')} {arrondissement}
            </h3>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {communes.map((commune) => (
                <CommuneCard key={commune.id} commune={commune} locale={locale} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface CommuneCardProps {
  commune: Commune
  locale: string
}

function CommuneCard({ commune, locale }: CommuneCardProps) {
  const t = useTranslations('nordOuest.communeIndex')

  const hasData = commune.supporterCount > 0 || commune.population2015 !== null

  return (
    <div className="group relative overflow-hidden rounded-lg border-2 border-ink/10 bg-white p-6 shadow-sm transition-all hover:border-sea-green hover:shadow-md">
      {/* Commune Name */}
      <h4 className="font-display text-xl font-bold text-deep-lagoon">
        {commune.name}
      </h4>

      {/* Stats */}
      {hasData && (
        <div className="mt-4 space-y-3">
          {commune.supporterCount > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink/60">{t('supporters')}</span>
              <span className="text-2xl font-bold text-sea-green">
                {commune.supporterCount}
              </span>
            </div>
          )}

          {commune.population2015 !== null && (
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink/60">{t('population')}</span>
              <span className="text-lg font-semibold text-ink">
                {commune.population2015.toLocaleString(locale)}
              </span>
            </div>
          )}
        </div>
      )}

      {!hasData && (
        <div className="mt-4 text-sm text-ink/40">
          {t('noData')}
        </div>
      )}

      {/* Visual Indicator */}
      <div
        className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-sea-green to-deep-lagoon opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
    </div>
  )
}
