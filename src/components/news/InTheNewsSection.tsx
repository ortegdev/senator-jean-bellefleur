import { getTranslations } from 'next-intl/server'
import { getTickerArticles } from '@/lib/data/news'
import { NewsTicker } from './NewsTicker'
import { type Locale } from '@/i18n/config'

interface InTheNewsSectionProps {
  locale: Locale
}

export async function InTheNewsSection({ locale }: InTheNewsSectionProps) {
  const t = await getTranslations({ locale, namespace: 'news' })

  // Fetch ticker articles
  const articles = await getTickerArticles(
    parseInt(process.env.NEWS_TICKER_MAX_ITEMS || '8', 10)
  )

  // Hide section if no articles (Principle 5)
  if (articles.length === 0) {
    return null
  }

  // Convert Date objects for client component
  const clientArticles = articles.map((article) => ({
    ...article,
    publishedAt: article.publishedAt,
  }))

  return (
    <section className="py-12" id="in-the-news">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-bold text-deep-lagoon md:text-4xl">
            {t('heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-ink/70">
            {t('framingText')}
          </p>
        </div>

        {/* Breaking News Ticker */}
        <div className="mb-8">
          <NewsTicker
            articles={clientArticles}
            locale={locale}
            intervalMs={
              parseInt(process.env.NEWS_TICKER_INTERVAL_MS || '5000', 10)
            }
          />
        </div>

        {/* "How We Choose" collapsible panel */}
        <details className="mx-auto max-w-3xl">
          <summary className="cursor-pointer rounded-lg bg-sand-paper p-4 text-center font-semibold text-deep-lagoon hover:bg-sand-paper/70">
            {t('howWeChoose.heading')}
          </summary>
          <div className="mt-4 rounded-lg border-2 border-sand-paper bg-white p-6">
            <div className="prose prose-sm max-w-none">
              <p>{t('howWeChoose.paragraph1')}</p>
              <p className="mt-4">{t('howWeChoose.paragraph2')}</p>
              <p className="mt-4">{t('howWeChoose.paragraph3')}</p>

              {/* Action links */}
              <ul className="mt-6 space-y-2">
                <li>
                  <a
                    href={`/${locale}/suggest-article`}
                    className="text-coral hover:underline"
                  >
                    {t('howWeChoose.suggestArticle')}
                  </a>
                </li>
                <li>
                  <a
                    href={`/${locale}/contact?subject=news-error`}
                    className="text-coral hover:underline"
                  >
                    {t('howWeChoose.reportError')}
                  </a>
                </li>
                <li>
                  <a
                    href={`/${locale}/contact?subject=removal-request`}
                    className="text-coral hover:underline"
                  >
                    {t('howWeChoose.requestRemoval')}
                  </a>
                </li>
              </ul>

              {/* GDELT attribution */}
              <p className="mt-6 text-xs text-ink/60">
                {t('howWeChoose.gdeltNote')}{' '}
                <a
                  href="https://www.gdeltproject.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coral hover:underline"
                >
                  gdeltproject.org
                </a>
              </p>
            </div>
          </div>
        </details>
      </div>
    </section>
  )
}
