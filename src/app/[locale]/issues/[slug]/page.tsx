import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getIssueBySlug } from '@/lib/data/issues'
import { type Locale } from '@/i18n/config'
import Link from 'next/link'
import type { Metadata } from 'next'

interface IssuePageProps {
  params: Promise<{
    locale: Locale
    slug: string
  }>
}

export async function generateMetadata({
  params,
}: IssuePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const issue = await getIssueBySlug(slug, locale)

  if (!issue) {
    return {
      title: 'Issue Not Found',
    }
  }

  return {
    title: issue.title,
    description: issue.summary || undefined,
  }
}

export default async function IssuePage({ params }: IssuePageProps) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'issues' })

  const issue = await getIssueBySlug(slug, locale)

  if (!issue) {
    notFound()
  }

  return (
    <div className="bg-sand-paper py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          {/* Back Link */}
          <Link
            href={`/${locale}/issues`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-coral hover:text-deep-lagoon"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('backToIssues')}
          </Link>

          {/* Header */}
          <div className="mt-8">
            <h1 className="font-display text-4xl font-bold text-deep-lagoon md:text-5xl">
              {issue.title}
            </h1>

            {/* Attribution Badge */}
            <div className="mt-6">
              {issue.supporterSummary && !issue.isOfficialPosition && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-salt-gold/10 p-4">
                  <svg
                    className="h-5 w-5 shrink-0 text-salt-gold"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm">
                    <div className="font-semibold text-ink">
                      {t('supporterSummaryLabel')}
                    </div>
                    <div className="text-xs text-ink/70">
                      {t('supporterSummaryNote')}
                    </div>
                  </div>
                </div>
              )}

              {issue.isOfficialPosition && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-sea-green/10 p-4">
                  <svg
                    className="h-5 w-5 shrink-0 text-sea-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm">
                    <div className="font-semibold text-sea-green">
                      {t('officialPositionLabel')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            {issue.summary && (
              <p className="mt-6 text-xl leading-relaxed text-ink/80">
                {issue.summary}
              </p>
            )}
          </div>

          {/* Body */}
          {issue.body && (
            <div className="prose prose-lg mt-12 max-w-none">
              {/* Simple markdown-like rendering - paragraphs split by double newlines */}
              {issue.body.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4 leading-relaxed text-ink">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* Sources */}
          {issue.sources.length > 0 && (
            <div className="mt-12 rounded-lg border-2 border-deep-lagoon/10 bg-white p-6">
              <h2 className="font-display text-2xl font-bold text-deep-lagoon">
                {t('sources')}
              </h2>
              <ul className="mt-4 space-y-3">
                {issue.sources.map((source) => (
                  <li key={source.id} className="text-sm">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 text-coral hover:text-deep-lagoon"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <div>
                        <div className="font-semibold group-hover:underline">
                          {source.title}
                        </div>
                        {source.publisher && (
                          <div className="text-ink/60">{source.publisher}</div>
                        )}
                        {source.date && (
                          <div className="text-xs text-ink/50">
                            {new Intl.DateTimeFormat(locale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }).format(new Date(source.date))}
                          </div>
                        )}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {issue.tags.length > 0 && (
            <div className="mt-8">
              <div className="flex flex-wrap gap-2">
                {issue.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-ink/10 px-3 py-1 text-sm text-ink/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
