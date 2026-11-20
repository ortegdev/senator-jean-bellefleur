'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CandidateConfig } from '@prisma/client'

interface AmountStepProps {
  config: CandidateConfig
  initialAmount?: number
  onComplete: (amountCents: number) => void
}

export function AmountStep({ config, initialAmount, onComplete }: AmountStepProps) {
  const t = useTranslations('contribute.amount')
  
  // Preset amounts from config (default $5, $7, $10)
  const presets = [500, 700, 1000] // in cents
  
  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    initialAmount && presets.includes(initialAmount) ? initialAmount : null
  )
  const [customAmount, setCustomAmount] = useState<string>(
    initialAmount && !presets.includes(initialAmount) ? (initialAmount / 100).toFixed(2) : ''
  )
  const [error, setError] = useState<string | null>(null)

  const minDollars = config.minAmountCents / 100
  const maxDollars = config.maxAmountCents / 100

  const handlePresetClick = (amountCents: number) => {
    setSelectedPreset(amountCents)
    setCustomAmount('')
    setError(null)
  }

  const handleCustomAmountChange = (value: string) => {
    setSelectedPreset(null)
    setCustomAmount(value)
    setError(null)
  }

  const handleContinue = () => {
    let amountCents: number

    if (selectedPreset) {
      amountCents = selectedPreset
    } else if (customAmount) {
      const dollars = parseFloat(customAmount)
      if (isNaN(dollars) || dollars <= 0) {
        setError(t('errorInvalidAmount'))
        return
      }
      amountCents = Math.round(dollars * 100)
    } else {
      setError(t('errorNoAmount'))
      return
    }

    // Validate range
    if (amountCents < config.minAmountCents || amountCents > config.maxAmountCents) {
      setError(
        t('errorOutOfRange', {
          min: `$${minDollars}`,
          max: `$${maxDollars}`,
        })
      )
      return
    }

    onComplete(amountCents)
  }

  const getCurrentAmount = () => {
    if (selectedPreset) {
      return `$${(selectedPreset / 100).toFixed(2)}`
    } else if (customAmount) {
      const dollars = parseFloat(customAmount)
      return isNaN(dollars) ? '$0.00' : `$${dollars.toFixed(2)}`
    }
    return '$0.00'
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
      {/* Value proposition (short, specific, config-driven) */}
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl text-ink mb-3">
          {t('title', { candidateName: config.candidateName })}
        </h1>
        <p className="text-base sm:text-lg text-ink/70 leading-relaxed">
          {t('valueProposition', {
            min: `$${minDollars}`,
            max: `$${maxDollars}`,
          })}
        </p>
      </div>

      {/* Preset amount buttons (large, primary control) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-3">
          {t('selectAmount')}
        </label>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {presets.map((amountCents) => {
            const dollars = amountCents / 100
            const isSelected = selectedPreset === amountCents
            return (
              <button
                key={amountCents}
                type="button"
                onClick={() => handlePresetClick(amountCents)}
                className={`
                  h-16 sm:h-20 rounded-lg font-medium text-lg sm:text-xl transition-all
                  ${
                    isSelected
                      ? 'bg-coral text-white ring-4 ring-coral/20 scale-105'
                      : 'bg-sandPaper text-deepLagoon hover:bg-deepLagoon/5 border-2 border-deepLagoon-200'
                  }
                `}
                aria-pressed={isSelected}
              >
                ${dollars}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom amount (secondary) */}
      <div className="mb-8">
        <label htmlFor="custom-amount" className="block text-sm font-medium text-ink mb-2">
          {t('customAmount')}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-deepLagoon text-lg">
            $
          </span>
          <input
            id="custom-amount"
            type="number"
            min={minDollars}
            max={maxDollars}
            step="0.01"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            placeholder={`${minDollars} - ${maxDollars}`}
            className={`
              w-full h-12 pl-8 pr-4 border rounded-lg text-lg
              focus:outline-none focus:ring-3 focus:ring-seaGreen/30 focus:border-seaGreen
              ${selectedPreset ? 'border-deepLagoon-200 bg-sandPaper/50' : 'border-deepLagoon-300'}
            `}
            inputMode="decimal"
            autoComplete="off"
          />
        </div>
        <p className="mt-2 text-xs text-ink/50">
          {t('rangeNote', { min: `$${minDollars}`, max: `$${maxDollars}` })}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-coral/10 border border-coral/30 rounded-lg p-4 text-coral text-sm">
          {error}
        </div>
      )}

      {/* Continue button */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={!selectedPreset && !customAmount}
        className="w-full h-12 sm:h-14 bg-coral text-white rounded-lg font-medium text-base sm:text-lg hover:bg-coral/90-500/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('continue')} · {getCurrentAmount()}
      </button>

      {/* Trust note */}
      <p className="mt-4 text-center text-xs text-ink/50">
        {t('trustNote')}
      </p>
    </div>
  )
}
