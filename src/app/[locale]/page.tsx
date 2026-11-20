import { Hero } from '@/components/home/Hero'
import { LiveProgress } from '@/components/home/LiveProgress'
import { WhyGiftsMatter } from '@/components/home/WhyGiftsMatter'
import { NordOuestMap } from '@/components/home/NordOuestMap'
import { CandidateTeaser } from '@/components/home/CandidateTeaser'
import { HowItWorks } from '@/components/home/HowItWorks'
import { FAQPreview } from '@/components/home/FAQPreview'
import { SignupBlock } from '@/components/home/SignupBlock'
import { type Locale } from '@/i18n/config'

interface HomePageProps {
  params: Promise<{
    locale: Locale
  }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params

  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Live Progress (DONATIONS_LIVE only, real data) */}
      <LiveProgress locale={locale} />

      {/* Why Small Gifts Matter */}
      <WhyGiftsMatter />

      {/* Nord-Ouest Roots Map */}
      <NordOuestMap />

      {/* Candidate Teaser */}
      <CandidateTeaser />

      {/* How It Works */}
      <HowItWorks />

      {/* FAQ Preview */}
      <FAQPreview />

      {/* Mode-Aware Signup Block */}
      <SignupBlock />
    </>
  )
}
