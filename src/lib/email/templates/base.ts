/**
 * Base Email Template
 * 
 * Table-based, responsive, dark-mode safe layout.
 * No tracking pixels, bulletproof buttons, system fonts.
 */

export interface EmailTemplateProps {
  locale: string
  preheader?: string
  content: string
  footerContent?: string
}

/**
 * Base HTML email template
 * 
 * Features:
 * - Table-based layout (max email client compatibility)
 * - Responsive (stacks on mobile)
 * - Dark mode safe (uses light colors, explicit backgrounds)
 * - System font stack
 * - Bulletproof buttons (VML for Outlook)
 * - No tracking pixels
 * - Disclosure in footer
 */
export function baseEmailTemplate(props: EmailTemplateProps): string {
  const { locale, preheader, content, footerContent } = props

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://diaspora4bellefleur.example.com'
  const siteName = 'Diaspora4Bellefleur'
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@diaspora4bellefleur.example.com'

  const translations = getTranslations(locale)

  return `
<!DOCTYPE html>
<html lang="${locale}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${translations.emailTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* System font stack */
    * {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
    }
    
    /* Reset */
    body, table, td, p, a, li { 
      -webkit-text-size-adjust: 100%; 
      -ms-text-size-adjust: 100%; 
    }
    table, td { 
      mso-table-lspace: 0pt; 
      mso-table-rspace: 0pt; 
    }
    img { 
      -ms-interpolation-mode: bicubic; 
      border: 0; 
      height: auto; 
      line-height: 100%; 
      outline: none; 
      text-decoration: none; 
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .content-width { 
        width: 100% !important; 
      }
      .mobile-padding { 
        padding: 20px !important; 
      }
      .mobile-hide { 
        display: none !important; 
      }
      .mobile-center { 
        text-align: center !important; 
      }
    }
    
    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { 
        background-color: #1a1a1a !important; 
      }
      .dark-mode-text { 
        color: #f5f5f5 !important; 
      }
      .dark-mode-text-secondary { 
        color: #cccccc !important; 
      }
      .dark-mode-border { 
        border-color: #333333 !important; 
      }
    }
    
    /* Bulletproof button */
    .button {
      background-color: #C8432B;
      border-radius: 6px;
      display: inline-block;
      font-size: 16px;
      font-weight: 600;
      line-height: 48px;
      text-align: center;
      text-decoration: none;
      -webkit-text-size-adjust: none;
      mso-hide: all;
    }
    .button a {
      color: #ffffff;
      display: block;
      padding: 0 24px;
      text-decoration: none;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6EE;">
  <!-- Preheader (hidden text for email preview) -->
  ${preheader ? `
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(preheader)}
  </div>
  ` : ''}
  
  <!-- Container -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF6EE;" class="dark-mode-bg">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main content table -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="content-width" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="dark-mode-bg">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px; border-bottom: 1px solid #E5E7EB;" class="mobile-padding dark-mode-border">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0F3D4A;" class="dark-mode-text">
                ${siteName}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;" class="mobile-padding">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; border-radius: 0 0 8px 8px;" class="mobile-padding dark-mode-bg dark-mode-border">
              ${footerContent || ''}
              
              <!-- Affiliation Disclosure -->
              <p style="margin: 16px 0 0; font-size: 12px; line-height: 18px; color: #6B7280;" class="dark-mode-text-secondary">
                ${translations.affiliationDisclosure}
              </p>
              
              <!-- Sender Identification -->
              <p style="margin: 12px 0 0; font-size: 12px; line-height: 18px; color: #6B7280;" class="dark-mode-text-secondary">
                ${translations.sentFrom} <strong>${siteName}</strong><br>
                <a href="${siteUrl}" style="color: #0F3D4A; text-decoration: none;" class="dark-mode-text">${siteUrl}</a><br>
                ${translations.questions} <a href="mailto:${supportEmail}" style="color: #0F3D4A; text-decoration: none;" class="dark-mode-text">${supportEmail}</a>
              </p>
              
              <!-- Unsubscribe (if newsletter) -->
              ${locale === 'newsletter' ? `
              <p style="margin: 12px 0 0; font-size: 12px; line-height: 18px; color: #6B7280;" class="dark-mode-text-secondary">
                <a href="{{unsubscribe_url}}" style="color: #6B7280; text-decoration: underline;">
                  ${translations.unsubscribe}
                </a>
              </p>
              ` : ''}
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim()
}

/**
 * Plain text email template
 */
export function plainTextEmailTemplate(props: {
  content: string
  locale: string
}): string {
  const { content, locale } = props

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://diaspora4bellefleur.example.com'
  const siteName = 'Diaspora4Bellefleur'
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@diaspora4bellefleur.example.com'

  const translations = getTranslations(locale)

  return `
${content}

---

${translations.affiliationDisclosure}

${translations.sentFrom} ${siteName}
${siteUrl}

${translations.questions} ${supportEmail}

  `.trim()
}

/**
 * Bulletproof button (works in Outlook with VML)
 */
export function emailButton(props: {
  href: string
  text: string
  color?: string
}): string {
  const { href, text, color = '#C8432B' } = props

  return `
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="13%" strokecolor="${color}" fillcolor="${color}">
  <w:anchorlock/>
  <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">${escapeHtml(text)}</center>
</v:roundrect>
<![endif]-->
<a href="${href}" style="background-color:${color};border-radius:6px;color:#ffffff;display:inline-block;font-size:16px;font-weight:600;line-height:48px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;mso-hide:all;">
  ${escapeHtml(text)}
</a>
  `.trim()
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Get translations for email footer
 */
function getTranslations(locale: string): {
  emailTitle: string
  affiliationDisclosure: string
  sentFrom: string
  questions: string
  unsubscribe: string
} {
  const translations: Record<string, any> = {
    en: {
      emailTitle: 'Diaspora4Bellefleur',
      affiliationDisclosure: 'Independent supporter initiative, not authorized by or affiliated with the candidate, his campaign or any party.',
      sentFrom: 'Sent from',
      questions: 'Questions?',
      unsubscribe: 'Unsubscribe',
    },
    fr: {
      emailTitle: 'Diaspora4Bellefleur',
      affiliationDisclosure: 'Initiative de supporters indépendants, non autorisée par ou affiliée au candidat, sa campagne ou tout parti.',
      sentFrom: 'Envoyé de',
      questions: 'Questions ?',
      unsubscribe: 'Se désabonner',
    },
    ht: {
      emailTitle: 'Diaspora4Bellefleur',
      affiliationDisclosure: 'Inisyativ sipòtè endepandan, pa otorize pa oswa afilie ak kandida a, kanpay li oswa nenpòt pati.',
      sentFrom: 'Voye soti nan',
      questions: 'Kesyon?',
      unsubscribe: 'Dezabòne',
    },
  }

  return translations[locale] || translations.en
}
