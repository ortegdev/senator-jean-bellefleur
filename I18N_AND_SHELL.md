# I18n and Global Shell Documentation

## Overview

Complete multilingual infrastructure with global shell components, error handling, and translation management for Diaspora4Bellefleur.

## Internationalization (i18n)

### Supported Locales

- **Haitian Creole (ht)** - Primary, default locale
- **French (fr)** - Secondary
- **English (en)** - Tertiary

### Locale Detection Priority

1. **Saved preference** - Cookie `NEXT_LOCALE`
2. **Accept-Language header** - Browser language preference
3. **Geographic detection** - Haiti → `ht`, else `en`
4. **Manual switching** - Language switcher (saves to cookie)

### Adding New Locales (Spanish, Portuguese, etc.)

To add a new locale (translation-file-only change):

1. **Add locale code** to `src/i18n/config.ts`:
   ```typescript
   export const locales = ['ht', 'fr', 'en', 'es', 'pt'] as const
   ```

2. **Add locale metadata**:
   ```typescript
   export const localeNames: Record<Locale, string> = {
     // ...
     es: 'Español',
     pt: 'Português',
   }

   export const dateLocales: Record<Locale, string> = {
     // ...
     es: 'es-ES',
     pt: 'pt-BR',
   }
   ```

3. **Create translation file**: `src/i18n/messages/es.json`
   - Copy `en.json` as template
   - Translate all values
   - Keep keys identical

4. **Update middleware** matcher in `src/middleware.ts`:
   ```typescript
   matcher: ['/', '/(ht|fr|en|es|pt)/:path*', ...]
   ```

5. **Run validation**: `npm run check:translations`

No code changes required beyond config!

## Translation Files

### Structure

```json
{
  "common": { "appName": "...", "loading": "..." },
  "nav": { "home": "...", "about": "..." },
  "affiliation": { "independent": "..." },
  "errors": { "pageNotFound": "..." }
}
```

### Key Naming Conventions

- **camelCase** for keys
- **Nested** for organization
- **ICU format** for interpolation: `{candidateName}`
- **Plural rules** supported: `{count, plural, one {# item} other {# items}}`

### Translation Status

File: `src/i18n/translation-status.json`

Tracks which translations are:
- `complete` + `nativeReviewed: true` ✅
- `machine-drafted` + `nativeReviewed: false` ⚠️ (needs review)

**Priority keys** (must be native-reviewed before launch):
- `affiliation.*` - Legal disclosure
- `candidacyStatus.*` - Verification status
- `cta.*` - Call to action buttons
- `errors.*` - Error messages

### CI Translation Validation

Script: `scripts/check-translations.ts`

```bash
npm run check:translations
```

Checks:
- All locale files have **same keys** (fails if keys diverge)
- Uses `en` as reference
- Reports missing/extra keys per locale

**CI Integration**: Runs automatically in `npm run ci`

## Locale-Specific Features

### Currency Display

File: `src/lib/i18n/currency.ts`

```typescript
// Format USD (always primary currency)
formatUSD(1000) // "$10.00"

// Show approximate local currency
formatWithApproximate(1000, 'HTG')
// { usd: "$10.00", approximate: "HTG 1,300", approximateAmount: 1300 }

// Auto-suggest currency by locale
getSuggestedCurrency('ht') // 'HTG'
getSuggestedCurrency('fr') // 'EUR'
getSuggestedCurrency('en-CA') // 'CAD'
```

**Display pattern**: "$10.00 USD (Approximately 1,300 HTG)"

**Note**: Exchange rates in `src/i18n/config.ts` are approximate, for display only.

### Date Formatting

File: `src/lib/i18n/dates.ts`

```typescript
// Format date
formatDate(date, 'ht', 'medium') // "15 Mas 2027"
formatDate(date, 'fr', 'long') // "15 mars 2027"
formatDate(date, 'en', 'full') // "Monday, March 15, 2027"

// Date + time
formatDateTime(date, 'en') // "Mar 15, 2027, 2:30 PM"

// Relative time
formatRelativeTime(date, 'en') // "3 days ago", "in 2 hours"

// Date range
formatDateRange(start, end, 'en') // "Mar 1 – 15, 2027"
```

### Metadata & SEO

File: `src/app/[locale]/layout.tsx`

- **Dynamic metadata** per locale
- **hreflang** tags for all locales
- **Canonical URLs** with locale prefix
- **Open Graph** localized
- **Twitter Card** localized

## Global Shell Components

### Header

File: `src/components/layout/Header.tsx`

**Features**:
- Sticky, quiet design (bg-white/95 backdrop-blur)
- Wordmark (full on desktop, "D4B" monogram on mobile)
- 4 nav items: About, Nord-Ouest, News, Get Involved
- Language switcher (dropdown)
- Primary CTA (mode-dependent):
  - `INFO_ONLY` → "Learn more" → `/about`
  - `WAITLIST` → "Get launch updates" → `/get-involved`
  - `DONATIONS_LIVE` → "Give $5-$10" → `/contribute`

**Mobile**: Hamburger menu → full-screen sheet

**Accessibility**:
- Semantic HTML (`<header>`, `<nav>`)
- ARIA labels
- Keyboard navigation
- Focus indicators

### Mobile Navigation

File: `src/components/client/MobileNav.tsx`

**Features**:
- Full-screen overlay (prevents body scroll)
- Large logo at top
- Vertical nav links
- Language switcher (list variant)
- Primary CTA pinned at bottom
- Backdrop click to close
- ESC key to close

**Client component** (handles menu state, click events)

### Language Switcher

File: `src/components/client/LanguageSwitcher.tsx`

**Variants**:
1. **Dropdown** (`variant="dropdown"`):
   - Compact `<select>` with native options
   - Good for desktop header

2. **List** (`variant="list"`):
   - Large touch targets
   - Visual checkmark for current locale
   - Good for mobile menu, footer

**Features**:
- Saves preference to cookie (`NEXT_LOCALE`)
- Client-side navigation (no page reload)
- Preserves current page path
- Accessible labels

### Affiliation Disclosure Strip

File: `src/components/layout/AffiliationStrip.tsx`

**Required** on every page (RULE 1: Honesty About Affiliation)

**Placement**: Directly under header, above main content

**Content**: Reads from `CandidateConfig.affiliationText` or defaults:
- `INDEPENDENT`: "Independent supporter initiative, not authorized..."
- `AUTHORIZED`: "Authorized by {candidateName} for Senator"
- `COORDINATED`: "Coordinated with {candidateName} campaign"

**Styling**: Background color varies by status
- `INDEPENDENT`: Neutral gray
- `AUTHORIZED`: Sea green tint
- `COORDINATED`: Salt gold tint

### Footer

File: `src/components/layout/Footer.tsx`

**Features**:
- Coastline constellation background (10% opacity)
- 3-column layout (desktop):
  1. Sitemap links
  2. Legal links (Privacy, Terms, Contact)
  3. Language switcher (list variant)
- Affiliation disclosure (full text)
- Copyright notice
- "Built for the Haitian diaspora..." tagline

**Mobile**: Stacks vertically

## Error Handling

### Error Boundary (`error.tsx`)

File: `src/app/[locale]/error.tsx`

**Client component** that catches rendering errors

**Features**:
- Friendly error icon
- Localized messages
- "Try again" button (calls `reset()`)
- "Reload page" button
- Error ID display (if `error.digest` exists)
- **No stack traces** shown to user
- Server-side logging with **PII scrubbing**

### 404 Not Found

File: `src/app/[locale]/not-found.tsx`

**Features**:
- Large "404" display
- Localized message
- Coastline constellation background
- "Return to home" button
- Maintains shell (header, footer)

### Global Error

File: `src/app/global-error.tsx`

**Catches errors in root layout** (rare)

**Features**:
- Inline styles (no CSS dependency)
- Minimal, accessible HTML
- No i18n (may not be available)
- Always in English for safety

### Maintenance Page

File: `src/app/[locale]/maintenance/page.tsx`

**Features**:
- Gear icon
- "We'll be right back" message
- Last updated timestamp
- Full shell (header, footer)
- Can be statically generated

**Usage**: Link to this page during scheduled maintenance

### Giving Paused Page

File: `src/app/[locale]/giving-paused/page.tsx`

**For kill switch activation**

**Features**:
- Pause icon
- "Giving is paused" message
- "Return to home" and "Check status" buttons
- Full shell (header, footer)
- Localized

**Usage**: Redirect contributions to this page when kill switch is active

## Server/Client Boundary

### RULE 8: No Function Props from Server to Client

**Violation**:
```tsx
// ❌ WRONG - Server Component
export function ServerPage() {
  const handleClick = () => { /* ... */ }
  return <ClientButton onClick={handleClick} /> // ERROR!
}
```

**Correct**:
```tsx
// ✅ RIGHT - Client Component
'use client'
export function ClientButton() {
  const handleClick = () => { /* ... */ }
  return <button onClick={handleClick}>Click</button>
}
```

### Boundary Checker

Script: `scripts/check-boundaries.ts`

```bash
npm run check:boundaries
```

**Heuristic check** for function props passed from server files to client components

Warns about:
- `onClick={...}` patterns
- `onChange={...}` patterns
- `onSubmit={...}` patterns
- Other `on*` prop patterns

**Note**: Heuristic only, manual review still needed

## Client Components

All interactive components are marked with `'use client'`:

- `LanguageSwitcher` - Handles locale changes, saves cookie
- `MobileNav` - Menu state, prevent body scroll, click handlers
- Error boundaries - `reset()` function requires client

## Server Components (Default)

- `Header` - Fetches current mode from database
- `AffiliationStrip` - Fetches candidate config
- `Footer` - Fetches candidate config
- All page layouts

## Development Workflow

### Adding a New String

1. **Add to `en.json`** (reference locale):
   ```json
   {
     "newSection": {
       "newKey": "New value in English"
     }
   }
   ```

2. **Add to `fr.json`** and `ht.json`** (machine-draft or native translate)

3. **Update translation status** if machine-drafted:
   ```json
   {
     "locales": {
       "fr": {
         "priorityKeys": ["newSection.newKey"]
       }
     }
   }
   ```

4. **Run validation**:
   ```bash
   npm run check:translations
   ```

5. **Use in component**:
   ```tsx
   const t = useTranslations('newSection')
   <p>{t('newKey')}</p>
   ```

### Testing Translations

```bash
# Unit tests
npm run test

# Check translation keys in sync
npm run check:translations

# Visual check in browser
npm run dev
# Visit http://localhost:3000/ht, /fr, /en
```

### Before Launch

- [ ] All `machine-drafted` priority keys reviewed by native speakers
- [ ] `npm run check:translations` passing
- [ ] Visual QA in all 3 locales
- [ ] Longest strings tested (doesn't break layout)
- [ ] RTL support considered for future locales

## Accessibility

### WCAG 2.2 AA Compliance

- **Color contrast**: All text meets 4.5:1 minimum
- **Focus indicators**: Visible on all interactive elements
- **Keyboard navigation**: All menus, switchers, CTAs
- **Screen readers**: Semantic HTML, ARIA labels
- **Language switching**: Announced to assistive tech

### Testing

```bash
# Lighthouse audit
npm run build
npm run start
# Visit with Lighthouse

# Keyboard navigation
# Tab through header, footer, language switcher
# Enter/Space to activate

# Screen reader (macOS)
# VoiceOver: Cmd+F5
# Navigate through shell components
```

## Performance

### Font Loading

- **Preloaded**: Critical WOFF2 files
- **Subsetted**: Latin + Latin Extended only
- **Swappable**: `font-display: swap`
- **Variable fonts**: Fraunces + Inter from Google Fonts

### Translation Loading

- **Server-side**: Translations loaded per request
- **No client bundle**: Messages not shipped to client
- **Tree-shaking**: Only used translations bundled

### Caching

- **Candidate config**: In-memory cache (5min dev, 1hr prod)
- **Launch mode**: In-memory cache
- **Static generation**: Locale layouts generated at build

## Scripts

```bash
# Development
npm run dev                    # Start dev server

# Translation Management
npm run check:translations     # Validate translation keys
npm run check:boundaries       # Check Server/Client boundaries

# Testing
npm run test                   # Unit tests
npm run test:integration       # Integration tests (shell components)
npm run test:e2e              # E2E tests (locale switching, shell)

# CI
npm run ci                     # Full CI pipeline (includes translation check)
```

## Files Reference

### Configuration
- `src/i18n/config.ts` - Locale settings, currency, dates
- `src/i18n/routing.ts` - Route definitions, navigation helpers
- `src/middleware.ts` - Locale detection, cookie handling

### Messages
- `src/i18n/messages/ht.json` - Haitian Creole
- `src/i18n/messages/fr.json` - French
- `src/i18n/messages/en.json` - English (reference)
- `src/i18n/translation-status.json` - Review status tracking

### Utilities
- `src/lib/i18n/currency.ts` - Currency formatting
- `src/lib/i18n/dates.ts` - Date/time formatting
- `src/lib/config/candidate.ts` - Candidate config (cached)

### Shell Components
- `src/components/layout/Header.tsx` - Main header
- `src/components/layout/AffiliationStrip.tsx` - Disclosure banner
- `src/components/layout/Footer.tsx` - Site footer
- `src/components/client/LanguageSwitcher.tsx` - Locale switcher
- `src/components/client/MobileNav.tsx` - Mobile menu

### Error Pages
- `src/app/[locale]/error.tsx` - Error boundary
- `src/app/[locale]/not-found.tsx` - 404 page
- `src/app/global-error.tsx` - Root error boundary
- `src/app/[locale]/maintenance/page.tsx` - Maintenance mode
- `src/app/[locale]/giving-paused/page.tsx` - Kill switch page

### Scripts
- `scripts/check-translations.ts` - Validate translation keys
- `scripts/check-boundaries.ts` - Check Server/Client boundaries

### Tests
- `tests/unit/lib/i18n/currency.test.ts` - Currency tests
- `tests/unit/lib/i18n/dates.test.ts` - Date formatting tests
- `tests/integration/shell.test.tsx` - Shell component tests

## Troubleshooting

### Translation Keys Out of Sync

```bash
npm run check:translations
# Fix reported missing/extra keys
```

### Locale Not Detecting

- Check browser Accept-Language header
- Clear `NEXT_LOCALE` cookie
- Check middleware matcher in `src/middleware.ts`

### Mobile Menu Not Closing

- Check body scroll lock in `MobileNav.tsx`
- Verify backdrop click handler
- Check ESC key handler

### Wrong CTA Showing

- Check launch mode in database
- Verify `getCurrentMode()` in Header
- Check `LaunchGate` table

---

**Status**: ✅ Complete

**Next**: Content pages (About, Nord-Ouest, News, Get Involved)
