/**
 * Funds Redirected Email Template
 * 
 * For when a fundraiser is terminated and funds are redirected
 * (e.g., candidate withdraws, becomes ineligible, or fundraiser is terminated)
 */

import { baseEmailTemplate, plainTextEmailTemplate, emailButton } from './base'

export interface FundsRedirectedEmailProps {
  locale: string
  recipientEmail: string
  contributionAmount: string // Pre-formatted with currency
  contributionDate: string
  receiptNumber: string
  redirectReason: string
  redirectionDestination: string
  refundOption: 'automatic' | 'optional' | 'none'
  refundRequestLink?: string
  refundDeadline?: string
}

/**
 * Funds redirected email (HTML)
 */
export function fundsRedirectedEmailHtml(props: FundsRedirectedEmailProps): string {
  const { locale, contributionAmount, contributionDate, receiptNumber, redirectReason, 
          redirectionDestination, refundOption, refundRequestLink, refundDeadline } = props
  const translations = getTranslations(locale)

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
      ${translations.heading}
    </h2>
    
    <!-- Important notice box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px; padding: 16px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #92400E;">
            ⚠️ ${translations.importantNotice}
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 20px; color: #78350F;">
            ${redirectReason}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Contribution details -->
    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
      ${translations.yourContribution}
    </h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px; border: 1px solid #E5E7EB; border-radius: 4px;" class="dark-mode-border">
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;" class="dark-mode-border">
          <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
            ${translations.amount}
          </p>
          <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
            ${contributionAmount}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;" class="dark-mode-border">
          <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
            ${translations.date}
          </p>
          <p style="margin: 4px 0 0; font-size: 16px; color: #0B1D24;" class="dark-mode-text">
            ${contributionDate}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px;">
          <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
            ${translations.receiptNumber}
          </p>
          <p style="margin: 4px 0 0; font-size: 16px; font-family: monospace; color: #0B1D24;" class="dark-mode-text">
            ${receiptNumber}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Redirection info -->
    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
      ${translations.whatHappensNext}
    </h3>
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #374151;" class="dark-mode-text">
      ${translations.redirectionExplanation}
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px; padding: 16px; background-color: #E0F2FE; border-left: 4px solid #0EA5E9; border-radius: 4px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #075985;">
            ${translations.fundsWillGo}
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 20px; color: #0c4a6e;">
            ${redirectionDestination}
          </p>
        </td>
      </tr>
    </table>
    
    ${refundOption === 'automatic' ? `
    <!-- Automatic refund notice -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px; padding: 16px; background-color: #DCFCE7; border-left: 4px solid #10B981; border-radius: 4px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #065F46;">
            ✓ ${translations.automaticRefundHeading}
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 20px; color: #064e3b;">
            ${translations.automaticRefundText}
          </p>
        </td>
      </tr>
    </table>
    ` : ''}
    
    ${refundOption === 'optional' && refundRequestLink && refundDeadline ? `
    <!-- Optional refund -->
    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
      ${translations.refundOptionHeading}
    </h3>
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 20px; color: #374151;" class="dark-mode-text">
      ${translations.refundOptionText}
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 8px 0 16px;">
          ${emailButton({
            href: refundRequestLink,
            text: translations.requestRefundButton,
          })}
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 20px; color: #6B7280; text-align: center;" class="dark-mode-text-secondary">
      ${translations.refundDeadline.replace('{deadline}', refundDeadline)}
    </p>
    ` : ''}
    
    ${refundOption === 'none' ? `
    <!-- No refund option -->
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 20px; color: #6B7280;" class="dark-mode-text-secondary">
      ${translations.noRefundText}
    </p>
    ` : ''}
    
    <!-- Questions -->
    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #0B1D24;" class="dark-mode-text">
      ${translations.questionsHeading}
    </h3>
    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #374151;" class="dark-mode-text">
      ${translations.questionsText}
    </p>
  `

  return baseEmailTemplate({
    locale,
    preheader: translations.preheader,
    content,
  })
}

/**
 * Funds redirected email (plain text)
 */
export function fundsRedirectedEmailPlainText(props: FundsRedirectedEmailProps): string {
  const { locale, contributionAmount, contributionDate, receiptNumber, redirectReason,
          redirectionDestination, refundOption, refundRequestLink, refundDeadline } = props
  const translations = getTranslations(locale)

  const content = `
${translations.heading}

⚠️ ${translations.importantNotice}
${redirectReason}

${translations.yourContribution}

${translations.amount}: ${contributionAmount}
${translations.date}: ${contributionDate}
${translations.receiptNumber}: ${receiptNumber}

${translations.whatHappensNext}

${translations.redirectionExplanation}

${translations.fundsWillGo}
${redirectionDestination}

${refundOption === 'automatic' ? `
✓ ${translations.automaticRefundHeading}
${translations.automaticRefundText}
` : ''}

${refundOption === 'optional' && refundRequestLink && refundDeadline ? `
${translations.refundOptionHeading}

${translations.refundOptionText}

${translations.requestRefundButton}: ${refundRequestLink}

${translations.refundDeadline.replace('{deadline}', refundDeadline)}
` : ''}

${refundOption === 'none' ? `
${translations.noRefundText}
` : ''}

${translations.questionsHeading}

${translations.questionsText}
  `.trim()

  return plainTextEmailTemplate({ content, locale })
}

/**
 * Get translations
 */
function getTranslations(locale: string) {
  const translations: Record<string, any> = {
    en: {
      preheader: 'Important update about your contribution',
      heading: 'Important Update About Your Contribution',
      importantNotice: 'Important Notice',
      yourContribution: 'Your Contribution',
      amount: 'Amount',
      date: 'Date',
      receiptNumber: 'Receipt Number',
      whatHappensNext: 'What Happens Next',
      redirectionExplanation: 'Your contribution will be redirected as described below.',
      fundsWillGo: 'Your contribution will go to:',
      automaticRefundHeading: 'Automatic Refund in Progress',
      automaticRefundText: 'Your contribution is being automatically refunded to your original payment method. Please allow 5-10 business days for the refund to appear.',
      refundOptionHeading: 'Prefer a Refund?',
      refundOptionText: 'If you would prefer a refund instead of having your contribution redirected, you may request one before the deadline below.',
      requestRefundButton: 'Request Refund',
      refundDeadline: 'Refund requests must be submitted by {deadline}',
      noRefundText: 'Refunds are not available at this time. Your contribution will be redirected as described above.',
      questionsHeading: 'Questions or Concerns?',
      questionsText: 'If you have any questions about this update or your contribution, please contact our support team.',
    },
    fr: {
      preheader: 'Mise à jour importante concernant votre contribution',
      heading: 'Mise à Jour Importante Concernant Votre Contribution',
      importantNotice: 'Avis Important',
      yourContribution: 'Votre Contribution',
      amount: 'Montant',
      date: 'Date',
      receiptNumber: 'Numéro de Reçu',
      whatHappensNext: 'Prochaines Étapes',
      redirectionExplanation: 'Votre contribution sera redirigée comme décrit ci-dessous.',
      fundsWillGo: 'Votre contribution ira à :',
      automaticRefundHeading: 'Remboursement Automatique en Cours',
      automaticRefundText: 'Votre contribution est en cours de remboursement automatique vers votre méthode de paiement d\'origine. Veuillez compter 5 à 10 jours ouvrables pour que le remboursement apparaisse.',
      refundOptionHeading: 'Préférez un Remboursement ?',
      refundOptionText: 'Si vous préférez un remboursement plutôt que la redirection de votre contribution, vous pouvez en demander un avant la date limite ci-dessous.',
      requestRefundButton: 'Demander un Remboursement',
      refundDeadline: 'Les demandes de remboursement doivent être soumises avant le {deadline}',
      noRefundText: 'Les remboursements ne sont pas disponibles pour le moment. Votre contribution sera redirigée comme décrit ci-dessus.',
      questionsHeading: 'Questions ou Préoccupations ?',
      questionsText: 'Si vous avez des questions concernant cette mise à jour ou votre contribution, veuillez contacter notre équipe d\'assistance.',
    },
    ht: {
      preheader: 'Mizajou enpòtan konsènan kontribisyon w',
      heading: 'Mizajou Enpòtan Konsènan Kontribisyon W',
      importantNotice: 'Avi Enpòtan',
      yourContribution: 'Kontribisyon W',
      amount: 'Montan',
      date: 'Dat',
      receiptNumber: 'Nimewo Resi',
      whatHappensNext: 'Kisa Ki Apre',
      redirectionExplanation: 'Kontribisyon w ap redirije jan sa dekri anba a.',
      fundsWillGo: 'Kontribisyon w ap ale bay:',
      automaticRefundHeading: 'Ranbousman Otomatik Ankou',
      automaticRefundText: 'Kontribisyon w ap ranbousa otomatikman nan metòd peman orijinal ou. Tanpri konte 5-10 jou travay pou ranbousman an parèt.',
      refundOptionHeading: 'Ou Prefere Yon Ranbousman?',
      refundOptionText: 'Si ou ta prefere yon ranbousman pito ke redirije kontribisyon w, ou ka mande youn anvan limit tan anba a.',
      requestRefundButton: 'Mande Ranbousman',
      refundDeadline: 'Demann ranbousman yo dwe soumèt anvan {deadline}',
      noRefundText: 'Ranbousman pa disponib pou kounye a. Kontribisyon w ap redirije jan sa dekri anwo a.',
      questionsHeading: 'Kesyon oswa Enkyetid?',
      questionsText: 'Si ou gen nenpòt kesyon konsènan mizajou sa a oswa kontribisyon w, tanpri kontakte ekip sipò nou.',
    },
  }

  return translations[locale] || translations.en
}
