# Home Page Documentation

## Overview

The home page is a comprehensive, mode-aware landing page that respects candidacy status, launch mode, and displays real contribution data when available.

## Sections

### 1. Hero
**Component**: `src/components/home/Hero.tsx`

**Features**:
- Candidacy status badge (UNVERIFIED, REGISTERED_PRELIMINARY, ON_FINAL_LIST)
- Status-aware headline (changes wording based on verification)
- Mode-aware primary CTA
- Secondary "How It Works" link
- Photo slot with elegant typographic fallback
- Coastline constellation background

**Wording Rules**:
- UNVERIFIED: "A supporter initiative for {name}" (doesn't claim registered)
- VERIFIED: "Support {name}" (can claim candidacy)

### 2. Live Progress
**Component**: `src/components/home/LiveProgress.tsx`

**Shows**:
- Total raised (USD, formatted by locale)
- Total supporters
- Unique countries
- Unique communes

**Rules**:
- **Only shows in DONATIONS_LIVE mode**
- Returns null if no data
- Cached 60 seconds
- Hidden by kill switch
- Shows goal bar if `fundraisingGoalCents` exists

### 3. Why Small Gifts Matter
**Component**: `src/components/home/WhyGiftsMatter.tsx`

**Cards**:
1. **Accessible to All**: Small amounts allow diaspora participation
2. **Independence**: Reduces reliance on large donors
3. **Broad Support**: Demonstrates grassroots backing

**Features**:
- Staggered reveal animation (0ms, 100ms, 200ms)
- Hover effects
- Icon + title + body pattern

### 4. Nord-Ouest Roots Map
**Component**: `src/components/home/NordOuestMap.tsx`

**Shows**:
- 10 communes of Nord-Ouest as cards
- Supporter count per commune
- Color intensity based on count
- Legend (Few/Some/Many)

**Fallback**:
- Shows placeholder if no data
- Lists all 10 commune names
- "Data will appear here when available"

**Communes**:
1. Port-de-Paix
2. Saint-Louis du Nord
3. Anse-à-Foleur
4. Bassin-Bleu
5. Chansolme
6. Tortue (Île de la Tortue)
7. Jean-Rabel
8. Môle-Saint-Nicolas
9. Baie-de-Henne
10. Bombardopolis

### 5. Candidate Teaser
**Component**: `src/components/home/CandidateTeaser.tsx`

**Content**:
- "About {candidateName}"
- Placeholder: "Profile coming soon..."
- CTA: "Read Full Profile" → `/about`

**Styling**:
- Gradient background (deep lagoon)
- White text
- Full-width section

### 6. How It Works
**Component**: `src/components/home/HowItWorks.tsx`

**Steps**:
1. **Learn**: Review sourced, verified information
2. **Contribute**: Make secure contribution when open
3. **Stay Connected**: Get updates on impact

**Layout**:
- Vertical timeline on desktop
- Numbered circles (1, 2, 3)
- Icons for each step
- Stacked on mobile

### 7. FAQ Preview
**Component**: `src/components/home/FAQPreview.tsx`

**Questions**:
1. "Is this the official campaign?" → No, independent
2. "Who can contribute?" → Depends on Haitian law
3. "How is money handled?" → Secure providers, no card storage

**Features**:
- Native `<details>` elements
- Expandable
- Keyboard accessible
- "View All Questions" CTA → `/faq`

### 8. Mode-Aware Signup Block
**Component**: `src/components/home/SignupBlock.tsx`

**By Mode**:
- **INFO_ONLY**: "Stay Informed" → Learn More about {name}
- **WAITLIST**: "Get Launch Updates" → Join the Waitlist
- **DONATIONS_LIVE**: "Support Today" → Make a Contribution

**Styling**:
- Prominent section at bottom
- Gradient background with constellation
- Large CTA button

## Data Integration

### Contribution Statistics

**File**: `src/lib/data/contributions.ts`

```typescript
// Get stats (cached 60 seconds)
const stats = await getContributionStats()

// Returns null if:
// - Mode is not DONATIONS_LIVE
// - Kill switch is active
// - No contributions exist
```

**Fields**:
```typescript
interface ContributionStats {
  totalRaisedCents: number
  totalSupporters: number
  uniqueCountries: number
  uniqueCommunes: number
  lastUpdated: Date
}
```

### Commune Supporters

```typescript
// Get supporter counts by commune
const supporters = await getCommuneSupporters()

// Returns empty array if:
// - Mode is not DONATIONS_LIVE
// - No data available
```

**Format**:
```typescript
interface CommuneSupporter {
  commune: string
  count: number
}
```

## Animations

### RevealOnScroll

**File**: `src/components/client/RevealOnScroll.tsx`

**Usage**:
```tsx
<RevealOnScroll delay={100}>
  <YourContent />
</RevealOnScroll>
```

**Features**:
- IntersectionObserver
- Respects `prefers-reduced-motion`
- Configurable delay
- Only animates once
- Threshold: 0.1, rootMargin: 50px

**CSS Classes**:
- Hidden: `opacity-0 translate-y-4`
- Visible: `opacity-100 translate-y-0`
- Transition: `duration-slow ease-out`

## Responsive Breakpoints

**Mobile** (< 768px):
- Stacked layout
- Full-width sections
- Vertical spacing: 16px

**Tablet** (768px - 1024px):
- 2-column grids
- Moderate spacing

**Desktop** (> 1024px):
- 3-column grids
- Timeline layout for "How It Works"
- Horizontal spacing

**Minimum**: 360px width (tested)

## Accessibility

### WCAG 2.2 AA Compliance

**Semantic HTML**:
- `<section>` for each major block
- `<h2>` for section headings
- `<details>` for FAQ
- Proper heading hierarchy

**Keyboard Navigation**:
- All interactive elements focusable
- Visible focus rings (2px, brand colors)
- Details expand with Enter/Space

**Screen Readers**:
- Alt text on all images
- ARIA labels where needed
- Decorative elements `aria-hidden="true"`

**Motion**:
- Respects `prefers-reduced-motion: reduce`
- Animations skip entirely if preference set
- No autoplay video

### Color Contrast

All text meets minimum ratios:
- Normal text: 4.5:1 ✅
- Large text: 3:1 ✅
- UI components: 3:1 ✅

## Performance

### Optimizations

1. **Server Components** (default)
   - Hero, Progress, Map, Teaser, Works, FAQ, Signup
   - Data fetched on server
   - No client JavaScript for rendering

2. **Client Components** (minimal)
   - RevealOnScroll only
   - Small bundle size
   - No blocking JavaScript

3. **Caching**
   - Contribution stats: 60 seconds
   - Commune supporters: 60 seconds
   - Candidate config: 5 min (dev), 1 hr (prod)

4. **Lazy Loading**
   - IntersectionObserver for animations
   - Only loads when in viewport
   - Reduces initial bundle

### Bundle Analysis

**Critical Path**:
- HTML (Server Components)
- CSS (Tailwind, purged)
- Minimal JS (RevealOnScroll)

**Total JS** (estimated): < 20KB gzipped

## Translation Keys

### home.hero
- `title` - Main headline (verified status)
- `titleUnverified` - Headline for unverified
- `subtitle` - Support sentence
- `subtitleUnverified` - Support for unverified
- `primaryCta` - Learn More
- `secondaryCta` - How It Works

### home.progress
- `heading` - Our Progress
- `raised`, `supporters`, `countries`, `communes`
- `ofGoal` - of {goal} goal
- `lastUpdated` - Updated {time}

### home.whyGifts
- `heading`, `description`
- `card1Title`, `card1Body`
- `card2Title`, `card2Body`
- `card3Title`, `card3Body`

### home.rootsMap
- `heading`, `description`
- `noData` - Placeholder message
- `supportersFrom` - {count} from {commune}

### home.candidateTeaser
- `heading` - About {candidateName}
- `readProfile` - CTA text
- `placeholder` - Coming soon message

### home.howItWorks
- `heading`
- `step1Title`, `step1Body`
- `step2Title`, `step2Body`
- `step3Title`, `step3Body`

### home.faq
- `heading`, `viewAll`
- `question1`, `answer1`
- `question2`, `answer2`
- `question3`, `answer3`

### home.signup
- `headingInfoOnly`, `descriptionInfoOnly`, `ctaInfoOnly`
- `headingWaitlist`, `descriptionWaitlist`, `ctaWaitlist`
- `headingDonationsLive`, `descriptionDonationsLive`, `ctaDonationsLive`

## Testing

### E2E Tests

**File**: `tests/e2e/home.spec.ts`

**Coverage**:
- All 8 sections visible
- Mode-aware CTAs
- Candidacy status handling
- Mobile responsive (360px)
- French and English locales
- Accessibility checks
- No autoplay, defined aspects
- Reduced motion respected

**Run**:
```bash
npm run test:e2e -- tests/e2e/home.spec.ts
```

### Manual Testing Checklist

- [ ] Hero shows correct wording for candidacy status
- [ ] Primary CTA matches current mode
- [ ] Affiliation visible without scrolling (360px)
- [ ] Photo or placeholder displays correctly
- [ ] All 3 "Why Gifts" cards visible
- [ ] Map shows 10 communes or placeholder
- [ ] "How It Works" shows 3 steps
- [ ] FAQ expands on click
- [ ] Signup block has correct CTA
- [ ] Progress only shows in DONATIONS_LIVE (if applicable)
- [ ] All text readable (contrast check)
- [ ] Keyboard navigation works
- [ ] Animations respect reduced motion

## Troubleshooting

### Progress section not showing

**Check**:
1. Is mode DONATIONS_LIVE?
2. Is kill switch off?
3. Do contributions exist in database?
4. Check `getContributionStats()` return value

### Animations not working

**Check**:
1. Is JavaScript enabled?
2. Check browser console for errors
3. Verify IntersectionObserver support
4. Check `prefers-reduced-motion` setting

### Wrong CTA showing

**Check**:
1. Verify launch mode in database
2. Check `getCurrentMode()` function
3. Look at LaunchGate table

### Translations missing

**Check**:
1. Run `npm run check:translations`
2. Verify locale file has all keys
3. Check `useTranslations()` namespace

---

**Status**: ✅ Production-ready

**Next**: Build About, Nord-Ouest, News, Get Involved pages
