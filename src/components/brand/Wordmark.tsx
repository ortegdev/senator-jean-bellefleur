/**
 * Diaspora4Bellefleur Wordmark
 * 
 * DESIGN RULE: Typographic treatment only, no logo likeness
 * - No candidate photos, flags, or party symbols
 * - Uses Fraunces display font
 * - Light, dark, and monochrome variants
 * 
 * Variants:
 * - full: Complete "Diaspora4Bellefleur"
 * - short: "D4B" monogram for mobile
 * - lockup: With tagline "Nord-Ouest 2027"
 */

interface WordmarkProps {
  variant?: 'full' | 'short' | 'lockup'
  theme?: 'light' | 'dark' | 'mono'
  className?: string
}

export function Wordmark({ variant = 'full', theme = 'light', className = '' }: WordmarkProps) {
  const colors = {
    light: {
      primary: 'text-deepLagoon-700',
      accent: 'text-coral-600',
      tagline: 'text-ink-600',
    },
    dark: {
      primary: 'text-sandPaper-100',
      accent: 'text-coral-400',
      tagline: 'text-sandPaper-200',
    },
    mono: {
      primary: 'text-current',
      accent: 'text-current',
      tagline: 'text-current',
    },
  }

  const themeColors = colors[theme]

  if (variant === 'short') {
    return (
      <div className={`font-display text-2xl font-bold ${className}`} role="img" aria-label="D4B">
        <span className={themeColors.primary}>D</span>
        <span className={themeColors.accent}>4</span>
        <span className={themeColors.primary}>B</span>
      </div>
    )
  }

  if (variant === 'lockup') {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="font-display text-xl font-bold leading-none tracking-tight md:text-2xl">
          <span className={themeColors.primary}>Diaspora</span>
          <span className={themeColors.accent}>4</span>
          <span className={themeColors.primary}>Bellefleur</span>
        </div>
        <div className={`mt-1 font-sans text-xs font-medium tracking-wide ${themeColors.tagline}`}>
          Nord-Ouest 2027
        </div>
      </div>
    )
  }

  // Full variant (default)
  return (
    <div
      className={`font-display text-xl font-bold leading-none tracking-tight md:text-2xl ${className}`}
      role="img"
      aria-label="Diaspora4Bellefleur"
    >
      <span className={themeColors.primary}>Diaspora</span>
      <span className={themeColors.accent}>4</span>
      <span className={themeColors.primary}>Bellefleur</span>
    </div>
  )
}
