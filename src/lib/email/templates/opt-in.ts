/**
 * Double Opt-In and Confirmation Email Templates
 * 
 * For newsletter and waitlist signups
 */

import { baseEmailTemplate, plainTextEmailTemplate, emailButton } from './base'

export interface DoubleOptInEmailProps {
  locale: string
  recipientEmail: string
  confirmationLink: string
  listType: 'newsletter' | 'waitlist'
}

export interface ConfirmationEmailProps {
  locale: string
  recipientEmail: string
  listType: 'newsletter' | 'waitlist'
  unsubscribeLink?: string
}

/**
 * Double opt-in email (HTML) - Step 1
 */
export function doubleOptInEmailHtml(props: DoubleOptInEmailProps): string {
  const { locale, confirmationLink, listType } = props
  const translations = getOptInTranslations(locale, listType)

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
      ${translations.heading}
    </h2>
    
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;" class="dark-mode-text">
      ${translations.intro}
    </p>
    
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;" class="dark-mode-text">
      ${translations.instruction}
    </p>
    
    <!-- Confirmation Button -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 8px 0 24px;">
          ${emailButton({
            href: confirmationLink,
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
      ${confirmationLink}
    </p>
    
    <!-- What to expect -->
    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
      ${translations.whatToExpectHeading}
    </h3>
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 20px; color: #374151;" class="dark-mode-text">
      ${translations.whatToExpectText}
    </p>
    
    <!-- Didn't sign up? -->
    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6B7280;" class="dark-mode-text-secondary">
      ${translations.didntSignUp}
    </p>
  `

  return baseEmailTemplate({
    locale,
    preheader: translations.preheader,
    content,
  })
}

/**
 * Double opt-in email (plain text) - Step 1
 */
export function doubleOptInEmailPlainText(props: DoubleOptInEmailProps): string {
  const { locale, confirmationLink, listType } = props
  const translations = getOptInTranslations(locale, listType)

  const content = `
${translations.heading}

${translations.intro}

${translations.instruction}

${translations.buttonText}:
${confirmationLink}

${translations.whatToExpectHeading}

${translations.whatToExpectText}

${translations.didntSignUp}
  `.trim()

  return plainTextEmailTemplate({ content, locale })
}

/**
 * Confirmation email (HTML) - Step 2
 */
export function confirmationEmailHtml(props: ConfirmationEmailProps): string {
  const { locale, listType, unsubscribeLink } = props
  const translations = getConfirmationTranslations(locale, listType)

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
      ${translations.heading}
    </h2>
    
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;" class="dark-mode-text">
      ${translations.intro}
    </p>
    
    ${listType === 'waitlist' ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px; padding: 16px; background-color: #E0F2FE; border-left: 4px solid #0EA5E9; border-radius: 4px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #075985;">
            ℹ️ ${translations.waitlistInfoHeading}
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 20px; color: #0c4a6e;">
            ${translations.waitlistInfoText}
          </p>
        </td>
      </tr>
    </table>
    ` : ''}
    
    <!-- What's next -->
    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
      ${translations.whatsNextHeading}
    </h3>
    <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 14px; line-height: 24px; color: #374151;" class="dark-mode-text">
      ${translations.whatsNextPoints.map(point => `<li>${point}</li>`).join('')}
    </ul>
    
    <!-- Learn more CTA -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 8px 0 24px;">
          ${emailButton({
            href: process.env.NEXT_PUBLIC_SITE_URL + '/' + locale,
            text: translations.learnMoreButton,
            color: '#0F3D4A',
          })}
        </td>
      </tr>
    </table>
    
    <!-- Privacy note -->
    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6B7280;" class="dark-mode-text-secondary">
      ${translations.privacyNote}
    </p>
  `

  const footerContent = unsubscribeLink ? `
    <p style="margin: 0 0 16px; font-size: 12px; line-height: 18px; color: #6B7280;" class="dark-mode-text-secondary">
      <a href="${unsubscribeLink}" style="color: #6B7280; text-decoration: underline;">
        ${translations.unsubscribe}
      </a>
    </p>
  ` : ''

  return baseEmailTemplate({
    locale,
    preheader: translations.preheader,
    content,
    footerContent,
  })
}

/**
 * Confirmation email (plain text) - Step 2
 */
export function confirmationEmailPlainText(props: ConfirmationEmailProps): string {
  const { locale, listType, unsubscribeLink } = props
  const translations = getConfirmationTranslations(locale, listType)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL + '/' + locale

  const content = `
${translations.heading}

${translations.intro}

${listType === 'waitlist' ? `
${translations.waitlistInfoHeading}
${translations.waitlistInfoText}
` : ''}

${translations.whatsNextHeading}

${translations.whatsNextPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

${translations.learnMoreButton}: ${siteUrl}

${translations.privacyNote}

${unsubscribeLink ? `\n${translations.unsubscribe}: ${unsubscribeLink}` : ''}
  `.trim()

  return plainTextEmailTemplate({ content, locale })
}

/**
 * Get opt-in translations
 */
function getOptInTranslations(locale: string, listType: 'newsletter' | 'waitlist') {
  const translations: Record<string, any> = {
    en: {
      newsletter: {
        preheader: 'Confirm your newsletter subscription',
        heading: 'Confirm Your Newsletter Subscription',
        intro: 'Thank you for your interest in updates about Jean Fritznel Bellefleur\'s candidacy for Senator of Nord-Ouest.',
        instruction: 'To complete your subscription, please confirm your email address by clicking the button below.',
        buttonText: 'Confirm Subscription',
        orCopyLink: 'Or copy and paste this link into your browser:',
        whatToExpectHeading: 'What to Expect',
        whatToExpectText: 'You\'ll receive occasional updates about the campaign, candidacy status, and ways to support. You can unsubscribe at any time.',
        didntSignUp: 'If you did not sign up for this newsletter, you can safely ignore this email.',
      },
      waitlist: {
        preheader: 'Confirm your waitlist signup',
        heading: 'Confirm Your Waitlist Signup',
        intro: 'Thank you for your interest in supporting Jean Fritznel Bellefleur\'s candidacy for Senator of Nord-Ouest.',
        instruction: 'To join the waitlist, please confirm your email address by clicking the button below.',
        buttonText: 'Join Waitlist',
        orCopyLink: 'Or copy and paste this link into your browser:',
        whatToExpectHeading: 'What to Expect',
        whatToExpectText: 'You\'ll be notified when contributions become available. We\'ll also send occasional updates about the campaign and candidacy status.',
        didntSignUp: 'If you did not sign up for the waitlist, you can safely ignore this email.',
      },
    },
    fr: {
      newsletter: {
        preheader: 'Confirmez votre abonnement à la newsletter',
        heading: 'Confirmez Votre Abonnement à la Newsletter',
        intro: 'Merci de votre intérêt pour les mises à jour sur la candidature de Jean Fritznel Bellefleur au poste de Sénateur du Nord-Ouest.',
        instruction: 'Pour finaliser votre abonnement, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous.',
        buttonText: 'Confirmer l\'Abonnement',
        orCopyLink: 'Ou copiez et collez ce lien dans votre navigateur :',
        whatToExpectHeading: 'À Quoi S\'Attendre',
        whatToExpectText: 'Vous recevrez des mises à jour occasionnelles sur la campagne, le statut de candidature et les moyens de soutien. Vous pouvez vous désabonner à tout moment.',
        didntSignUp: 'Si vous ne vous êtes pas inscrit à cette newsletter, vous pouvez ignorer cet e-mail en toute sécurité.',
      },
      waitlist: {
        preheader: 'Confirmez votre inscription sur la liste d\'attente',
        heading: 'Confirmez Votre Inscription sur la Liste d\'Attente',
        intro: 'Merci de votre intérêt pour soutenir la candidature de Jean Fritznel Bellefleur au poste de Sénateur du Nord-Ouest.',
        instruction: 'Pour rejoindre la liste d\'attente, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous.',
        buttonText: 'Rejoindre la Liste d\'Attente',
        orCopyLink: 'Ou copiez et collez ce lien dans votre navigateur :',
        whatToExpectHeading: 'À Quoi S\'Attendre',
        whatToExpectText: 'Vous serez informé lorsque les contributions seront disponibles. Nous vous enverrons également des mises à jour occasionnelles sur la campagne et le statut de candidature.',
        didntSignUp: 'Si vous ne vous êtes pas inscrit sur la liste d\'attente, vous pouvez ignorer cet e-mail en toute sécurité.',
      },
    },
    ht: {
      newsletter: {
        preheader: 'Konfime abònman newsletter ou',
        heading: 'Konfime Abònman Newsletter Ou',
        intro: 'Mèsi pou enterè w nan mizajou sou kandidati Jean Fritznel Bellefleur pou Senatè Nò-Dwès.',
        instruction: 'Pou konplete abònman w, tanpri konfime adrès imèl ou lè w klike sou bouton anba a.',
        buttonText: 'Konfime Abònman',
        orCopyLink: 'Oswa kopye epi kole lyen sa a nan navigatè w:',
        whatToExpectHeading: 'Sa W Ka Atann',
        whatToExpectText: 'W ap resevwa mizajou de tan zan tan sou kanpay la, estati kandidati a, ak fason pou sipòte. Ou ka dezabòne nenpòt lè.',
        didntSignUp: 'Si ou pa t enskri pou newsletter sa a, ou ka inyore imèl sa a an sekirite.',
      },
      waitlist: {
        preheader: 'Konfime enskripsyon lis datant ou',
        heading: 'Konfime Enskripsyon Lis Datant Ou',
        intro: 'Mèsi pou enterè w nan sipòte kandidati Jean Fritznel Bellefleur pou Senatè Nò-Dwès.',
        instruction: 'Pou antre nan lis datant lan, tanpri konfime adrès imèl ou lè w klike sou bouton anba a.',
        buttonText: 'Antre nan Lis Datant',
        orCopyLink: 'Oswa kopye epi kole lyen sa a nan navigatè w:',
        whatToExpectHeading: 'Sa W Ka Atann',
        whatToExpectText: 'Yo ap enfòme w lè kontribisyon vin disponib. Nou ap voye w mizajou de tan zan tan sou kanpay la ak estati kandidati a tou.',
        didntSignUp: 'Si ou pa t enskri pou lis datant lan, ou ka inyore imèl sa a an sekirite.',
      },
    },
  }

  return translations[locale]?.[listType] || translations.en[listType]
}

/**
 * Get confirmation translations
 */
function getConfirmationTranslations(locale: string, listType: 'newsletter' | 'waitlist') {
  const translations: Record<string, any> = {
    en: {
      newsletter: {
        preheader: 'You\'re subscribed to updates',
        heading: 'Welcome! You\'re All Set',
        intro: 'Thank you for confirming your subscription. You\'ll now receive updates about Jean Fritznel Bellefleur\'s candidacy for Senator of Nord-Ouest.',
        whatsNextHeading: 'What\'s Next',
        whatsNextPoints: [
          'Stay informed about candidacy status and campaign developments',
          'Learn about ways to support and get involved',
          'Connect with other diaspora supporters',
        ],
        learnMoreButton: 'Visit the Site',
        privacyNote: 'We respect your privacy. Your information is never shared with third parties. You can unsubscribe at any time.',
        unsubscribe: 'Unsubscribe from newsletter',
      },
      waitlist: {
        preheader: 'You\'re on the waitlist',
        heading: 'You\'re on the Waitlist!',
        intro: 'Thank you for confirming your signup. You\'re now on the waitlist to be notified when contributions become available.',
        waitlistInfoHeading: 'About the Waitlist',
        waitlistInfoText: 'Contributions are not yet available. We\'re completing legal and compliance requirements before accepting donations. You\'ll be among the first to know when we launch.',
        whatsNextHeading: 'What\'s Next',
        whatsNextPoints: [
          'We\'ll email you when contributions become available',
          'You\'ll receive occasional updates about the campaign',
          'Learn more about Jean Fritznel Bellefleur and his vision for Nord-Ouest',
        ],
        learnMoreButton: 'Learn More',
        privacyNote: 'We respect your privacy. Your information is never shared with third parties. You can unsubscribe at any time.',
        unsubscribe: 'Leave waitlist',
      },
    },
    fr: {
      newsletter: {
        preheader: 'Vous êtes abonné aux mises à jour',
        heading: 'Bienvenue ! Vous Êtes Prêt',
        intro: 'Merci d\'avoir confirmé votre abonnement. Vous recevrez désormais des mises à jour sur la candidature de Jean Fritznel Bellefleur au poste de Sénateur du Nord-Ouest.',
        whatsNextHeading: 'Prochaines Étapes',
        whatsNextPoints: [
          'Restez informé du statut de candidature et des développements de la campagne',
          'Découvrez comment soutenir et vous impliquer',
          'Connectez-vous avec d\'autres supporters de la diaspora',
        ],
        learnMoreButton: 'Visiter le Site',
        privacyNote: 'Nous respectons votre vie privée. Vos informations ne sont jamais partagées avec des tiers. Vous pouvez vous désabonner à tout moment.',
        unsubscribe: 'Se désabonner de la newsletter',
      },
      waitlist: {
        preheader: 'Vous êtes sur la liste d\'attente',
        heading: 'Vous Êtes sur la Liste d\'Attente !',
        intro: 'Merci d\'avoir confirmé votre inscription. Vous êtes maintenant sur la liste d\'attente pour être informé lorsque les contributions seront disponibles.',
        waitlistInfoHeading: 'À Propos de la Liste d\'Attente',
        waitlistInfoText: 'Les contributions ne sont pas encore disponibles. Nous finalisons les exigences légales et de conformité avant d\'accepter des dons. Vous serez parmi les premiers informés lors du lancement.',
        whatsNextHeading: 'Prochaines Étapes',
        whatsNextPoints: [
          'Nous vous enverrons un e-mail lorsque les contributions seront disponibles',
          'Vous recevrez des mises à jour occasionnelles sur la campagne',
          'Apprenez-en plus sur Jean Fritznel Bellefleur et sa vision pour le Nord-Ouest',
        ],
        learnMoreButton: 'En Savoir Plus',
        privacyNote: 'Nous respectons votre vie privée. Vos informations ne sont jamais partagées avec des tiers. Vous pouvez vous désabonner à tout moment.',
        unsubscribe: 'Quitter la liste d\'attente',
      },
    },
    ht: {
      newsletter: {
        preheader: 'Ou abòne pou mizajou',
        heading: 'Byenveni! Ou Pare',
        intro: 'Mèsi paske w konfime abònman w. Ou ap resevwa mizajou sou kandidati Jean Fritznel Bellefleur pou Senatè Nò-Dwès kounye a.',
        whatsNextHeading: 'Kisa Ki Apre',
        whatsNextPoints: [
          'Rete enfòme sou estati kandidati a ak devlopman kanpay la',
          'Aprann sou fason pou sipòte epi angaje',
          'Konekte ak lòt sipòtè dyaspora',
        ],
        learnMoreButton: 'Vizite Sit la',
        privacyNote: 'Nou respekte vi prive w. Enfòmasyon w pa janm pataje ak twazyèm pati. Ou ka dezabòne nenpòt lè.',
        unsubscribe: 'Dezabòne nan newsletter',
      },
      waitlist: {
        preheader: 'Ou nan lis datant lan',
        heading: 'Ou nan Lis Datant Lan!',
        intro: 'Mèsi paske w konfime enskripsyon w. Ou nan lis datant lan kounye a pou yo enfòme w lè kontribisyon vin disponib.',
        waitlistInfoHeading: 'Konsènan Lis Datant Lan',
        waitlistInfoText: 'Kontribisyon poko disponib. Nou ap konplete egzijans legal ak konformite anvan nou aksepte don. W ap youn nan premye moun ki pral konnen lè nou lanse.',
        whatsNextHeading: 'Kisa Ki Apre',
        whatsNextPoints: [
          'Nou ap voye w imèl lè kontribisyon vin disponib',
          'W ap resevwa mizajou de tan zan tan sou kanpay la',
          'Aprann plis sou Jean Fritznel Bellefleur ak vizyon li pou Nò-Dwès',
        ],
        learnMoreButton: 'Aprann Plis',
        privacyNote: 'Nou respekte vi prive w. Enfòmasyon w pa janm pataje ak twazyèm pati. Ou ka dezabòne nenpòt lè.',
        unsubscribe: 'Kite lis datant lan',
      },
    },
  }

  return translations[locale]?.[listType] || translations.en[listType]
}
