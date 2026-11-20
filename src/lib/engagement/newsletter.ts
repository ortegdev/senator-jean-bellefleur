/**
 * Newsletter System
 * 
 * Localized newsletters with:
 * - Composer with preview
 * - Test sends
 * - Segmentation (country, chapter, commune, tags)
 * - Scheduled sends
 * - List-Unsubscribe header
 * - Bounce and complaint handling
 * - Sender identification in every email
 */

import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

// ============================================================================
// NEWSLETTER COMPOSER
// ============================================================================

export interface CreateNewsletterInput {
  slug: string
  subjectHt: string
  subjectFr: string
  subjectEn: string
  bodyHt: string
  bodyFr: string
  bodyEn: string
  previewTextHt?: string
  previewTextFr?: string
  previewTextEn?: string
  senderName?: string
  senderEmail: string
  replyTo?: string
  segmentCountries?: string[]
  segmentCommunes?: string[]
  segmentChapters?: string[]
  segmentTags?: string[]
  createdBy: string
  createdByEmail: string
}

/**
 * Create newsletter draft
 */
export async function createNewsletter(input: CreateNewsletterInput) {
  // Validate sender email
  if (!input.senderEmail.includes('@')) {
    throw new Error('Valid sender email is required')
  }

  // Check slug uniqueness
  const existing = await prisma.newsletter.findUnique({
    where: { slug: input.slug },
  })

  if (existing) {
    throw new Error('Newsletter slug already exists')
  }

  const newsletter = await prisma.newsletter.create({
    data: {
      slug: input.slug,
      subjectHt: input.subjectHt,
      subjectFr: input.subjectFr,
      subjectEn: input.subjectEn,
      bodyHt: input.bodyHt,
      bodyFr: input.bodyFr,
      bodyEn: input.bodyEn,
      previewTextHt: input.previewTextHt,
      previewTextFr: input.previewTextFr,
      previewTextEn: input.previewTextEn,
      senderName: input.senderName || 'Diaspora4Bellefleur',
      senderEmail: input.senderEmail,
      replyTo: input.replyTo,
      segmentCountries: input.segmentCountries || [],
      segmentCommunes: input.segmentCommunes || [],
      segmentChapters: input.segmentChapters || [],
      segmentTags: input.segmentTags || [],
      status: 'DRAFT',
      createdBy: input.createdBy,
      createdByEmail: input.createdByEmail,
    },
  })

  return newsletter
}

/**
 * Update newsletter (only if DRAFT or READY)
 */
export async function updateNewsletter(
  newsletterId: string,
  updates: Partial<CreateNewsletterInput>
) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
  })

  if (!newsletter) {
    throw new Error('Newsletter not found')
  }

  if (newsletter.status !== 'DRAFT' && newsletter.status !== 'READY') {
    throw new Error('Cannot edit newsletter that is not DRAFT or READY')
  }

  return prisma.newsletter.update({
    where: { id: newsletterId },
    data: updates as any,
  })
}

// ============================================================================
// PREVIEW & TEST SEND
// ============================================================================

/**
 * Generate newsletter preview HTML
 */
export async function generateNewsletterPreview(
  newsletterId: string,
  locale: 'ht' | 'fr' | 'en'
): Promise<string> {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
  })

  if (!newsletter) {
    throw new Error('Newsletter not found')
  }

  const subject = newsletter[`subject${locale.charAt(0).toUpperCase() + locale.slice(1)}`]
  const body = newsletter[`body${locale.charAt(0).toUpperCase() + locale.slice(1)}`]
  const previewText =
    newsletter[`previewText${locale.charAt(0).toUpperCase() + locale.slice(1)}`]

  return generateNewsletterHtml({
    subject,
    previewText,
    body,
    senderName: newsletter.senderName,
    unsubscribeUrl: '${UNSUBSCRIBE_URL}', // Placeholder
    locale,
  })
}

/**
 * Send test newsletter
 */
export async function sendTestNewsletter(
  newsletterId: string,
  testEmails: string[],
  locale: 'ht' | 'fr' | 'en'
) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
  })

  if (!newsletter) {
    throw new Error('Newsletter not found')
  }

  const html = await generateNewsletterPreview(newsletterId, locale)

  // Send to test emails
  for (const email of testEmails) {
    console.log(`[Newsletter] Sending test to ${email}`)
    // In production, use sendEmail() function
  }

  // Update test sent tracking
  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: {
      testSentTo: { push: testEmails },
      testSentAt: new Date(),
    },
  })

  return { sent: testEmails.length }
}

// ============================================================================
// RECIPIENT SEGMENTATION
// ============================================================================

/**
 * Get newsletter recipients based on segmentation
 */
export async function getNewsletterRecipients(newsletterId: string) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
  })

  if (!newsletter) {
    throw new Error('Newsletter not found')
  }

  const where: any = {
    status: 'ACTIVE',
    verified: true,
    bounced: false,
  }

  // Apply segmentation filters
  if (newsletter.segmentCountries.length > 0) {
    where.country = { in: newsletter.segmentCountries }
  }

  if (newsletter.segmentCommunes.length > 0) {
    where.communeOfOrigin = { in: newsletter.segmentCommunes }
  }

  if (newsletter.segmentChapters.length > 0) {
    where.chapterId = { in: newsletter.segmentChapters }
  }

  if (newsletter.segmentTags.length > 0) {
    where.tags = { hasSome: newsletter.segmentTags }
  }

  const recipients = await prisma.newsletterSubscriber.findMany({
    where,
    select: {
      id: true,
      email: true,
      preferredLocale: true,
    },
  })

  return recipients
}

// ============================================================================
// SEND NEWSLETTER
// ============================================================================

/**
 * Mark newsletter as ready to send
 */
export async function markNewsletterReady(
  newsletterId: string,
  approvedBy: string,
  approvedByEmail: string
) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
  })

  if (!newsletter) {
    throw new Error('Newsletter not found')
  }

  if (newsletter.status !== 'DRAFT') {
    throw new Error('Newsletter must be DRAFT to mark ready')
  }

  // Get recipient count
  const recipients = await getNewsletterRecipients(newsletterId)

  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: {
      status: 'READY',
      recipientCount: recipients.length,
      approvedBy,
      approvedByEmail,
      approvedAt: new Date(),
    },
  })

  return { recipientCount: recipients.length }
}

/**
 * Schedule newsletter for future send
 */
export async function scheduleNewsletter(newsletterId: string, scheduledFor: Date) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
  })

  if (!newsletter) {
    throw new Error('Newsletter not found')
  }

  if (newsletter.status !== 'READY') {
    throw new Error('Newsletter must be READY to schedule')
  }

  if (scheduledFor <= new Date()) {
    throw new Error('Scheduled time must be in the future')
  }

  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: {
      status: 'SCHEDULED',
      scheduledFor,
    },
  })

  return { scheduledFor }
}

/**
 * Send newsletter immediately or process scheduled send
 */
export async function sendNewsletter(newsletterId: string) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
  })

  if (!newsletter) {
    throw new Error('Newsletter not found')
  }

  if (newsletter.status !== 'READY' && newsletter.status !== 'SCHEDULED') {
    throw new Error('Newsletter must be READY or SCHEDULED to send')
  }

  // If scheduled, check if it's time
  if (newsletter.status === 'SCHEDULED' && newsletter.scheduledFor) {
    if (newsletter.scheduledFor > new Date()) {
      throw new Error('Newsletter scheduled time has not arrived yet')
    }
  }

  // Mark as sending
  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: { status: 'SENDING' },
  })

  // Get recipients
  const recipients = await getNewsletterRecipients(newsletterId)

  console.log(`[Newsletter] Sending to ${recipients.length} recipients`)

  let sentCount = 0
  let deliveredCount = 0

  // Send to each recipient in their preferred locale
  for (const recipient of recipients) {
    try {
      await sendNewsletterToRecipient(newsletterId, recipient.id, recipient.preferredLocale)
      sentCount++
      deliveredCount++
    } catch (error) {
      console.error(`[Newsletter] Failed to send to ${recipient.email}:`, error)
      // Create failed send record
      await prisma.newsletterSend.create({
        data: {
          newsletterId,
          subscriberId: recipient.id,
          locale: recipient.preferredLocale,
          failedAt: new Date(),
          failureReason: (error as Error).message,
        },
      })
    }
  }

  // Mark as sent
  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      sentCount,
      deliveredCount,
    },
  })

  return { sent: sentCount, delivered: deliveredCount, total: recipients.length }
}

/**
 * Send newsletter to individual recipient
 */
async function sendNewsletterToRecipient(
  newsletterId: string,
  subscriberId: string,
  locale: 'ht' | 'fr' | 'en'
) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
  })

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { id: subscriberId },
  })

  if (!newsletter || !subscriber) {
    throw new Error('Newsletter or subscriber not found')
  }

  // Generate unsubscribe token
  const unsubscribeToken = crypto.randomBytes(32).toString('hex')

  // Generate HTML
  const html = await generateNewsletterPreview(newsletterId, locale)

  const unsubscribeUrl = `${process.env.SITE_URL}/${locale}/unsubscribe?token=${unsubscribeToken}`

  const finalHtml = html.replace('${UNSUBSCRIBE_URL}', unsubscribeUrl)

  // Send email
  console.log(`[Newsletter] Sending to ${subscriber.email} in ${locale}`)

  // In production, use sendEmail() function with proper headers:
  // - List-Unsubscribe: <mailto:unsubscribe@example.com>, <unsubscribeUrl>
  // - List-Unsubscribe-Post: List-Unsubscribe=One-Click

  // Create send record
  const send = await prisma.newsletterSend.create({
    data: {
      newsletterId,
      subscriberId,
      locale,
      sentAt: new Date(),
      deliveredAt: new Date(), // Update this based on provider webhook
    },
  })

  // Update subscriber last email sent
  await prisma.newsletterSubscriber.update({
    where: { id: subscriberId },
    data: {
      lastEmailSentAt: new Date(),
    },
  })

  return send
}

// ============================================================================
// NEWSLETTER HTML GENERATION
// ============================================================================

interface NewsletterHtmlParams {
  subject: string
  previewText?: string
  body: string
  senderName: string
  unsubscribeUrl: string
  locale: 'ht' | 'fr' | 'en'
}

function generateNewsletterHtml(params: NewsletterHtmlParams): string {
  const unsubscribeTexts = {
    ht: 'Retire abònman',
    fr: 'Se désabonner',
    en: 'Unsubscribe',
  }

  const disclaimerTexts = {
    ht: 'Inisyativ sipòtè endepandan, pa otorize pa kandida a, kanpay li oswa nenpòt pati.',
    fr: 'Initiative de supporters indépendants, non autorisée par le candidat, sa campagne ou tout parti.',
    en: 'Independent supporter initiative, not authorized by the candidate, his campaign or any party.',
  }

  const senderTexts = {
    ht: 'Voye pa',
    fr: 'Envoyé par',
    en: 'Sent by',
  }

  return `
<!DOCTYPE html>
<html lang="${params.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  ${params.previewText ? `<meta name="description" content="${params.previewText}">` : ''}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #0B1D24;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #FAF6EE;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #0F3D4A;
      margin-bottom: 30px;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #6B7280;
      padding: 20px 0;
      border-top: 1px solid #E5E7EB;
    }
    .footer a {
      color: #C8432B;
      text-decoration: none;
    }
    .sender {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .disclaimer {
      margin-top: 10px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="color: #0F3D4A; margin: 0;">${params.senderName}</h1>
  </div>

  <div class="content">
    ${params.body}
  </div>

  <div class="footer">
    <div class="sender">
      ${senderTexts[params.locale]} ${params.senderName}
    </div>
    
    <div class="disclaimer">
      ${disclaimerTexts[params.locale]}
    </div>

    <div style="margin-top: 20px;">
      <a href="${params.unsubscribeUrl}">${unsubscribeTexts[params.locale]}</a>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// ============================================================================
// BOUNCE & COMPLAINT HANDLING
// ============================================================================

/**
 * Handle email bounce
 */
export async function handleBounce(params: {
  email: string
  bounceType: 'hard' | 'soft' | 'complaint'
  reason?: string
}) {
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email: params.email },
  })

  if (!subscriber) {
    return { found: false }
  }

  const updateData: any = {
    bounced: true,
    bouncedAt: new Date(),
    bounceType: params.bounceType,
    bounceReason: params.reason,
  }

  // Hard bounces and complaints → unsubscribe
  if (params.bounceType === 'hard' || params.bounceType === 'complaint') {
    updateData.status = params.bounceType === 'complaint' ? 'COMPLAINED' : 'BOUNCED'
    updateData.unsubscribedAt = new Date()
  }

  await prisma.newsletterSubscriber.update({
    where: { email: params.email },
    data: updateData,
  })

  return { handled: true, unsubscribed: updateData.status !== undefined }
}

// ============================================================================
// UNSUBSCRIBE
// ============================================================================

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeFromNewsletter(email: string) {
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  })

  if (!subscriber) {
    throw new Error('Email not found')
  }

  if (subscriber.status === 'UNSUBSCRIBED') {
    return { alreadyUnsubscribed: true }
  }

  await prisma.newsletterSubscriber.update({
    where: { email },
    data: {
      status: 'UNSUBSCRIBED',
      unsubscribedAt: new Date(),
    },
  })

  return { unsubscribed: true }
}

// ============================================================================
// NEWSLETTER STATS
// ============================================================================

/**
 * Get newsletter statistics
 */
export async function getNewsletterStats(newsletterId: string) {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
    include: {
      sends: {
        select: {
          openCount: true,
          clickCount: true,
          openedAt: true,
          clickedAt: true,
        },
      },
    },
  })

  if (!newsletter) {
    throw new Error('Newsletter not found')
  }

  const opened = newsletter.sends.filter((s) => s.openedAt).length
  const clicked = newsletter.sends.filter((s) => s.clickedAt).length
  const totalOpens = newsletter.sends.reduce((sum, s) => sum + s.openCount, 0)
  const totalClicks = newsletter.sends.reduce((sum, s) => sum + s.clickCount, 0)

  return {
    sent: newsletter.sentCount,
    delivered: newsletter.deliveredCount,
    opened,
    clicked,
    totalOpens,
    totalClicks,
    openRate: newsletter.sentCount > 0 ? (opened / newsletter.sentCount) * 100 : 0,
    clickRate: newsletter.sentCount > 0 ? (clicked / newsletter.sentCount) * 100 : 0,
    bounced: newsletter.bouncedCount,
  }
}
