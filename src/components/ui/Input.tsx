import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  success?: string
  helperText?: string
}

/**
 * Input Component
 * 
 * ACCESSIBILITY:
 * - Always has visible label (no placeholder-only)
 * - Error messages associated via aria-describedby
 * - 44px minimum height for tap target
 * - Clear focus state
 * - Success indicators when appropriate
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, helperText, id, className = '', ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`
    const hasError = Boolean(error)
    const hasSuccess = Boolean(success)

    return (
      <div className="w-full">
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink">
          {label}
          {props.required && <span className="ml-1 text-coral" aria-label="required">*</span>}
        </label>

        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError}
          aria-describedby={
            [error && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined
          }
          className={`
            h-11 w-full rounded-sm border-2 bg-white px-4 text-base text-ink
            transition-colors duration-fast
            placeholder:text-ink-400
            focus:border-deepLagoon focus:outline-none focus:ring-2 focus:ring-deepLagoon-500/20
            disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400
            ${hasError ? 'border-coral-600 focus:border-coral-600 focus:ring-coral-500/20' : 'border-ink-300'}
            ${hasSuccess ? 'border-seaGreen-500 focus:border-seaGreen-500 focus:ring-seaGreen-500/20' : ''}
            ${className}
          `}
          {...props}
        />

        {helperText && !error && !success && (
          <p id={helperId} className="mt-1.5 text-sm text-ink-600">
            {helperText}
          </p>
        )}

        {error && (
          <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-sm text-coral-700" role="alert">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {success && !error && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-seaGreen-700">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
