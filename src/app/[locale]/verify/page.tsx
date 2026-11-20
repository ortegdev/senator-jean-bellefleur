/**
 * Public Verification Page
 * 
 * Lists official domain, email sender, and social handles.
 * Helps donors verify they're on the legitimate site.
 * 
 * Includes guidance for checking:
 * - SPF records
 * - DKIM signatures
 * - DMARC policy
 */

import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

interface VerifyPageProps {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'verify' })

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  }
}

export default function VerifyPage() {
  const t = useTranslations('verify')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://diaspora4bellefleur.example.com'
  const emailDomain = process.env.EMAIL_DOMAIN || 'diaspora4bellefleur.example.com'
  const supportEmail = process.env.SUPPORT_EMAIL || `support@${emailDomain}`

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Warning Banner */}
      <div className="bg-coral/10 border-2 border-coral rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <svg 
            className="w-6 h-6 text-coral flex-shrink-0 mt-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <div>
            <h2 className="text-xl font-bold text-ink mb-2">
              {t('warning.title')}
            </h2>
            <p className="text-ink/80">
              {t('warning.message')}
            </p>
            <p className="text-lg font-semibold text-coral mt-2">
              {t('warning.officialDomain')}: <code className="bg-white px-2 py-1 rounded">{siteUrl}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <h1 className="text-4xl font-bold text-ink mb-4">
        {t('title')}
      </h1>
      <p className="text-xl text-ink/70 mb-8">
        {t('description')}
      </p>

      {/* Official Domain */}
      <section className="bg-white rounded-lg border-2 border-deep-lagoon/10 p-6 mb-6">
        <h2 className="text-2xl font-semibold text-deep-lagoon mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          {t('domain.title')}
        </h2>
        <p className="text-ink/80 mb-4">
          {t('domain.description')}
        </p>
        <div className="bg-sand-paper p-4 rounded-lg">
          <p className="text-sm text-ink/60 mb-1">{t('domain.officialUrl')}</p>
          <p className="text-2xl font-mono font-bold text-deep-lagoon break-all">
            {siteUrl}
          </p>
        </div>
        <div className="mt-4 p-4 bg-sea-green/10 rounded-lg">
          <p className="text-sm text-ink/80">
            <strong>{t('domain.browserCheck')}:</strong> {t('domain.browserCheckDescription')}
          </p>
          <ul className="list-disc ml-6 mt-2 text-sm text-ink/70 space-y-1">
            <li>{t('domain.checkUrl')}</li>
            <li>{t('domain.checkCertificate')}</li>
            <li>{t('domain.checkNoWarnings')}</li>
          </ul>
        </div>
      </section>

      {/* Official Email */}
      <section className="bg-white rounded-lg border-2 border-deep-lagoon/10 p-6 mb-6">
        <h2 className="text-2xl font-semibold text-deep-lagoon mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {t('email.title')}
        </h2>
        <p className="text-ink/80 mb-4">
          {t('email.description')}
        </p>
        <div className="bg-sand-paper p-4 rounded-lg mb-4">
          <p className="text-sm text-ink/60 mb-1">{t('email.officialDomain')}</p>
          <p className="text-xl font-mono font-bold text-deep-lagoon">
            @{emailDomain}
          </p>
          <p className="text-sm text-ink/60 mt-3 mb-1">{t('email.supportAddress')}</p>
          <p className="text-lg font-mono text-deep-lagoon">
            {supportEmail}
          </p>
        </div>

        {/* Email Authentication */}
        <div className="mt-4 p-4 bg-sand-paper rounded-lg">
          <h3 className="font-semibold text-ink mb-2">{t('email.authentication.title')}</h3>
          <p className="text-sm text-ink/70 mb-3">
            {t('email.authentication.description')}
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm text-deep-lagoon mb-1">
                SPF (Sender Policy Framework)
              </h4>
              <p className="text-sm text-ink/70">
                {t('email.authentication.spf')}
              </p>
              <code className="block mt-2 bg-white p-2 rounded text-xs overflow-x-auto">
                nslookup -type=txt {emailDomain}
              </code>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-deep-lagoon mb-1">
                DKIM (DomainKeys Identified Mail)
              </h4>
              <p className="text-sm text-ink/70">
                {t('email.authentication.dkim')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-deep-lagoon mb-1">
                DMARC (Domain-based Message Authentication)
              </h4>
              <p className="text-sm text-ink/70">
                {t('email.authentication.dmarc')}
              </p>
              <code className="block mt-2 bg-white p-2 rounded text-xs overflow-x-auto">
                nslookup -type=txt _dmarc.{emailDomain}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media (if configured) */}
      {(process.env.NEXT_PUBLIC_TWITTER_HANDLE || process.env.NEXT_PUBLIC_FACEBOOK_PAGE) && (
        <section className="bg-white rounded-lg border-2 border-deep-lagoon/10 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-deep-lagoon mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            {t('social.title')}
          </h2>
          <p className="text-ink/80 mb-4">
            {t('social.description')}
          </p>
          <div className="space-y-3">
            {process.env.NEXT_PUBLIC_TWITTER_HANDLE && (
              <div className="flex items-center gap-3 p-3 bg-sand-paper rounded-lg">
                <svg className="w-5 h-5 text-deep-lagoon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
                <span className="font-mono text-deep-lagoon">
                  @{process.env.NEXT_PUBLIC_TWITTER_HANDLE}
                </span>
              </div>
            )}
            {process.env.NEXT_PUBLIC_FACEBOOK_PAGE && (
              <div className="flex items-center gap-3 p-3 bg-sand-paper rounded-lg">
                <svg className="w-5 h-5 text-deep-lagoon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="font-mono text-deep-lagoon">
                  {process.env.NEXT_PUBLIC_FACEBOOK_PAGE}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Red Flags */}
      <section className="bg-coral/5 border-2 border-coral/20 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-coral mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('redFlags.title')}
        </h2>
        <p className="text-ink/80 mb-4">
          {t('redFlags.description')}
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-coral mt-1">❌</span>
            <span className="text-ink/80">{t('redFlags.wrongDomain')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral mt-1">❌</span>
            <span className="text-ink/80">{t('redFlags.unsecureHttp')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral mt-1">❌</span>
            <span className="text-ink/80">{t('redFlags.wrongEmail')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral mt-1">❌</span>
            <span className="text-ink/80">{t('redFlags.urgentRequests')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral mt-1">❌</span>
            <span className="text-ink/80">{t('redFlags.personalInfo')}</span>
          </li>
        </ul>
      </section>

      {/* Report Suspicious Activity */}
      <div className="mt-8 text-center">
        <p className="text-ink/70 mb-3">
          {t('report.description')}
        </p>
        <a
          href={`mailto:${supportEmail}?subject=Suspicious%20Activity%20Report`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-deep-lagoon text-white rounded-lg hover:bg-deep-lagoon/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {t('report.button')}
        </a>
      </div>
    </div>
  )
}
