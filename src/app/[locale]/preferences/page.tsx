/**
 * Preference Center
 * 
 * Allows users to manage their communication preferences
 * Access via magic link sent to email
 */

import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PreferenceCenterClient } from '@/components/communications/PreferenceCenterClient'

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations('communications.preferences')
  
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function PreferencesPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { token?: string }
}) {
  const t = await getTranslations('communications.preferences')
  
  // Require magic link token
  if (!searchParams.token) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h1 className="font-fraunces text-2xl font-bold text-ink dark:text-sand-paper mb-4">
            {t('tokenRequired.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('tokenRequired.description')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('tokenRequired.help')}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="font-fraunces text-3xl font-bold text-ink dark:text-sand-paper mb-2">
        {t('title')}
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        {t('description')}
      </p>
      
      <PreferenceCenterClient token={searchParams.token} locale={params.locale} />
    </div>
  )
}
