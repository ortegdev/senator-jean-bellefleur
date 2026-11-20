import { useTranslations } from 'next-intl'
import { formatDate, type Locale } from '@/i18n/config'
import { type PublishedContent } from '@/lib/data/content'
import { RevealOnScroll } from '@/components/client/RevealOnScroll'

interface ProfileJourneyProps {
  biography: PublishedContent[]
  education: PublishedContent[]
  profession: PublishedContent[]
  publicService: PublishedContent[]
  locale: Locale
}

export function ProfileJourney({
  biography,
  education,
  profession,
  publicService,
  locale,
}: ProfileJourneyProps) {
  const t = useTranslations('profile.journey')

  const sections = [
    { key: 'biography', title: t('biography'), content: biography },
    { key: 'education', title: t('education'), content: education },
    { key: 'profession', title: t('profession'), content: profession },
    { key: 'publicService', title: t('publicService'), content: publicService },
  ].filter((section) => section.content.length > 0)

  if (sections.length === 0) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="mt-6 text-ink-600">{t('noContent')}</p>
        </div>
      </section>
    )
  }

  return (
    <RevealOnScroll>
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            {t('heading')}
          </h2>

          <div className="mt-12 space-y-12">
            {sections.map((section, sectionIndex) => (
              <RevealOnScroll key={section.key} delay={sectionIndex * 150}>
                <div>
                  <h3 className="font-display text-2xl font-bold text-ink-900">
                    {section.title}
                  </h3>

                  <div className="mt-6 space-y-6">
                    {section.content.map((item) => (
                      <div key={item.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:h-3 before:w-3 before:rounded-full before:bg-deepLagoon-500">
                        {/* Date if available */}
                        {item.date && (
                          <p className="text-sm font-medium text-ink-500">
                            {formatDate(item.date, locale, item.datePrecision === 'YEAR' ? 'short' : 'medium')}
                          </p>
                        )}

                        {/* Content */}
                        <div className="mt-2 prose prose-sm max-w-none text-ink-700">
                          {item.quote ? (
                            <blockquote className="border-l-4 border-deepLagoon-300 pl-4 italic">
                              "{item.quote}"
                            </blockquote>
                          ) : (
                            <p>{item.text}</p>
                          )}
                        </div>

                        {/* Sources */}
                        {item.sources.length > 0 && (
                          <details className="mt-3 group">
                            <summary className="cursor-pointer text-xs font-medium text-deepLagoon-600 hover:text-deepLagoon-800">
                              {t('sources')} ({item.sources.length})
                            </summary>
                            <div className="mt-2 space-y-2 rounded-lg bg-sandPaper-50 p-3">
                              {item.sources.map((source) => (
                                <div key={source.id} className="text-xs">
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-deepLagoon-700 hover:underline"
                                  >
                                    {source.title}
                                  </a>
                                  <p className="mt-0.5 text-ink-500">{source.publisher}</p>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </RevealOnScroll>
  )
}
