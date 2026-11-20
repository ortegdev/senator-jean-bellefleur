import { getTranslations } from 'next-intl/server'
import { getPublishedIssues } from '@/lib/data/issues'
import { type Locale } from '@/i18n/config'
import Link from 'next/link'
import type { Metadata } from 'next'

// Force dynamic rendering (don't generate at build time)
export const dynamic = 'force-dynamic'

interface IssuesPageProps {
  params: Promise<{
    locale: Locale
  }>
}

export async function generateMetadata({
  params,
}: IssuesPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'issues' })

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  }
}

export default async function IssuesPage({ params }: IssuesPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'issues' })

  const issues = await getPublishedIssues(locale)

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
          {issues.length === 0 && (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm">
              <svg
                className="mx-auto h-16 w-16 text-ink/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="mt-6 font-display text-2xl font-bold text-deep-lagoon">
                {t('emptyState.heading')}
              </h2>
              <p className="mt-4 text-ink/70">{t('emptyState.description')}</p>
            </div>
          )}

          {/* Issues List */}
          {issues.length > 0 && (
            <div className="space-y-6">
              {issues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/${locale}/issues/${issue.slug}`}
                  className="block"
                >
                  <div className="group rounded-lg border-2 border-ink/10 bg-white p-6 shadow-sm transition-all hover:border-sea-green hover:shadow-md">
                    {/* Title */}
                    <h2 className="font-display text-2xl font-bold text-deep-lagoon group-hover:text-sea-green">
                      {issue.title}
                    </h2>

                    {/* Attribution Badge */}
                    {issue.supporterSummary && !issue.isOfficialPosition && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-salt-gold/10 px-3 py-1 text-xs font-semibold text-salt-gold">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {t('supporterSummary')}
                      </div>
                    )}

                    {issue.isOfficialPosition && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sea-green/10 px-3 py-1 text-xs font-semibold text-sea-green">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {t('officialPosition')}
                      </div>
                    )}

                    {/* Summary */}
                    {issue.summary && (
                      <p className="mt-4 text-ink/70">{issue.summary}</p>
                    )}

                    {/* Meta */}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink/60">
                      {issue.sources.length > 0 && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          {t('sourceCount', { count: issue.sources.length })}
                        </div>
                      )}

                      {issue.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {issue.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-ink/5 px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Read More Arrow */}
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
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
