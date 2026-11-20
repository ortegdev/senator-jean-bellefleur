'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/Button'
import { RevealOnScroll } from '@/components/client/RevealOnScroll'

export function FAQPreview() {
  const t = useTranslations('home.faq')

  const faqs = [
    {
      question: t('question1'),
      answer: t('answer1'),
    },
    {
      question: t('question2'),
      answer: t('answer2'),
    },
    {
      question: t('question3'),
      answer: t('answer3'),
    },
  ]

  return (
    <RevealOnScroll>
      <section className="bg-sandPaper-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
              {t('heading')}
            </h2>
          </div>

          <div className="mt-12 space-y-6">
            {faqs.map((faq, index) => (
              <RevealOnScroll key={faq.question} delay={index * 100}>
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
                  <p className="mt-4 leading-relaxed text-ink-600">{faq.answer}</p>
                </details>
              </RevealOnScroll>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/faq">
              <Button variant="secondary" size="medium">
                {t('viewAll')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </RevealOnScroll>
  )
}
