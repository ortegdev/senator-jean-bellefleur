/**
 * Refund Email Templates
 * 
 * - Refund request received
 * - Refund approved
 * - Refund failed
 */

import { baseEmailTemplate, plainTextEmailTemplate, emailButton } from './base'
import { formatReceiptAmount, formatReceiptDate } from '@/lib/receipts/generator'

/**
 * Refund Request Received Email
 */
export function refundRequestReceivedHtml(params: {
  locale: string
  receiptNumber: string
  amountCents: number
  currency: string
  ticketId: string
  estimatedProcessingDays: number
}): string {
  const { locale, receiptNumber, amountCents, currency, ticketId, estimatedProcessingDays } = params
  const t = getTranslations(locale, 'received')

  const content = `
<p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #111827;" class="dark-mode-text">
  ${t.greeting}
</p>

<p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #374151;" class="dark-mode-text-secondary">
  ${t.message}
</p>

<!-- Refund details box -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px; background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;" class="dark-mode-bg dark-mode-border">
  <tr>
    <td style="padding: 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
              ${t.ticketNumber}
            </p>
          </td>
          <td align="right" style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0F3D4A; font-family: monospace;" class="dark-mode-text">
              ${ticketId}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
              ${t.receipt}
            </p>
          </td>
          <td align="right" style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #374151;" class="dark-mode-text">
              ${receiptNumber}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
              ${t.amount}
            </p>
          </td>
          <td align="right" style="padding: 8px 0;">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0F3D4A;" class="dark-mode-text">
              ${formatReceiptAmount(amountCents, currency, locale)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<p style="margin: 0 0 16px; font-size: 14px; line-height: 20px; color: #374151;" class="dark-mode-text-secondary">
  ${t.processing.replace('{days}', estimatedProcessingDays.toString())}
</p>

<p style="margin: 0; font-size: 14px; line-height: 20px; color: #6B7280;" class="dark-mode-text-secondary">
  ${t.notification}
</p>
  `

  return baseEmailTemplate({
    locale,
    preheader: t.preheader,
    content,
  })
}

/**
 * Refund Approved Email
 */
export function refundApprovedHtml(params: {
  locale: string
  receiptNumber: string
  amountCents: number
  currency: string
  refundMethod: string
  estimatedArrival: string
}): string {
  const { locale, receiptNumber, amountCents, currency, refundMethod, estimatedArrival } = params
  const t = getTranslations(locale, 'approved')

  const content = `
<p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #111827;" class="dark-mode-text">
  ${t.greeting}
</p>

<div style="margin: 0 0 24px; padding: 16px; background-color: #D1FAE5; border: 1px solid #6EE7B7; border-radius: 8px;">
  <p style="margin: 0; font-size: 16px; font-weight: 600; color: #065F46;">
    ✓ ${t.approved}
  </p>
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px; background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;" class="dark-mode-bg dark-mode-border">
  <tr>
    <td style="padding: 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
              ${t.receipt}
            </p>
          </td>
          <td align="right" style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #374151;" class="dark-mode-text">
              ${receiptNumber}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
              ${t.refundAmount}
            </p>
          </td>
          <td align="right" style="padding: 8px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0F3D4A;" class="dark-mode-text">
              ${formatReceiptAmount(amountCents, currency, locale)}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
              ${t.refundMethod}
            </p>
          </td>
          <td align="right" style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #374151;" class="dark-mode-text">
              ${refundMethod}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;" class="dark-mode-text-secondary">
              ${t.estimatedArrival}
            </p>
          </td>
          <td align="right" style="padding: 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #374151;" class="dark-mode-text">
              ${estimatedArrival}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<p style="margin: 0; font-size: 14px; line-height: 20px; color: #6B7280;" class="dark-mode-text-secondary">
  ${t.bankNote}
</p>
  `

  return baseEmailTemplate({
    locale,
    preheader: t.preheader,
    content,
  })
}

/**
 * Refund Failed Email
 */
export function refundFailedHtml(params: {
  locale: string
  receiptNumber: string
  reason: string
  supportEmail: string
}): string {
  const { locale, receiptNumber, reason, supportEmail } = params
  const t = getTranslations(locale, 'failed')

  const content = `
<p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #111827;" class="dark-mode-text">
  ${t.greeting}
</p>

<div style="margin: 0 0 24px; padding: 16px; background-color: #FEE2E2; border: 1px solid #FCA5A5; border-radius: 8px;">
  <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #991B1B;">
    ${t.failedTitle}
  </p>
  <p style="margin: 0; font-size: 14px; color: #7F1D1D;">
    ${reason}
  </p>
</div>

<p style="margin: 0 0 16px; font-size: 14px; line-height: 20px; color: #374151;" class="dark-mode-text-secondary">
  ${t.receiptRef} <strong>${receiptNumber}</strong>
</p>

<p style="margin: 0 0 24px; font-size: 14px; line-height: 20px; color: #374151;" class="dark-mode-text-secondary">
  ${t.contactUs}
</p>

<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td align="center">
      ${emailButton({
        href: `mailto:${supportEmail}`,
        text: t.contactButton,
      })}
    </td>
  </tr>
</table>
  `

  return baseEmailTemplate({
    locale,
    preheader: t.preheader,
    content,
  })
}

/**
 * Get translations for refund emails
 */
function getTranslations(locale: string, type: 'received' | 'approved' | 'failed'): any {
  const translations: Record<string, Record<string, any>> = {
    en: {
      received: {
        preheader: 'We have received your refund request',
        greeting: 'Refund Request Received',
        message: 'We have received your refund request and are processing it.',
        ticketNumber: 'Ticket Number',
        receipt: 'Original Receipt',
        amount: 'Refund Amount',
        processing: 'Your refund will be processed within {days} business days.',
        notification: 'You will receive an email once the refund has been processed.',
      },
      approved: {
        preheader: 'Your refund has been approved',
        greeting: 'Refund Approved',
        approved: 'Your refund has been approved and processed',
        receipt: 'Original Receipt',
        refundAmount: 'Refund Amount',
        refundMethod: 'Refund Method',
        estimatedArrival: 'Estimated Arrival',
        bankNote: 'Please allow 5-10 business days for the refund to appear on your statement.',
      },
      failed: {
        preheader: 'There was a problem processing your refund',
        greeting: 'Refund Processing Failed',
        failedTitle: 'Unable to Process Refund',
        receiptRef: 'Receipt:',
        contactUs: 'Please contact our support team for assistance.',
        contactButton: 'Contact Support',
      },
    },
    fr: {
      received: {
        preheader: 'Nous avons reçu votre demande de remboursement',
        greeting: 'Demande de remboursement reçue',
        message: 'Nous avons reçu votre demande de remboursement et la traitons.',
        ticketNumber: 'Numéro de ticket',
        receipt: 'Reçu original',
        amount: 'Montant du remboursement',
        processing: 'Votre remboursement sera traité dans {days} jours ouvrables.',
        notification: 'Vous recevrez un e-mail une fois le remboursement traité.',
      },
      approved: {
        preheader: 'Votre remboursement a été approuvé',
        greeting: 'Remboursement approuvé',
        approved: 'Votre remboursement a été approuvé et traité',
        receipt: 'Reçu original',
        refundAmount: 'Montant du remboursement',
        refundMethod: 'Méthode de remboursement',
        estimatedArrival: 'Arrivée estimée',
        bankNote: 'Veuillez prévoir 5 à 10 jours ouvrables pour que le remboursement apparaisse sur votre relevé.',
      },
      failed: {
        preheader: 'Un problème est survenu lors du traitement de votre remboursement',
        greeting: 'Échec du traitement du remboursement',
        failedTitle: 'Impossible de traiter le remboursement',
        receiptRef: 'Reçu :',
        contactUs: 'Veuillez contacter notre équipe d\'assistance.',
        contactButton: 'Contacter l\'assistance',
      },
    },
    ht: {
      received: {
        preheader: 'Nou resevwa demann ranbousman ou',
        greeting: 'Demann ranbousman resevwa',
        message: 'Nou resevwa demann ranbousman ou epi n ap trete li.',
        ticketNumber: 'Nimewo tikè',
        receipt: 'Resi orijinal',
        amount: 'Montan ranbousman',
        processing: 'Ranbousman ou ap trete nan {days} jou travay.',
        notification: 'Ou ap resevwa yon imèl lè ranbousman an trete.',
      },
      approved: {
        preheader: 'Ranbousman ou apwouve',
        greeting: 'Ranbousman apwouve',
        approved: 'Ranbousman ou apwouve epi trete',
        receipt: 'Resi orijinal',
        refundAmount: 'Montan ranbousman',
        refundMethod: 'Mòd ranbousman',
        estimatedArrival: 'Rive estime',
        bankNote: 'Tanpri pèmèt 5-10 jou travay pou ranbousman an parèt sou deklarasyon ou.',
      },
      failed: {
        preheader: 'Te gen yon pwoblèm nan trete ranbousman ou',
        greeting: 'Echwe trete ranbousman',
        failedTitle: 'Pa kapab trete ranbousman',
        receiptRef: 'Resi:',
        contactUs: 'Tanpri kontakte ekip sipò nou pou asistans.',
        contactButton: 'Kontakte Sipò',
      },
    },
  }

  return translations[locale]?.[type] || translations.en[type]
}
