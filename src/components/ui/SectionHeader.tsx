import { type ReactNode } from 'react'
import { CoastlineConstellation } from '@/components/design/CoastlineConstellation'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  showDivider?: boolean
  className?: string
}

/**
 * Section Header Component
 * 
 * RULE 3: Brand Lives on Every Page
 * 
 * Consistent section headings with optional coastline divider.
 * Uses Fraunces display font for brand consistency.
 */
export function SectionHeader({
  title,
  description,
  action,
  showDivider = false,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">{title}</h2>
          {description && <p className="mt-2 text-lg text-ink-600">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {showDivider && (
        <div className="relative py-4">
          <CoastlineConstellation variant="horizontal" opacity={0.2} className="h-8 w-full" />
        </div>
      )}
    </div>
  )
}
