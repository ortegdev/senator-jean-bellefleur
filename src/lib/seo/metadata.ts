/**
 * SEO Metadata Generation
 * 
 * Canonical URLs, hreflang tags, meta tags, robots directives
 */

import { getCandidateConfig } from '@/lib/config/candidate'

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Check if current deployment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production'
}

/**
 * Get robots directive based on environment
 */
export function getRobotsDirective(): 'index, follow' | 'noindex, nofollow' {
  return isProduction() ? 'index, follow' : 'noindex, nofollow'
}

// ============================================================================
// CANONICAL URL
// ============================================================================

/**
 * Generate canonical URL for page
 * 
 * Always uses HTTPS, removes query parameters and fragments
 */
export function generateCanonicalUrl(path: string, locale?: 'ht' | 'fr' | 'en'): string {
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000'

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  // Build URL with locale if provided
  const fullPath = locale ? `/${locale}${normalizedPath}` : normalizedPath

  // Remove trailing slash unless it's root
  const cleanPath = fullPath === '/' ? '/' : fullPath.replace(/\/$/, '')

  return `${baseUrl}${cleanPath}`
}

// ============================================================================
// HREFLANG TAGS
// ============================================================================

export interface HreflangTag {
  hreflang: string
  href: string
}

/**
 * Generate hreflang tags for multilingual pages
 * 
 * Tells search engines about alternate language versions
 */
export function generateHreflangTags(path: string): HreflangTag[] {
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000'
  const locales = ['ht', 'fr', 'en'] as const

  const tags: HreflangTag[] = locales.map((locale) => ({
    hreflang: locale === 'ht' ? 'ht-HT' : locale === 'fr' ? 'fr-FR' : 'en-US',
    href: generateCanonicalUrl(path, locale),
  }))

  // Add x-default (default language for users without a matching locale)
  tags.push({
    hreflang: 'x-default',
    href: generateCanonicalUrl(path, 'en'), // Default to English
  })

  return tags
}

// ============================================================================
// META TAGS
// ============================================================================

export interface PageMetadata {
  title: string
  description: string
  keywords?: string[]
  canonical: string
  robots: string
  ogImage?: string
  twitterCard?: string
  hreflang: HreflangTag[]
}

/**
 * Generate complete metadata for page
 */
export async function generatePageMetadata(params: {
  title: string
  description: string
  path: string
  locale: 'ht' | 'fr' | 'en'
  keywords?: string[]
}): Promise<PageMetadata> {
  const config = await getCandidateConfig()

  // Default keywords based on candidate info
  const defaultKeywords = [
    config.candidateName,
    config.department,
    'Haiti',
    'Senator',
    'Sénateur',
    'Nord-Ouest',
    'elections',
    'élections',
  ]

  const keywords = params.keywords
    ? [...defaultKeywords, ...params.keywords]
    : defaultKeywords

  return {
    title: `${params.title} | Diaspora4Bellefleur`,
    description: params.description,
    keywords,
    canonical: generateCanonicalUrl(params.path, params.locale),
    robots: getRobotsDirective(),
    hreflang: generateHreflangTags(params.path),
  }
}

// ============================================================================
// NEXT.JS METADATA OBJECT
// ============================================================================

/**
 * Generate Next.js 13+ Metadata object
 */
export async function generateNextMetadata(params: {
  title: string
  description: string
  path: string
  locale: 'ht' | 'fr' | 'en'
  keywords?: string[]
}) {
  const metadata = await generatePageMetadata(params)
  const config = await getCandidateConfig()

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    robots: metadata.robots,
    alternates: {
      canonical: metadata.canonical,
      languages: {
        'ht-HT': generateCanonicalUrl(params.path, 'ht'),
        'fr-FR': generateCanonicalUrl(params.path, 'fr'),
        'en-US': generateCanonicalUrl(params.path, 'en'),
      },
    },
    openGraph: {
      title: params.title,
      description: params.description,
      url: metadata.canonical,
      siteName: 'Diaspora4Bellefleur',
      locale: params.locale === 'ht' ? 'ht_HT' : params.locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: params.title,
      description: params.description,
    },
  }
}

// ============================================================================
// ROBOTS.TXT GENERATION
// ============================================================================

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(): string {
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000'

  if (!isProduction()) {
    // Block all crawlers in non-production
    return `
# Non-production environment - disallow all crawlers
User-agent: *
Disallow: /
    `.trim()
  }

  // Production robots.txt
  return `
# Diaspora4Bellefleur - Independent Supporter Initiative

User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Block admin and API routes
Disallow: /admin/
Disallow: /api/

# Block auth routes
Disallow: /auth/
Disallow: /login/
Disallow: /logout/

# Block my-support (private supporter dashboard)
Disallow: /*/my-support/

# Block dynamic routes that don't need indexing
Disallow: /*?*utm_*

# Crawl delay (be respectful)
Crawl-delay: 1
  `.trim()
}

// ============================================================================
// SITEMAP GENERATION
// ============================================================================

export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  alternates?: { hreflang: string; href: string }[]
}

/**
 * Generate sitemap.xml content
 */
export async function generateSitemap(): Promise<string> {
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000'
  const urls: SitemapUrl[] = []

  // Only generate sitemap for production
  if (!isProduction()) {
    return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
  }

  const { prisma } = await import('@/lib/db/prisma')

  // Static pages (multilingual)
  const staticPages = [
    { path: '/', priority: 1.0, changefreq: 'daily' as const },
    { path: '/about', priority: 0.8, changefreq: 'weekly' as const },
    { path: '/issues', priority: 0.8, changefreq: 'weekly' as const },
    { path: '/updates', priority: 0.7, changefreq: 'daily' as const },
    { path: '/chapters', priority: 0.7, changefreq: 'weekly' as const },
    { path: '/nord-ouest', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/contribute', priority: 0.9, changefreq: 'monthly' as const },
    { path: '/faq', priority: 0.6, changefreq: 'monthly' as const },
    { path: '/press', priority: 0.6, changefreq: 'monthly' as const },
  ]

  for (const page of staticPages) {
    const locales = ['ht', 'fr', 'en'] as const

    for (const locale of locales) {
      const loc = generateCanonicalUrl(page.path, locale)
      const alternates = generateHreflangTags(page.path)

      urls.push({
        loc,
        changefreq: page.changefreq,
        priority: page.priority,
        alternates,
      })
    }
  }

  // Dynamic pages: Published chapters
  const chapters = await prisma.chapter.findMany({
    where: {
      status: 'APPROVED',
      suspended: false,
    },
    select: { slug: true, updatedAt: true },
  })

  for (const chapter of chapters) {
    const path = `/chapters/${chapter.slug}`
    const locales = ['ht', 'fr', 'en'] as const

    for (const locale of locales) {
      urls.push({
        loc: generateCanonicalUrl(path, locale),
        lastmod: chapter.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.6,
        alternates: generateHreflangTags(path),
      })
    }
  }

  // Dynamic pages: Active supporter pages
  const supporterPages = await prisma.supporterPage.findMany({
    where: {
      status: 'ACTIVE',
      suspended: false,
    },
    select: { slug: true, updatedAt: true },
    take: 1000, // Limit to prevent huge sitemap
  })

  for (const page of supporterPages) {
    const path = `/s/${page.slug}`
    const locales = ['ht', 'fr', 'en'] as const

    for (const locale of locales) {
      urls.push({
        loc: generateCanonicalUrl(path, locale),
        lastmod: page.updatedAt.toISOString(),
        changefreq: 'monthly',
        priority: 0.5,
        alternates: generateHreflangTags(path),
      })
    }
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
    ${
      url.alternates
        ? url.alternates
            .map(
              (alt) =>
                `<xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />`
            )
            .join('\n    ')
        : ''
    }
  </url>`
  )
  .join('\n')}
</urlset>`

  return xml
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
