import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { type PublishedContent } from '@/lib/data/content'

interface HisJourneyProps {
  entries: PublishedContent[]
  locale: string
}

type CategoryFilter = 'all' | 'education' | 'career' | 'civic' | 'elections' | 'candidacy'

const CATEGORY_MAP: Record<string, CategoryFilter> = {
  EDUCATION: 'education',
  PROFESSION: 'career',
  PUBLIC_SERVICE: 'civic',
  PARTY_AFFILIATION: 'elections',
  CEP_REGISTRATION: 'candidacy',
}

function getCategoryForEntry(entry: PublishedContent): CategoryFilter {
  return CATEGORY_MAP[entry.category] || 'all'
}

function formatEntryDate(
  entry: PublishedContent,
  locale: string,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  if (!entry.date) return t('dateUnknown')

  const date = new Date(entry.date)

  switch (entry.datePrecision) {
    case 'EXACT':
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date)
    case 'MONTH':
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
      }).format(date)
    case 'YEAR':
      return date.getFullYear().toString()
    case 'UNKNOWN':
    default:
      return t('dateUnknown')
  }
}

function CoastlineSpine() {
  return (
    <svg
      className="absolute left-0 top-0 h-full w-12 -translate-x-1/2"
      viewBox="0 0 48 400"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spine-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1F8A70" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#0F3D4A" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1F8A70" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Vertical line */}
      <line
        x1="24"
        y1="0"
        x2="24"
        y2="400"
        stroke="url(#spine-gradient)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      {/* Decorative dots */}
      {[0, 25, 50, 75, 100].map((percent) => (
        <circle
          key={percent}
          cx="24"
          cy={`${percent}%`}
          r="3"
          fill="#1F8A70"
          opacity="0.4"
        />
      ))}
    </svg>
  )
}

function CitationMarker({ number }: { number: number }) {
  return (
    <sup className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-deep-lagoon text-xs font-semibold text-sand-paper">
      {number}
    </sup>
  )
}

interface SourceItemProps {
  source: PublishedContent['sources'][0]
  number: number
  locale: string
  t: (key: string) => string
}

function SourceItem({ source, number, locale, t }: SourceItemProps) {
  const accessedDate = source.accessedOn
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(source.accessedOn))
    : null

  const languageBadge = source.language ? (
    <span className="inline-flex items-center rounded-full bg-sea-green/10 px-2 py-0.5 text-xs font-medium text-sea-green">
      {source.language.toUpperCase()}
    </span>
  ) : null

  return (
    <li className="text-sm">
      <div className="flex items-start gap-2">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-deep-lagoon text-xs font-semibold text-sand-paper">
          {number}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {source.publisher && (
              <span className="font-semibold text-ink">
                {source.publisher}
              </span>
            )}
            {languageBadge}
          </div>
          {source.title && (
            <div className="mt-0.5 text-ink/80">{source.title}</div>
          )}
          {accessedDate && (
            <div className="mt-0.5 text-ink/60">
              {t('accessed')} {accessedDate}
            </div>
          )}
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-coral hover:underline"
            >
              {t('viewSource')}
              <svg
                className="h-3 w-3"
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
            </a>
          )}
        </div>
      </div>
    </li>
  )
}

interface TimelineEntryProps {
  entry: PublishedContent
  locale: string
  t: (key: string, values?: Record<string, string | number>) => string
}

function TimelineEntry({ entry, locale, t }: TimelineEntryProps) {
  const text = entry.text // Already localized by getPublishedContent
  const dateDisplay = formatEntryDate(entry, locale, t)
  const hasSources = entry.sources.length > 0

  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div className="absolute left-0 top-2 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-sand-paper bg-sea-green" />

      <div className="pb-12">
        {/* Date */}
        <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-deep-lagoon">
          {dateDisplay}
        </div>

        {/* Content */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <p className="text-base leading-relaxed text-ink">
            {text}
            {hasSources &&
              entry.sources.map((_, idx) => (
                <CitationMarker key={idx} number={idx + 1} />
              ))}
          </p>

          {/* Confidence indicator for non-confirmed entries */}
          {entry.confidence !== 'CONFIRMED' && (
            <div className="mt-3 text-xs text-ink/60">
              {entry.confidence === 'REPORTED_SINGLE_SOURCE' &&
                t('singleSourceNote')}
              {entry.confidence === 'DISPUTED_DATE' && t('disputedDateNote')}
            </div>
          )}

          {/* Sources */}
          {hasSources && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-deep-lagoon hover:text-coral">
                {t('sources')} ({entry.sources.length})
              </summary>
              <ul className="mt-3 space-y-3 border-t border-ink/10 pt-3">
                {entry.sources.map((source, idx) => (
                  <SourceItem
                    key={source.id}
                    source={source}
                    number={idx + 1}
                    locale={locale}
                    t={t}
                  />
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function HisJourney({
  entries,
  locale,
}: HisJourneyProps) {
  const t = await getTranslations({ locale, namespace: 'profile.journey' })

  // All entries should be PUBLISHED (filtered by query), but double-check
  const publishedEntries = entries.filter((e) => e.confidence !== undefined)

  // Already sorted chronologically by getPublishedContent
  const sortedEntries = publishedEntries

  if (sortedEntries.length === 0) {
    return (
      <section className="py-16" id="journey">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-deep-lagoon md:text-4xl">
              {t('heading')}
            </h2>
            <p className="mt-4 text-ink/70">{t('noEntries')}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16" id="journey">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-deep-lagoon md:text-4xl">
            {t('heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink/70">
            {t('subtitle')}
          </p>
        </div>

        {/* Category Filters - Client Component will be added in next iteration */}
        <div className="mb-8 text-center">
          <p className="text-sm text-ink/60">{t('filterPlaceholder')}</p>
        </div>

        {/* Timeline */}
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            {/* Constellation Spine */}
            <CoastlineSpine />

            {/* Entries */}
            <div>
              {sortedEntries.map((entry) => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Verification Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-ink/60">{t('verificationNote')}</p>
        </div>
      </div>
    </section>
  )
}
