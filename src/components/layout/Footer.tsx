import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { CoastlineConstellation } from '@/components/design/CoastlineConstellation'
import { LanguageSwitcher } from '@/components/client/LanguageSwitcher'
import { getCandidateConfig } from '@/lib/config/candidate'

export async function Footer() {
  const t = useTranslations()
  const config = await getCandidateConfig()
  const currentYear = new Date().getFullYear()

  const sitemapLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/about', label: t('nav.about') },
    { href: '/nord-ouest', label: t('nav.nordOuest') },
    { href: '/news', label: t('nav.news') },
    { href: '/get-involved', label: t('nav.getInvolved') },
  ]

  const legalLinks = [
    { href: '/privacy', label: t('footer.privacy') },
    { href: '/terms', label: t('footer.terms') },
    { href: '/contact', label: t('footer.contact') },
  ]

  const affiliationMessage = config.affiliationText || t('affiliation.independent')

  return (
    <footer className="relative bg-deepLagoon-900 text-white mt-auto">
      {/* Coastline Constellation Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
        <CoastlineConstellation variant="horizontal" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Sitemap */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              {t('footer.sitemap')}
            </h3>
            <ul className="space-y-2">
              {sitemapLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-sandPaper-100 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              {t('footer.legal')}
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-sandPaper-100 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Language Switcher */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              {t('language.switchLanguage')}
            </h3>
            <LanguageSwitcher variant="list" className="max-w-xs" />
          </div>
        </div>

        {/* Affiliation Disclosure */}
        <div className="border-t border-deepLagoon-700 pt-8 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">
            {t('footer.affiliation')}
          </h3>
          <p className="text-sm text-sandPaper-200 leading-relaxed">
            {affiliationMessage}
          </p>
        </div>

        {/* Bottom Row */}
        <div className="border-t border-deepLagoon-700 pt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-xs text-sandPaper-300">
            {t('footer.copyright', { year: currentYear, appName: t('common.appName') })}
          </p>
          <p className="text-xs text-sandPaper-300 text-center sm:text-right">
            {t('footer.builtFor', { candidateName: config.candidateName })}
          </p>
        </div>
      </div>
    </footer>
  )
}
