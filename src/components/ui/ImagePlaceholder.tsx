import { CoastlineConstellation } from '@/components/design/CoastlineConstellation'

interface ImagePlaceholderProps {
  label?: string
  aspectRatio?: '1:1' | '4:3' | '16:9' | '3:4'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * Image Placeholder Component
 * 
 * RULE 6: Complete Without Candidate Photo
 * 
 * Elegant placeholder for candidate photo or other imagery.
 * Must look professionally designed, not like missing content.
 * 
 * Features:
 * - Coastline constellation background
 * - Clear labeling
 * - Maintains aspect ratio
 * - Matches brand aesthetic
 */
export function ImagePlaceholder({
  label = 'Photo pending approval',
  aspectRatio = '4:3',
  size = 'md',
  className = '',
}: ImagePlaceholderProps) {
  const aspectRatios = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    '3:4': 'aspect-[3/4]',
  }

  const sizes = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl bg-gradient-to-br from-deepLagoon-50 to-seaGreen-50
        ${aspectRatios[aspectRatio]} ${sizes[size]} ${className}
      `}
      role="img"
      aria-label={label}
    >
      {/* Background constellation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <CoastlineConstellation variant="circular" opacity={0.15} className="h-full w-full" />
      </div>

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-deepLagoon-100">
            <svg
              className="h-8 w-8 text-deepLagoon-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Text */}
          <p className="font-sans text-sm font-medium text-deepLagoon-700">{label}</p>
        </div>
      </div>

      {/* Border */}
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-ink-900/10" />
    </div>
  )
}
