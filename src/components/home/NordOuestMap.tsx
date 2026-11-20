'use client'
import { useTranslations } from 'next-intl'
import { getCommuneSupporters } from '@/lib/data/contributions'

// 10 communes of Nord-Ouest department
const COMMUNES = [
  'Port-de-Paix',
  'Saint-Louis du Nord',
  'Anse-à-Foleur',
  'Bassin-Bleu',
  'Chansolme',
  'Tortue (Île de la Tortue)',
  'Jean-Rabel',
  'Môle-Saint-Nicolas',
  'Baie-de-Henne',
  'Bombardopolis',
]

export async function NordOuestMap() {
  const t = useTranslations('home.rootsMap')
  const supporters = await getCommuneSupporters()

  const hasData = supporters.length > 0
  const maxCount = hasData ? Math.max(...supporters.map((s) => s.count)) : 0

  // Get count for a commune
  const getCount = (commune: string): number => {
    const found = supporters.find((s) => s.commune === commune)
    return found ? found.count : 0
  }

  // Calculate fill opacity based on supporter count (0.1 to 1.0)
  const getOpacity = (commune: string): number => {
    if (!hasData) return 0.1
    const count = getCount(commune)
    if (count === 0) return 0.1
    return 0.2 + (count / maxCount) * 0.8
  }

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="mt-4 text-lg text-ink-600">{t('description')}</p>
        </div>

        <div className="mt-12">
          {hasData ? (
            <div className="space-y-8">
              {/* Simple list view - accessible and works without complex SVG */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {COMMUNES.map((commune) => {
                  const count = getCount(commune)
                  const opacity = getOpacity(commune)

                  return (
                    <div
                      key={commune}
                      className="rounded-lg border border-ink-200 p-4 transition-all hover:border-deepLagoon-400"
                      style={{
                        backgroundColor: `rgba(15, 61, 74, ${opacity})`,
                        color: opacity > 0.5 ? 'white' : 'inherit',
                      }}
                    >
                      <h3 className="font-semibold">{commune}</h3>
                      {count > 0 && (
                        <p className="mt-1 text-sm" style={{ opacity: 0.9 }}>
                          {t('supportersFrom', { count, commune })}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-sm text-ink-600">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: 'rgba(15, 61, 74, 0.2)' }}
                  />
                  <span>Few</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: 'rgba(15, 61, 74, 0.6)' }}
                  />
                  <span>Some</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: 'rgba(15, 61, 74, 1.0)' }}
                  />
                  <span>Many</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-ink-200 bg-sandPaper-50 py-16 text-center">
              <svg
                className="mx-auto h-12 w-12 text-ink-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="mt-4 text-base text-ink-600">{t('noData')}</p>
              <p className="mt-2 text-sm text-ink-500">
                {/* List of 10 communes for reference */}
                {COMMUNES.join(' • ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
