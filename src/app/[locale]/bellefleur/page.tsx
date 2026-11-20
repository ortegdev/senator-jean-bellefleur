import { notFound } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getCandidateConfig } from '@/lib/config/candidate'
import { getPublishedContent } from '@/lib/data/content'
import { getPublishedFAQs } from '@/lib/data/faq'
import { ProfileIntro } from '@/components/profile/ProfileIntro'
import { ProfileNews } from '@/components/profile/ProfileNews'
import { InTheNewsSection } from '@/components/news/InTheNewsSection'
import HisJourney from '@/components/profile/HisJourney'
import { ProfileSupporter } from '@/components/profile/ProfileSupporter'
import { ProfileFAQ } from '@/components/profile/ProfileFAQ'
import { type Locale } from '@/i18n/config'
import type { Metadata } from 'next'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface ProfilePageProps {
  params: Promise<{
    locale: Locale
  }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params
  const config = await getCandidateConfig()

  return {
    title: `${config.candidateName} - Profile`,
    description: `Learn about ${config.candidateName}, candidate for ${config.office} of ${config.department}, Haiti.`,
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params
  const config = await getCandidateConfig()

  // Verify slug matches
  if (config.slug !== 'bellefleur') {
    notFound()
  }

  // Fetch published content
  const [
    journeyContent,
    faqs,
  ] = await Promise.all([
    getPublishedContent(
      ['EDUCATION', 'PROFESSION', 'PUBLIC_SERVICE', 'PARTY_AFFILIATION', 'CEP_REGISTRATION'],
      locale
    ),
    getPublishedFAQs(locale),
  ])

  return (
    <div className="bg-sandPaper-50">
      {/* Intro */}
      <ProfileIntro config={config} locale={locale} />

      {/* In the News - ABOVE His Journey (Principle: directly above) */}
      <InTheNewsSection locale={locale} />

      {/* His Journey - Timeline with sources */}
      <HisJourney entries={journeyContent} locale={locale} />

      {/* Supporter Perspective (clearly labeled) */}
      <ProfileSupporter config={config} locale={locale} />

      {/* FAQ */}
      <ProfileFAQ faqs={faqs} locale={locale} />
    </div>
  )
}
