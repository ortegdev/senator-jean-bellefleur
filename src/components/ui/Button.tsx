import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { CoastlineLoader } from '@/components/design/CoastlineConstellation'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

/**
 * Button Component
 * 
 * DESIGN RULE 2: One dominant action per screen
 * - Primary (Coral): High-contrast, should be singular per view
 * - Secondary (Deep Lagoon): Lower priority actions
 * - Tertiary: Text-only, lowest priority
 * - Ghost: Outline style for alternate secondary
 * 
 * ACCESSIBILITY:
 * - Minimum 44px tap target
 * - Visible focus ring (3px)
 * - Disabled state clearly indicated
 * - Loading state announced to screen readers
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-sans font-semibold transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

    const variants = {
      primary:
        'bg-coral text-white hover:bg-coral-700 active:bg-coral-800 focus:ring-coral-500 shadow-sm hover:shadow-md',
      secondary:
        'bg-deepLagoon text-sandPaper hover:bg-deepLagoon-600 active:bg-deepLagoon-800 focus:ring-deepLagoon-500 shadow-sm hover:shadow-md',
      tertiary:
        'text-coral-600 hover:text-coral-700 hover:bg-coral-50 active:bg-coral-100 focus:ring-coral-500',
      ghost:
        'border-2 border-deepLagoon text-deepLagoon hover:bg-deepLagoon hover:text-white active:bg-deepLagoon-800 focus:ring-deepLagoon-500',
    }

    const sizes = {
      sm: 'h-9 px-4 text-sm rounded-sm', // 36px
      md: 'h-11 px-6 text-base rounded-md', // 44px - minimum tap target
      lg: 'h-13 px-8 text-lg rounded-lg', // 52px
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <CoastlineLoader className="scale-75" />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
