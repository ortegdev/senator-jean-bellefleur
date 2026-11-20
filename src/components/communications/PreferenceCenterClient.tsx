/**
 * Preference Center Client Component
 * 
 * Loads and updates contact preferences
 * Per-channel, per-topic consent management
 */

'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ConsentCheckbox } from './ConsentCheckbox'

interface ContactPreferences {
  email: string
  name?: string
  locale: string
  consents: Array<{
    channel: string
    topic: string
    status: string
    grantedAt: string | null
  }>
}

interface PreferenceCenterClientProps {
  token: string
  locale: string
}

export function PreferenceCenterClient({ token, locale }: PreferenceCenterClientProps) {
  const t = useTranslations('communications.preferences')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [preferences, setPreferences] = useState<ContactPreferences | null>(null)
  
  // Load preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch(`/api/communications/preferences?token=${token}`)
        
        if (!response.ok) {
          throw new Error('Failed to load preferences')
        }
        
        const data = await response.json()
        setPreferences(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    
    loadPreferences()
  }, [token])
  
  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    
    try {
      const response = await fetch('/api/communications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          consents: preferences?.consents || [],
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full" />
      </div>
    )
  }
  
  if (error && !preferences) {
    return (
      <div className="bg-coral/10 border border-coral rounded-lg p-6">
        <p className="text-coral font-medium">{error}</p>
      </div>
    )
  }
  
  if (!preferences) {
    return null
  }
  
  return (
    <div className="space-y-8">
      {/* Contact Info */}
      <div className="bg-white dark:bg-ink rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-fraunces text-xl font-bold text-ink dark:text-sand-paper mb-4">
          {t('contactInfo.title')}
        </h2>
        <div className="space-y-2">
          {preferences.name && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{t('contactInfo.name')}:</span> {preferences.name}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">{t('contactInfo.email')}:</span> {preferences.email}
          </p>
        </div>
      </div>
      
      {/* Email Preferences */}
      <div className="bg-white dark:bg-ink rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-fraunces text-xl font-bold text-ink dark:text-sand-paper mb-4">
          {t('email.title')}
        </h2>
        <div className="space-y-4">
          <ConsentCheckbox
            channel="EMAIL"
            topic="NEWS"
            label={t('email.news.label')}
            description={t('email.news.description')}
          />
          <ConsentCheckbox
            channel="EMAIL"
            topic="EVENTS"
            label={t('email.events.label')}
            description={t('email.events.description')}
          />
          <ConsentCheckbox
            channel="EMAIL"
            topic="FUNDRAISING"
            label={t('email.fundraising.label')}
            description={t('email.fundraising.description')}
          />
          <ConsentCheckbox
            channel="EMAIL"
            topic="VOLUNTEER"
            label={t('email.volunteer.label')}
            description={t('email.volunteer.description')}
          />
        </div>
      </div>
      
      {/* SMS Preferences (if SMS enabled) */}
      {/* TODO: Add SMS section when SMS adapter is live */}
      
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-sea-green/10 border border-sea-green rounded-lg p-4">
          <p className="text-sm text-sea-green font-medium">{t('saved')}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-coral/10 border border-coral rounded-lg p-4">
          <p className="text-sm text-coral font-medium">{error}</p>
        </div>
      )}
      
      {/* Save Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-coral hover:bg-coral/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
        >
          {saving ? t('saving') : t('saveButton')}
        </button>
        
        <button
          onClick={() => {
            // TODO: Implement unsubscribe all
          }}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
        >
          {t('unsubscribeAll')}
        </button>
      </div>
    </div>
  )
}
