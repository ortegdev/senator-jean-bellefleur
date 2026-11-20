import { useTranslations } from 'next-intl'

type Step = 'amount' | 'details' | 'payment'

interface ProgressIndicatorProps {
  currentStep: Step
  completedSteps: boolean[]
}

export function ProgressIndicator({ currentStep, completedSteps }: ProgressIndicatorProps) {
  const t = useTranslations('contribute.steps')

  const steps = [
    { key: 'amount', label: t('amount'), completed: completedSteps[0] },
    { key: 'details', label: t('details'), completed: completedSteps[1] },
    { key: 'payment', label: t('payment'), completed: false },
  ]

  const currentIndex = steps.findIndex((s) => s.key === currentStep)

  return (
    <nav aria-label={t('progressLabel')}>
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const isCurrent = step.key === currentStep
          const isCompleted = step.completed
          const isPast = index < currentIndex

          return (
            <li key={step.key} className="flex items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                    font-medium text-sm sm:text-base transition-all
                    ${
                      isCurrent
                        ? 'bg-coral text-white ring-4 ring-coral/20'
                        : isCompleted || isPast
                        ? 'bg-seaGreen text-white'
                        : 'bg-deepLagoon/10 text-deepLagoon/40'
                    }
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted || isPast ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs sm:text-sm font-medium
                    ${
                      isCurrent
                        ? 'text-coral'
                        : isCompleted || isPast
                        ? 'text-seaGreen'
                        : 'text-deepLagoon/40'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-12 sm:w-20 h-0.5 mx-2 mb-6 transition-all
                    ${isCompleted || isPast ? 'bg-seaGreen' : 'bg-deepLagoon/10'}
                  `}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
