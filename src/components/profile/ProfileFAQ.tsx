import { useTranslations } from 'next-intl'
import { type PublishedFAQ } from '@/lib/data/faq'
import { type Locale } from '@/i18n/config'
import { RevealOnScroll } from '@/components/client/RevealOnScroll'

interface ProfileFAQProps {
  faqs: PublishedFAQ[]
  locale: Locale
}

export function ProfileFAQ({ faqs, locale }: ProfileFAQProps) {
  const t = useTranslations('profile.faq')
  const tReport = useTranslations('profile.reportError')

  return (
    <RevealOnScroll>
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            {t('heading')}
          </h2>

          {faqs.length === 0 ? (
            <p className="mt-6 text-ink-600">{t('noQuestions')}</p>
          ) : (
            <div className="mt-12 space-y-6">
              {faqs.map((faq, index) => (
                <RevealOnScroll key={faq.id} delay={index * 100}>
                  <details className="group rounded-xl border border-ink-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <summary className="flex cursor-pointer items-start justify-between gap-4 font-semibold text-ink-900">
                      <span className="flex-1">{faq.question}</span>
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-ink-500 transition-transform group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>

                    <div className="mt-4 space-y-4">
                      {/* Answer */}
                      <div className="prose prose-sm max-w-none text-ink-700">
                        <p>{faq.answer}</p>
                      </div>

                      {/* Sources */}
                      {faq.sources.length > 0 && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-xs font-medium text-deepLagoon-600 hover:text-deepLagoon-800">
                            {t('viewAllSources')} ({faq.sources.length})
                          </summary>
                          <div className="mt-2 space-y-2 rounded-lg bg-sandPaper-50 p-3">
                            {faq.sources.map((source) => (
                              <div key={source.id} className="text-xs">
                                {source.url ? (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-deepLagoon-700 hover:underline"
                                  >
                                    {source.title}
                                  </a>
                                ) : (
                                  <span className="font-medium text-ink-700">{source.title}</span>
                                )}
                                {source.publisher && (
                                  <p className="mt-0.5 text-ink-500">{source.publisher}</p>
                                )}
                                {source.notes && (
                                  <p className="mt-1 text-ink-600">{source.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </details>
                </RevealOnScroll>
              ))}
            </div>
          )}

          {/* Report Error Section */}
          <div
            id="report-error"
            className="mt-16 scroll-mt-20 rounded-xl border-2 border-dashed border-ink-300 bg-sandPaper-50 p-8"
          >
            <h3 className="font-display text-2xl font-bold text-ink-900">
              {tReport('heading')}
            </h3>
            <p className="mt-3 text-ink-600">{tReport('description')}</p>
            <div className="mt-6">
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com'}?subject=Factual Error Report&body=Please describe the error and provide evidence:`}
                className="inline-flex items-center gap-2 text-deepLagoon-700 hover:text-deepLagoon-900 font-medium"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {tReport('emailLink')}
              </a>
            </div>
          </div>
        </div>
      </section>
    </RevealOnScroll>
  )
}
