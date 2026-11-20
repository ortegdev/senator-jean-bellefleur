import { useTranslations } from 'next-intl'
import { RevealOnScroll } from '@/components/client/RevealOnScroll'

export function HowItWorks() {
  const t = useTranslations('home.howItWorks')

  const steps = [
    {
      number: '1',
      title: t('step1Title'),
      body: t('step1Body'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      number: '2',
      title: t('step2Title'),
      body: t('step2Body'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      number: '3',
      title: t('step3Title'),
      body: t('step3Body'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
    },
  ]

  return (
    <RevealOnScroll>
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
              {t('heading')}
            </h2>
          </div>

          <div className="mt-16">
            <div className="relative">
              {/* Connection line (hidden on mobile) */}
              <div
                className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-deepLagoon-200 via-seaGreen-200 to-coral-200 lg:block"
                aria-hidden="true"
              />

              {/* Steps */}
              <div className="space-y-12 lg:space-y-24">
                {steps.map((step, index) => (
                  <RevealOnScroll key={step.number} delay={index * 150}>
                    <div
                      className={`
                      relative flex flex-col items-center gap-6
                      lg:flex-row lg:gap-12
                      ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}
                    `}
                    >
                      {/* Content */}
                      <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center rounded-full bg-deepLagoon-100 p-3 text-deepLagoon-700">
                          {step.icon}
                        </div>
                        <h3 className="mt-4 font-display text-2xl font-bold text-ink-900">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-lg text-ink-600">{step.body}</p>
                      </div>

                      {/* Step number */}
                      <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-deepLagoon-600 to-deepLagoon-800 font-display text-3xl font-bold text-white shadow-lg ring-4 ring-white lg:h-20 lg:w-20 lg:text-4xl">
                        {step.number}
                      </div>

                      {/* Spacer for other side */}
                      <div className="hidden flex-1 lg:block" />
                    </div>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </RevealOnScroll>
  )
}
