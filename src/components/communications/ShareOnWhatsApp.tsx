/**
 * Share on WhatsApp Button
 * 
 * Opens WhatsApp share dialog with pre-filled message
 * NO automation - uses whatsapp:// URL scheme only
 */

import { FaWhatsapp } from 'react-icons/fa'

interface ShareOnWhatsAppProps {
  text: string
  url?: string
  className?: string
}

export function ShareOnWhatsApp({ text, url, className = '' }: ShareOnWhatsAppProps) {
  const shareText = url ? `${text}\n\n${url}` : text
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-md font-medium transition-colors ${className}`}
      aria-label="Share on WhatsApp"
    >
      <FaWhatsapp className="w-5 h-5" />
      <span>Share</span>
    </a>
  )
}
