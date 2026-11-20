import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { isDonationsLive, getCurrentMode, canCollectWaitlistData } from '@/lib/launch-gate/mode'
import { getCandidateConfig } from '@/lib/data/candidate'
import { ContributeFlow } from '@/components/contribute/ContributeFlow'
import { InfoOnlyPanel } from '@/components/contribute/InfoOnlyPanel'
import { WaitlistForm } from '@/components/contribute/WaitlistForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contribute')
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  }
}

export default async function ContributePage() {
  const [donationsLive, mode, canCollectData, config] = await Promise.all([
    isDonationsLive(),
    getCurrentMode(),
    canCollectWaitlistData(),
    getCandidateConfig(),
  ])

  // Render based on launch mode
  if (donationsLive) {
    return <ContributeFlow config={config} />
  }

  if (canCollectData) {
    return <WaitlistForm config={config} mode={mode} />
  }

  // INFO_ONLY mode
  return <InfoOnlyPanel config={config} />
}
