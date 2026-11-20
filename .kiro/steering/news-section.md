# News Section: Automated Coverage Discovery

## Mission

Surface third-party news coverage about Jean Fritznel Bellefleur through automated discovery, with honest framing and relevance-only moderation. Link out to original sources; never republish content.

## Core Principles

### 1. Link Out, Never Republish

**What we store and display:**
- Headline (as published, no translation)
- Outlet name
- Publication date
- Language (ISO 639-1 code)
- Content type label (NEWS, INTERVIEW, OPINION_EDITORIAL, etc.)
- Canonical URL

**What we DO NOT store or display:**
- Article body text
- Publisher images or graphics
- AI-generated summaries
- Translated headlines
- Excerpts or pull quotes (except optional meta-description, see below)

**Optional meta-description:**
- Publisher-provided meta-description (max 160 chars)
- Controlled by environment flag: `NEWS_SHOW_SNIPPETS` (default: `false`)
- Only shown if explicitly enabled
- Never generated, always from source `<meta name="description">`

**Rationale:** We respect publisher copyright, drive traffic to original sources, and avoid creating derivative works.

### 2. No Cherry-Picking

**All coverage is included:**
- ✅ Critical coverage
- ✅ Neutral reporting
- ✅ Favorable coverage
- ✅ Opinion and editorial pieces

**Forbidden:**
- ❌ Sentiment scoring
- ❌ Tone analysis or filtering
- ❌ Favorability tags
- ❌ "Positive/negative" categorization
- ❌ Hiding unfavorable coverage

**Permitted hiding reasons (ONLY these):**
1. `NOT_ABOUT_HIM` - Namesake (e.g., Florida MMA fighter Jean Bellefleur)
2. `DUPLICATE` - Same article already shown
3. `LINK_DEAD_OR_REMOVED` - Publisher removed or 404
4. `SPAM_OR_SCRAPER` - Content farm, spam, or scraper site
5. `PUBLISHER_TAKEDOWN_OR_LEGAL_REQUEST` - Legal takedown or publisher request
6. `ILLEGAL_OR_HATEFUL_CONTENT` - Illegal content or hate speech

**Enforcement:**
- Reason is mandatory for hiding
- All hides are audit-logged with admin user, timestamp, and reason
- No "hide all negative" bulk action
- Regular audit of hidden items

**Rationale:** Transparency and credibility require showing all coverage, not just favorable mentions. Voters deserve the full picture.

### 3. Label Content Types

**Content type classification:**
- `NEWS` - Standard news reporting
- `INTERVIEW` - Interview or Q&A format
- `OPINION_EDITORIAL` - Opinion piece, editorial, column
- `OFFICIAL_STATEMENT` - Press release, official statement
- `VIDEO` - Video content (YouTube, news video)
- `OTHER` - Fallback

**Classification methods:**
1. **Heuristic rules** (URL patterns, outlet sections, meta tags)
2. **Manual override** (admin can change type)

**Opinion labeling:**
- Opinion pieces ALWAYS display "Opinion" label
- Distinct visual treatment (e.g., italic or badge)
- Never hidden from "Opinion" label alone

**Rationale:** Users need context to understand the nature of coverage.

### 4. Honest Framing

**Section heading:** "In the News"

**Framing text (above ticker):**
> "Third-party news coverage mentioning Jean Fritznel Bellefleur. We link to articles we discover through news monitoring; we do not endorse, verify, or control their content."

**"How We Choose" panel (collapsible):**
```
How We Choose Coverage

We use automated news monitoring to discover articles mentioning Jean Fritznel 
Bellefleur from Haitian and international news sources. Articles are included 
based on relevance only—not tone or favorability.

Critical coverage, opinion pieces, and neutral reporting all appear here. We 
moderate only for accuracy (removing namesakes or duplicates) and basic quality 
(removing spam or broken links).

Discovery is partly powered by the GDELT Project (gdeltproject.org), a global 
news monitoring initiative.

• Suggest an article we missed
• Report an error or namesake
• Request removal (publishers only)
```

**Links:**
- "Suggest an article" → public form (rate-limited, moderated)
- "Report an error" → contact form with pre-filled subject
- "Request removal" → publisher contact form

**Rationale:** Transparency about our methods builds trust. Users understand we're not curating for favorability.

### 5. Hide Section When Empty

**Behavior:**
- If zero published articles: entire section is hidden
- No "No articles yet" empty state
- No sample or placeholder content in production
- Development/staging may show sample data with clear "SAMPLE DATA" banner

**Rationale:** An empty news section looks unprofessional. Better to hide until we have real content.

### 6. Zero Third-Party Browser Requests

**Strict client-side policy:**
- ✅ Plain `<a>` tags with `href` to article URL
- ✅ `rel="noopener noreferrer"` for security
- ❌ No iframe embeds
- ❌ No tracking pixels
- ❌ No click tracking or analytics on external links
- ❌ No social media widgets
- ❌ No third-party scripts for this section

**Server-side fetching only:**
- All discovery and metadata fetching happens server-side
- Results cached and served from our database
- Browser never contacts GDELT, RSS feeds, or news sites directly

**Rationale:** Privacy, performance, and security. Users don't leak data to third parties when viewing our news section.

### 7. No Private-Person Data

**Forbidden content:**
- ❌ Home addresses
- ❌ Phone numbers
- ❌ Family members or relatives
- ❌ Data-broker pages (people-search sites like Whitepages, Spokeo, etc.)
- ❌ Social media profiles of private individuals

**Enforcement:**
- URL pattern blocklist for known data-broker domains
- Manual review flags private-data articles
- Admin can mark and hide with `ILLEGAL_OR_HATEFUL_CONTENT` reason

**Rationale:** Rule 9 from project rules—no private-person data, ever.

---

## News Sources (Provider-Adapter Interface)

### A. GDELT DOC 2.0 API (Primary Discovery)

**About GDELT:**
- Global Database of Events, Language, and Tone
- Monitors broadcast, print, and web news worldwide in 100+ languages
- Free, open API for non-commercial research
- URL: https://www.gdeltproject.org/

**Usage limits:**
- ~1 request per 5 seconds (rate limit)
- Max 250 results per query
- Rolling ~3-month window of coverage
- Must verify against GDELT's own documentation

**Query format:**
```
"Jean Fritznel Bellefleur"
OR
"Fritznel Bellefleur"
OR
(Bellefleur AND (sénateur OR sénat OR "Nord-Ouest" OR RDNP OR "Port-de-Paix" OR "Môle-Saint-Nicolas" OR Jean-Rabel OR candidat))
```

**Important:** Wrap OR groups in parentheses for proper boolean logic.

**Error handling:**
- Throttle and back off on rate limits
- Log API errors but continue with other sources
- Retry with exponential backoff

**Verification requirement:**
- Always check GDELT's official documentation
- API endpoints and limits may change
- Document the API version used

### B. Publisher RSS/Sitemaps (Targeted Discovery)

**Seed outlets (Haiti-focused):**
1. **Haitian Times** (https://haitiantimes.com/)
2. **Le Nouvelliste** (https://lenouvelliste.com/)
3. **HaitiLibre** (https://www.haitilibre.com/)
4. **Juno7** (https://www.juno7.ht/)
5. **Rezo Nòdwès** (https://www.rezonodwes.com/)
6. **Le National** (http://www.lenational.org/)
7. **Gazette Haïti** (https://www.gazettehaiti.com/)
8. **Le Témoin** (http://www.letemoin.net/)
9. **Zantray News** (https://zantraynews.com/)
10. **Le Relief** (https://lerelief.com/)

**RSS/Sitemap discovery:**
- Check standard locations: `/feed`, `/rss`, `/sitemap.xml`
- Parse RSS 2.0, Atom, and XML sitemaps
- Extract: title, link, pubDate, description (optional)
- Respect `<ttl>` and `<sy:updatePeriod>` tags

**robots.txt compliance:**
- Check `robots.txt` before crawling any domain
- Respect `Crawl-delay` directives
- Respect `Disallow` rules
- Use identifying User-Agent: `Diaspora4Bellefleur-NewsBot/1.0 (+https://example.com/about/news-bot)`

**Terms of service:**
- Review and respect each outlet's terms
- Respect rate limits
- Never bypass paywalls
- Link to original content only

### C. Licensed News API (Optional, Disabled by Default)

**Purpose:** Commercial news API for additional coverage (e.g., Aylien, Meltwater, Newscatcher)

**Requirements:**
- Must be properly licensed for commercial use
- Disabled by default (`NEWS_API_ENABLED=false`)
- Requires explicit configuration
- Document licensing terms and costs

**Not permitted:**
- ❌ Google News or its RSS (personal-use terms only)
- ❌ NewsAPI.org free plan in staging or production (violates their terms)
- ❌ Any API used beyond its licensing terms

### D. Manual Submission

**Admin add-by-URL:**
- Single URL input with validation
- Fetches metadata (title, date, outlet)
- Requires admin review before publishing

**CSV import:**
- Bulk import for historical coverage
- Columns: url, title, outlet, date, language, type
- All items go to `NEEDS_REVIEW` status
- Validation and deduplication

**Public "Suggest an article" form:**
- Rate-limited (e.g., 5 submissions per IP per day)
- Fields: URL (required), your email (optional), notes (optional)
- All submissions moderated—never auto-published
- Spam protection (honeypot, Turnstile)

**Forbidden sources:**
- ❌ Scraping social media (Twitter, Facebook, Instagram)
- ❌ Bypassing paywalls or authentication
- ❌ Violating robots.txt
- ❌ Storing full article text
- ❌ Unauthorized use of news APIs

---

## Matching & Namesake Detection

### The Namesake Problem

**Jean Bellefleur is not a unique name.** Known namesakes include:
- Jean Bellefleur (MMA fighter, Florida, USA)
- Other individuals with the same or similar names

### Default Query Patterns (Admin-Editable)

**High-confidence queries:**
1. `"Jean Fritznel Bellefleur"` (full name, exact)
2. `"Fritznel Bellefleur"` (middle + last)

**Context-required queries:**
3. `Bellefleur AND (sénateur OR sénat OR "Nord-Ouest" OR RDNP OR "Port-de-Paix" OR candidat)`

**Never publish on:**
- `"Bellefleur"` alone (too many false positives)
- `"Jean Bellefleur"` alone (namesakes exist)

### Match Scoring

**Factors:**
1. **Name in title** (+3 points)
2. **Name in URL** (+2 points)
3. **Context terms present** (Haiti, senator, Nord-Ouest, RDNP, politics, etc.) (+1 each)
4. **Negative signals** (MMA, UFC, Florida, sports) (-5 points)

**Match tier assignment:**
- **ABOUT** (7+ points): High confidence, about Jean Fritznel Bellefleur
- **MENTION** (4-6 points): Mentioned but not main subject
- **UNRELATED** (<4 points): Likely namesake or irrelevant

**Confidence levels:**
- **High confidence** (ABOUT + strong context): Auto-publishes
- **Medium confidence** (MENTION or weak context): Goes to `NEEDS_REVIEW`
- **Low confidence** (UNRELATED or negative signals): Never publishes

**Namesake detection signals:**
- Keywords: MMA, UFC, wrestling, fighter, Florida, sports
- Domains: MMA sites, sports sites
- Co-mentions: Names of other fighters or sports figures

### Canonical URL Deduplication

**Process:**
1. Normalize URL (remove tracking params, fragments)
2. Follow redirects to final destination
3. Check if canonical URL already exists in database
4. If exists: skip (don't create duplicate)

**URL normalization:**
- Remove `utm_*` tracking parameters
- Remove `ref`, `source`, `campaign` parameters
- Remove `#` fragments
- Follow 301/302 redirects (max 5 hops)
- Use final URL as canonical

---

## Breaking-News Ticker Component

### Overview

A banner-style carousel showing the N newest `ABOUT` articles, auto-advancing every 5 seconds (configurable).

### Behavior

**Auto-advance:**
- Default interval: 5000ms (`NEWS_TICKER_INTERVAL_MS`)
- Cycles through newest articles (default: 8 items)
- If fewer than 2 items: displays as static card (no rotation)

**Pause conditions:**
- User hovers over ticker
- User focuses on link (keyboard navigation)
- User touches ticker (mobile)
- User clicks "Pause" button
- Browser tab becomes hidden (`visibilitychange`)
- Ticker scrolls out of viewport (`IntersectionObserver`)
- User manually pauses

**Under `prefers-reduced-motion`:**
- Starts paused by default
- No auto-advance
- No CSS transitions
- Manual navigation only (Previous/Next buttons)

### Visual Elements

**Label chip:**
- "Latest coverage" (default)
- "Breaking" (within 24 hours of publish date)
- "New" (within 48 hours of publish date)

**Progress indicator:**
- Thin progress line (fills during interval)
- Counter: "1 of 8"
- Pagination dots (current highlighted)

**Controls:**
- Pause/Play toggle button
- Previous arrow button
- Next arrow button
- Swipe gestures (touch devices)

### Accessibility (WCAG 2.2.2 Compliance)

**Carousel best practices:**
- `<div role="region" aria-roledescription="carousel" aria-label="Latest news coverage">`
- Each slide: `<div role="group" aria-roledescription="slide" aria-label="1 of 8">`
- `aria-live="off"` while auto-rotating
- `aria-live="polite"` when paused or manually stepping
- Only the visible slide's link is focusable (`tabindex="-1"` on hidden slides)
- Keyboard navigation: Left/Right arrows, Space to pause/play

**Focus management:**
- When user tabs into ticker, focus goes to Play/Pause button
- Arrow keys navigate slides
- Tab moves to the article link, then to Next button
- Clear focus indicators (3px outline)

**Screen reader announcements:**
- On pause: "Paused on article 3 of 8"
- On manual advance: "Showing article 4 of 8"
- Article headline and outlet announced when slide changes (via `aria-live="polite"`)

### Performance

**No layout shift:**
- All slides stacked in single grid cell (`display: grid`, all items `grid-area: 1 / 1`)
- Height pre-calculated and fixed
- Opacity transitions only (no transform or position changes)

**Server-render first slide:**
- First article visible without JavaScript
- Progressive enhancement: JS adds rotation and controls
- Fallback: Static list of articles (no carousel)

**Tiny client JS:**
- No carousel library dependencies
- Vanilla JS with `IntersectionObserver` and `requestAnimationFrame`
- Total bundle: <3KB (gzipped)

**No ellipsis truncation:**
- Headlines shown in full
- Multi-line layout (line-clamp: 2 or 3)
- No "…" that hides critical meaning

### Below the Ticker: Filterable List

**Filters:**
- Language (ht, fr, en, other)
- Content type (NEWS, INTERVIEW, OPINION, etc.)
- Year (2024, 2025, 2026, etc.)
- Outlet (dropdown of discovered outlets)
- Match tier ("About him" vs "Also mentioned in")

**Pagination:**
- Cursor-based (not offset-based for stability)
- 20 items per page
- "Load more" button (not infinite scroll)
- Query params in URL for sharing: `?lang=ht&type=NEWS&page=2`

**ISR (Incremental Static Regeneration):**
- Revalidate every 10 minutes
- Cached at edge (CDN)
- Fresh data without blocking user

**Article card:**
- Headline (linked to article)
- Outlet name
- Date (relative: "2 days ago" or absolute: "March 15, 2026")
- Language badge (if not same as page locale)
- Content type badge ("Opinion" for op-eds)
- External link icon

---

## Admin Interface (`/admin/news`)

### Dashboard

**Ingestion health:**
- Last successful run timestamp
- Articles discovered (last 24h, last 7d)
- Success rate by source
- Error log (last 10 errors)
- Alerts for: repeated failures, dead RSS feeds, GDELT API errors

**Quick stats:**
- Total articles in database
- Published: X
- Pending review: X
- Hidden: X
- By source: GDELT (X), RSS (X), Manual (X)

### Review Queue

**Filters:**
- Status: `NEEDS_REVIEW`, `PENDING`, `PUBLISHED`, `HIDDEN`
- Match tier: `ABOUT`, `MENTION`, `UNRELATED`
- Confidence: High, Medium, Low
- Source: GDELT, RSS (by outlet), Manual

**Article card (review view):**
- Headline (plain text rendered)
- Outlet, date, language
- URL (clickable, opens in new tab)
- Match score and tier
- Detected content type
- Actions: Approve, Hide (with reason), Change type

**Bulk actions:**
- Select multiple articles
- Bulk approve (only for `ABOUT` tier)
- Bulk hide (reason required, audit-logged)

### All Items View

**Table columns:**
- Headline
- Outlet
- Date
- Language
- Type
- Match tier
- Status
- Actions

**Sortable columns:** Date, headline, outlet, status

**Inline actions:**
- Edit type (dropdown)
- View article (new tab)
- Hide/Unhide
- Delete (soft delete, audit-logged)

### Add by URL

**Single URL form:**
- URL input (validates format)
- "Fetch metadata" button
- Shows: Extracted title, outlet (guessed), date
- Manual override fields for all metadata
- "Add to review queue" → creates article with `PENDING` status

**Validation:**
- URL must be HTTPS
- Not already in database (canonical check)
- Reachable (HEAD request, 200 OK)
- Not a data-broker domain (blocklist check)

### CSV Import

**Upload CSV:**
- Template downloadable
- Columns: `url`, `title`, `outlet`, `date`, `language`, `type`
- All required except `type` (defaults to `NEWS`)
- Batch processing (100 at a time)
- Validation report: succeeded, failed, duplicates

**Post-import:**
- All items go to `NEEDS_REVIEW`
- Deduplication by canonical URL
- Summary report shown

### Source Manager

**GDELT settings:**
- Enable/disable
- Query patterns (editable)
- Rate limit (requests per second)
- Max results per query

**RSS feeds:**
- List of configured outlets
- Add new feed URL
- Test feed (fetch latest)
- Enable/disable per feed
- Last successful fetch timestamp
- Error status

**Licensed API settings:**
- Enable/disable (`NEWS_API_ENABLED`)
- API key configuration
- Query settings
- Usage stats

**Manual submission:**
- View public submissions
- Approve/reject
- Spam report

### Query Manager

**Search queries:**
- List of active queries
- Add new query
- Edit existing
- Enable/disable
- Test query (shows sample results)

**Namesake patterns:**
- Negative keyword list (MMA, UFC, Florida, etc.)
- Domain blocklist (MMA sites, data brokers)
- Manual namesake reports from users

### Run Now (Manual Ingestion)

**Trigger ingestion:**
- "Run discovery now" button
- Rate-limited: 1 run per 10 minutes
- Shows progress: "Running... discovered 15 articles"
- Error handling: continues on failure, logs errors

**Dry run mode:**
- "Preview results" button
- Shows what would be discovered
- Does not save to database
- For testing queries and sources

---

## Data Model

### NewsArticle

```prisma
model NewsArticle {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Core fields
  url              String  @unique // Canonical URL after redirects
  originalUrl      String? // Original URL before canonicalization
  headline         String  @db.Text
  outlet           String
  publishedAt      DateTime
  language         String  // ISO 639-1 (ht, fr, en, es, etc.)
  
  // Optional meta-description (only if NEWS_SHOW_SNIPPETS=true)
  metaDescription  String? @db.Text // Max 160 chars, from <meta name="description">
  
  // Classification
  contentType      NewsContentType @default(NEWS)
  contentTypeOverride Boolean @default(false) // Admin manually set type
  
  // Matching
  matchScore       Int @default(0)
  matchTier        NewsMatchTier @default(MENTION)
  matchConfidence  NewsConfidence @default(MEDIUM)
  
  // Status
  status           NewsStatus @default(PENDING)
  publishedToSiteAt DateTime?
  
  // Moderation
  hiddenAt         DateTime?
  hiddenBy         String? // User ID/email
  hideReason       NewsHideReason?
  hideReasonText   String? @db.Text // Required explanation
  
  // Discovery
  source           NewsSource? @relation(fields: [sourceId], references: [id])
  sourceId         String?
  discoveredVia    String // "gdelt", "rss:haitilibre", "manual", etc.
  ingestionRunId   String?
  ingestionRun     IngestionRun? @relation(fields: [ingestionRunId], references: [id])
  
  // Metadata
  domain           String // Extracted from URL
  isPaywalled      Boolean @default(false) // Detected or manual
  lastCheckedAt    DateTime? // Link health check
  linkStatus       Int? // Last HTTP status code
  
  @@index([status])
  @@index([publishedAt])
  @@index([matchTier])
  @@index([contentType])
  @@index([outlet])
  @@index([domain])
  @@index([sourceId])
}

enum NewsContentType {
  NEWS
  INTERVIEW
  OPINION_EDITORIAL
  OFFICIAL_STATEMENT
  VIDEO
  OTHER
}

enum NewsMatchTier {
  ABOUT       // High confidence, main subject
  MENTION     // Mentioned but not main subject
  UNRELATED   // Likely namesake or irrelevant
}

enum NewsConfidence {
  HIGH        // Auto-publish
  MEDIUM      // Needs review
  LOW         // Do not publish
}

enum NewsStatus {
  PENDING         // Just discovered, needs review
  NEEDS_REVIEW    // Medium confidence, needs admin check
  PUBLISHED       // Approved and visible on site
  HIDDEN          // Hidden by admin with reason
}

enum NewsHideReason {
  NOT_ABOUT_HIM                   // Namesake
  DUPLICATE                        // Already shown
  LINK_DEAD_OR_REMOVED             // 404 or removed by publisher
  SPAM_OR_SCRAPER                  // Content farm or spam
  PUBLISHER_TAKEDOWN_OR_LEGAL_REQUEST // Legal/publisher request
  ILLEGAL_OR_HATEFUL_CONTENT       // Illegal or hate speech
}
```

### NewsSource

```prisma
model NewsSource {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Source identity
  name            String  @unique // "GDELT", "HaitiLibre RSS", "Manual", etc.
  sourceType      NewsSourceType
  
  // Configuration
  enabled         Boolean @default(true)
  config          Json // Source-specific config (API keys, feed URL, etc.)
  
  // Health
  lastSuccessAt   DateTime?
  lastErrorAt     DateTime?
  lastErrorMessage String? @db.Text
  successCount    Int @default(0)
  errorCount      Int @default(0)
  
  // Relationships
  articles        NewsArticle[]
  
  @@index([sourceType])
  @@index([enabled])
}

enum NewsSourceType {
  GDELT
  RSS
  LICENSED_API
  MANUAL
}
```

### NewsQuery

```prisma
model NewsQuery {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Query definition
  name            String // "Full name", "Context terms", etc.
  queryPattern    String @db.Text // The actual query string
  enabled         Boolean @default(true)
  
  // Matching
  minScore        Int @default(4) // Minimum match score to consider
  autoPublishScore Int @default(7) // Score to auto-publish
  
  // Stats
  articlesFound   Int @default(0)
  lastUsedAt      DateTime?
  
  @@index([enabled])
}
```

### IngestionRun

```prisma
model IngestionRun {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  
  // Run metadata
  sourceType      NewsSourceType
  sourceName      String // Which source or feed
  status          String // "success", "partial", "failed"
  
  // Results
  articlesDiscovered Int @default(0)
  articlesCreated    Int @default(0)
  articlesDuplicate  Int @default(0)
  articlesRejected   Int @default(0)
  
  // Errors
  errorCount         Int @default(0)
  errorMessages      String[] // Array of error strings
  
  // Timing
  durationMs         Int?
  completedAt        DateTime?
  
  // Relationships
  articles           NewsArticle[]
  
  @@index([createdAt])
  @@index([sourceType])
}
```

---

## Ingestion Hardening

### Canonical URL Deduplication

**Process:**
1. Normalize URL (remove tracking params)
2. Make HEAD request to check for redirects
3. Follow up to 3 redirects to get final URL
4. Use final URL as canonical
5. Check database for existing canonical URL
6. If exists: skip (log as duplicate)

**URL normalization rules:**
- Remove: `utm_*`, `ref`, `source`, `campaign`, `fbclid`, `gclid`
- Remove fragments (`#`)
- Lowercase domain
- Remove default ports (`:80`, `:443`)

### Identifying User-Agent

All HTTP requests must use a descriptive User-Agent:

```
Diaspora4Bellefleur-NewsBot/1.0 (+https://diaspora4bellefleur.example.com/about/news-bot)
```

**Why:**
- Publishers can identify our bot
- Respectful and transparent
- Allows publishers to block if desired
- Required by many `robots.txt` files

### robots.txt Compliance

**Before crawling any domain:**
1. Fetch `/robots.txt`
2. Parse for our User-Agent or `*`
3. Respect `Disallow` rules
4. Respect `Crawl-delay` directives (default: 5 seconds if not specified)
5. Cache `robots.txt` for 24 hours
6. Log and skip if disallowed

**Library:** Use `robots-parser` npm package

### Timeouts

**HTTP request timeouts:**
- Connection timeout: 10 seconds
- Read timeout: 15 seconds
- Total timeout: 30 seconds
- Applies to all external HTTP requests

**Rationale:** Prevents hanging on slow or unresponsive servers.

### Size Caps

**HTML page size cap:** 5MB

**Why:** We only need `<head>` metadata (title, meta tags). Reject large responses.

**Implementation:** Check `Content-Length` header; abort if >5MB.

### SSRF Protection

**Prevent Server-Side Request Forgery:**

1. **HTTPS only** - Reject `http://` URLs (allow only `https://`)
2. **Block private IPs** - Reject RFC 1918 addresses:
   - `10.0.0.0/8`
   - `172.16.0.0/12`
   - `192.168.0.0/16`
   - `127.0.0.0/8` (localhost)
   - `169.254.0.0/16` (link-local)
3. **Block metadata endpoints** - AWS, GCP, Azure metadata URLs
4. **Cap redirects** - Maximum 3 redirects, re-validate each hop
5. **Validate final destination** - Check final URL after redirects

**Library:** Use `is-ip` and `ip-range-check` npm packages

### Headline Rendering

**Security:**
- Headlines rendered as plain text only
- No HTML rendering (XSS risk)
- Escape all HTML entities: `&lt;`, `&gt;`, `&amp;`, `&quot;`
- No `dangerouslySetInnerHTML`
- Use React's default text rendering (auto-escapes)

**Rationale:** Malicious article titles could inject scripts if rendered as HTML.

### Link Health Checks

**Weekly cron job:**
- Iterate through all `PUBLISHED` articles
- Make HEAD request to each URL
- Update `linkStatus` (HTTP code)
- Update `lastCheckedAt` timestamp
- If 404 or 410: auto-hide with reason `LINK_DEAD_OR_REMOVED`
- If repeated failures (3+ times): alert admin

**Purpose:** Keep the news section fresh; remove dead links automatically.

---

## Scheduled Ingestion Job

### Frequency

**Hourly cron job** (e.g., `0 * * * *` = top of every hour)

**Why hourly:**
- News updates frequently enough
- Respects rate limits (GDELT, RSS feeds)
- Balances freshness with resource usage

### Security

**Endpoint:** `/api/admin/news/ingest` (or serverless function)

**Authentication:**
- Shared secret in environment: `NEWS_INGEST_SECRET`
- Request must include header: `X-News-Ingest-Secret: <secret>`
- Reject if secret missing or invalid
- Log all ingest attempts (success and failure)

**Idempotency:**
- Canonical URL deduplication prevents duplicates
- Safe to re-run if job fails partway
- Each run gets unique `IngestionRun` ID

### Vercel Considerations

**Cron limits on Vercel:**
- Free/Hobby: No cron support
- Pro: 1 cron job
- Enterprise: Multiple cron jobs

**Fallback strategy:**
- If Vercel plan doesn't support cron: use external scheduler
- Options: GitHub Actions, AWS EventBridge, cron-job.org
- External scheduler hits `/api/admin/news/ingest` endpoint via HTTPS

**Implementation:**
```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/admin/news/ingest",
    "schedule": "0 * * * *" // Every hour
  }]
}
```

### Error Handling

**On failure:**
- Log error details to database (`IngestionRun`)
- Continue processing other sources (don't abort)
- Admin dashboard shows errors
- Alert admin after 3 consecutive failures

**Retries:**
- Exponential backoff for transient errors
- Max 3 retries per source
- Skip source if repeatedly failing

---

## Seed Data

**Single seed article:**

```typescript
{
  url: "https://www.haitilibre.com/en/news-18348-haiti-elections-mirlande-manigat-present-the-7-senate-candidates-of-rndp.html",
  headline: "Haiti - Elections : Mirlande Manigat present the 7 Senate candidates of RNDP",
  outlet: "HaitiLibre",
  publishedAt: new Date("2016-08-22"),
  language: "en",
  contentType: "NEWS",
  matchScore: 9,
  matchTier: "ABOUT",
  matchConfidence: "HIGH",
  status: "PENDING", // Mark PENDING until admin confirms live page data
  discoveredVia: "manual",
}
```

**Note:** Status is `PENDING` until an admin verifies the live page still exists with correct title, outlet, and date.

**Everything else comes from automated discovery.**

---

## Testing Requirements

### Unit Tests (Vitest)

**Test fixtures only—no live APIs in CI:**

1. **Canonical URL normalization**
   - Remove tracking params: `?utm_source=facebook` → removed
   - Remove fragments: `#section` → removed
   - Lowercase domain: `Example.COM` → `example.com`

2. **Match scoring and tier assignment**
   - Full name in title: score = 9, tier = ABOUT
   - Context terms only: score = 5, tier = MENTION
   - Negative signals (MMA, Florida): score = -2, tier = UNRELATED

3. **Namesake detection**
   - "Jean Bellefleur MMA" → UNRELATED
   - "Bellefleur" alone → rejected (score too low)
   - "Jean Fritznel Bellefleur" → ABOUT

4. **SSRF guard**
   - Reject `http://` URLs
   - Reject `192.168.1.1` (private IP)
   - Reject `http://169.254.169.254/` (AWS metadata)
   - Allow `https://haitilibre.com/article` ✓

5. **robots.txt compliance**
   - Parse `Disallow: /admin/` → block `/admin/*`
   - Parse `Crawl-delay: 10` → wait 10s between requests
   - Respect User-Agent-specific rules

6. **Hostile headline escaping**
   - `<script>alert('xss')</script>` → renders as plain text
   - `"<a href="evil.com">Click</a>"` → renders as plain text
   - No HTML injection possible

### Integration Tests (Vitest)

**Uses fixtures and mock APIs:**

1. **NewsArticle CRUD operations**
2. **Publishing workflow (PENDING → NEEDS_REVIEW → PUBLISHED)**
3. **Hide with reason (audit log created)**
4. **Duplicate detection (same canonical URL rejected)**

### E2E Tests (Playwright)

**Ticker component:**

1. **Timing with fake timers**
   - Advances every 5000ms
   - Pauses on hover
   - Pauses on focus-within
   - Pauses on touch

2. **Reduced motion**
   - With `prefers-reduced-motion`: starts paused
   - No CSS transitions
   - Manual navigation only

3. **ARIA and keyboard navigation**
   - `aria-roledescription="carousel"`
   - Each slide: `role="group" aria-label="1 of 8"`
   - Only visible slide link is focusable
   - `aria-live="polite"` when paused
   - Left/Right arrows navigate slides
   - Space toggles play/pause

4. **No cumulative layout shift (CLS)**
   - Measure CLS score
   - Assert CLS < 0.1
   - All slides stacked, no position changes

5. **Section placement**
   - "In the News" appears directly above "His Journey"
   - In all locales: en, fr, ht
   - Hidden when zero articles

6. **Hidden items never render**
   - Create article with `status: HIDDEN`
   - Assert not visible in ticker
   - Assert not visible in list below ticker

7. **No sentiment field anywhere**
   - Grep database schema → no `sentiment` column
   - Grep UI components → no sentiment display
   - Grep admin interface → no sentiment filter

8. **Zero third-party browser requests**
   - Use Playwright's network monitoring
   - Assert no requests to GDELT domain
   - Assert no requests to news outlet domains (except on user click)
   - Assert no tracking pixels or analytics for news section

### Supervised Dry Run

**After initial implementation:**

1. Run ingestion manually (`npm run news:ingest:dry-run`)
2. Review discovered articles in admin interface
3. Verify namesake detection works
4. Verify content type classification
5. Document results in `docs/NEWS_COVERAGE.md`:
   - Total articles discovered
   - Breakdown by source
   - Breakdown by match tier
   - Breakdown by content type
   - Namesake rejections count
   - Sample headlines (5-10 examples)

---

## Environment Variables

```env
# News Section Feature Flag
NEWS_ENABLED=false

# Meta-description snippets (default: false)
NEWS_SHOW_SNIPPETS=false

# GDELT Configuration
NEWS_GDELT_ENABLED=true
NEWS_GDELT_RATE_LIMIT=0.2 # Requests per second (1 per 5 seconds)

# RSS Configuration
NEWS_RSS_ENABLED=true

# Licensed API (disabled by default)
NEWS_API_ENABLED=false
NEWS_API_KEY="" # Only if licensed API enabled
NEWS_API_PROVIDER="" # "aylien", "meltwater", etc.

# Ingestion
NEWS_INGEST_SECRET="generate-secure-random-secret-here"
NEWS_INGEST_INTERVAL="0 * * * *" # Cron expression, hourly

# Ticker Configuration
NEWS_TICKER_INTERVAL_MS=5000
NEWS_TICKER_MAX_ITEMS=8

# Public submission rate limit
NEWS_SUGGEST_RATE_LIMIT=5 # Per IP per day
```

---

## Documentation Deliverables

### 1. `.kiro/steering/news-section.md`
This document (comprehensive principles and rules).

### 2. `docs/NEWS_COVERAGE.md`
Generated after supervised dry run:
- Total articles discovered
- Source breakdown
- Match tier distribution
- Content type distribution
- Sample headlines
- Namesake rejection examples
- Link health report
- Recommendations

### 3. `README_NEWS_BOT.md`
Public-facing documentation about the news bot:
- What it does
- How it works
- How to suggest an article
- How to report an error
- How publishers can opt out (robots.txt)
- Contact information

---

## Summary

This news section:
- ✅ Links out, never republishes
- ✅ Shows all coverage without cherry-picking
- ✅ Labels opinion content clearly
- ✅ Uses honest framing and transparency
- ✅ Hides when empty (no fake content)
- ✅ Makes zero third-party browser requests
- ✅ Never displays private-person data
- ✅ Respects publisher robots.txt and terms
- ✅ Protects against SSRF and XSS
- ✅ Auto-discovers via GDELT and RSS
- ✅ Detects and filters namesakes
- ✅ Provides accessible, auto-advancing ticker
- ✅ Includes admin moderation interface
- ✅ Logs all actions for audit trail

**Result:** A trustworthy, automated news section that surfaces coverage honestly and respects both publishers and users.
