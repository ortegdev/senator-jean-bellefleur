/**
 * Supporter Kit
 * 
 * Localized graphics, flyer PDFs, email templates, talking points
 * All assets flagged as APPROVED or DRAFT
 */

import { prisma } from '@/lib/db/prisma'

// ============================================================================
// SUPPORTER KIT ASSET TYPES
// ============================================================================

export enum AssetType {
  GRAPHIC_SQUARE = 'GRAPHIC_SQUARE', // 1080x1080 for Instagram/Facebook
  GRAPHIC_STORY = 'GRAPHIC_STORY', // 1080x1920 for Stories
  GRAPHIC_BANNER = 'GRAPHIC_BANNER', // Web banner
  FLYER_PDF = 'FLYER_PDF', // Printable flyer
  EMAIL_TEMPLATE = 'EMAIL_TEMPLATE', // HTML email template
  TALKING_POINTS = 'TALKING_POINTS', // Text document
  QR_CODE = 'QR_CODE', // QR code for sharing
}

export enum AssetStatus {
  DRAFT = 'DRAFT', // In progress, not for distribution
  APPROVED = 'APPROVED', // Reviewed and approved for use
  ARCHIVED = 'ARCHIVED', // No longer in use
}

// ============================================================================
// DATABASE MODEL (Add to schema.prisma)
// ============================================================================

/*
model SupporterKitAsset {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Asset identity
  slug        String      @unique
  type        AssetType
  status      AssetStatus @default(DRAFT)

  // Localized titles
  titleHt String
  titleFr String
  titleEn String

  // Localized descriptions
  descriptionHt String? @db.Text
  descriptionFr String? @db.Text
  descriptionEn String? @db.Text

  // File URLs (Vercel Blob, S3, etc.)
  fileUrlHt String? // Haitian Creole version
  fileUrlFr String? // French version
  fileUrlEn String? // English version

  // Metadata
  fileSizeBytes Int?
  mimeType      String?
  dimensions    String? // e.g., "1080x1080"

  // Approval workflow
  approvedBy     String?
  approvedAt     DateTime?
  approvalNotes  String? @db.Text

  // Display order
  order Int @default(0)

  @@index([type])
  @@index([status])
  @@index([order])
}
*/

// ============================================================================
// SUPPORTER KIT QUERIES
// ============================================================================

export interface SupporterKitAsset {
  id: string
  slug: string
  type: AssetType
  status: AssetStatus
  titleHt: string
  titleFr: string
  titleEn: string
  descriptionHt?: string
  descriptionFr?: string
  descriptionEn?: string
  fileUrlHt?: string
  fileUrlFr?: string
  fileUrlEn?: string
  fileSizeBytes?: number
  mimeType?: string
  dimensions?: string
  approvedBy?: string
  approvedAt?: Date
  order: number
}

/**
 * Get all approved assets for supporter kit
 */
export async function getApprovedAssets(
  type?: AssetType
): Promise<SupporterKitAsset[]> {
  const where: any = {
    status: AssetStatus.APPROVED,
  }

  if (type) {
    where.type = type
  }

  return prisma.supporterKitAsset.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  }) as any
}

/**
 * Get asset by slug (any status for admin)
 */
export async function getAssetBySlug(slug: string): Promise<SupporterKitAsset | null> {
  return prisma.supporterKitAsset.findUnique({
    where: { slug },
  }) as any
}

/**
 * Get assets by type and status
 */
export async function getAssetsByType(
  type: AssetType,
  status?: AssetStatus
): Promise<SupporterKitAsset[]> {
  const where: any = { type }

  if (status) {
    where.status = status
  }

  return prisma.supporterKitAsset.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  }) as any
}

// ============================================================================
// TALKING POINTS GENERATOR
// ============================================================================

export interface TalkingPoints {
  locale: 'ht' | 'fr' | 'en'
  title: string
  sections: {
    heading: string
    points: string[]
  }[]
  footer: string
}

/**
 * Generate talking points document
 * 
 * These are stored as TALKING_POINTS assets but can also be
 * dynamically generated based on candidate config and content.
 */
export async function generateTalkingPoints(locale: 'ht' | 'fr' | 'en'): Promise<TalkingPoints> {
  const { getCandidateConfig } = await import('@/lib/config/candidate')
  const config = await getCandidateConfig()

  const titles = {
    ht: `Pwen Diskisyon: Sipòte ${config.candidateName}`,
    fr: `Points de discussion : Soutenir ${config.candidateName}`,
    en: `Talking Points: Supporting ${config.candidateName}`,
  }

  const whySupport = {
    ht: {
      heading: 'Poukisa nou sipòte li',
      points: [
        `${config.candidateName} se yon kandida seryø pou Senatè ${config.department}`,
        'Nou se yon gwoup sipòtè endepandan',
        'Nou vle wè yon reprezantasyon jis pou depatman nou an',
      ],
    },
    fr: {
      heading: 'Pourquoi nous le soutenons',
      points: [
        `${config.candidateName} est un candidat sérieux pour Sénateur du ${config.department}`,
        'Nous sommes un groupe de supporters indépendants',
        'Nous voulons une représentation équitable pour notre département',
      ],
    },
    en: {
      heading: 'Why we support him',
      points: [
        `${config.candidateName} is a serious candidate for Senator of ${config.department}`,
        'We are an independent supporter group',
        'We want fair representation for our department',
      ],
    },
  }

  const whatYouCanDo = {
    ht: {
      heading: 'Sa ou ka fè',
      points: [
        'Pataje lyen sit wèb nou an ak fanmi ak zanmi ou yo',
        'Swiv nou sou rezo sosyal',
        'Anrejistre pou w vote si w kalifye',
        'Kontribye si w kapab',
      ],
    },
    fr: {
      heading: 'Ce que vous pouvez faire',
      points: [
        'Partager le lien de notre site avec votre famille et vos amis',
        'Nous suivre sur les réseaux sociaux',
        "Vous inscrire pour voter si vous êtes éligible",
        'Contribuer si vous le pouvez',
      ],
    },
    en: {
      heading: 'What you can do',
      points: [
        'Share our website link with family and friends',
        'Follow us on social media',
        'Register to vote if eligible',
        'Contribute if you can',
      ],
    },
  }

  const footers = {
    ht: `Nòt: Nou se yon inisyativ sipòtè endepandan. Nou pa otorize pa kandida a, kanpay li oswa nenpòt pati.`,
    fr: `Note : Nous sommes une initiative de supporters indépendants. Nous ne sommes pas autorisés par le candidat, sa campagne ou aucun parti.`,
    en: `Note: We are an independent supporter initiative. We are not authorized by the candidate, his campaign or any party.`,
  }

  return {
    locale,
    title: titles[locale],
    sections: [whySupport[locale], whatYouCanDo[locale]],
    footer: footers[locale],
  }
}

// ============================================================================
// EMAIL TEMPLATE GENERATOR
// ============================================================================

export interface EmailTemplate {
  subject: string
  bodyHtml: string
  bodyText: string
}

/**
 * Generate email template for sharing
 */
export async function generateEmailTemplate(
  locale: 'ht' | 'fr' | 'en'
): Promise<EmailTemplate> {
  const { getCandidateConfig } = await import('@/lib/config/candidate')
  const config = await getCandidateConfig()

  const subjects = {
    ht: `Sipòte ${config.candidateName} pou Senatè ${config.department}`,
    fr: `Soutenir ${config.candidateName} pour Sénateur du ${config.department}`,
    en: `Support ${config.candidateName} for Senator of ${config.department}`,
  }

  const greetings = {
    ht: 'Bonjou,',
    fr: 'Bonjour,',
    en: 'Hello,',
  }

  const bodyParagraphs = {
    ht: [
      `Mwen vle pataje ak ou yon bagay enpòtan. ${config.candidateName} ap kanpe kòm kandida pou Senatè depatman ${config.department}.`,
      `Nou se yon gwoup sipòtè endepandan ki kwè nan reprezantasyon jis pou depatman nou an.`,
      `Ou ka aprann plis sou sit wèb nou an: ${config.domain}`,
      `Mèsi pou sipò ou!`,
    ],
    fr: [
      `Je voulais partager quelque chose d'important avec vous. ${config.candidateName} se présente comme candidat pour Sénateur du département du ${config.department}.`,
      `Nous sommes un groupe de supporters indépendants qui croit en une représentation équitable pour notre département.`,
      `Vous pouvez en apprendre plus sur notre site web : ${config.domain}`,
      `Merci pour votre soutien!`,
    ],
    en: [
      `I wanted to share something important with you. ${config.candidateName} is running as a candidate for Senator of ${config.department} department.`,
      `We are an independent supporter group that believes in fair representation for our department.`,
      `You can learn more on our website: ${config.domain}`,
      `Thank you for your support!`,
    ],
  }

  const disclaimers = {
    ht: `Nòt: Nou se yon inisyativ sipòtè endepandan. Nou pa otorize pa kandida a, kanpay li oswa nenpòt pati.`,
    fr: `Note : Nous sommes une initiative de supporters indépendants. Nous ne sommes pas autorisés par le candidat, sa campagne ou aucun parti.`,
    en: `Note: We are an independent supporter initiative. We are not authorized by the candidate, his campaign or any party.`,
  }

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjects[locale]}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0B1D24; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greetings[locale]}</p>
  ${bodyParagraphs[locale].map((p) => `<p>${p}</p>`).join('\n  ')}
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
  <p style="font-size: 12px; color: #6B7280;">
    ${disclaimers[locale]}
  </p>
</body>
</html>
  `

  const bodyText = `
${greetings[locale]}

${bodyParagraphs[locale].join('\n\n')}

---
${disclaimers[locale]}
  `.trim()

  return {
    subject: subjects[locale],
    bodyHtml,
    bodyText,
  }
}

// ============================================================================
// FLYER PDF GENERATION (with QR Code)
// ============================================================================

/**
 * Generate printable flyer PDF with QR code
 * 
 * Uses Puppeteer or similar to render HTML to PDF
 * Includes QR code linking to main site or supporter page
 */
export async function generateFlyerPdf(params: {
  locale: 'ht' | 'fr' | 'en'
  qrCodeUrl: string
  supporterName?: string
}): Promise<Buffer> {
  const { getCandidateConfig } = await import('@/lib/config/candidate')
  const config = await getCandidateConfig()

  const { generateQrCodeWithUtm } = await import('./qr-generator')

  // Generate QR code
  const qrCodeDataUrl = (await generateQrCodeWithUtm({
    baseUrl: params.qrCodeUrl,
    source: 'page',
    medium: 'print',
    format: 'dataurl',
    size: 300,
  })) as string

  const titles = {
    ht: `Sipòte ${config.candidateName}`,
    fr: `Soutenir ${config.candidateName}`,
    en: `Support ${config.candidateName}`,
  }

  const subtitles = {
    ht: `Kandida pou Senatè ${config.department}`,
    fr: `Candidat pour Sénateur du ${config.department}`,
    en: `Candidate for Senator of ${config.department}`,
  }

  const scanTexts = {
    ht: 'Skane pou aprann plis',
    fr: 'Scannez pour en savoir plus',
    en: 'Scan to learn more',
  }

  const disclaimers = {
    ht: 'Inisyativ sipòtè endepandan',
    fr: 'Initiative de supporters indépendants',
    en: 'Independent supporter initiative',
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #FAF6EE;
      width: 8.5in;
      height: 11in;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1in;
      position: relative;
    }
    .title {
      font-size: 48pt;
      font-weight: 700;
      color: #0F3D4A;
      text-align: center;
      margin-bottom: 20px;
    }
    .subtitle {
      font-size: 24pt;
      color: #0B1D24;
      text-align: center;
      margin-bottom: 60px;
    }
    .qr-code {
      margin: 40px 0;
      text-align: center;
    }
    .qr-code img {
      width: 300px;
      height: 300px;
    }
    .scan-text {
      font-size: 18pt;
      color: #0B1D24;
      text-align: center;
      margin-top: 20px;
    }
    .url {
      font-size: 16pt;
      color: #C8432B;
      font-weight: 600;
      text-align: center;
      margin-top: 40px;
    }
    .disclaimer {
      position: absolute;
      bottom: 0.5in;
      left: 0;
      right: 0;
      font-size: 10pt;
      color: #6B7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="title">${titles[params.locale]}</div>
  <div class="subtitle">${subtitles[params.locale]}</div>
  
  <div class="qr-code">
    <img src="${qrCodeDataUrl}" alt="QR Code" />
  </div>
  
  <div class="scan-text">${scanTexts[params.locale]}</div>
  <div class="url">${config.domain || 'diaspora4bellefleur.org'}</div>
  
  ${params.supporterName ? `<div style="margin-top: 40px; font-size: 14pt; color: #0B1D24;">Shared by ${params.supporterName}</div>` : ''}
  
  <div class="disclaimer">${disclaimers[params.locale]}</div>
</body>
</html>
  `

  // Convert HTML to PDF using Puppeteer
  // Note: This requires puppeteer to be installed
  // For production, consider using a PDF generation service
  
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const pdf = await page.pdf({
    format: 'letter',
    printBackground: true,
  })

  await browser.close()

  return pdf
}
