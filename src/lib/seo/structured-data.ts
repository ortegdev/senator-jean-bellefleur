/**
 * Structured Data (Schema.org / JSON-LD)
 * 
 * Only for verified facts - never fabricate or claim unverified information
 */

import { getCandidateConfig } from '@/lib/config/candidate'
import type { Organization, WebSite, BreadcrumbList, Person } from 'schema-dts'

// ============================================================================
// ORGANIZATION SCHEMA
// ============================================================================

/**
 * Generate Organization schema for the supporter initiative
 * 
 * Note: This is for the SUPPORTER INITIATIVE, not the campaign.
 * Affiliation status is clearly stated.
 */
export async function generateOrganizationSchema(): Promise<Organization> {
  const config = await getCandidateConfig()

  return {
    '@type': 'Organization',
    '@id': `${config.domain}#organization`,
    name: 'Diaspora4Bellefleur',
    description:
      config.affiliationText ||
      'Independent supporter initiative for Jean Fritznel Bellefleur',
    url: config.domain || '',
    logo: config.photoUrl
      ? {
          '@type': 'ImageObject',
          url: config.photoUrl,
        }
      : undefined,
    contactPoint: {
      '@type': 'ContactPoint',
      email: config.supportEmail,
      contactType: 'supporter relations',
    },
  }
}

// ============================================================================
// WEBSITE SCHEMA
// ============================================================================

/**
 * Generate WebSite schema with search functionality
 */
export async function generateWebSiteSchema(locale: 'ht' | 'fr' | 'en'): Promise<WebSite> {
  const config = await getCandidateConfig()

  const names = {
    ht: 'Diaspora4Bellefleur - Sipòtè pou Senatè Nòdwès',
    fr: 'Diaspora4Bellefleur - Supporters pour Sénateur du Nord-Ouest',
    en: 'Diaspora4Bellefleur - Supporters for Nord-Ouest Senator',
  }

  return {
    '@type': 'WebSite',
    '@id': `${config.domain}#website`,
    name: names[locale],
    url: config.domain || '',
    inLanguage: locale === 'ht' ? 'ht_HT' : locale === 'fr' ? 'fr_FR' : 'en_US',
    publisher: {
      '@id': `${config.domain}#organization`,
    },
  }
}

// ============================================================================
// PERSON SCHEMA (Only if verified)
// ============================================================================

/**
 * Generate Person schema for candidate
 * 
 * ONLY includes verified information. Never fabricate.
 */
export async function generatePersonSchema(): Promise<Person | null> {
  const config = await getCandidateConfig()

  // Only generate if candidacy status is verified
  if (config.candidacyStatus === 'UNVERIFIED') {
    return null
  }

  // Get verified content about candidate from database
  const { prisma } = await import('@/lib/db/prisma')

  const bioContent = await prisma.content.findFirst({
    where: {
      category: 'BIOGRAPHY',
      status: 'PUBLISHED',
    },
  })

  if (!bioContent) {
    return null // No verified bio available
  }

  const person: Person = {
    '@type': 'Person',
    name: config.candidateName,
    jobTitle:
      config.candidacyStatus === 'ON_FINAL_LIST' ||
      config.candidacyStatus === 'REGISTERED_PRELIMINARY'
        ? `Candidate for Senator - ${config.department} Department, Haiti`
        : undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'HT',
      addressRegion: config.department,
    },
  }

  // Only add image if approved photo exists
  if (config.photoUrl) {
    person.image = {
      '@type': 'ImageObject',
      url: config.photoUrl,
    }
  }

  return person
}

// ============================================================================
// BREADCRUMB SCHEMA
// ============================================================================

export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ============================================================================
// COMBINED JSON-LD
// ============================================================================

/**
 * Generate complete JSON-LD structured data for page
 */
export async function generateStructuredData(params: {
  locale: 'ht' | 'fr' | 'en'
  breadcrumbs?: BreadcrumbItem[]
  includePerson?: boolean
}): Promise<string> {
  const schemas: any[] = []

  // Always include organization and website
  const organization = await generateOrganizationSchema()
  const website = await generateWebSiteSchema(params.locale)

  schemas.push(organization, website)

  // Add person schema if requested and verified
  if (params.includePerson) {
    const person = await generatePersonSchema()
    if (person) {
      schemas.push(person)
    }
  }

  // Add breadcrumbs if provided
  if (params.breadcrumbs && params.breadcrumbs.length > 0) {
    const breadcrumbs = generateBreadcrumbSchema(params.breadcrumbs)
    schemas.push(breadcrumbs)
  }

  // Wrap in @graph
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': schemas,
  }

  return JSON.stringify(jsonLd, null, 2)
}

// ============================================================================
// CONTENT SCHEMA (Article/BlogPosting)
// ============================================================================

/**
 * Generate Article schema for content pages (Issues, Updates)
 * 
 * Only use for published, sourced content
 */
export async function generateArticleSchema(params: {
  title: string
  description: string
  datePublished: Date
  dateModified?: Date
  url: string
  sources?: { title: string; url: string }[]
}): Promise<string> {
  const config = await getCandidateConfig()
  const organization = await generateOrganizationSchema()

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    url: params.url,
    datePublished: params.datePublished.toISOString(),
    dateModified: (params.dateModified || params.datePublished).toISOString(),
    author: organization,
    publisher: organization,
    // Only include sources if provided
    citation: params.sources?.map((source) => ({
      '@type': 'CreativeWork',
      name: source.title,
      url: source.url,
    })),
  }

  return JSON.stringify(article, null, 2)
}
