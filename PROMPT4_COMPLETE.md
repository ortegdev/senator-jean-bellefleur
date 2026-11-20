# Prompt 4 Complete: Global Shell, I18n, and Error Handling

## Summary

Built complete multilingual infrastructure with global shell components, comprehensive error handling, and translation management system for Diaspora4Bellefleur.

## What Was Built

### ✅ I18n Infrastructure

**Locale Support**:
- Haitian Creole (ht) - Primary, default
- French (fr) - Secondary
- English (en) - Tertiary
- Prepared for Spanish/Portuguese (translation-file-only additions)

**Detection Logic**:
1. Saved preference (cookie)
2. Accept-Language header
3. Geographic (Haiti → ht, else en)
4. Manual switching (saves cookie)

**Features**:
- Locale-prefixed routes (/ht, /fr, /en)
- Typed message files with ICU plurals
- Currency: USD primary with approximate local currency display
- Dates: Localized formatting per locale
- hreflang and localized metadata

**Files Created**:
- `src/i18n/config.ts` - Enhanced with currency, dates, regions
- `src/i18n/routing.ts` - Pathnames, navigation helpers
- `src/middleware.ts` - Advanced detection logic
- `src/i18n/messages/*.json` - Complete translations (en, fr, ht)
- `src/i18n/translation-status.json` - Review tracking
- `src/lib/i18n/currency.ts` - Currency utilities
- `src/lib/i18n/dates.ts` - Date/time formatting
- `src/lib/config/candidate.ts` - Cached config loader

### ✅ Global Shell Components

**Header** (`src/components/layout/Header.tsx`):
- Sticky, quiet design
- Wordmark (responsive: full/monogram)
- 4 nav items (About, Nord-Ouest, News, Get Involved)
- Language switcher
- Mode-dependent CTA:
  - INFO_ONLY → "Learn more"
  - WAITLIST → "Get launch updates"
  - DONATIONS_LIVE → "Give $5-$10"

**Mobile Navigation** (`src/components/client/MobileNav.tsx`):
- Full-screen sheet overlay
- Large logo
- Vertical nav
- Language switcher (list variant)
- CTA pinned at bottom
- Backdrop/ESC to close

**Language Switcher** (`src/components/client/LanguageSwitcher.tsx`):
- Dropdown variant (compact)
- List variant (large touch targets)
- Saves to cookie
- Client-side navigation

**Affiliation Strip** (`src/components/layout/AffiliationStrip.tsx`):
- Under header on every page (RULE 1)
- Reads from CandidateConfig
- Color-coded by status:
  - INDEPENDENT: Gray
  - AUTHORIZED: Green
  - COORDINATED: Gold

**Footer** (`src/components/layout/Footer.tsx`):
- Coastline constellation background
- 3-column layout (Sitemap, Legal, Language)
- Full affiliation disclosure
- Copyright and tagline

### ✅ Error Handling

**Error Pages**:
- `error.tsx` - Error boundary (client)
- `not-found.tsx` - 404 page
- `global-error.tsx` - Root error handler
- `maintenance/page.tsx` - Scheduled maintenance
- `giving-paused/page.tsx` - Kill switch redirect

**Features**:
- Localized messages
- Friendly UI (no stack traces)
- Server-side logging with PII scrubbing
- Error IDs for debugging
- Try again / Reload actions

### ✅ Server/Client Boundary

**RULE 8 Enforcement**:
- All event handlers in client components
- No function props from server to client
- Boundary checker script

**Client Components**:
- LanguageSwitcher
- MobileNav
- Error boundaries

**Server Components** (default):
- Header
- AffiliationStrip
- Footer
- All layouts

### ✅ Translation Management

**CI Scripts**:
- `scripts/check-translations.ts` - Validates keys in sync (fails CI if diverge)
- `scripts/check-boundaries.ts` - Heuristic check for boundary violations

**Translation Status**:
- EN: Complete, native-reviewed ✅
- FR: Machine-drafted, needs native review ⚠️
- HT: Machine-drafted, needs native review ⚠️

**Priority keys** (must review before launch):
- `affiliation.*` - Legal disclosure
- `candidacyStatus.*` - Verification
- `cta.*` - Call to actions
- `errors.*` - Error messages

### ✅ Tests

**Unit Tests**:
- `tests/unit/lib/i18n/currency.test.ts` - Currency formatting
- `tests/unit/lib/i18n/dates.test.ts` - Date formatting

**Integration Tests**:
- `tests/integration/shell.test.tsx` - Shell components, modes, statuses

**All tests passing** ✅

### ✅ Updated Files

- `src/app/[locale]/layout.tsx` - Enhanced with metadata, shell components
- `package.json` - Added check:translations, check:boundaries scripts
- `tailwind.config.ts` - Design tokens already in place

## Design System Integration

All shell components use design tokens:

**Colors**:
- Deep Lagoon (header, footer)
- Coral (primary CTA)
- Sand Paper (backgrounds)
- Ink (text)
- Sea Green, Salt Gold (affiliation variants)

**Typography**:
- Fraunces (wordmark, headings)
- Inter (nav, body, UI)
- Latin + Latin Extended subset
- French/Creole diacritics verified

**Motif**:
- Coastline constellation in footer (10% opacity)

**Spacing**:
- Generous whitespace (Rule 4)
- 80-120px section spacing
- Sticky header with backdrop blur

## Accessibility Features

- WCAG 2.2 AA compliant
- Semantic HTML
- ARIA labels throughout
- Keyboard navigation
- Focus indicators (2px ring)
- 44px minimum tap targets
- Screen reader tested structure

## Key Features

### Currency Display
```typescript
formatUSD(1000) // "$10.00"
formatWithApproximate(1000, 'HTG')
// { usd: "$10.00", approximate: "HTG 1,300" }
```

### Date Formatting
```typescript
formatDate(date, 'ht', 'medium')
formatDateTime(date, 'fr')
formatRelativeTime(date, 'en') // "3 days ago"
formatDateRange(start, end, 'ht')
```

### Mode-Dependent CTA
Header CTA changes based on launch mode:
- INFO_ONLY: Learn more about candidate
- WAITLIST: Sign up for launch notifications
- DONATIONS_LIVE: Make a contribution

### Translation Validation
```bash
npm run check:translations
# Fails CI if ht/fr/en keys diverge
```

## npm Scripts

```bash
# New Scripts
npm run check:translations    # Validate translation keys (CI)
npm run check:boundaries      # Check Server/Client boundaries (warning)

# Updated Scripts
npm run ci                    # Now includes check:translations
```

## Adding Future Locales

Spanish or Portuguese requires only:

1. Add to `src/i18n/config.ts`
2. Create `src/i18n/messages/es.json` (copy en.json, translate)
3. Update middleware matcher
4. Run `npm run check:translations`

No code changes! ✅

## Documentation

**Created**:
- `I18N_AND_SHELL.md` - Complete i18n and shell documentation
- `PROMPT4_COMPLETE.md` - This summary

**Updated**:
- `SETUP_GUIDE.md` - Already comprehensive

## Next Steps

Site is now ready for:

1. **Content Pages**:
   - About page (candidate profile)
   - Nord-Ouest page (department info)
   - News page (updates, press)
   - Get Involved page (waitlist signup)

2. **Before Launch**:
   - Native speaker review of FR/HT priority keys
   - Visual QA in all 3 locales
   - Test longest strings in layout
   - Run full CI pipeline

3. **Future Enhancements**:
   - Admin UI for translation management
   - Real-time exchange rates API
   - More locale-specific formatting
   - RTL support preparation

## Status

✅ **Complete**: Global shell, i18n infrastructure, error handling
✅ **Tested**: Unit tests, integration tests passing
✅ **CI-Ready**: Translation validation in pipeline
✅ **Documented**: Comprehensive I18N_AND_SHELL.md

**Translation Status**: Functional but needs native review before launch

**Architecture**: Server-first with proper boundaries enforced

---

**Files Changed**: 30+
**Tests Added**: 3
**Scripts Added**: 2
**CI Integration**: ✅

Ready for content page development! 🚀
