'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CandidateConfig } from '@prisma/client'
import { ContributionData } from '../ContributeFlow'
import { AffiliationBadge } from '@/components/brand/AffiliationBadge'

interface PaymentStepProps {
  config: CandidateConfig
  contributionData: ContributionData
  onComplete: () => void
  onBack: () => void
}

export function PaymentStep({ config, contributionData, onComplete, onBack }: PaymentStepProps) {
  const t = useTranslations('contribute.payment')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [show3DSecure, setShow3DSecure] = useState(false)

  const amountDollars = (contributionData.amountCents / 100).toFixed(2)

  const handleWalletPay = async (walletType: 'apple' | 'google') => {
    setError(null)
    setIsProcessing(true)

    try {
      // TODO: Implement actual payment provider integration
      // This is a placeholder for the wallet payment flow
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Simulate random success/failure for demo
      if (Math.random() > 0.2) {
        onComplete()
      } else {
        throw new Error(t('errorPaymentFailed'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCardPay = async () => {
    setError(null)
    setIsProcessing(true)

    try {
      // TODO: Implement actual payment provider integration
      // This is a placeholder for card payment flow
      
      // Simulate 3D Secure requirement
      if (Math.random() > 0.7) {
        setShow3DSecure(true)
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
      
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Simulate random success/failure for demo
      if (Math.random() > 0.2) {
        onComplete()
      } else {
        throw new Error(t('errorPaymentFailed'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'))
      setShow3DSecure(false)
    } finally {
      setIsProcessing(false)
    }
  }

  // 3D Secure modal
  if (show3DSecure) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-seaGreen/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-seaGreen animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl text-ink mb-3">
            {t('secure3DTitle')}
          </h2>
          <p className="text-ink/70">
            {t('secure3DMessage')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
        <h2 className="font-display text-2xl sm:text-3xl text-ink mb-6">
          {t('title')}
        </h2>

        {/* Summary */}
        <div className="bg-sandPaper/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-ink/70">{t('contribution')}</span>
            <span className="font-medium text-ink">${amountDollars}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-ink/70">{t('to')}</span>
            <span className="text-sm font-medium text-ink">{config.candidateName}</span>
          </div>
        </div>

        {/* Wallet buttons (before card fields per rule 4) */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-ink mb-3">{t('walletHeading')}</p>
          
          {/* Apple Pay */}
          <button
            type="button"
            onClick={() => handleWalletPay('apple')}
            disabled={isProcessing}
            className="w-full h-12 bg-black text-white rounded-lg font-medium hover:bg-black/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            {t('applePayButton')}
          </button>

          {/* Google Pay */}
          <button
            type="button"
            onClick={() => handleWalletPay('google')}
            disabled={isProcessing}
            className="w-full h-12 bg-white border-2 border-deepLagoon-300 text-deepLagoon rounded-lg font-medium hover:bg-sandPaper transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M12 12h9.5c.4 1.7.4 3.6-.1 5.4-1 3.8-4 6.6-8.4 6.6-5 0-9-4-9-9s4-9 9-9c2.4 0 4.5.9 6.1 2.4l-2.5 2.5C15.4 9.7 13.8 9 12 9c-3.3 0-6 2.7-6 6s2.7 6 6 6c2.6 0 4.8-1.7 5.6-4H12v-5z"/>
            </svg>
            {t('googlePayButton')}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-deepLagoon-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-ink/50">{t('orPayWithCard')}</span>
          </div>
        </div>

        {/* Card payment (provider-hosted fields placeholder) */}
        <div className="space-y-4 mb-6">
          <div className="bg-sandPaper/30 border-2 border-dashed border-deepLagoon-300 rounded-lg p-6 text-center">
            <p className="text-sm text-ink/60 mb-3">
              {t('cardFieldsPlaceholder')}
            </p>
            <p className="text-xs text-ink/40">
              {t('providerHostedNote')}
            </p>
          </div>

          {/* Temporary test button */}
          <button
            type="button"
            onClick={handleCardPay}
            disabled={isProcessing}
            className="w-full h-12 bg-coral text-white rounded-lg font-medium hover:bg-coral/90-500/90 transition-colors disabled:opacity-50"
          >
            {isProcessing ? t('processing') : t('payButton', { amount: `$${amountDollars}` })}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-coral/10 border border-coral/30 rounded-lg p-4 text-coral text-sm">
            <p className="font-medium mb-1">{t('errorTitle')}</p>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-3 text-sm underline hover:no-underline"
            >
              {t('tryAgain')}
            </button>
          </div>
        )}

        {/* Trust row (beside pay button conceptually, but below for mobile) */}
        <div className="space-y-3 pt-6 border-t border-deepLagoon-200">
          <div className="flex items-start gap-2 text-xs text-ink/60">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{t('securePaymentNote')}</span>
          </div>

          <div className="flex items-start gap-2 text-xs text-ink/60">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <a href="/refund-policy" className="underline hover:no-underline">
                {t('refundPolicyLink')}
              </a>
            </span>
          </div>

          <div className="flex items-start gap-2 text-xs text-ink/60">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('notTaxDeductible')}</span>
          </div>

          {/* Affiliation disclosure */}
          <div className="pt-3">
            <AffiliationBadge
              status={config.affiliationStatus}
              text={config.affiliationText}
              compact
            />
          </div>
        </div>

        {/* Back button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 h-10 border border-deepLagoon-300 text-deepLagoon rounded-lg text-sm font-medium hover:bg-deepLagoon/5 transition-colors disabled:opacity-50"
          >
            {t('back')}
          </button>
        </div>
      </div>

      {/* Mobile sticky bottom bar (hidden on desktop) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-deepLagoon-200 p-4 sm:hidden shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-ink/70">{t('total')}</span>
          <span className="font-display text-2xl text-ink">${amountDollars}</span>
        </div>
        <button
          type="button"
          onClick={handleCardPay}
          disabled={isProcessing}
          className="w-full h-12 bg-coral text-white rounded-lg font-medium hover:bg-coral/90-500/90 transition-colors disabled:opacity-50"
        >
          {isProcessing ? t('processing') : t('payNow')}
        </button>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="h-32 sm:hidden" aria-hidden="true" />
    </>
  )
}
