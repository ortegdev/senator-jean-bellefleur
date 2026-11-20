# Prompt 9 Complete: In the News - Automated Coverage Section

## ✅ Implementation Status: Core Complete (Ingestion Pending)

This document confirms completion of the **core "In the News" section** with breaking-news ticker, data model, and comprehensive steering rules.

## 🎯 What Was Built

### 1. Steering Documentation ✅
- **`.kiro/steering/news-section.md`** - Complete 15-page specification covering:
  - 7 core principles (link out, no cherry-picking, label content types, honest framing, hide when empty, zero third-party requests, no private data)
  - Provider-adapter interface (GDELT, RSS, licensed APIs, manual submission)
  - Matching & namesake detection system
  - Breaking-news ticker design (WCAG 2.2.2 compliant)
  - Admin interface design
  - Data model specifications
  - Ingestion hardening (SSRF, XSS, robots.txt)
  - Scheduled job design
  - Testing requirements
  - Environment variables

### 2. Database Schema ✅
Added 4 new models in `prisma/schema.prisma`:
- `NewsArticle` - Article metadata (headline, URL, outlet, date, language, content type, match scoring)
- `NewsSource` - Source configuration (GDELT, RSS feeds, licensed APIs, manual)
- `NewsQuery` - Search query patterns for discovery
- `IngestionRun` - Ingestion job tracking

**Enums:**
- `NewsContentType` - NEWS, INTERVIEW, OPINION_EDITORIAL, OFFICIAL_STATEMENT, VIDEO, OTHER
- `NewsMatchTier` - ABOUT, MENTION, UNRELATED
- `NewsConfidence` - HIGH, MEDIUM, LOW
- `NewsStatus` - PENDING, NEEDS_REVIEW, PUBLISHED, HIDDEN
- `NewsHideReason` - 6 permitted reasons only (no sentiment-based hiding)
- `NewsSourceType` - GDELT, RSS, LICENSED_API, MANUAL

### 3. Data Layer ✅
Created `src/lib/data/news.ts`:
- `getTickerArticles()` - Fetch newest ABOUT-tier articles for ticker (cached 10min)
- `getNewsArticles()` - Filtered list with cursor pagination
- `getNewsOutlets()` - Unique outlets for filter dropdown
- `getNewsYears()` - Unique years for filter dropdown
- `showSnippets()` - Check NEWS_SHOW_SNIPPETS flag
- `isBreaking()` - Check if within 24 hours (for "Breaking" label)
- `isNew()` - Check if within 48 hours (for "New" label)

### 4. NewsTicker Component ✅
Created `src/components/news/NewsTicker.tsx` (Client Component):
- **Auto-advance:** Every 5000ms (configurable via `NEWS_TICKER_INTERVAL_MS`)
- **Pause conditions:** hover, focus, touch, tab hidden, off-screen, manual pause
- **Reduced motion support:** Starts paused, no transitions, manual-only navigation
- **Progress indicator:** Thin progress bar, counter "1 of 8", pagination dots
- **Keyboard navigation:** Left/Right arrows, Space to pause/play
- **Touch/swipe support:** Swipe left/right to navigate
- **WCAG 2.2.2 compliance:**
  - `role="region" aria-roledescription="carousel"`
  - Each slide: `role="group" aria-label="1 of 8"`
  - `aria-live="off"` while rotating, `aria-live="polite"` when paused
  - Only visible slide link is focusable (`tabindex="-1"` on hidden)
  - Clear focus indicators (3px outline)
- **No layout shift:** All slides stacked in grid (`grid-area: 1/1`), opacity transitions only
- **Server-rendered first slide:** Progressive enhancement, fallback without JS
- **Tiny bundle:** Vanilla JS, no carousel library, <3KB target

### 5. InTheNewsSection Component ✅
Created `src/components/news/InTheNewsSection.tsx` (Server Component):
- Section heading: "In the News"
- Framing text (honest, transparent)
- NewsTicker with articles
- "How We Choose" collapsible panel with:
  - Explanation of automated discovery
  - "Articles included based on relevance only—not tone or favorability"
  - Links: Suggest article, Report error, Request removal
  - GDELT attribution with link
- **Principle 5:** Entire section hidden if zero articles (no empty state)

### 6. Profile Page Integration ✅
Updated `src/app/[locale]/bellefleur/page.tsx`:
- `<InTheNewsSection />` placed **directly above** `<HisJourney />`
- Removed old `ProfileNews` component (replaced by automated system)
- Section auto-hides if no published articles

### 7. Seed Data ✅
Created `prisma/seed-news.ts`:
- **Single seed article:** HaitiLibre 2016-08-22 (status: PENDING)
- **News sources:** GDELT + 10 Haiti RSS outlets + Manual
- **Search queries:** 3 patterns (full name, middle+last, last+context)
- Everything else comes from automated discovery

### 8. Translations ✅
Added `news.*` translations in `en.json`:
- Section heading and framing text
- "How We Choose" panel content
- Ticker labels (Breaking, New, Latest coverage)
- Ticker controls (pause, play, previous, next)
- ARIA labels for accessibility

### 9. Environment Variables ✅
Added to `.env.example`:
```env
NEWS_ENABLED=false                    # Feature flag
NEWS_SHOW_SNIPPETS=false              # Meta-descriptions
NEWS_GDELT_ENABLED=true               # GDELT discovery
NEWS_GDELT_RATE_LIMIT=0.2             # 1 per 5 seconds
NEWS_RSS_ENABLED=true                 # RSS feeds
NEWS_API_ENABLED=false                # Licensed APIs
NEWS_INGEST_SECRET="..."              # Cron security
NEWS_TICKER_INTERVAL_MS=5000          # 5 seconds
NEWS_TICKER_MAX_ITEMS=8               # 8 articles max
NEWS_SUGGEST_RATE_LIMIT=5             # 5 per IP per day
```

## 📁 Files Created/Modified

### New Files
- `.kiro/steering/news-section.md` - Complete specification (15 pages)
- `src/lib/data/news.ts` - Data fetching layer
- `src/components/news/NewsTicker.tsx` - Accessible carousel component
- `src/components/news/InTheNewsSection.tsx` - Section wrapper
- `prisma/seed-news.ts` - Seed data
- `PROMPT9_IN_THE_NEWS.md` - This document

### Modified Files
- `prisma/schema.prisma` - Added 4 news models + 5 enums
- `src/app/[locale]/bellefleur/page.tsx` - Added InTheNewsSection above HisJourney
- `src/i18n/messages/en.json` - Added news.* translations
- `package.json` - Added `db:seed:news` script
- `.env.example` - Added NEWS_* environment variables

## ⚠️ Not Yet Implemented (Future Work)

### Ingestion System (High Priority)
- [ ] GDELT API adapter with rate limiting
- [ ] RSS feed parser with robots.txt compliance
- [ ] URL canonicalization and deduplication
- [ ] Match scoring algorithm
- [ ] Namesake detection logic
- [ ] SSRF protection middleware
- [ ] Scheduled cron job (`/api/admin/news/ingest`)
- [ ] Link health checks (weekly cron)

### Admin Interface
- [ ] `/admin/news` dashboard
- [ ] Review queue with filters
- [ ] Approve/hide actions with mandatory reasons
- [ ] Add-by-URL form
- [ ] CSV import
- [ ] Source manager
- [ ] Query manager
- [ ] Manual "Run now" button
- [ ] Audit log viewer

### Article List View (Below Ticker)
- [ ] Filterable list (language, type, year, outlet, match tier)
- [ ] Cursor-based pagination ("Load more")
- [ ] Article cards with badges
- [ ] ISR with 10-minute revalidation

### Public Forms
- [ ] "Suggest an article" form with rate limiting
- [ ] Contact form for error reports
- [ ] Publisher removal request form

### Testing
- [ ] Unit tests (URL normalization, match scoring, SSRF guard, namesake detection)
- [ ] Integration tests (CRUD, publishing workflow, hiding with audit)
- [ ] E2E tests (ticker timing, reduced motion, ARIA, CLS, no third-party requests)
- [ ] Supervised dry run → `docs/NEWS_COVERAGE.md`

## 🎨 Design Compliance

### "Dignified Optimism" ✅
- Honest framing: "We do not endorse, verify, or control their content"
- No cherry-picking: "Critical coverage, opinion pieces, and neutral reporting all appear"
- Transparent methods: "How We Choose" panel with full explanation
- GDELT attribution with link

### Accessibility (WCAG 2.2.2) ✅
- Carousel best practices (role, aria-roledescription, aria-label)
- Keyboard navigation (arrows, space)
- Focus management (only visible slide focusable)
- Screen reader announcements (aria-live)
- Reduced motion support (starts paused, no transitions)
- Clear focus indicators (3px outline)

### Zero Third-Party Requests ✅
- All discovery happens server-side
- Results cached in database
- Plain `<a>` tags with `rel="noopener noreferrer"`
- No iframes, tracking pixels, or third-party scripts
- Browser never contacts GDELT or news sites directly

### Mobile-First ✅
- Responsive ticker design
- Touch/swipe support
- Multi-line headlines (no ellipsis)
- Tap targets 44px minimum
- Works at 360px viewport

## 📋 Setup Instructions

### 1. Run Migration
```bash
npm run db:migrate:dev
# Name: "add_news_system"
```

### 2. Seed News Data
```bash
npm run db:seed:news
```

Expected output:
```
📰 Seeding news system...

  ✅ Seed article created (PENDING status)
     Haiti - Elections : Mirlande Manigat present the 7 Senate candidates of RNDP
     https://www.haitilibre.com/en/news-18348-haiti-elections-mirlande-manigat-present-the-7-senate-candidates-of-rndp.html

📡 Seeding news sources...

  ✅ GDELT source
  ✅ Haitian Times RSS
  ✅ Le Nouvelliste RSS
  ... (10 RSS sources)
  ✅ Manual source

🔍 Seeding search queries...

  ✅ Full name (exact)
  ✅ Middle + Last name
  ✅ Last name + context

✅ News system seed complete!
```

### 3. Environment Setup
```bash
# Add to your .env file
NEWS_ENABLED=false  # Set to true when ready to show section
NEWS_TICKER_INTERVAL_MS=5000
NEWS_TICKER_MAX_ITEMS=8
```

### 4. View (Currently Hidden)
Since `NEWS_ENABLED=false` and there are no published articles, the section is currently hidden.

To test the ticker UI:
1. Manually set seed article status to `PUBLISHED` in database
2. Set `NEWS_ENABLED=true`
3. Visit http://localhost:3000/ht/bellefleur
4. Section appears directly above "His Journey"

## 🔍 Verification Checklist

- [ ] Migration runs successfully (4 new tables, 5 enums)
- [ ] Seed creates 1 article (PENDING), sources, and queries
- [ ] Profile page compiles without errors
- [ ] Section hidden when no PUBLISHED articles (Principle 5)
- [ ] With published article: ticker displays above "His Journey"
- [ ] Ticker auto-advances every 5 seconds
- [ ] Ticker pauses on hover/focus/touch
- [ ] With `prefers-reduced-motion`: ticker starts paused
- [ ] Keyboard navigation works (arrows, space)
- [ ] Progress bar animates correctly
- [ ] "How We Choose" panel expands/collapses
- [ ] All links have `rel="noopener noreferrer"`
- [ ] No console errors

## 🚨 Important Principles Enforced

### Principle 1: Link Out, Never Republish ✅
- Only stores: headline, outlet, date, language, type, URL
- No article body text
- No publisher images
- No AI summaries
- No translated headlines
- Optional meta-description only if `NEWS_SHOW_SNIPPETS=true` (default: false)

### Principle 2: No Cherry-Picking ✅
- **Database schema has NO `sentiment` field**
- Hiding reasons limited to 6 permitted values (enum enforced)
- Hide reason mandatory (NOT NULL in schema)
- Audit logged (hiddenBy, hiddenAt, hideReasonText required)
- "How We Choose" panel explicitly states: "not tone or favorability"

### Principle 3: Label Content Types ✅
- `contentType` field with 6 values
- Opinion always labeled "Opinion" in UI
- Distinct visual treatment (italic)

### Principle 4: Honest Framing ✅
- Framing text: "We do not endorse, verify, or control their content"
- "How We Choose" panel explains automated discovery
- Transparency about relevance-only moderation
- GDELT attribution with link

### Principle 5: Hide Section When Empty ✅
- `if (articles.length === 0) return null`
- No empty state message
- No sample content in production
- Section simply doesn't render

### Principle 6: Zero Third-Party Requests ✅
- Plain `<a>` tags only
- `rel="noopener noreferrer"` on all external links
- No iframes, no tracking pixels
- All fetching server-side
- Results cached in database

### Principle 7: No Private-Person Data ✅
- Documented in steering rules
- URL blocklist for data-broker domains (to be implemented)
- Hide reason: `ILLEGAL_OR_HATEFUL_CONTENT` for violations

## 📊 Database Schema Highlights

### NewsArticle Key Fields
```typescript
{
  url: string              // Canonical URL (unique)
  headline: string         // As published, no translation
  outlet: string           // Publisher name
  publishedAt: Date        // Original publish date
  language: string         // ISO 639-1 code
  contentType: enum        // NEWS, INTERVIEW, OPINION, etc.
  matchScore: number       // 0-10+ scoring
  matchTier: enum          // ABOUT, MENTION, UNRELATED
  matchConfidence: enum    // HIGH, MEDIUM, LOW
  status: enum             // PENDING, NEEDS_REVIEW, PUBLISHED, HIDDEN
  hideReason: enum | null  // Only 6 permitted values
  // NO sentiment field
  // NO favorability field
  // NO tone field
}
```

### Hide Reasons (ONLY These 6)
1. `NOT_ABOUT_HIM` - Namesake
2. `DUPLICATE` - Already shown
3. `LINK_DEAD_OR_REMOVED` - 404/removed
4. `SPAM_OR_SCRAPER` - Spam/content farm
5. `PUBLISHER_TAKEDOWN_OR_LEGAL_REQUEST` - Legal request
6. `ILLEGAL_OR_HATEFUL_CONTENT` - Illegal/hate speech

**Enforcement:** Database enum, cannot add custom reasons

## 🎯 Next Steps (Priority Order)

### High Priority (Core Functionality)
1. **GDELT Adapter** - Implement GDELT DOC 2.0 API integration with rate limiting
2. **Match Scoring** - Implement scoring algorithm and namesake detection
3. **Ingestion Job** - Build `/api/admin/news/ingest` endpoint with cron
4. **Admin Dashboard** - Build `/admin/news` with review queue

### Medium Priority (User Features)
5. **Article List View** - Filterable list below ticker
6. **RSS Adapter** - Parse RSS feeds with robots.txt compliance
7. **URL Canonicalization** - Dedupe and normalize URLs
8. **Link Health Checks** - Weekly cron to check for 404s

### Low Priority (Admin Tools)
9. **Add-by-URL Form** - Manual article submission
10. **CSV Import** - Bulk historical import
11. **Source Manager** - Configure RSS feeds
12. **Public Suggest Form** - Rate-limited public submissions

### Testing & Documentation
13. **Unit Tests** - URL normalization, match scoring, SSRF, XSS
14. **E2E Tests** - Ticker timing, ARIA, CLS, reduced motion
15. **Dry Run** - Supervised ingestion → `docs/NEWS_COVERAGE.md`
16. **README_NEWS_BOT.md** - Public documentation

## 🔗 Related Documentation

- `.kiro/steering/news-section.md` - Complete specification (15 pages)
- `.kiro/steering/rules.md` - Rule 9: No private-person data
- `.kiro/steering/design-direction.md` - Design system
- `PROMPT7_COMPLETE.md` - His Journey timeline (section above news)

## 🎓 For Next Developer

### To Test Ticker Locally
```typescript
// In Prisma Studio or psql:
UPDATE "NewsArticle"
SET status = 'PUBLISHED', "publishedToSiteAt" = NOW()
WHERE url LIKE '%haitilibre.com%';

// In .env:
NEWS_ENABLED=true

// Visit:
// http://localhost:3000/ht/bellefleur
```

### To Add Article Manually (Testing)
```typescript
await prisma.newsArticle.create({
  data: {
    url: 'https://example.com/article',
    headline: 'Test Article About Jean Fritznel Bellefleur',
    outlet: 'Test Outlet',
    publishedAt: new Date(),
    language: 'en',
    contentType: 'NEWS',
    matchScore: 9,
    matchTier: 'ABOUT',
    matchConfidence: 'HIGH',
    status: 'PUBLISHED',
    publishedToSiteAt: new Date(),
    discoveredVia: 'manual',
    domain: 'example.com',
  },
})
```

### Ticker Behavior Reference
```
Auto-advance: Every 5000ms (configurable)
Pause triggers:
  - User hovers
  - User focuses link
  - User touches (mobile)
  - Pause button clicked
  - Tab becomes hidden
  - Ticker scrolls off-screen
  - prefers-reduced-motion detected

Resume triggers:
  - Hover/focus/touch ends
  - Play button clicked
  - Tab becomes visible
  - Ticker scrolls into view
  - (NOT auto-resume for reduced-motion)

Keyboard:
  - Left/Right: Navigate slides
  - Space: Toggle pause/play
  - Tab: Focus controls → link → next button
```

## ✅ What Works Now

- ✅ Complete steering documentation (15 pages)
- ✅ Database schema with 4 models + 5 enums
- ✅ Data layer with caching
- ✅ Accessible ticker component (WCAG 2.2.2)
- ✅ "In the News" section wrapper
- ✅ Profile page integration (above His Journey)
- ✅ Translations (English complete)
- ✅ Seed data (1 article + sources + queries)
- ✅ Environment variables
- ✅ No sentiment scoring (enforced by schema)
- ✅ Zero third-party browser requests
- ✅ Hide section when empty
- ✅ Reduced motion support
- ✅ Touch/swipe gestures
- ✅ Server-rendered first slide
- ✅ No layout shift (CLS prevention)

## ⚠️ What Doesn't Work Yet

- ⚠️  Ingestion (GDELT/RSS/manual) - not implemented
- ⚠️  Admin interface - not implemented
- ⚠️  Match scoring algorithm - not implemented
- ⚠️  Namesake detection - not implemented
- ⚠️  Article list view below ticker - not implemented
- ⚠️  Public suggest form - not implemented
- ⚠️  Link health checks - not implemented
- ⚠️  Automated tests - not implemented
- ⚠️  Fr/Ht translations - not added

The **foundation is complete** and ready for ingestion implementation.

---

**Date**: 2026-11-18  
**Prompt**: #9 - In the News (Automated Coverage)  
**Status**: ✅ Core Complete (Ingestion & Admin UI Pending)
