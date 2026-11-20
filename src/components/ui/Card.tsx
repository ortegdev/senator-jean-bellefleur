import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'interactive' | 'featured'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

/**
 * Card Component
 * 
 * Flexible container for content grouping.
 * 
 * Variants:
 * - default: Basic container
 * - interactive: Hover states, clickable
 * - featured: Highlighted content with border accent
 */
export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  const baseStyles = 'rounded-lg bg-white shadow-md'

  const variants = {
    default: '',
    interactive:
      'cursor-pointer transition-all duration-fast hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
    featured: 'border-l-4 border-coral-600',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const Component = onClick ? 'button' : 'div'
  const interactiveProps = onClick
    ? {
        onClick,
        type: 'button' as const,
        className: 'w-full text-left',
      }
    : {}

  return (
    <Component
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...interactiveProps}
    >
      {children}
    </Component>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return <h3 className={`font-display text-xl font-bold text-ink ${className}`}>{children}</h3>
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`mt-6 ${className}`}>{children}</div>
}
