import { getTranslations } from 'next-intl/server'
import { getPublishedUpdates } from '@/lib/data/updates'
import { type Locale } from '@/i18n/config'
import Link from 'next/link'
import type { Metadata } from 'next'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface UpdatesPageProps {
  params: Promise<{
    locale: Locale
  }>
}

export async function generateMetadata({
  params,
}: UpdatesPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'updates' })

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  }
}

export default async function UpdatesPage({ params }: UpdatesPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'updates' })

  const updates = await getPublishedUpdates(locale)

  return (
    <div className="bg-sand-paper py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="font-display text-4xl font-bold text-deep-lagoon md:text-5xl">
              {t('heading')}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-ink/70">
              {t('description')}
            </p>
          </div>

          {/* Empty State */}
          {updates.length === 0 && (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <h2 className="font-display text-2xl font-bold text-deep-lagoon">
                {t('emptyState.heading')}
              </h2>
              <p className="mt-4 text-ink/70">{t('emptyState.description')}</p>
            </div>
          )}

          {/* Updates List */}
          {updates.length > 0 && (
            <div className="space-y-8">
              {updates.map((update) => (
                <Link
                  key={update.id}
                  href={`/${locale}/updates/${update.slug}`}
                  className="block"
                >
                  <article className="group rounded-lg border-2 border-ink/10 bg-white p-6 shadow-sm transition-all hover:border-sea-green hover:shadow-md">
                    {/* Date + Category */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-ink/60">
                      {update.publishedAt && (
                        <time dateTime={update.publishedAt.toISOString()}>
                          {new Intl.DateTimeFormat(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }).format(new Date(update.publishedAt))}
                        </time>
                      )}
                      {update.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{update.category}</span>
                        </>
                      )}
                      {update.pinned && (
                        <span className="rounded-full bg-coral/10 px-2 py-0.5 text-xs font-semibold text-coral">
                          {t('pinned')}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="mt-3 font-display text-2xl font-bold text-deep-lagoon group-hover:text-sea-green">
                      {update.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="mt-4 line-clamp-3 text-ink/70">
                      {update.body.substring(0, 200)}...
                    </p>

                    {/* Read More */}
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-coral group-hover:gap-3 group-hover:text-deep-lagoon">
                      {t('readMore')}
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
