'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CandidateConfig } from '@prisma/client'
import { ContributionData } from '../ContributeFlow'

interface DetailsStepProps {
  config: CandidateConfig
  initialData: Partial<ContributionData>
  onComplete: (data: Partial<ContributionData>) => void
  onBack: () => void
}

// 10 communes of Nord-Ouest
const COMMUNES = [
  'Port-de-Paix',
  'Môle-Saint-Nicolas',
  'Jean-Rabel',
  'Bombardopolis',
  'Bassin-Bleu',
  'Chansolme',
  'Anse-à-Foleur',
  'Saint-Louis-du-Nord',
  'La Tortue',
  'Baie-de-Henne',
]

const LANGUAGES = [
  { code: 'ht', label: 'Kreyòl' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
]

export function DetailsStep({ config, initialData, onComplete, onBack }: DetailsStepProps) {
  const t = useTranslations('contribute.details')

  const [firstName, setFirstName] = useState(initialData.firstName || '')
  const [lastName, setLastName] = useState(initialData.lastName || '')
  const [email, setEmail] = useState(initialData.email || '')
  const [country, setCountry] = useState(initialData.country || '')
  const [communeOfOrigin, setCommuneOfOrigin] = useState(initialData.communeOfOrigin || '')
  const [preferredLanguage, setPreferredLanguage] = useState(initialData.preferredLanguage || 'ht')
  const [isAnonymous, setIsAnonymous] = useState(initialData.isAnonymous ?? true)
  const [dedication, setDedication] = useState(initialData.dedication || '')
  
  // Eligibility attestations (Prompt 11)
  const [eligibilityAttestations, setEligibilityAttestations] = useState(
    initialData.eligibilityAttestations || {}
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleAttestationChange = (key: string, checked: boolean) => {
    setEligibilityAttestations((prev) => ({ ...prev, [key]: checked }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[key]
      return newErrors
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!firstName.trim()) newErrors.firstName = t('errorRequired')
    if (!lastName.trim()) newErrors.lastName = t('errorRequired')
    if (!email.trim()) newErrors.email = t('errorRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('errorInvalidEmail')
    }
    if (!country.trim()) newErrors.country = t('errorRequired')

    // Eligibility attestations (all required)
    const requiredAttestations = ['ageConfirm', 'legalConfirm', 'foreignAgentConfirm']
    requiredAttestations.forEach((key) => {
      if (!eligibilityAttestations[key]) {
        newErrors[key] = t('errorAttestation')
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (!validateForm()) {
      // Focus on first error
      const firstError = Object.keys(errors)[0]
      const element = document.getElementById(firstError)
      element?.focus()
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    onComplete({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      country: country.trim(),
      communeOfOrigin: communeOfOrigin || undefined,
      preferredLanguage,
      isAnonymous,
      dedication: dedication.trim() || undefined,
      eligibilityAttestations,
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
      <h2 className="font-display text-2xl sm:text-3xl text-ink mb-6">
        {t('title')}
      </h2>

      <form className="space-y-6">
        {/* Name fields (grouped) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-ink mb-2">
              {t('firstName')} <span className="text-coral">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-seaGreen/30 focus:border-seaGreen ${
                errors.firstName ? 'border-coral' : 'border-deepLagoon-300'
              }`}
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <p id="firstName-error" className="mt-1 text-sm text-coral">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-ink mb-2">
              {t('lastName')} <span className="text-coral">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-seaGreen/30 focus:border-seaGreen ${
                errors.lastName ? 'border-coral' : 'border-deepLagoon-300'
              }`}
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="mt-1 text-sm text-coral">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
            {t('email')} <span className="text-coral">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-seaGreen/30 focus:border-seaGreen ${
              errors.email ? 'border-coral' : 'border-deepLagoon-300'
            }`}
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-coral">
              {errors.email}
            </p>
          )}
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-ink mb-2">
            {t('country')} <span className="text-coral">*</span>
          </label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder={t('countryPlaceholder')}
            className={`w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-seaGreen/30 focus:border-seaGreen ${
              errors.country ? 'border-coral' : 'border-deepLagoon-300'
            }`}
            autoComplete="country-name"
            aria-invalid={!!errors.country}
            aria-describedby={errors.country ? 'country-error' : undefined}
          />
          {errors.country && (
            <p id="country-error" className="mt-1 text-sm text-coral">
              {errors.country}
            </p>
          )}
        </div>

        {/* Commune of origin (optional select) */}
        <div>
          <label htmlFor="communeOfOrigin" className="block text-sm font-medium text-ink mb-2">
            {t('communeOfOrigin')} <span className="text-ink/50 text-xs">{t('optional')}</span>
          </label>
          <select
            id="communeOfOrigin"
            value={communeOfOrigin}
            onChange={(e) => setCommuneOfOrigin(e.target.value)}
            className="w-full h-12 px-4 border border-deepLagoon-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-seaGreen/30 focus:border-seaGreen"
          >
            <option value="">{t('communeSelect')}</option>
            {COMMUNES.map((commune) => (
              <option key={commune} value={commune}>
                {commune}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink/50">{t('communeNote')}</p>
        </div>

        {/* Preferred language (chips) */}
        <div>
          <label className="block text-sm font-medium text-ink mb-3">
            {t('preferredLanguage')}
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setPreferredLanguage(lang.code)}
                className={`
                  px-4 py-2 rounded-full font-medium text-sm transition-all
                  ${
                    preferredLanguage === lang.code
                      ? 'bg-coral text-white'
                      : 'bg-sandPaper text-deepLagoon border border-deepLagoon-300 hover:border-coral'
                  }
                `}
                aria-pressed={preferredLanguage === lang.code}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Eligibility attestations */}
        <div className="space-y-3 p-4 bg-sandPaper/50 rounded-lg">
          <p className="text-sm font-medium text-ink mb-3">
            {t('attestationsHeading')} <span className="text-coral">*</span>
          </p>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id="ageConfirm"
              type="checkbox"
              checked={!!eligibilityAttestations.ageConfirm}
              onChange={(e) => handleAttestationChange('ageConfirm', e.target.checked)}
              className="mt-0.5 w-5 h-5 text-seaGreen border-deepLagoon-300 rounded focus:ring-seaGreen"
              aria-invalid={!!errors.ageConfirm}
            />
            <span className="text-sm text-ink/80">{t('attestationAge')}</span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id="legalConfirm"
              type="checkbox"
              checked={!!eligibilityAttestations.legalConfirm}
              onChange={(e) => handleAttestationChange('legalConfirm', e.target.checked)}
              className="mt-0.5 w-5 h-5 text-seaGreen border-deepLagoon-300 rounded focus:ring-seaGreen"
              aria-invalid={!!errors.legalConfirm}
            />
            <span className="text-sm text-ink/80">{t('attestationLegal')}</span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id="foreignAgentConfirm"
              type="checkbox"
              checked={!!eligibilityAttestations.foreignAgentConfirm}
              onChange={(e) => handleAttestationChange('foreignAgentConfirm', e.target.checked)}
              className="mt-0.5 w-5 h-5 text-seaGreen border-deepLagoon-300 rounded focus:ring-seaGreen"
              aria-invalid={!!errors.foreignAgentConfirm}
            />
            <span className="text-sm text-ink/80">{t('attestationForeignAgent')}</span>
          </label>

          {(errors.ageConfirm || errors.legalConfirm || errors.foreignAgentConfirm) && (
            <p className="text-sm text-coral mt-2">{t('errorAttestation')}</p>
          )}
        </div>

        {/* Anonymous toggle */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="mt-0.5 w-5 h-5 text-seaGreen border-deepLagoon-300 rounded focus:ring-seaGreen"
          />
          <div>
            <span className="text-sm font-medium text-ink">{t('anonymousToggle')}</span>
            <p className="text-xs text-ink/50 mt-1">{t('anonymousNote')}</p>
          </div>
        </label>

        {/* Dedication (optional) */}
        <div>
          <label htmlFor="dedication" className="block text-sm font-medium text-ink mb-2">
            {t('dedication')} <span className="text-ink/50 text-xs">{t('optional')}</span>
          </label>
          <textarea
            id="dedication"
            value={dedication}
            onChange={(e) => setDedication(e.target.value)}
            placeholder={t('dedicationPlaceholder')}
            rows={2}
            maxLength={140}
            className="w-full px-4 py-3 border border-deepLagoon-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-seaGreen/30 focus:border-seaGreen resize-none"
          />
          <p className="mt-1 text-xs text-ink/50 text-right">
            {dedication.length}/140
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-6 h-12 border-2 border-deepLagoon-300 text-deepLagoon rounded-lg font-medium hover:bg-deepLagoon/5 transition-colors"
          >
            {t('back')}
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 h-12 bg-coral text-white rounded-lg font-medium hover:bg-coral/90-500/90 transition-colors"
          >
            {t('continue')}
          </button>
        </div>
      </form>
    </div>
  )
}
