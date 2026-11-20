import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { localeDir, dateLocales, type Locale } from '@/i18n/config'
import { Fraunces, Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { AffiliationStrip } from '@/components/layout/AffiliationStrip'
import { Footer } from '@/components/layout/Footer'
import '../globals.css'

// Font configuration with Latin + Latin Extended subset
const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-fraunces',
  display: 'swap',
  preload: true,
})

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })
  const candidate = await getTranslations({ locale, namespace: 'candidate' })

  // Base URL for the site (should come from env in production)
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000'
  const canonicalUrl = `${baseUrl}/${locale}`

  return {
    title: {
      default: `${t('appName')} | ${candidate('department')} 2027`,
      template: `%s | ${t('appName')}`,
    },
    description: `Supporting ${candidate('name')} for ${candidate('office')} of ${candidate('department')}, Haiti. Independent supporter initiative.`,
    keywords: [
      candidate('name'),
      candidate('office'),
      candidate('department'),
      'Haiti',
      'election',
      'Senate',
      'Nord-Ouest',
      'diaspora',
    ],
    authors: [{ name: t('appName') }],
    creator: t('appName'),
    publisher: t('appName'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ht: `${baseUrl}/ht`,
        fr: `${baseUrl}/fr`,
        en: `${baseUrl}/en`,
      },
    },
    openGraph: {
      type: 'website',
      locale: dateLocales[locale as Locale],
      url: canonicalUrl,
      title: `${t('appName')} | ${candidate('department')} 2027`,
      description: `Supporting ${candidate('name')} for ${candidate('office')}`,
      siteName: t('appName'),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('appName')} | ${candidate('department')} 2027`,
      description: `Supporting ${candidate('name')} for ${candidate('office')}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    icons: {
      icon: '/favicon.svg',
      apple: '/apple-touch-icon.png',
    },
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()
  const dir = localeDir[locale as Locale]

  return (
    <html lang={locale} dir={dir} className={`${fraunces.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-sandPaper font-sans text-ink antialiased">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <AffiliationStrip />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
