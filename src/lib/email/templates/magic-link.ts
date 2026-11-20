/**
 * Magic Link Email Template
 * 
 * For refund requests and email verification
 */

import { baseEmailTemplate, plainTextEmailTemplate, emailButton } from './base'

export interface MagicLinkEmailProps {
  locale: string
  recipientEmail: string
  magicLink: string
  purpose: 'refund' | 'email-verification'
  expiresInHours: number
}

/**
 * Magic link email (HTML)
 */
export function magicLinkEmailHtml(props: MagicLinkEmailProps): string {
  const { locale, recipientEmail, magicLink, purpose, expiresInHours } = props
  const translations = getTranslations(locale, purpose)

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
      ${translations.heading}
    </h2>
    
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;" class="dark-mode-text">
      ${translations.intro}
    </p>
    
    ${purpose === 'refund' ? `
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;" class="dark-mode-text">
      ${translations.refundInfo}
    </p>
    ` : ''}
    
    <!-- Magic Link Button -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 8px 0 24px;">
          ${emailButton({
            href: magicLink,
            text: translations.buttonText,
          })}
        </td>
      </tr>
    </table>
    
    <!-- Or copy link -->
    <p style="margin: 0 0 8px; font-size: 14px; line-height: 20px; color: #6B7280;" class="dark-mode-text-secondary">
      ${translations.orCopyLink}
    </p>
    <p style="margin: 0 0 24px; padding: 12px; background-color: #F3F4F6; border-radius: 4px; font-size: 13px; font-family: monospace; word-break: break-all; color: #374151;" class="dark-mode-bg dark-mode-text">
      ${magicLink}
    </p>
    
    <!-- Security notice -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px; padding: 16px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #92400E;">
            ⚠️ ${translations.securityHeading}
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 20px; color: #78350F;">
            ${translations.securityText}
          </p>
          <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 14px; line-height: 20px; color: #78350F;">
            <li>${translations.securityPoint1}</li>
            <li>${translations.securityPoint2}</li>
            <li>${translations.securityPoint3}</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <!-- Expiration notice -->
    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6B7280;" class="dark-mode-text-secondary">
      ${translations.expiresIn.replace('{hours}', expiresInHours.toString())}
    </p>
  `

  return baseEmailTemplate({
    locale,
    preheader: translations.preheader,
    content,
  })
}

/**
 * Magic link email (plain text)
 */
export function magicLinkEmailPlainText(props: MagicLinkEmailProps): string {
  const { locale, magicLink, purpose, expiresInHours } = props
  const translations = getTranslations(locale, purpose)

  const content = `
${translations.heading}

${translations.intro}

${purpose === 'refund' ? translations.refundInfo + '\n\n' : ''}

${translations.buttonText}:
${magicLink}

${translations.securityHeading}

${translations.securityText}

- ${translations.securityPoint1}
- ${translations.securityPoint2}
- ${translations.securityPoint3}

${translations.expiresIn.replace('{hours}', expiresInHours.toString())}
  `.trim()

  return plainTextEmailTemplate({ content, locale })
}

/**
 * Get translations
 */
function getTranslations(locale: string, purpose: 'refund' | 'email-verification') {
  const translations: Record<string, any> = {
    en: {
      refund: {
        preheader: 'Click to proceed with your refund request',
        heading: 'Verify Your Refund Request',
        intro: 'You requested a refund for a contribution to Jean Fritznel Bellefleur. To proceed, please verify your email address by clicking the button below.',
        refundInfo: 'This will create a refund request that will be reviewed by our team. We typically process refund requests within 3-5 business days.',
        buttonText: 'Verify & Submit Request',
        orCopyLink: 'Or copy and paste this link into your browser:',
        securityHeading: 'Security Notice',
        securityText: 'This is a secure, one-time link. For your protection:',
        securityPoint1: 'Only you should use this link',
        securityPoint2: 'Do not forward this email to anyone',
        securityPoint3: 'If you did not request this, please ignore this email',
        expiresIn: 'This link expires in {hours} hours.',
      },
      'email-verification': {
        preheader: 'Verify your email address',
        heading: 'Verify Your Email Address',
        intro: 'Thank you for signing up. Please verify your email address by clicking the button below.',
        buttonText: 'Verify Email Address',
        orCopyLink: 'Or copy and paste this link into your browser:',
        securityHeading: 'Security Notice',
        securityText: 'This is a secure, one-time link. For your protection:',
        securityPoint1: 'Only you should use this link',
        securityPoint2: 'Do not forward this email to anyone',
        securityPoint3: 'If you did not sign up, please ignore this email',
        expiresIn: 'This link expires in {hours} hours.',
      },
    },
    fr: {
      refund: {
        preheader: 'Cliquez pour poursuivre votre demande de remboursement',
        heading: 'Vérifiez Votre Demande de Remboursement',
        intro: 'Vous avez demandé un remboursement pour une contribution à Jean Fritznel Bellefleur. Pour continuer, veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous.',
        refundInfo: 'Cela créera une demande de remboursement qui sera examinée par notre équipe. Nous traitons généralement les demandes de remboursement dans un délai de 3 à 5 jours ouvrables.',
        buttonText: 'Vérifier et Soumettre la Demande',
        orCopyLink: 'Ou copiez et collez ce lien dans votre navigateur :',
        securityHeading: 'Avis de Sécurité',
        securityText: 'Ceci est un lien sécurisé à usage unique. Pour votre protection :',
        securityPoint1: 'Seul vous devriez utiliser ce lien',
        securityPoint2: 'Ne transférez pas cet e-mail à qui que ce soit',
        securityPoint3: 'Si vous n\'avez pas demandé cela, veuillez ignorer cet e-mail',
        expiresIn: 'Ce lien expire dans {hours} heures.',
      },
      'email-verification': {
        preheader: 'Vérifiez votre adresse e-mail',
        heading: 'Vérifiez Votre Adresse E-mail',
        intro: 'Merci de vous être inscrit. Veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous.',
        buttonText: 'Vérifier l\'Adresse E-mail',
        orCopyLink: 'Ou copiez et collez ce lien dans votre navigateur :',
        securityHeading: 'Avis de Sécurité',
        securityText: 'Ceci est un lien sécurisé à usage unique. Pour votre protection :',
        securityPoint1: 'Seul vous devriez utiliser ce lien',
        securityPoint2: 'Ne transférez pas cet e-mail à qui que ce soit',
        securityPoint3: 'Si vous ne vous êtes pas inscrit, veuillez ignorer cet e-mail',
        expiresIn: 'Ce lien expire dans {hours} heures.',
      },
    },
    ht: {
      refund: {
        preheader: 'Klike pou kontinye demann ranbousman w',
        heading: 'Verifye Demann Ranbousman W',
        intro: 'Ou te mande yon ranbousman pou yon kontribisyon bay Jean Fritznel Bellefleur. Pou kontinye, tanpri verifye adrès imèl ou lè w klike sou bouton anba a.',
        refundInfo: 'Sa ap kreye yon demann ranbousman ki pral revize pa ekip nou an. Nou trètman demann ranbousman nan 3-5 jou travay anjeneral.',
        buttonText: 'Verifye epi Soumèt Demann',
        orCopyLink: 'Oswa kopye epi kole lyen sa a nan navigatè w:',
        securityHeading: 'Avi Sekirite',
        securityText: 'Sa se yon lyen sekirize, sèlman yon fwa. Pou pwoteksyon w:',
        securityPoint1: 'Sèlman ou ki ta dwe itilize lyen sa a',
        securityPoint2: 'Pa voye imèl sa bay pèsonn',
        securityPoint3: 'Si ou pa t mande sa, tanpri inyore imèl sa a',
        expiresIn: 'Lyen sa a ekspire nan {hours} èdtan.',
      },
      'email-verification': {
        preheader: 'Verifye adrès imèl ou',
        heading: 'Verifye Adrès Imèl Ou',
        intro: 'Mèsi paske w enskri. Tanpri verifye adrès imèl ou lè w klike sou bouton anba a.',
        buttonText: 'Verifye Adrès Imèl',
        orCopyLink: 'Oswa kopye epi kole lyen sa a nan navigatè w:',
        securityHeading: 'Avi Sekirite',
        securityText: 'Sa se yon lyen sekirize, sèlman yon fwa. Pou pwoteksyon w:',
        securityPoint1: 'Sèlman ou ki ta dwe itilize lyen sa a',
        securityPoint2: 'Pa voye imèl sa bay pèsonn',
        securityPoint3: 'Si ou pa t enskri, tanpri inyore imèl sa a',
        expiresIn: 'Lyen sa a ekspire nan {hours} èdtan.',
      },
    },
  }

  return translations[locale]?.[purpose] || translations.en[purpose]
}
