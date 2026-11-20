import { type ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Badge Component
 * 
 * Compact labels for status, counts, or categories.
 * Uses semantic colors from design system.
 */
export function Badge({ children, variant = 'neutral', size = 'md', className = '' }: BadgeProps) {
  const variants = {
    success: 'bg-seaGreen-50 text-seaGreen-800 ring-1 ring-inset ring-seaGreen-600/20',
    warning: 'bg-saltGold-50 text-saltGold-900 ring-1 ring-inset ring-saltGold-600/20',
    error: 'bg-coral-50 text-coral-800 ring-1 ring-inset ring-coral-600/20',
    info: 'bg-deepLagoon-50 text-deepLagoon-800 ring-1 ring-inset ring-deepLagoon-600/20',
    neutral: 'bg-ink-50 text-ink-700 ring-1 ring-inset ring-ink-600/20',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  )
}
