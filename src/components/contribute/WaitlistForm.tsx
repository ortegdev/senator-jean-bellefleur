'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CandidateConfig, LaunchMode } from '@prisma/client'
import { AffiliationBadge } from '@/components/brand/AffiliationBadge'

interface WaitlistFormProps {
  config: CandidateConfig
  mode: LaunchMode
}

export function WaitlistForm({ config, mode }: WaitlistFormProps) {
  const t = useTranslations('contribute')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [emailConsent, setEmailConsent] = useState(false)
  const [whatsappConsent, setWhatsappConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!email && !whatsapp) {
      setError(t('waitlist.errorNoContact'))
      return
    }

    if (email && !emailConsent) {
      setError(t('waitlist.errorEmailConsent'))
      return
    }

    if (whatsapp && !whatsappConsent) {
      setError(t('waitlist.errorWhatsappConsent'))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          whatsapp: whatsapp || undefined,
          emailConsent,
          whatsappConsent,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('waitlist.errorGeneric'))
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('waitlist.errorGeneric'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-sandPaper py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-seaGreen/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-seaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-ink mb-4">
              {t('waitlist.successTitle')}
            </h1>
            <p className="text-lg text-ink/70 mb-8">
              {t('waitlist.successMessage')}
            </p>
            <a
              href="/"
              className="inline-block bg-deepLagoon text-white px-6 py-3 rounded-lg hover:bg-deepLagoon/90 transition-colors"
            >
              {t('backToHome')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sandPaper py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Reduced header */}
        <header className="mb-8">
          <a href="/" className="inline-flex items-center text-deepLagoon hover:text-seaGreen transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('backToHome')}
          </a>
        </header>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="font-display text-3xl sm:text-4xl text-ink mb-4">
            {t('waitlist.title')}
          </h1>
          
          <p className="text-lg text-ink/80 mb-8">
            {t('waitlist.description', { candidateName: config.candidateName })}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
                {t('waitlist.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('waitlist.emailPlaceholder')}
                className="w-full h-12 px-4 border border-deepLagoon-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-seaGreen/30 focus:border-seaGreen"
                autoComplete="email"
              />
              {email && (
                <label className="flex items-start mt-3">
                  <input
                    type="checkbox"
                    checked={emailConsent}
                    onChange={(e) => setEmailConsent(e.target.checked)}
                    className="mt-1 mr-3 w-5 h-5 text-seaGreen border-deepLagoon-300 rounded focus:ring-seaGreen"
                  />
                  <span className="text-sm text-ink/70">
                    {t('waitlist.emailConsent')}
                  </span>
                </label>
              )}
            </div>

            {/* WhatsApp field */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-ink mb-2">
                {t('waitlist.whatsappLabel')}
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={t('waitlist.whatsappPlaceholder')}
                className="w-full h-12 px-4 border border-deepLagoon-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-seaGreen/30 focus:border-seaGreen"
                autoComplete="tel"
              />
              {whatsapp && (
                <label className="flex items-start mt-3">
                  <input
                    type="checkbox"
                    checked={whatsappConsent}
                    onChange={(e) => setWhatsappConsent(e.target.checked)}
                    className="mt-1 mr-3 w-5 h-5 text-seaGreen border-deepLagoon-300 rounded focus:ring-seaGreen"
                  />
                  <span className="text-sm text-ink/70">
                    {t('waitlist.whatsappConsent')}
                  </span>
                </label>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-coral/10 border border-coral/30 rounded-lg p-4 text-coral">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || (!email && !whatsapp)}
              className="w-full h-12 bg-coral text-white rounded-lg font-medium hover:bg-coral/90-500/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('waitlist.submitting') : t('waitlist.submit')}
            </button>
          </form>

          {/* Affiliation disclosure */}
          <div className="mt-8 pt-6 border-t border-deepLagoon-200">
            <AffiliationBadge
              status={config.affiliationStatus}
              text={config.affiliationText}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
