/**
 * Privacy-Friendly Analytics (Plausible)
 * 
 * Cookieless, GDPR-compliant analytics with custom events:
 * - Page views (automatic)
 * - Custom events: view, start-checkout, donation-complete, share-click
 * - No PII collection
 */

// ============================================================================
// PLAUSIBLE SCRIPT TAG
// ============================================================================

/**
 * Generate Plausible script tag for <head>
 * 
 * Use data-domain to configure which site to track
 */
export function getPlausibleScriptTag(): string {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'diaspora4bellefleur.org'

  // Only enable in production
  if (process.env.NODE_ENV !== 'production') {
    return ''
  }

  return `
    <script
      defer
      data-domain="${domain}"
      src="https://plausible.io/js/script.js"
    ></script>
  `.trim()
}

// ============================================================================
// CUSTOM EVENTS
// ============================================================================

export type AnalyticsEvent =
  | 'view' // Generic page view
  | 'start-checkout' // User starts donation flow
  | 'donation-complete' // Donation successfully completed
  | 'share-click' // User clicks share button
  | 'chapter-join' // User joins a chapter
  | 'supporter-page-create' // User creates supporter page
  | 'email-signup' // User signs up for email list
  | 'roots-select' // User selects family commune

export interface EventProps {
  // All values must be strings for Plausible
  [key: string]: string | number | boolean
}

/**
 * Track custom event with Plausible
 * 
 * Privacy-safe: No PII, no cookies, aggregated data only
 */
export function trackEvent(
  event: AnalyticsEvent,
  props?: EventProps,
  callback?: () => void
): void {
  // Only track in production
  if (process.env.NODE_ENV !== 'production') {
    if (callback) callback()
    return
  }

  // Check if Plausible is loaded
  if (typeof window === 'undefined' || !window.plausible) {
    console.warn('[Analytics] Plausible not loaded')
    if (callback) callback()
    return
  }

  // Track event
  window.plausible(event, {
    props: props || {},
    callback: callback || undefined,
  })
}

// ============================================================================
// SPECIFIC EVENT TRACKERS
// ============================================================================

/**
 * Track donation flow start
 */
export function trackCheckoutStart(props: {
  amount: number // Amount in cents
  currency: string
  source: string // 'page', 'chapter', 'supporter'
}): void {
  trackEvent('start-checkout', {
    amount: props.amount,
    currency: props.currency,
    source: props.source,
  })
}

/**
 * Track completed donation
 */
export function trackDonationComplete(props: {
  amount: number // Amount in cents
  currency: string
  source: string
  referrer?: string // Referrer supporter page slug
}): void {
  trackEvent('donation-complete', {
    amount: props.amount,
    currency: props.currency,
    source: props.source,
    referrer: props.referrer || 'none',
  })
}

/**
 * Track share button click
 */
export function trackShareClick(props: {
  medium: 'whatsapp' | 'facebook' | 'messenger' | 'telegram' | 'sms' | 'email' | 'copy' | 'web-share'
  source: 'page' | 'chapter' | 'supporter'
  path: string
}): void {
  trackEvent('share-click', {
    medium: props.medium,
    source: props.source,
    path: props.path,
  })
}

/**
 * Track chapter join
 */
export function trackChapterJoin(props: {
  chapterSlug: string
}): void {
  trackEvent('chapter-join', {
    chapter: props.chapterSlug,
  })
}

/**
 * Track supporter page creation
 */
export function trackSupporterPageCreate(props: {
  hasStory: boolean
  hasRoots: boolean
}): void {
  trackEvent('supporter-page-create', {
    hasStory: props.hasStory.toString(),
    hasRoots: props.hasRoots.toString(),
  })
}

/**
 * Track email signup
 */
export function trackEmailSignup(props: {
  source: 'waitlist' | 'newsletter' | 'updates'
}): void {
  trackEvent('email-signup', {
    source: props.source,
  })
}

/**
 * Track roots commune selection
 */
export function trackRootsSelect(props: {
  commune: string
}): void {
  trackEvent('roots-select', {
    commune: props.commune,
  })
}

// ============================================================================
// PAGE VIEW TRACKING (Manual)
// ============================================================================

/**
 * Track page view manually (if needed)
 * 
 * Plausible automatically tracks page views, but this can be used
 * for SPA navigation or virtual page views
 */
export function trackPageView(url?: string): void {
  if (typeof window === 'undefined' || !window.plausible) {
    return
  }

  // Plausible automatically tracks page views via script.js
  // This is only needed for SPAs with client-side routing
  window.plausible('pageview', {
    props: url ? { url } : undefined,
  })
}

// ============================================================================
// CONVERSION GOALS (Configure in Plausible Dashboard)
// ============================================================================

/**
 * Plausible Conversion Goals to configure:
 * 
 * 1. donation-complete (Revenue goal with "amount" property)
 * 2. email-signup (Goal)
 * 3. chapter-join (Goal)
 * 4. supporter-page-create (Goal)
 * 5. share-click (Goal with "medium" breakdown)
 * 
 * Custom properties to enable:
 * - amount (number)
 * - currency (string)
 * - source (string)
 * - medium (string)
 * - referrer (string)
 */

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: {
        props?: Record<string, string | number | boolean>
        callback?: () => void
      }
    ) => void
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * React hook for tracking events
 */
export function useAnalytics() {
  return {
    trackEvent,
    trackCheckoutStart,
    trackDonationComplete,
    trackShareClick,
    trackChapterJoin,
    trackSupporterPageCreate,
    trackEmailSignup,
    trackRootsSelect,
    trackPageView,
  }
}

// ============================================================================
// DASHBOARD WIDGET EMBED
// ============================================================================

/**
 * Generate embeddable progress widget HTML
 * 
 * Shows aggregated donation count and supporter count
 * Privacy-safe: No individual donor information
 */
export async function generateProgressWidgetHtml(params: {
  backgroundColor?: string
  textColor?: string
  accentColor?: string
}): Promise<string> {
  const { prisma } = await import('@/lib/db/prisma')

  // Get aggregate stats (privacy-safe)
  const totalContributions = await prisma.contribution.count({
    where: { paymentStatus: 'SUCCEEDED' },
  })

  const totalSupporters = await prisma.donor.count({
    where: {
      contributions: {
        some: {
          paymentStatus: 'SUCCEEDED',
        },
      },
    },
  })

  const bg = params.backgroundColor || '#FAF6EE'
  const text = params.textColor || '#0B1D24'
  const accent = params.accentColor || '#C8432B'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${bg};
      color: ${text};
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 100vh;
      justify-content: center;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 48px;
      font-weight: 700;
      color: ${accent};
      line-height: 1;
    }
    .stat-label {
      font-size: 16px;
      margin-top: 8px;
      opacity: 0.8;
    }
    .disclaimer {
      text-align: center;
      font-size: 12px;
      opacity: 0.6;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="stat">
    <div class="stat-value">${totalSupporters.toLocaleString()}</div>
    <div class="stat-label">Supporters</div>
  </div>
  
  <div class="stat">
    <div class="stat-value">${totalContributions.toLocaleString()}</div>
    <div class="stat-label">Contributions</div>
  </div>
  
  <div class="disclaimer">
    Independent supporter initiative
  </div>
</body>
</html>
  `.trim()
}
