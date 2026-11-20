interface ProgressBarProps {
  value?: number // 0-100 for determinate
  variant?: 'determinate' | 'indeterminate'
  size?: 'sm' | 'md' | 'lg'
  color?: 'seaGreen' | 'coral' | 'deepLagoon'
  label?: string
  showPercentage?: boolean
  className?: string
}

/**
 * Progress Bar Component
 * 
 * Visual feedback for multi-step processes or loading states.
 * 
 * Variants:
 * - determinate: Known progress (0-100%)
 * - indeterminate: Unknown duration (animated)
 */
export function ProgressBar({
  value = 0,
  variant = 'determinate',
  size = 'md',
  color = 'seaGreen',
  label,
  showPercentage = false,
  className = '',
}: ProgressBarProps) {
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const colors = {
    seaGreen: 'bg-seaGreen',
    coral: 'bg-coral',
    deepLagoon: 'bg-deepLagoon',
  }

  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label && <span className="font-medium text-ink">{label}</span>}
          {showPercentage && variant === 'determinate' && (
            <span className="text-ink-600">{clampedValue}%</span>
          )}
        </div>
      )}

      <div
        className={`w-full overflow-hidden rounded-full bg-ink-100 ${sizes[size]}`}
        role="progressbar"
        aria-valuenow={variant === 'determinate' ? clampedValue : undefined}
        aria-valuemin={variant === 'determinate' ? 0 : undefined}
        aria-valuemax={variant === 'determinate' ? 100 : undefined}
        aria-label={label || 'Progress indicator'}
      >
        {variant === 'determinate' ? (
          <div
            className={`h-full transition-all duration-slow ${colors[color]}`}
            style={{ width: `${clampedValue}%` }}
          />
        ) : (
          <div
            className={`h-full w-1/3 animate-shimmer ${colors[color]}`}
            style={{
              background: `linear-gradient(90deg, transparent, currentColor, transparent)`,
              backgroundSize: '200% 100%',
            }}
          />
        )}
      </div>
    </div>
  )
}
