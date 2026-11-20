'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import { Wordmark } from '@/components/brand/Wordmark'
import { useTranslations } from 'next-intl'

/**
 * Main Navigation Component
 * 
 * RULE 3: Brand Lives on Every Page
 * Wordmark present in navigation on all pages.
 * 
 * ACCESSIBILITY:
 * - Keyboard navigation
 * - Mobile-friendly toggle
 * - Skip link to main content
 */
export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('nav')

  const links = [
    { href: '/', label: t('home') },
    { href: '/about', label: t('about') },
    { href: '/design-system', label: 'Design System' },
  ]

  return (
    <nav className="bg-white shadow-sm" role="navigation" aria-label="Main navigation">
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Wordmark variant="short" theme="light" className="sm:hidden" />
            <Wordmark variant="full" theme="light" className="hidden sm:block" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink-700 transition-colors hover:text-coral focus:outline-none focus:ring-2 focus:ring-coral rounded px-3 py-2"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-ink hover:bg-ink-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-coral md:hidden"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
            {isOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-ink-700 hover:bg-ink-50 hover:text-coral"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
