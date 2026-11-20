/**
 * QR Code Generator
 * 
 * Generates QR codes with UTM parameters for tracking
 */

import QRCode from 'qrcode'
import { buildUrlWithUtm, ShareUrlParams } from './share-toolkit'

// ============================================================================
// QR CODE GENERATION
// ============================================================================

export interface QrCodeOptions {
  url: string
  size?: number // Width/height in pixels
  format?: 'png' | 'svg' | 'dataurl'
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  color?: {
    dark?: string
    light?: string
  }
}

/**
 * Generate QR code for URL
 */
export async function generateQrCode(options: QrCodeOptions): Promise<Buffer | string> {
  const {
    url,
    size = 300,
    format = 'png',
    errorCorrectionLevel = 'M',
    color = {
      dark: '#0F3D4A', // Deep Lagoon
      light: '#FAF6EE', // Sand Paper
    },
  } = options

  const qrOptions: QRCode.QRCodeToBufferOptions = {
    errorCorrectionLevel,
    type: format === 'png' ? 'png' : 'svg',
    width: size,
    color,
    margin: 2,
  }

  if (format === 'dataurl') {
    return QRCode.toDataURL(url, qrOptions)
  } else if (format === 'svg') {
    return QRCode.toString(url, { ...qrOptions, type: 'svg' })
  } else {
    return QRCode.toBuffer(url, qrOptions)
  }
}

// ============================================================================
// QR CODE WITH UTM PARAMETERS
// ============================================================================

export interface QrCodeWithUtmOptions extends Omit<QrCodeOptions, 'url'> {
  baseUrl: string
  source: ShareUrlParams['source']
  medium: 'qr-code' | 'print' | 'flyer'
  campaign?: string
}

/**
 * Generate QR code with UTM tracking parameters
 */
export async function generateQrCodeWithUtm(
  options: QrCodeWithUtmOptions
): Promise<Buffer | string> {
  const trackedUrl = buildUrlWithUtm(options.baseUrl, {
    url: options.baseUrl,
    message: '',
    source: options.source,
    medium: options.medium,
    campaign: options.campaign,
  })

  return generateQrCode({
    ...options,
    url: trackedUrl,
  })
}

// ============================================================================
// BRANDED QR CODE (With Logo/Icon)
// ============================================================================

/**
 * Generate branded QR code with center logo/icon
 * 
 * Note: Requires logo asset. Uses error correction to ensure
 * QR code remains scannable with logo overlay.
 */
export async function generateBrandedQrCode(options: {
  url: string
  logoPath?: string
  size?: number
}): Promise<Buffer> {
  // For branded QR codes, use high error correction
  const qrCode = await generateQrCode({
    url: options.url,
    size: options.size || 300,
    format: 'png',
    errorCorrectionLevel: 'H', // Highest correction for logo overlay
  })

  // If no logo, return plain QR code
  if (!options.logoPath) {
    return qrCode as Buffer
  }

  // Composite logo onto QR code (requires sharp)
  const sharp = (await import('sharp')).default
  const { readFile } = await import('fs/promises')

  const logoBuffer = await readFile(options.logoPath)
  const logoSize = Math.floor((options.size || 300) * 0.25) // Logo is 25% of QR size

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 250, g: 246, b: 238, alpha: 1 } })
    .png()
    .toBuffer()

  const brandedQr = await sharp(qrCode as Buffer)
    .composite([
      {
        input: resizedLogo,
        top: Math.floor(((options.size || 300) - logoSize) / 2),
        left: Math.floor(((options.size || 300) - logoSize) / 2),
      },
    ])
    .png()
    .toBuffer()

  return brandedQr
}

// ============================================================================
// QR CODE FOR DIFFERENT CONTEXTS
// ============================================================================

/**
 * Generate QR code for chapter
 */
export async function generateChapterQrCode(params: {
  chapterSlug: string
  format?: QrCodeOptions['format']
  size?: number
}): Promise<Buffer | string> {
  const baseUrl = `${process.env.SITE_URL}/chapters/${params.chapterSlug}`

  return generateQrCodeWithUtm({
    baseUrl,
    source: 'chapter',
    medium: 'qr-code',
    format: params.format,
    size: params.size,
  })
}

/**
 * Generate QR code for supporter page
 */
export async function generateSupporterPageQrCode(params: {
  supporterSlug: string
  format?: QrCodeOptions['format']
  size?: number
}): Promise<Buffer | string> {
  const baseUrl = `${process.env.SITE_URL}/s/${params.supporterSlug}`

  return generateQrCodeWithUtm({
    baseUrl,
    source: 'supporter',
    medium: 'qr-code',
    campaign: params.supporterSlug,
    format: params.format,
    size: params.size,
  })
}

/**
 * Generate QR code for main site
 */
export async function generateMainSiteQrCode(params: {
  locale?: 'ht' | 'fr' | 'en'
  format?: QrCodeOptions['format']
  size?: number
}): Promise<Buffer | string> {
  const baseUrl = `${process.env.SITE_URL}${params.locale ? `/${params.locale}` : ''}`

  return generateQrCodeWithUtm({
    baseUrl,
    source: 'page',
    medium: 'qr-code',
    format: params.format,
    size: params.size,
  })
}

// ============================================================================
// DOWNLOADABLE QR CODE (For Supporter Kit)
// ============================================================================

export interface DownloadableQrCode {
  buffer: Buffer
  filename: string
  mimeType: string
}

/**
 * Generate downloadable QR code for supporter kit
 */
export async function generateDownloadableQrCode(params: {
  url: string
  filename: string
  size?: number
}): Promise<DownloadableQrCode> {
  const buffer = (await generateQrCode({
    url: params.url,
    size: params.size || 500,
    format: 'png',
    errorCorrectionLevel: 'H',
  })) as Buffer

  return {
    buffer,
    filename: params.filename.endsWith('.png') ? params.filename : `${params.filename}.png`,
    mimeType: 'image/png',
  }
}
