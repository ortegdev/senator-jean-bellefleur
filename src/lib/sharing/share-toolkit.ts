/**
 * Share Toolkit
 * 
 * Multi-platform sharing with:
 * - Pre-written localized messages (no official status claims)
 * - Platform-specific URLs (WhatsApp, Facebook, Telegram, SMS)
 * - Web Share API support
 * - Copy link functionality
 * - UTM parameter tracking
 */

import { getCandidateConfig } from '@/lib/config/candidate'

// ============================================================================
// SHARE MESSAGE TEMPLATES
// ============================================================================

interface ShareMessageTemplates {
  ht: string
  fr: string
  en: string
}

/**
 * Get localized share message template
 * 
 * IMPORTANT: Messages never claim official status.
 * Always identify as supporter initiative.
 */
export async function getShareMessage(
  locale: 'ht' | 'fr' | 'en',
  context: 'general' | 'chapter' | 'supporter',
  contextName?: string
): Promise<string> {
  const config = await getCandidateConfig()

  const templates: Record<typeof context, ShareMessageTemplates> = {
    general: {
      ht: `Mwen sipòte ${config.candidateName} pou Senatè ${config.department}. Klike la a pou w aprann plis.`,
      fr: `Je soutiens ${config.candidateName} pour Sénateur du ${config.department}. Cliquez pour en savoir plus.`,
      en: `I'm supporting ${config.candidateName} for Senator of ${config.department}. Click to learn more.`,
    },
    chapter: {
      ht: `Jwenn nou nan gwoup ${contextName || 'nou an'} ki sipòte ${config.candidateName} pou Senatè ${config.department}.`,
      fr: `Rejoignez notre groupe ${contextName || ''} qui soutient ${config.candidateName} pour Sénateur du ${config.department}.`,
      en: `Join our ${contextName || ''} group supporting ${config.candidateName} for Senator of ${config.department}.`,
    },
    supporter: {
      ht: `${contextName || 'Mwen'} sipòte ${config.candidateName} pou Senatè ${config.department}. Ede nou fè diferans!`,
      fr: `${contextName || 'Je'} soutien${contextName ? '' : 's'} ${config.candidateName} pour Sénateur du ${config.department}. Aidez-nous à faire la différence!`,
      en: `${contextName || 'I'} ${contextName ? 'supports' : 'support'} ${config.candidateName} for Senator of ${config.department}. Help us make a difference!`,
    },
  }

  return templates[context][locale]
}

// ============================================================================
// SHARE URLS
// ============================================================================

interface ShareUrlParams {
  url: string
  message: string
  source: 'chapter' | 'supporter' | 'page' // For UTM tracking
  medium: 'whatsapp' | 'facebook' | 'messenger' | 'telegram' | 'sms' | 'copy' | 'web-share'
  campaign?: string
}

/**
 * Build URL with UTM parameters
 */
export function buildUrlWithUtm(baseUrl: string, params: ShareUrlParams): string {
  const url = new URL(baseUrl)

  // Add UTM parameters for tracking
  url.searchParams.set('utm_source', params.source)
  url.searchParams.set('utm_medium', params.medium)
  if (params.campaign) {
    url.searchParams.set('utm_campaign', params.campaign)
  }

  return url.toString()
}

/**
 * Get WhatsApp share URL
 */
export function getWhatsAppShareUrl(params: ShareUrlParams): string {
  const trackedUrl = buildUrlWithUtm(params.url, params)
  const text = `${params.message}\n\n${trackedUrl}`

  // WhatsApp Web (desktop) or app (mobile)
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/**
 * Get Facebook share URL
 */
export function getFacebookShareUrl(params: ShareUrlParams): string {
  const trackedUrl = buildUrlWithUtm(params.url, params)

  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackedUrl)}`
}

/**
 * Get Facebook Messenger share URL
 */
export function getMessengerShareUrl(params: ShareUrlParams): string {
  const trackedUrl = buildUrlWithUtm(params.url, params)

  return `fb-messenger://share?link=${encodeURIComponent(trackedUrl)}`
}

/**
 * Get Telegram share URL
 */
export function getTelegramShareUrl(params: ShareUrlParams): string {
  const trackedUrl = buildUrlWithUtm(params.url, params)
  const text = `${params.message}\n\n${trackedUrl}`

  return `https://t.me/share/url?url=${encodeURIComponent(trackedUrl)}&text=${encodeURIComponent(params.message)}`
}

/**
 * Get SMS share URL (with message)
 */
export function getSmsShareUrl(params: ShareUrlParams): string {
  const trackedUrl = buildUrlWithUtm(params.url, params)
  const text = `${params.message}\n\n${trackedUrl}`

  // SMS URL format varies by platform, this is the most compatible
  return `sms:?body=${encodeURIComponent(text)}`
}

/**
 * Get email share URL
 */
export function getEmailShareUrl(params: ShareUrlParams, subject: string): string {
  const trackedUrl = buildUrlWithUtm(params.url, { ...params, medium: 'copy' })
  const body = `${params.message}\n\n${trackedUrl}`

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// ============================================================================
// WEB SHARE API
// ============================================================================

export interface WebShareData {
  title: string
  text: string
  url: string
}

/**
 * Check if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'share' in navigator
}

/**
 * Share using Web Share API
 */
export async function shareViaWebApi(data: WebShareData): Promise<boolean> {
  if (!isWebShareSupported()) {
    return false
  }

  try {
    await navigator.share(data)
    return true
  } catch (error) {
    // User cancelled or error occurred
    console.error('Web Share API error:', error)
    return false
  }
}

// ============================================================================
// COPY TO CLIPBOARD
// ============================================================================

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    }
  } catch (error) {
    console.error('Copy to clipboard error:', error)
    return false
  }
}

// ============================================================================
// SHARE ANALYTICS TRACKING
// ============================================================================

/**
 * Track share event (privacy-friendly, no PII)
 */
export function trackShareEvent(params: {
  medium: ShareUrlParams['medium']
  source: ShareUrlParams['source']
  url: string
}) {
  // This will integrate with analytics in separate file
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible('share-click', {
      props: {
        medium: params.medium,
        source: params.source,
        path: new URL(params.url).pathname,
      },
    })
  }
}

// ============================================================================
// COMPLETE SHARE TOOLKIT
// ============================================================================

export interface ShareToolkitOptions {
  url: string
  locale: 'ht' | 'fr' | 'en'
  context: 'general' | 'chapter' | 'supporter'
  contextName?: string
  source: ShareUrlParams['source']
  campaign?: string
}

export interface ShareToolkit {
  message: string
  urls: {
    whatsapp: string
    facebook: string
    messenger: string
    telegram: string
    sms: string
    email: string
    copy: string
  }
  webShare: {
    supported: boolean
    data: WebShareData
  }
}

/**
 * Generate complete share toolkit for given context
 */
export async function generateShareToolkit(
  options: ShareToolkitOptions
): Promise<ShareToolkit> {
  const config = await getCandidateConfig()
  const message = await getShareMessage(options.locale, options.context, options.contextName)

  const baseParams: Omit<ShareUrlParams, 'medium'> = {
    url: options.url,
    message,
    source: options.source,
    campaign: options.campaign,
  }

  const titleMap = {
    ht: `Sipòte ${config.candidateName}`,
    fr: `Soutenir ${config.candidateName}`,
    en: `Support ${config.candidateName}`,
  }

  return {
    message,
    urls: {
      whatsapp: getWhatsAppShareUrl({ ...baseParams, medium: 'whatsapp' }),
      facebook: getFacebookShareUrl({ ...baseParams, medium: 'facebook' }),
      messenger: getMessengerShareUrl({ ...baseParams, medium: 'messenger' }),
      telegram: getTelegramShareUrl({ ...baseParams, medium: 'telegram' }),
      sms: getSmsShareUrl({ ...baseParams, medium: 'sms' }),
      email: getEmailShareUrl(
        { ...baseParams, medium: 'copy' },
        titleMap[options.locale]
      ),
      copy: buildUrlWithUtm(options.url, { ...baseParams, medium: 'copy' }),
    },
    webShare: {
      supported: isWebShareSupported(),
      data: {
        title: titleMap[options.locale],
        text: message,
        url: buildUrlWithUtm(options.url, { ...baseParams, medium: 'web-share' }),
      },
    },
  }
}

// ============================================================================
// INSTAGRAM STORY SHARING (Special Case)
// ============================================================================

/**
 * Instagram doesn't support URL sharing directly.
 * This generates a shareable image with QR code (handled in social-cards.ts)
 * 
 * Users download the image and share manually to Instagram Stories.
 */
export interface InstagramStoryAsset {
  imageUrl: string
  instructions: {
    ht: string
    fr: string
    en: string
  }
}

export function getInstagramStoryInstructions(locale: 'ht' | 'fr' | 'en'): string {
  const instructions = {
    ht: '1. Telechaje imaj la\n2. Louvri Instagram\n3. Swiv etap yo pou ajoute li nan istwa ou',
    fr: "1. Télécharger l'image\n2. Ouvrir Instagram\n3. Suivre les étapes pour l'ajouter à votre story",
    en: '1. Download this image\n2. Open Instagram\n3. Follow steps to add it to your story',
  }

  return instructions[locale]
}

// ============================================================================
// TYPE DECLARATIONS (for analytics)
// ============================================================================

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: {
        props?: Record<string, string | number | boolean>
        callback?: () => void
      }
    ) => void
  }
}
