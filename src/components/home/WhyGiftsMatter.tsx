'use client'
import { useTranslations } from 'next-intl'
import { RevealOnScroll } from '@/components/client/RevealOnScroll'

export function WhyGiftsMatter() {
  const t = useTranslations('home.whyGifts')

  const cards = [
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      title: t('card1Title'),
      body: t('card1Body'),
      color: 'deepLagoon',
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: t('card2Title'),
      body: t('card2Body'),
      color: 'seaGreen',
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: t('card3Title'),
      body: t('card3Body'),
      color: 'coral',
    },
  ]

  return (
    <RevealOnScroll>
      <section className="bg-sandPaper-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
              {t('heading')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600">
              {t('description')}
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {cards.map((card, index) => (
              <RevealOnScroll key={card.title} delay={index * 100}>
                <div className="group h-full rounded-xl border border-ink-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                  <div
                    className={`
                    inline-flex rounded-lg p-3 ring-4 ring-${card.color}-100
                    bg-${card.color}-600 text-white
                  `}
                  >
                    {card.icon}
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-ink-900">
                    {card.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-ink-600">{card.body}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </RevealOnScroll>
  )
}
