/**
 * Coastline Constellation Motif
 * 
 * Original graphic representing the connection between Nord-Ouest
 * and diaspora destinations. Decorative element only.
 * 
 * Cities represented:
 * - Port-de-Paix (Haiti)
 * - Miami (USA)
 * - New York (USA)
 * - Boston (USA)
 * - Montreal (Canada)
 * - Paris (France)
 */

interface CoastlineConstellationProps {
  variant?: 'horizontal' | 'vertical' | 'circular'
  opacity?: number
  className?: string
}

export function CoastlineConstellation({
  variant = 'horizontal',
  opacity = 0.1,
  className = '',
}: CoastlineConstellationProps) {
  if (variant === 'horizontal') {
    return (
      <svg
        className={className}
        style={{ opacity }}
        viewBox="0 0 1200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        role="presentation"
      >
        {/* Port-de-Paix (origin) */}
        <circle cx="100" cy="100" r="6" fill="currentColor" className="text-deepLagoon-700" />
        
        {/* Miami */}
        <circle cx="300" cy="80" r="5" fill="currentColor" className="text-seaGreen-500" />
        
        {/* New York */}
        <circle cx="500" cy="60" r="5" fill="currentColor" className="text-seaGreen-500" />
        
        {/* Boston */}
        <circle cx="600" cy="50" r="4" fill="currentColor" className="text-seaGreen-400" />
        
        {/* Montreal */}
        <circle cx="800" cy="40" r="5" fill="currentColor" className="text-seaGreen-500" />
        
        {/* Paris */}
        <circle cx="1100" cy="70" r="5" fill="currentColor" className="text-seaGreen-500" />
        
        {/* Connection lines */}
        <path
          d="M 100 100 Q 200 90 300 80"
          stroke="currentColor"
          strokeWidth="1"
          className="text-deepLagoon-500"
          strokeDasharray="4 4"
        />
        <path
          d="M 300 80 Q 400 70 500 60"
          stroke="currentColor"
          strokeWidth="1"
          className="text-deepLagoon-500"
          strokeDasharray="4 4"
        />
        <path
          d="M 500 60 Q 550 55 600 50"
          stroke="currentColor"
          strokeWidth="1"
          className="text-deepLagoon-400"
          strokeDasharray="4 4"
        />
        <path
          d="M 600 50 Q 700 45 800 40"
          stroke="currentColor"
          strokeWidth="1"
          className="text-deepLagoon-500"
          strokeDasharray="4 4"
        />
        <path
          d="M 800 40 Q 950 55 1100 70"
          stroke="currentColor"
          strokeWidth="1"
          className="text-deepLagoon-500"
          strokeDasharray="4 4"
        />
      </svg>
    )
  }

  if (variant === 'circular') {
    return (
      <svg
        className={className}
        style={{ opacity }}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        role="presentation"
      >
        {/* Center: Port-de-Paix */}
        <circle cx="200" cy="200" r="8" fill="currentColor" className="text-deepLagoon-700" />
        
        {/* Diaspora cities in circle */}
        <circle cx="200" cy="100" r="5" fill="currentColor" className="text-seaGreen-500" />
        <circle cx="300" cy="150" r="5" fill="currentColor" className="text-seaGreen-500" />
        <circle cx="300" cy="250" r="5" fill="currentColor" className="text-seaGreen-500" />
        <circle cx="200" cy="300" r="5" fill="currentColor" className="text-seaGreen-500" />
        <circle cx="100" cy="250" r="5" fill="currentColor" className="text-seaGreen-500" />
        <circle cx="100" cy="150" r="5" fill="currentColor" className="text-seaGreen-500" />
        
        {/* Radial connection lines */}
        <line x1="200" y1="200" x2="200" y2="100" stroke="currentColor" strokeWidth="1" className="text-deepLagoon-400" strokeDasharray="3 3" />
        <line x1="200" y1="200" x2="300" y2="150" stroke="currentColor" strokeWidth="1" className="text-deepLagoon-400" strokeDasharray="3 3" />
        <line x1="200" y1="200" x2="300" y2="250" stroke="currentColor" strokeWidth="1" className="text-deepLagoon-400" strokeDasharray="3 3" />
        <line x1="200" y1="200" x2="200" y2="300" stroke="currentColor" strokeWidth="1" className="text-deepLagoon-400" strokeDasharray="3 3" />
        <line x1="200" y1="200" x2="100" y2="250" stroke="currentColor" strokeWidth="1" className="text-deepLagoon-400" strokeDasharray="3 3" />
        <line x1="200" y1="200" x2="100" y2="150" stroke="currentColor" strokeWidth="1" className="text-deepLagoon-400" strokeDasharray="3 3" />
      </svg>
    )
  }

  // Vertical variant
  return (
    <svg
      className={className}
      style={{ opacity }}
      viewBox="0 0 200 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
    >
      {/* Vertical migration path */}
      <circle cx="100" cy="500" r="6" fill="currentColor" className="text-deepLagoon-700" />
      <circle cx="100" cy="400" r="5" fill="currentColor" className="text-seaGreen-500" />
      <circle cx="100" cy="300" r="5" fill="currentColor" className="text-seaGreen-500" />
      <circle cx="100" cy="200" r="5" fill="currentColor" className="text-seaGreen-500" />
      <circle cx="100" cy="100" r="5" fill="currentColor" className="text-seaGreen-500" />
      
      <path
        d="M 100 500 L 100 100"
        stroke="currentColor"
        strokeWidth="1"
        className="text-deepLagoon-400"
        strokeDasharray="4 4"
      />
    </svg>
  )
}

/**
 * Animated loading variant with connecting dots
 */
export function CoastlineLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="Loading">
      <span className="h-2 w-2 animate-pulse rounded-full bg-deepLagoon-700" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-seaGreen-500" style={{ animationDelay: '150ms' }} />
      <span className="h-2 w-2 animate-pulse rounded-full bg-seaGreen-500" style={{ animationDelay: '300ms' }} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
