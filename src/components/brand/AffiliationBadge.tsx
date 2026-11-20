import type { AffiliationStatus } from '@prisma/client'

interface AffiliationBadgeProps {
  status: AffiliationStatus
  text: string
  variant?: 'default' | 'compact'
  className?: string
}

/**
 * Affiliation Badge Component
 * 
 * RULE 1: Honesty About Affiliation
 * RULE 7: Affiliation Disclosure as Design Element
 * 
 * This component makes the required affiliation disclosure
 * a designed element rather than hidden fine print.
 * 
 * Always visible on pages with donation/contribution features.
 */
export function AffiliationBadge({
  status,
  text,
  variant = 'default',
  className = '',
}: AffiliationBadgeProps) {
  const styles = {
    INDEPENDENT: {
      bg: 'bg-ink-50',
      border: 'border-ink-200',
      text: 'text-ink-700',
      icon: (
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    AUTHORIZED: {
      bg: 'bg-seaGreen-50',
      border: 'border-seaGreen-200',
      text: 'text-seaGreen-800',
      icon: (
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    COORDINATED: {
      bg: 'bg-saltGold-50',
      border: 'border-saltGold-200',
      text: 'text-saltGold-900',
      icon: (
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
  }

  const style = styles[status]

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium ${style.bg} ${style.border} ${style.text} ${className}`}
        role="status"
        aria-label="Affiliation disclosure"
      >
        {style.icon}
        <span>{text}</span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${style.bg} ${style.border} ${className}`}
      role="status"
      aria-label="Affiliation disclosure"
    >
      <div className={`mt-0.5 ${style.text}`}>{style.icon}</div>
      <div>
        <p className={`text-sm font-medium ${style.text}`}>Affiliation Status</p>
        <p className={`mt-1 text-sm ${style.text}`}>{text}</p>
      </div>
    </div>
  )
}
