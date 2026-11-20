/**
 * Newsletter Signup Form
 * 
 * Collects email with explicit consent per topic
 * Double opt-in required (sends verification email)
 * NEVER pre-checks consent boxes
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ConsentCheckbox } from './ConsentCheckbox'

interface NewsletterSignupFormProps {
  locale: string
  className?: string
}

export function NewsletterSignupForm({ locale, className = '' }: NewsletterSignupFormProps) {
  const t = useTranslations('communications.newsletter')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      // Call signup API
      const response = await fetch('/api/communications/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          locale,
          consents: {
            news: formData.get('consent_email_news') === 'on',
            events: formData.get('consent_email_events') === 'on',
          },
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Signup failed')
      }
      
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  if (success) {
    return (
      <div className={`bg-sea-green/10 border border-sea-green rounded-lg p-4 ${className}`}>
        <p className="text-sm text-sea-green font-medium">
          {t('successMessage')}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          {t('checkEmailMessage')}
        </p>
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Email Field */}
      <div>
        <label htmlFor="newsletter-email" className="block text-sm font-medium text-ink dark:text-sand-paper mb-1">
          {t('emailLabel')} <span className="text-coral">*</span>
        </label>
        <input
          type="email"
          id="newsletter-email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-coral focus:border-transparent"
          placeholder="you@example.com"
        />
      </div>
      
      {/* Consent Checkboxes (NEVER pre-checked) */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink dark:text-sand-paper">
          {t('consentTitle')}
        </p>
        
        <ConsentCheckbox
          channel="EMAIL"
          topic="NEWS"
          label={t('newsConsentLabel')}
          description={t('newsConsentDescription')}
        />
        
        <ConsentCheckbox
          channel="EMAIL"
          topic="EVENTS"
          label={t('eventsConsentLabel')}
          description={t('eventsConsentDescription')}
        />
      </div>
      
      {/* Disclosure */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('disclosure')}
      </p>
      
      {/* Error Message */}
      {error && (
        <div className="bg-coral/10 border border-coral rounded-md p-3">
          <p className="text-sm text-coral">{error}</p>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-coral hover:bg-coral/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
      >
        {loading ? t('submitting') : t('submitButton')}
      </button>
    </form>
  )
}
