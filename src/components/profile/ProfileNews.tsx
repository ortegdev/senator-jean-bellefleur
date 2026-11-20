import { useTranslations } from 'next-intl'
import { formatDate, type Locale } from '@/i18n/config'
import { type PublishedContent } from '@/lib/data/content'
import { RevealOnScroll } from '@/components/client/RevealOnScroll'

interface ProfileNewsProps {
  content: PublishedContent[]
  locale: Locale
}

export function ProfileNews({ content, locale }: ProfileNewsProps) {
  const t = useTranslations('profile.news')

  if (content.length === 0) return null

  return (
    <RevealOnScroll>
      <section className="bg-sandPaper-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            {t('heading')}
          </h2>

          <div className="mt-12 space-y-8">
            {content.map((item, index) => (
              <RevealOnScroll key={item.id} delay={index * 100}>
                <article className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                  {/* Date */}
                  {item.date && (
                    <time
                      className="text-sm font-medium text-ink-500"
                      dateTime={item.date.toISOString()}
                    >
                      {formatDate(item.date, locale, 'medium')}
                    </time>
                  )}

                  {/* Content */}
                  <div className="mt-3">
                    {item.quote ? (
                      <blockquote className="border-l-4 border-deepLagoon-500 pl-4 italic text-ink-700">
                        "{item.quote}"
                      </blockquote>
                    ) : (
                      <p className="text-ink-700">{item.text}</p>
                    )}
                  </div>

                  {/* Confidence badge */}
                  <div className="mt-4">
                    <span
                      className={`
                        inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium
                        ${
                          item.confidence === 'CONFIRMED'
                            ? 'bg-seaGreen-100 text-seaGreen-800'
                            : item.confidence === 'DISPUTED_DATE'
                            ? 'bg-saltGold-100 text-saltGold-800'
                            : 'bg-deepLagoon-100 text-deepLagoon-800'
                        }
                      `}
                    >
                      {item.confidence === 'CONFIRMED' && t('confidence.confirmed')}
                      {item.confidence === 'REPORTED_SINGLE_SOURCE' &&
                        t('confidence.singleSource', { publisher: item.sources[0]?.publisher })}
                      {item.confidence === 'DISPUTED_DATE' && t('confidence.disputedDate')}
                    </span>
                  </div>

                  {/* Sources */}
                  {item.sources.length > 0 && (
                    <details className="mt-4 group">
                      <summary className="cursor-pointer text-sm font-medium text-deepLagoon-700 hover:text-deepLagoon-900">
                        {t('source')}: {item.sources[0].publisher}
                        {item.sources.length > 1 && ` +${item.sources.length - 1} more`}
                      </summary>
                      <div className="mt-3 space-y-2 rounded-lg bg-sandPaper-50 p-4">
                        {item.sources.map((source) => (
                          <div key={source.id} className="text-sm">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-deepLagoon-700 hover:underline"
                            >
                              {source.title}
                            </a>
                            <p className="mt-1 text-ink-600">
                              {source.publisher} •{' '}
                              {t('accessed', { date: formatDate(source.accessedOn, locale, 'short') })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </RevealOnScroll>
  )
}
