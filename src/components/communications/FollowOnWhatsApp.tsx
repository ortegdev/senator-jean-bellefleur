/**
 * Follow on WhatsApp Module
 * 
 * Displays WhatsApp Channel link and QR code (when configured)
 * NO automation, NO API usage - manual presence only
 * 
 * Hidden when whatsappChannelUrl is empty
 */

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FaWhatsapp } from 'react-icons/fa'

interface FollowOnWhatsAppProps {
  channelUrl: string | null
  locale: string
}

export function FollowOnWhatsApp({ channelUrl, locale }: FollowOnWhatsAppProps) {
  // Hide module if no channel URL configured
  if (!channelUrl || channelUrl.trim() === '') {
    return null
  }
  
  const t = useTranslations('communications.whatsapp')
  
  return (
    <div className="bg-white dark:bg-ink rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start gap-4">
        {/* WhatsApp Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
            <FaWhatsapp className="w-7 h-7 text-white" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-fraunces text-xl font-bold text-ink dark:text-sand-paper mb-2">
            {t('title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {t('description')}
          </p>
          
          {/* CTA Button */}
          <Link
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-md font-medium transition-colors"
          >
            <FaWhatsapp className="w-5 h-5" />
            {t('followButton')}
          </Link>
          
          {/* Disclosure */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            {t('disclosure')}
          </p>
        </div>
        
        {/* QR Code (if available) */}
        {/* TODO: Generate QR code from channelUrl */}
        {/* For now, just placeholder */}
      </div>
    </div>
  )
}
