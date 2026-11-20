/**
 * Email Service
 * 
 * Wrapper for sending transactional emails via configured provider
 * (SendGrid, Postmark, AWS SES, or console for development)
 */

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
  from?: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType: string
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>
}

/**
 * Console email provider (for development)
 * Logs emails to console instead of sending
 */
class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string }> {
    console.log('='.repeat(80))
    console.log('📧 EMAIL (Console Mode)')
    console.log('='.repeat(80))
    console.log(`To: ${message.to}`)
    console.log(`From: ${message.from || process.env.FROM_EMAIL || 'noreply@example.com'}`)
    console.log(`Subject: ${message.subject}`)
    console.log(`Reply-To: ${message.replyTo || 'N/A'}`)
    console.log('-'.repeat(80))
    console.log('HTML Body:')
    console.log(message.html.substring(0, 500) + '...')
    console.log('-'.repeat(80))
    console.log('Plain Text Body:')
    console.log(message.text)
    console.log('='.repeat(80))

    return {
      success: true,
      messageId: `console-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    }
  }
}

/**
 * Get configured email provider
 */
function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'console'

  switch (provider) {
    case 'console':
      return new ConsoleEmailProvider()

    case 'sendgrid':
      // TODO: Implement SendGrid provider
      // return new SendGridEmailProvider()
      throw new Error('SendGrid provider not yet implemented')

    case 'postmark':
      // TODO: Implement Postmark provider
      // return new PostmarkEmailProvider()
      throw new Error('Postmark provider not yet implemented')

    case 'ses':
      // TODO: Implement AWS SES provider
      // return new SESEmailProvider()
      throw new Error('AWS SES provider not yet implemented')

    default:
      throw new Error(`Unknown email provider: ${provider}`)
  }
}

/**
 * Send an email
 */
export async function sendEmail(message: EmailMessage): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  const provider = getEmailProvider()

  // Add default from address if not provided
  if (!message.from) {
    message.from = process.env.FROM_EMAIL || 'noreply@diaspora4bellefleur.example.com'
  }

  try {
    const result = await provider.send(message)
    return result
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send receipt email
 */
export async function sendReceiptEmail(params: {
  to: string
  locale: string
  receiptData: {
    receiptNumber: string
    contributionAmount: string
    contributionDate: string
    paymentMethod: string
    last4: string
    refundWindowDays: number
    magicLinkUrl: string
  }
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, locale, receiptData } = params

  // Import templates dynamically to avoid circular dependencies
  const { receiptEmailHtml, receiptEmailPlainText } = await import('./templates/receipt')

  const html = receiptEmailHtml({ locale, ...receiptData })
  const text = receiptEmailPlainText({ locale, ...receiptData })

  const subjects = {
    en: `Your Contribution Receipt - ${receiptData.receiptNumber}`,
    fr: `Votre Reçu de Contribution - ${receiptData.receiptNumber}`,
    ht: `Resi Kontribisyon W - ${receiptData.receiptNumber}`,
  }

  return sendEmail({
    to,
    subject: subjects[locale as keyof typeof subjects] || subjects.en,
    html,
    text,
  })
}

/**
 * Send refund request received email
 */
export async function sendRefundRequestReceivedEmail(params: {
  to: string
  locale: string
  receiptNumber: string
  contributionAmount: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, locale, receiptNumber, contributionAmount } = params

  const { refundRequestReceivedHtml, refundRequestReceivedPlainText } = await import(
    './templates/refund'
  )

  const html = refundRequestReceivedHtml({ locale, receiptNumber, contributionAmount })
  const text = refundRequestReceivedPlainText({ locale, receiptNumber, contributionAmount })

  const subjects = {
    en: 'Refund Request Received',
    fr: 'Demande de Remboursement Reçue',
    ht: 'Demann Ranbousman Resevwa',
  }

  return sendEmail({
    to,
    subject: subjects[locale as keyof typeof subjects] || subjects.en,
    html,
    text,
  })
}

/**
 * Send refund approved email
 */
export async function sendRefundApprovedEmail(params: {
  to: string
  locale: string
  receiptNumber: string
  refundAmount: string
  processingDays: number
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, locale, receiptNumber, refundAmount, processingDays } = params

  const { refundApprovedHtml, refundApprovedPlainText } = await import('./templates/refund')

  const html = refundApprovedHtml({ locale, receiptNumber, refundAmount, processingDays })
  const text = refundApprovedPlainText({ locale, receiptNumber, refundAmount, processingDays })

  const subjects = {
    en: 'Refund Approved',
    fr: 'Remboursement Approuvé',
    ht: 'Ranbousman Apwouve',
  }

  return sendEmail({
    to,
    subject: subjects[locale as keyof typeof subjects] || subjects.en,
    html,
    text,
  })
}

/**
 * Send refund failed email
 */
export async function sendRefundFailedEmail(params: {
  to: string
  locale: string
  receiptNumber: string
  reason: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, locale, receiptNumber, reason } = params

  const { refundFailedHtml, refundFailedPlainText } = await import('./templates/refund')

  const html = refundFailedHtml({ locale, receiptNumber, reason })
  const text = refundFailedPlainText({ locale, receiptNumber, reason })

  const subjects = {
    en: 'Refund Request Update',
    fr: 'Mise à Jour de Demande de Remboursement',
    ht: 'Mizajou Demann Ranbousman',
  }

  return sendEmail({
    to,
    subject: subjects[locale as keyof typeof subjects] || subjects.en,
    html,
    text,
  })
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(params: {
  to: string
  locale: string
  magicLink: string
  purpose: 'refund' | 'email-verification'
  expiresInHours: number
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, locale, magicLink, purpose, expiresInHours } = params

  const { magicLinkEmailHtml, magicLinkEmailPlainText } = await import('./templates/magic-link')

  const html = magicLinkEmailHtml({
    locale,
    recipientEmail: to,
    magicLink,
    purpose,
    expiresInHours,
  })
  const text = magicLinkEmailPlainText({
    locale,
    recipientEmail: to,
    magicLink,
    purpose,
    expiresInHours,
  })

  const subjects = {
    en: {
      refund: 'Verify Your Refund Request',
      'email-verification': 'Verify Your Email Address',
    },
    fr: {
      refund: 'Vérifiez Votre Demande de Remboursement',
      'email-verification': 'Vérifiez Votre Adresse E-mail',
    },
    ht: {
      refund: 'Verifye Demann Ranbousman W',
      'email-verification': 'Verifye Adrès Imèl Ou',
    },
  }

  return sendEmail({
    to,
    subject: subjects[locale as keyof typeof subjects]?.[purpose] || subjects.en[purpose],
    html,
    text,
  })
}

/**
 * Send double opt-in email
 */
export async function sendDoubleOptInEmail(params: {
  to: string
  locale: string
  confirmationLink: string
  listType: 'newsletter' | 'waitlist'
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, locale, confirmationLink, listType } = params

  const { doubleOptInEmailHtml, doubleOptInEmailPlainText } = await import('./templates/opt-in')

  const html = doubleOptInEmailHtml({
    locale,
    recipientEmail: to,
    confirmationLink,
    listType,
  })
  const text = doubleOptInEmailPlainText({
    locale,
    recipientEmail: to,
    confirmationLink,
    listType,
  })

  const subjects = {
    en: {
      newsletter: 'Confirm Your Newsletter Subscription',
      waitlist: 'Confirm Your Waitlist Signup',
    },
    fr: {
      newsletter: 'Confirmez Votre Abonnement à la Newsletter',
      waitlist: 'Confirmez Votre Inscription sur la Liste d\'Attente',
    },
    ht: {
      newsletter: 'Konfime Abònman Newsletter Ou',
      waitlist: 'Konfime Enskripsyon Lis Datant Ou',
    },
  }

  return sendEmail({
    to,
    subject: subjects[locale as keyof typeof subjects]?.[listType] || subjects.en[listType],
    html,
    text,
  })
}

/**
 * Send confirmation email (after opt-in)
 */
export async function sendConfirmationEmail(params: {
  to: string
  locale: string
  listType: 'newsletter' | 'waitlist'
  unsubscribeLink?: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, locale, listType, unsubscribeLink } = params

  const { confirmationEmailHtml, confirmationEmailPlainText } = await import('./templates/opt-in')

  const html = confirmationEmailHtml({
    locale,
    recipientEmail: to,
    listType,
    unsubscribeLink,
  })
  const text = confirmationEmailPlainText({
    locale,
    recipientEmail: to,
    listType,
    unsubscribeLink,
  })

  const subjects = {
    en: {
      newsletter: 'Welcome! You\'re Subscribed',
      waitlist: 'You\'re on the Waitlist!',
    },
    fr: {
      newsletter: 'Bienvenue ! Vous Êtes Abonné',
      waitlist: 'Vous Êtes sur la Liste d\'Attente !',
    },
    ht: {
      newsletter: 'Byenveni! Ou Abòne',
      waitlist: 'Ou nan Lis Datant Lan!',
    },
  }

  return sendEmail({
    to,
    subject: subjects[locale as keyof typeof subjects]?.[listType] || subjects.en[listType],
    html,
    text,
  })
}

/**
 * Send funds redirected email
 */
export async function sendFundsRedirectedEmail(params: {
  to: string
  locale: string
  contributionAmount: string
  contributionDate: string
  receiptNumber: string
  redirectReason: string
  redirectionDestination: string
  refundOption: 'automatic' | 'optional' | 'none'
  refundRequestLink?: string
  refundDeadline?: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, locale, ...emailProps } = params

  const { fundsRedirectedEmailHtml, fundsRedirectedEmailPlainText } = await import(
    './templates/funds-redirected'
  )

  const html = fundsRedirectedEmailHtml({
    locale,
    recipientEmail: to,
    ...emailProps,
  })
  const text = fundsRedirectedEmailPlainText({
    locale,
    recipientEmail: to,
    ...emailProps,
  })

  const subjects = {
    en: 'Important Update About Your Contribution',
    fr: 'Mise à Jour Importante Concernant Votre Contribution',
    ht: 'Mizajou Enpòtan Konsènan Kontribisyon W',
  }

  return sendEmail({
    to,
    subject: subjects[locale as keyof typeof subjects] || subjects.en,
    html,
    text,
  })
}
