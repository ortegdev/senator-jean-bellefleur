/**
 * Motion Design Tokens
 * 
 * Respects prefers-reduced-motion user preference.
 * All animations disabled when motion is reduced.
 */

export const motion = {
  duration: {
    fast: '120ms',
    base: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.2, 0, 0, 1)', // ease-out
  },
} as const

/**
 * CSS custom properties for motion
 * Automatically respects prefers-reduced-motion
 */
export const motionVars = `
  :root {
    --motion-duration-fast: 120ms;
    --motion-duration-base: 200ms;
    --motion-duration-slow: 300ms;
    --motion-easing: cubic-bezier(0.2, 0, 0, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-duration-fast: 0ms;
      --motion-duration-base: 0ms;
      --motion-duration-slow: 0ms;
    }
    
    * {
      animation-duration: 0ms !important;
      transition-duration: 0ms !important;
    }
  }
`

/**
 * React hook to check if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
