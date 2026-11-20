'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Wordmark } from '@/components/brand/Wordmark'
import { LanguageSwitcher } from './LanguageSwitcher'
import { LaunchMode } from '@prisma/client'

interface MobileNavProps {
  mode: LaunchMode
}

export function MobileNav({ mode }: MobileNavProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const navItems = [
    { href: '/about', label: t('nav.about') },
    { href: '/nord-ouest', label: t('nav.nordOuest') },
    { href: '/news', label: t('nav.news') },
    { href: '/get-involved', label: t('nav.getInvolved') },
  ]

  const ctaConfig = {
    INFO_ONLY: { href: '/about', label: t('cta.infoOnly') },
    WAITLIST: { href: '/get-involved', label: t('cta.waitlist') },
    DONATIONS_LIVE: { href: '/contribute', label: t('cta.donationsLive') },
  }

  const cta = ctaConfig[mode]

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          lg:hidden p-2 rounded-md text-ink-700 hover:bg-sandPaper-200
          focus:outline-none focus:ring-2 focus:ring-deepLagoon-500
          transition-colors
        "
        aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
        aria-expanded={isOpen}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Full-screen Mobile Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink-900/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            className="
              fixed inset-0 z-50 lg:hidden
              bg-sandPaper-50 overflow-y-auto
              flex flex-col
            "
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.openMenu')}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-ink-200">
              <Wordmark size="lg" />
              <button
                onClick={() => setIsOpen(false)}
                className="
                  p-2 rounded-md text-ink-700 hover:bg-sandPaper-200
                  focus:outline-none focus:ring-2 focus:ring-deepLagoon-500
                "
                aria-label={t('nav.closeMenu')}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="
                    block px-4 py-4 text-lg font-medium text-ink-900
                    hover:bg-deepLagoon-50 hover:text-deepLagoon-900
                    rounded-lg transition-colors
                  "
                >
                  {item.label}
                </Link>
              ))}

              {/* Language Switcher */}
              <div className="pt-6 mt-6 border-t border-ink-200">
                <LanguageSwitcher variant="list" />
              </div>
            </nav>

            {/* CTA Button - Pinned at Bottom */}
            <div className="p-4 border-t border-ink-200 bg-white">
              <Link
                href={cta.href}
                onClick={() => setIsOpen(false)}
                className="
                  block w-full px-6 py-4 text-center text-base font-semibold
                  bg-coral-500 text-white rounded-lg
                  hover:bg-coral-600 active:bg-coral-700
                  focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2
                  transition-colors
                  shadow-md
                "
              >
                {cta.label}
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
