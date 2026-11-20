import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Wordmark } from '@/components/brand/Wordmark'
import { LanguageSwitcher } from '@/components/client/LanguageSwitcher'
import { MobileNav } from '@/components/client/MobileNav'
import { getCurrentMode } from '@/lib/launch-gate/mode'
import { LaunchMode } from '@prisma/client'

export async function Header() {
  const t = useTranslations()
  const mode = await getCurrentMode()

  const navItems = [
    { href: '/about', label: t('nav.about') },
    { href: '/nord-ouest', label: t('nav.nordOuest') },
    { href: '/news', label: t('nav.news') },
    { href: '/get-involved', label: t('nav.getInvolved') },
  ]

  const ctaConfig: Record<LaunchMode, { href: string; label: string }> = {
    INFO_ONLY: { href: '/about', label: t('cta.infoOnly') },
    WAITLIST: { href: '/get-involved', label: t('cta.waitlist') },
    DONATIONS_LIVE: { href: '/contribute', label: t('cta.donationsLive') },
  }

  const cta = ctaConfig[mode]

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-ink-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" aria-label={t('common.appName')}>
              <Wordmark size="md" className="hidden sm:block" />
              <Wordmark size="sm" variant="short" className="sm:hidden" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="
                  px-3 py-2 text-sm font-medium text-ink-700
                  hover:text-deepLagoon-700 hover:bg-sandPaper-100
                  rounded-md transition-colors
                "
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <LanguageSwitcher variant="dropdown" />
            <Link
              href={cta.href}
              className="
                px-4 py-2 text-sm font-semibold
                bg-coral-500 text-white rounded-md
                hover:bg-coral-600 active:bg-coral-700
                focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2
                transition-colors
                shadow-sm
              "
            >
              {cta.label}
            </Link>
          </div>

          {/* Mobile Menu Button & Language Switcher */}
          <div className="flex lg:hidden items-center space-x-2">
            <LanguageSwitcher variant="dropdown" />
            <MobileNav mode={mode} />
          </div>
        </div>
      </div>
    </header>
  )
}
