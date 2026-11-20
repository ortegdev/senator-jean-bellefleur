'use client'

import { useState } from 'react'
import { CandidateConfig } from '@prisma/client'
import { AmountStep } from './steps/AmountStep'
import { DetailsStep } from './steps/DetailsStep'
import { PaymentStep } from './steps/PaymentStep'
import { SuccessPage } from './SuccessPage'
import { ContributeHeader } from './ContributeHeader'
import { ProgressIndicator } from './ProgressIndicator'

export type ContributionData = {
  // Amount
  amountCents: number
  
  // Details
  firstName: string
  lastName: string
  email: string
  country: string
  communeOfOrigin?: string
  preferredLanguage: string
  isAnonymous: boolean
  dedication?: string
  
  // Eligibility attestations (from Prompt 11)
  eligibilityAttestations: {
    [key: string]: boolean
  }
}

type Step = 'amount' | 'details' | 'payment' | 'success'

interface ContributeFlowProps {
  config: CandidateConfig
}

export function ContributeFlow({ config }: ContributeFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('amount')
  const [data, setData] = useState<Partial<ContributionData>>({
    isAnonymous: true, // Default anonymous
    eligibilityAttestations: {},
  })

  const updateData = (newData: Partial<ContributionData>) => {
    setData((prev) => ({ ...prev, ...newData }))
  }

  const goToStep = (step: Step) => {
    setCurrentStep(step)
    // Scroll to top on step change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAmountComplete = (amountCents: number) => {
    updateData({ amountCents })
    goToStep('details')
  }

  const handleDetailsComplete = (detailsData: Partial<ContributionData>) => {
    updateData(detailsData)
    goToStep('payment')
  }

  const handlePaymentComplete = () => {
    goToStep('success')
  }

  const handleBack = () => {
    if (currentStep === 'details') {
      goToStep('amount')
    } else if (currentStep === 'payment') {
      goToStep('details')
    }
  }

  // Success page (no header/progress)
  if (currentStep === 'success') {
    return (
      <SuccessPage
        config={config}
        contributionData={data as ContributionData}
      />
    )
  }

  return (
    <div className="min-h-screen bg-sandPaper">
      {/* Reduced header */}
      <ContributeHeader
        config={config}
        onBack={currentStep !== 'amount' ? handleBack : undefined}
      />

      {/* Progress indicator */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-8">
        <ProgressIndicator
          currentStep={currentStep}
          completedSteps={[
            currentStep !== 'amount',
            currentStep === 'payment',
          ]}
        />
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        {currentStep === 'amount' && (
          <AmountStep
            config={config}
            initialAmount={data.amountCents}
            onComplete={handleAmountComplete}
          />
        )}

        {currentStep === 'details' && (
          <DetailsStep
            config={config}
            initialData={data}
            onComplete={handleDetailsComplete}
            onBack={handleBack}
          />
        )}

        {currentStep === 'payment' && (
          <PaymentStep
            config={config}
            contributionData={data as ContributionData}
            onComplete={handlePaymentComplete}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}
