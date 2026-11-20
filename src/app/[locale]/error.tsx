'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations('errors')

  useEffect(() => {
    // Log error to error reporting service (Sentry, etc.)
    // Scrub PII before logging
    const scrubbedError = {
      message: error.message,
      digest: error.digest,
      // Do NOT log stack trace to avoid exposing sensitive paths
    }
    
    console.error('Error boundary caught:', scrubbedError)
    
    // TODO: Send to error tracking service
    // logErrorToService(scrubbedError)
  }, [error])

  return (
    <div className="min-h-screen bg-sandPaper-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-coral-100 p-4">
            <svg
              className="h-12 w-12 text-coral-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-ink-900">
            {t('somethingWentWrong')}
          </h1>
          <p className="text-base text-ink-600">
            {t('errorDescription')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="primary" size="medium">
            {t('tryAgain')}
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            size="medium"
          >
            {t('reload')}
          </Button>
        </div>

        {/* Error Reference (if digest exists) */}
        {error.digest && (
          <p className="text-xs text-ink-500 pt-4">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
