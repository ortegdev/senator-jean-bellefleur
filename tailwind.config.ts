import type { Config } from 'tailwindcss'
import { colors } from './src/lib/design/colors'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        deepLagoon: colors.deepLagoon,
        coral: colors.coral,
        sandPaper: colors.sandPaper,
        ink: colors.ink,
        seaGreen: colors.seaGreen,
        saltGold: colors.saltGold,
        
        // Semantic aliases
        primary: colors.coral,
        secondary: colors.deepLagoon,
        success: colors.seaGreen,
        warning: colors.saltGold,
        error: colors.coral,
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // Fluid type scale with clamp()
        xs: ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
        sm: ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5' }],
        base: ['clamp(1.0625rem, 1rem + 0.3125vw, 1.125rem)', { lineHeight: '1.5' }],
        lg: ['clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)', { lineHeight: '1.4' }],
        xl: ['clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)', { lineHeight: '1.3' }],
        '2xl': ['clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)', { lineHeight: '1.25' }],
        '3xl': ['clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)', { lineHeight: '1.2' }],
        '4xl': ['clamp(2.25rem, 1.95rem + 1.5vw, 3rem)', { lineHeight: '1.15' }],
        '5xl': ['clamp(3rem, 2.55rem + 2.25vw, 4.375rem)', { lineHeight: '1.1' }],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        DEFAULT: '12px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(11, 29, 36, 0.05)',
        DEFAULT: '0 4px 6px rgba(11, 29, 36, 0.07), 0 2px 4px rgba(11, 29, 36, 0.03)',
        md: '0 4px 6px rgba(11, 29, 36, 0.07), 0 2px 4px rgba(11, 29, 36, 0.03)',
        lg: '0 10px 15px rgba(11, 29, 36, 0.08), 0 4px 6px rgba(11, 29, 36, 0.04)',
        xl: '0 20px 25px rgba(11, 29, 36, 0.1), 0 8px 10px rgba(11, 29, 36, 0.04)',
        inner: 'inset 0 2px 4px rgba(11, 29, 36, 0.06)',
        none: 'none',
      },
      spacing: {
        // Extended spacing scale (base-4)
        18: '4.5rem', // 72px
        22: '5.5rem', // 88px
        26: '6.5rem', // 104px
        30: '7.5rem', // 120px
        34: '8.5rem', // 136px
        38: '9.5rem', // 152px
      },
      maxWidth: {
        '8xl': '1440px',
        prose: '70ch',
      },
      transitionDuration: {
        fast: '120ms',
        DEFAULT: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.2, 0, 0, 1)', // ease-out
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 200ms cubic-bezier(0.2, 0, 0, 1)',
        fadeOut: 'fadeOut 200ms cubic-bezier(0.2, 0, 0, 1)',
        slideDown: 'slideDown 200ms cubic-bezier(0.2, 0, 0, 1)',
        slideUp: 'slideUp 200ms cubic-bezier(0.2, 0, 0, 1)',
        scaleIn: 'scaleIn 200ms cubic-bezier(0.2, 0, 0, 1)',
        shimmer: 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
}

export default config
