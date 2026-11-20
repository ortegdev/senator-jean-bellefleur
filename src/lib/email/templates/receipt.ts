/**
 * Receipt Email Template
 * 
 * Sent immediately after successful donation.
 * Includes all required information for donor records.
 */

import { baseEmailTemplate, plainTextEmailTemplate, emailButton } from './base'
import { formatReceiptAmount, formatReceiptDate, type ReceiptData } from '@/lib/receipts/generator'

export function receiptEmailHtml(receipt: ReceiptData): string {
  const t = getTranslations(receipt.locale)

  const content = `
<!-- Greeting -->
<p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #111827;" class="dark-mode-text">
  ${t.greeting}
</p>

<!-- Thank you message -->
<p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;" class="dark-mode-text-secondary">
  ${t.thankYou}
</p>

<!-- Receipt box -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px; background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;" class="dark-mode-bg dark-mode-border">
  <tr>
    <td style="padding: 20px;">
      
      <!-- Receipt number -->
      <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;" class="dark-mode-text-secondary">
        ${t.receiptNumber}
      </p>
      <p style="margin: 0 0 24px; font-size: 20px; font-weight: 700; color: #0F3D4A; font-family: monospace;" class="dark-mode-text">
        ${receipt.receiptNumber}
      </p>
      
      <!-- Amount -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 12px 0; border-top: 1px solid #E5E7EB;" class="dark-mode-border">
            <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
              ${t.amount}
            </p>
          </td>
          <td align="right" style="padding: 12px 0; border-top: 1px solid #E5E7EB;" class="dark-mode-border">
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0F3D4A;" class="dark-mode-text">
              ${formatReceiptAmount(receipt.amountCents, receipt.currency, receipt.locale)}
            </p>
          </td>
        </tr>
        
        <!-- Date -->
        <tr>
          <td style="padding: 12px 0; border-top: 1px solid #E5E7EB;" class="dark-mode-border">
            <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
              ${t.date}
            </p>
          </td>
          <td align="right" style="padding: 12px 0; border-top: 1px solid #E5E7EB;" class="dark-mode-border">
            <p style="margin: 0; font-size: 14px; color: #374151;" class="dark-mode-text">
              ${formatReceiptDate(receipt.donationDate, receipt.locale)}
            </p>
          </td>
        </tr>
        
        <!-- Payment method -->
        <tr>
          <td style="padding: 12px 0; border-top: 1px solid #E5E7EB;" class="dark-mode-border">
            <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
              ${t.paymentMethod}
            </p>
          </td>
          <td align="right" style="padding: 12px 0; border-top: 1px solid #E5E7EB;" class="dark-mode-border">
            <p style="margin: 0; font-size: 14px; color: #374151;" class="dark-mode-text">
              ${receipt.paymentType} ${t.ending} ${receipt.last4}
            </p>
          </td>
        </tr>
      </table>
      
    </td>
  </tr>
</table>

<!-- Tax notice -->
<div style="margin: 0 0 24px; padding: 16px; background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px;">
  <p style="margin: 0; font-size: 14px; line-height: 20px; color: #92400E;">
    <strong>${t.notTaxDeductible}</strong><br>
    ${receipt.taxDeductibleNote}
  </p>
</div>

<!-- Affiliation disclosure -->
<div style="margin: 0 0 24px; padding: 16px; background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px;">
  <p style="margin: 0; font-size: 14px; line-height: 20px; color: #3730A3;">
    ${receipt.affiliationDisclosure}
  </p>
</div>

<!-- Refund instructions -->
<h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #111827;" class="dark-mode-text">
  ${t.refundTitle}
</h2>
<p style="margin: 0 0 16px; font-size: 14px; line-height: 20px; color: #374151;" class="dark-mode-text-secondary">
  ${receipt.refundPolicy}
</p>

<!-- Refund button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td align="center">
      ${emailButton({
        href: receipt.refundMagicLink,
        text: t.requestRefund,
      })}
    </td>
  </tr>
</table>

<p style="margin: 16px 0 0; font-size: 12px; line-height: 18px; color: #6B7280;" class="dark-mode-text-secondary">
  ${t.refundExpires} ${formatReceiptDate(receipt.refundExpiresAt, receipt.locale)}
</p>
  `

  return baseEmailTemplate({
    locale: receipt.locale,
    preheader: t.preheader.replace('{amount}', formatReceiptAmount(receipt.amountCents, receipt.currency, receipt.locale)),
    content,
  })
}

export function receiptEmailPlainText(receipt: ReceiptData): string {
  const t = getTranslations(receipt.locale)

  const content = `
${t.greeting}

${t.thankYou}

---

${t.receiptNumber}
${receipt.receiptNumber}

${t.amount}: ${formatReceiptAmount(receipt.amountCents, receipt.currency, receipt.locale)}
${t.date}: ${formatReceiptDate(receipt.donationDate, receipt.locale)}
${t.paymentMethod}: ${receipt.paymentType} ${t.ending} ${receipt.last4}

---

${t.notTaxDeductible}
${receipt.taxDeductibleNote}

---

${receipt.affiliationDisclosure}

---

${t.refundTitle}

${receipt.refundPolicy}

${t.requestRefund}: ${receipt.refundMagicLink}
${t.refundExpires} ${formatReceiptDate(receipt.refundExpiresAt, receipt.locale)}
  `

  return plainTextEmailTemplate({
    content,
    locale: receipt.locale,
  })
}

/**
 * Get translations for receipt email
 */
function getTranslations(locale: string): {
  preheader: string
  greeting: string
  thankYou: string
  receiptNumber: string
  amount: string
  date: string
  paymentMethod: string
  ending: string
  notTaxDeductible: string
  refundTitle: string
  requestRefund: string
  refundExpires: string
} {
  const translations: Record<string, any> = {
    en: {
      preheader: 'Receipt for your {amount} contribution',
      greeting: 'Thank you for your contribution!',
      thankYou: 'Your support helps connect the Haitian diaspora with Nord-Ouest representation. Here is your receipt for your records.',
      receiptNumber: 'Receipt Number',
      amount: 'Amount',
      date: 'Date',
      paymentMethod: 'Payment Method',
      ending: 'ending in',
      notTaxDeductible: 'Not Tax-Deductible',
      refundTitle: 'Refund Policy',
      requestRefund: 'Request a Refund',
      refundExpires: 'Refund link expires:',
    },
    fr: {
      preheader: 'Reçu pour votre contribution de {amount}',
      greeting: 'Merci pour votre contribution !',
      thankYou: 'Votre soutien aide à connecter la diaspora haïtienne avec la représentation du Nord-Ouest. Voici votre reçu pour vos dossiers.',
      receiptNumber: 'Numéro de reçu',
      amount: 'Montant',
      date: 'Date',
      paymentMethod: 'Mode de paiement',
      ending: 'se terminant par',
      notTaxDeductible: 'Non déductible d\'impôt',
      refundTitle: 'Politique de remboursement',
      requestRefund: 'Demander un remboursement',
      refundExpires: 'Le lien de remboursement expire :',
    },
    ht: {
      preheader: 'Resi pou kontribisyon {amount} ou a',
      greeting: 'Mèsi pou kontribisyon ou!',
      thankYou: 'Sipò ou ede konekte dyaspora ayisyen an ak reprezantasyon Nò-Dwès. Men resi ou pou dosye ou.',
      receiptNumber: 'Nimewo resi',
      amount: 'Montan',
      date: 'Dat',
      paymentMethod: 'Mòd peman',
      ending: 'ki fini ak',
      notTaxDeductible: 'Pa dedwi nan taks',
      refundTitle: 'Politik ranbousman',
      requestRefund: 'Mande yon ranbousman',
      refundExpires: 'Lyen ranbousman ekspire:',
    },
  }

  return translations[locale] || translations.en
}
