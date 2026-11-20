/**
 * Dynamic Social Card Generator
 * 
 * Generates Open Graph and story-size social cards with:
 * - Brand palette (Deep Lagoon, Coral, Sand Paper)
 * - Display font (Fraunces)
 * - Coastline constellation motif
 * - No candidate photo (unless approved asset exists)
 * - Supporter chapter or page name
 * - Multilingual (ht, fr, en)
 */

import { getCandidateConfig } from '@/lib/config/candidate'
import satori from 'satori'
import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { join } from 'path'

// ============================================================================
// CARD DIMENSIONS
// ============================================================================

export const CARD_SIZES = {
  og: { width: 1200, height: 630 }, // Open Graph (Facebook, LinkedIn, etc.)
  twitter: { width: 1200, height: 675 }, // Twitter/X
  story: { width: 1080, height: 1920 }, // Instagram/Facebook Stories
  square: { width: 1080, height: 1080 }, // Instagram/Facebook Posts
} as const

export type CardSize = keyof typeof CARD_SIZES

// ============================================================================
// BRAND COLORS
// ============================================================================

const COLORS = {
  deepLagoon: '#0F3D4A',
  coral: '#C8432B',
  sandPaper: '#FAF6EE',
  ink: '#0B1D24',
  seaGreen: '#1F8A70',
  saltGold: '#EFB93F',
}

// ============================================================================
// COASTLINE CONSTELLATION SVG
// ============================================================================

/**
 * Simplified coastline constellation for cards
 * Port-de-Paix to diaspora cities
 */
function getConstellationSvg(width: number, height: number): string {
  // Positions scaled to card size
  const dots = [
    { x: width * 0.2, y: height * 0.5, label: 'Port-de-Paix' }, // Center-left
    { x: width * 0.4, y: height * 0.3, label: 'Miami' },
    { x: width * 0.5, y: height * 0.2, label: 'New York' },
    { x: width * 0.65, y: height * 0.25, label: 'Boston' },
    { x: width * 0.75, y: height * 0.35, label: 'Montreal' },
    { x: width * 0.85, y: height * 0.45, label: 'Paris' },
  ]

  const lines = dots
    .slice(1)
    .map(
      (dot, i) =>
        `<line x1="${dots[0].x}" y1="${dots[0].y}" x2="${dot.x}" y2="${dot.y}" stroke="${COLORS.deepLagoon}" stroke-width="1" opacity="0.2" />`
    )
    .join('')

  const circles = dots
    .map((dot) => `<circle cx="${dot.x}" cy="${dot.y}" r="3" fill="${COLORS.seaGreen}" opacity="0.3" />`)
    .join('')

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${lines}
      ${circles}
    </svg>
  `
}

// ============================================================================
// CARD DATA
// ============================================================================

export interface SocialCardData {
  title: string
  subtitle?: string // Chapter or supporter name
  locale: 'ht' | 'fr' | 'en'
  size: CardSize
  includeAffilationDisclosure?: boolean
}

// ============================================================================
// GENERATE CARD HTML (for Satori)
// ============================================================================

async function generateCardHtml(data: SocialCardData): Promise<string> {
  const config = await getCandidateConfig()
  const { width, height } = CARD_SIZES[data.size]

  const affiliationText = {
    ht: 'Inisyativ sipòtè endepandan',
    fr: 'Initiative de supporters indépendants',
    en: 'Independent supporter initiative',
  }

  // Build card JSX-like structure for Satori
  return `
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '${COLORS.sandPaper}',
        position: 'relative',
        padding: '60px',
      }}
    >
      {/* Constellation background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.15,
        }}
      >
        ${getConstellationSvg(width, height)}
      </div>

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          zIndex: 1,
        }}
      >
        {/* Main text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h1
            style={{
              fontFamily: 'Fraunces',
              fontSize: data.size === 'story' ? '72px' : '60px',
              fontWeight: 700,
              color: '${COLORS.deepLagoon}',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            ${data.title}
          </h1>

          ${
            data.subtitle
              ? `
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: data.size === 'story' ? '36px' : '28px',
              fontWeight: 500,
              color: '${COLORS.ink}',
              margin: 0,
              opacity: 0.8,
            }}
          >
            ${data.subtitle}
          </p>
          `
              : ''
          }
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Domain/URL */}
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: '24px',
              fontWeight: 600,
              color: '${COLORS.coral}',
            }}
          >
            ${config.domain || 'diaspora4bellefleur.org'}
          </div>

          ${
            data.includeAffilationDisclosure
              ? `
          {/* Affiliation disclosure */}
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: '18px',
              fontWeight: 400,
              color: '${COLORS.ink}',
              opacity: 0.6,
            }}
          >
            ${affiliationText[data.locale]}
          </div>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `
}

// ============================================================================
// GENERATE CARD IMAGE
// ============================================================================

/**
 * Generate social card as PNG buffer
 * 
 * Uses Satori for HTML-to-SVG, then Sharp for SVG-to-PNG
 */
export async function generateSocialCard(data: SocialCardData): Promise<Buffer> {
  const { width, height } = CARD_SIZES[data.size]

  // Load fonts
  const frauncesFont = await readFile(
    join(process.cwd(), 'public/fonts/Fraunces-Bold.ttf')
  )
  const interFont = await readFile(join(process.cwd(), 'public/fonts/Inter-Regular.ttf'))
  const interBoldFont = await readFile(join(process.cwd(), 'public/fonts/Inter-SemiBold.ttf'))

  // Generate HTML
  const html = await generateCardHtml(data)

  // Convert HTML to SVG using Satori
  const svg = await satori(html as any, {
    width,
    height,
    fonts: [
      {
        name: 'Fraunces',
        data: frauncesFont,
        weight: 700,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: interFont,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: interBoldFont,
        weight: 600,
        style: 'normal',
      },
    ],
  })

  // Convert SVG to PNG using Sharp
  const png = await sharp(Buffer.from(svg))
    .png()
    .toBuffer()

  return png
}

// ============================================================================
// CARD URL GENERATOR
// ============================================================================

/**
 * Generate URL for dynamic card endpoint
 */
export function generateCardUrl(params: {
  title: string
  subtitle?: string
  locale: 'ht' | 'fr' | 'en'
  size: CardSize
}): string {
  const url = new URL('/api/og', process.env.SITE_URL || 'http://localhost:3000')

  url.searchParams.set('title', params.title)
  if (params.subtitle) {
    url.searchParams.set('subtitle', params.subtitle)
  }
  url.searchParams.set('locale', params.locale)
  url.searchParams.set('size', params.size)

  return url.toString()
}

// ============================================================================
// OPEN GRAPH META TAGS
// ============================================================================

export interface OpenGraphMeta {
  title: string
  description: string
  url: string
  image: string
  imageAlt: string
  locale: 'ht_HT' | 'fr_FR' | 'en_US'
  type: 'website' | 'article' | 'profile'
  siteName: string
}

/**
 * Generate Open Graph meta tags for page
 */
export async function generateOpenGraphMeta(params: {
  title: string
  description: string
  url: string
  locale: 'ht' | 'fr' | 'en'
  subtitle?: string
  type?: OpenGraphMeta['type']
}): Promise<OpenGraphMeta> {
  const config = await getCandidateConfig()

  const localeMap = {
    ht: 'ht_HT' as const,
    fr: 'fr_FR' as const,
    en: 'en_US' as const,
  }

  const imageUrl = generateCardUrl({
    title: params.title,
    subtitle: params.subtitle,
    locale: params.locale,
    size: 'og',
  })

  return {
    title: params.title,
    description: params.description,
    url: params.url,
    image: imageUrl,
    imageAlt: `${params.title} - ${config.candidateName}`,
    locale: localeMap[params.locale],
    type: params.type || 'website',
    siteName: `Diaspora4Bellefleur`,
  }
}

// ============================================================================
// TWITTER CARD META TAGS
// ============================================================================

export interface TwitterCardMeta {
  card: 'summary' | 'summary_large_image' | 'app' | 'player'
  title: string
  description: string
  image: string
  imageAlt: string
}

/**
 * Generate Twitter/X card meta tags
 */
export function generateTwitterCardMeta(params: {
  title: string
  description: string
  locale: 'ht' | 'fr' | 'en'
  subtitle?: string
}): TwitterCardMeta {
  const imageUrl = generateCardUrl({
    title: params.title,
    subtitle: params.subtitle,
    locale: params.locale,
    size: 'twitter',
  })

  return {
    card: 'summary_large_image',
    title: params.title,
    description: params.description,
    image: imageUrl,
    imageAlt: params.title,
  }
}

// ============================================================================
// STORY-SIZE CARD (for Instagram/Facebook Stories)
// ============================================================================

/**
 * Generate story-size card with QR code
 * 
 * Used for manual Instagram Story sharing
 */
export async function generateStoryCard(params: {
  title: string
  subtitle?: string
  locale: 'ht' | 'fr' | 'en'
  qrCodeUrl: string
}): Promise<Buffer> {
  // Generate base card
  const baseCard = await generateSocialCard({
    title: params.title,
    subtitle: params.subtitle,
    locale: params.locale,
    size: 'story',
    includeAffilationDisclosure: true,
  })

  // Generate QR code (imported from qr-generator.ts)
  const { generateQrCode } = await import('./qr-generator')
  const qrCode = await generateQrCode({
    url: params.qrCodeUrl,
    size: 300,
    format: 'png',
  })

  // Composite QR code onto card (bottom center)
  const cardWithQr = await sharp(baseCard)
    .composite([
      {
        input: qrCode,
        top: 1920 - 350, // 50px from bottom
        left: (1080 - 300) / 2, // Centered
      },
    ])
    .png()
    .toBuffer()

  return cardWithQr
}
