# Design Direction: Dignified Optimism, Sea and Salt

## Vision

A visual identity that projects **confident optimism** without false promises, **community connection** without tokenism, and **professional credibility** without corporate coldness. The design speaks to diaspora members who carry Haiti in their hearts and want to support serious representation for Nord-Ouest.

## Core Principles

### 1. Dignified Optimism
- **Confident, not desperate**: No fake urgency, no countdown timers, no manufactured scarcity
- **Warm, not corporate**: Inviting layouts, human tone, genuine imagery (when available)
- **Serious, not frivolous**: Professional presentation that respects the electoral process
- **Hopeful, not naive**: Acknowledges challenges while projecting constructive vision

### 2. Community-First
- **Diaspora-centric**: Design acknowledges geographic connection through "coastline constellation" motif
- **Inclusive**: Works for all ages, technical abilities, connection speeds
- **Accessible**: WCAG 2.2 AA compliance minimum, tested with assistive technologies
- **Transparent**: Affiliation disclosure is designed-in, never hidden

### 3. Sea and Salt Metaphor
- **Coastal connection**: Nord-Ouest's relationship to the sea informs palette and motif
- **Migration and diaspora**: The constellation links Port-de-Paix to diaspora cities
- **Strength and preservation**: Salt preserves, sea sustains—themes of resilience
- **Horizon and possibility**: Ocean blues suggest forward vision

## Design Rules (Research-Backed)

### Rule 1: Discipline Over Decoration
**Principle**: Constraint breeds clarity. Two type families maximum, token-based system.

- **Type families**: Fraunces (display) + Inter (body/UI) only
- **Tokens only**: All spacing, colors, sizes from design tokens
- **No arbitrary values**: If it's not in the token system, it doesn't go in
- **Rationale**: Consistency creates trust; random decoration creates cognitive load

### Rule 2: One Dominant Action Per Screen
**Principle**: Clear hierarchy guides user through intended flow.

- **Single primary CTA**: High-contrast Coral button dominates each view
- **Secondary actions**: Lower contrast, smaller, or text-only
- **Visual weight**: Primary action should be immediately obvious (5-second test)
- **Rationale**: Decision paralysis reduces action; clarity increases conversion

### Rule 3: Brand Lives on Every Page
**Principle**: Recognition builds over time, not just in hero sections.

- **Wordmark**: Present in navigation on every page
- **Motif**: Coastline constellation appears as dividers, backgrounds, loaders
- **Palette**: Brand colors used consistently throughout
- **Typography**: Distinctive display type in headings site-wide
- **Rationale**: Brand recall requires repeated exposure in varied contexts

### Rule 4: Positive, Human Tone with Airy Layouts
**Principle**: Respect user attention and intelligence.

- **No stock photo tokenism**: Generic "diverse people smiling" images forbidden
- **Generous whitespace**: Breathing room between sections (80-120px)
- **Human language**: Conversational, respectful, never condescending
- **Real imagery only**: Candidate photo, community events, or elegant placeholders
- **Rationale**: Users detect and resent inauthentic representation

### Rule 5: Respect Motion and Cognitive Preferences
**Principle**: Motion enhances when intentional, distracts when gratuitous.

- **No autoplay video**: User-initiated media only
- **Subtle CSS transitions**: 120-300ms, one easing function
- **prefers-reduced-motion**: All motion disabled when requested
- **Purposeful animation**: Loading states, focus indicators, page transitions only
- **Rationale**: Respect user autonomy and accessibility needs

### Rule 6: Complete Without Candidate Photo
**Principle**: Site must look finished with placeholder.

- **Elegant placeholder**: Designed slot with label, not empty space
- **No layout shift**: Space reserved, design balanced either way
- **Clear labeling**: "Photo pending approval" or similar
- **Professional appearance**: Placeholder uses brand colors and coastline motif
- **Rationale**: RULE 4 (Visual Assets) - may launch without approved photo

### Rule 7: Affiliation Disclosure as Design Element
**Principle**: Required disclosure shouldn't feel tacked-on.

- **Designed component**: AffilationBadge with consistent styling
- **Always visible**: Never hidden in footer fine print
- **Contextual placement**: Near donation/action areas, integrated naturally
- **Clear hierarchy**: Important info, but not primary focus
- **Rationale**: RULE 1 (Honesty About Affiliation) - transparency builds trust

### Rule 8: No Manufactured Urgency
**Principle**: Authentic urgency only (real deadlines with evidence).

- **No countdown timers**: Unless actual election date with verification
- **No "spots remaining"**: No artificial scarcity
- **No fake testimonials**: Only real, attributed endorsements (when verified)
- **No pressure language**: "Act now!" / "Don't miss out!" forbidden
- **Rationale**: RULE 3 (No Fabricated Content) - integrity over manipulation

### Rule 9: Mobile-First at 360px on Slow Connections
**Principle**: Design for lowest common denominator, enhance progressively.

- **Base viewport**: 360px width (common budget Android devices)
- **Connection**: Test on throttled 3G
- **Performance budget**: Lighthouse mobile 90+ score
- **Font loading**: Subset, preload, swap gracefully
- **Image optimization**: WebP with fallback, lazy loading
- **Rationale**: Diaspora may be accessing from areas with limited connectivity

## Color Palette

### Brand Colors

**Deep Lagoon** `#0F3D4A`
- **Role**: Anchor, trust, depth
- **Usage**: Headers, navigation, footer
- **Associations**: Caribbean sea, stability, seriousness
- **WCAG**: AA on Sand Paper, AAA on white

**Coral** `#C8432B`
- **Role**: Primary action, energy
- **Usage**: Primary buttons, links, key CTAs
- **Associations**: Vitality, urgency (dignified), call to action
- **WCAG**: AA on white, verify on Sand Paper

**Sand Paper** `#FAF6EE`
- **Role**: Background, warmth, canvas
- **Usage**: Page backgrounds, card backgrounds
- **Associations**: Beach sand, light, openness
- **WCAG**: Base for text contrast checks

**Ink** `#0B1D24`
- **Role**: Primary text, maximum contrast
- **Usage**: Body text, headings
- **Associations**: Authority, legibility
- **WCAG**: AAA on Sand Paper and white

**Sea Green** `#1F8A70`
- **Role**: Progress, success, growth
- **Usage**: Progress bars, success states, checkmarks
- **Associations**: Growth, forward movement, achievement
- **WCAG**: AA on white and Sand Paper

**Salt Gold** `#EFB93F`
- **Role**: Rare highlight, warning
- **Usage**: Important badges, warning states, rare accents
- **Associations**: Value, attention, caution
- **WCAG**: Verify contrast, use sparingly

### Semantic Colors

Built from palette:
- **Success**: Sea Green
- **Warning**: Salt Gold
- **Error**: Adjusted Coral (darker for contrast)
- **Info**: Deep Lagoon lighter tint
- **Neutral**: Ink with opacity variations

### Contrast Requirements

All color pairings **MUST** meet WCAG 2.2 Level AA:
- **Normal text** (< 18px): 4.5:1 minimum
- **Large text** (≥ 18px or bold): 3:1 minimum
- **UI components**: 3:1 minimum
- **Interactive states**: Clear visual distinction

**Verification process**:
1. Test all pairings with contrast checker
2. Document actual ratios in design system
3. Adjust if needed to meet standards
4. Create accessible variants for dark mode

## Typography

### Type Families

**Fraunces** (Display)
- **Role**: Headings, display text, brand voice
- **Weight**: 400 (regular), 700 (bold)
- **Character**: Sophisticated serif with personality
- **License**: SIL Open Font License (self-hostable)
- **Subset**: Latin + Latin Extended for French diacritics

**Inter** (Body/UI)
- **Role**: Body text, UI elements, captions
- **Weight**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Character**: Neutral, highly legible, modern sans-serif
- **License**: SIL Open Font License (self-hostable)
- **Subset**: Latin + Latin Extended

### Character Set Requirements

**Must include glyphs for French/Creole diacritics**:
- Lowercase: è ò à â ê î ô û ç œ
- Uppercase: È Ò À Â Ê Î Ô Û Ç Œ
- Test phrase: "À Port-de-Paix, le cœur bat fort"

### Type Scale (Fluid)

Using `clamp()` for responsive scaling:

```css
--font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);     /* 12-14px */
--font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);       /* 14-16px */
--font-size-base: clamp(1.0625rem, 1rem + 0.3125vw, 1.125rem); /* 17-18px */
--font-size-lg: clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem);   /* 18-20px */
--font-size-xl: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);       /* 20-24px */
--font-size-2xl: clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem);    /* 24-30px */
--font-size-3xl: clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem);  /* 30-36px */
--font-size-4xl: clamp(2.25rem, 1.95rem + 1.5vw, 3rem);        /* 36-48px */
--font-size-5xl: clamp(3rem, 2.55rem + 2.25vw, 4.375rem);      /* 48-70px */
```

### Type Settings

- **Base**: 17-18px (mobile-desktop)
- **Line height**: 1.5 for body, 1.2 for headings
- **Line length**: 60-70ch for optimal readability
- **Letter spacing**: Default (no adjustment needed for Inter)
- **Font smoothing**: `-webkit-font-smoothing: antialiased`

### Loading Strategy

1. **Preload** critical WOFF2 files
2. **Subset** to Latin + Latin Extended
3. **font-display: swap** for graceful fallback
4. **System fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', ...`

## Shape Language

### Grid System

**12-column grid** with flexible implementation:
- Mobile (360px+): 4 columns, 16px gutters
- Tablet (768px+): 8 columns, 24px gutters
- Desktop (1280px+): 12 columns, 32px gutters
- Max width: 1440px centered

### Border Radius

- **xs**: 4px - Small elements, badges
- **sm**: 8px - Input fields, chips
- **md**: 12px - Cards, buttons
- **lg**: 16px - Modals, large cards
- **xl**: 24px - Hero sections, image placeholders
- **full**: 9999px - Pills, avatars

### Shadows

Soft, natural shadows:
- **sm**: `0 1px 2px rgba(11, 29, 36, 0.05)`
- **md**: `0 4px 6px rgba(11, 29, 36, 0.07), 0 2px 4px rgba(11, 29, 36, 0.03)`
- **lg**: `0 10px 15px rgba(11, 29, 36, 0.08), 0 4px 6px rgba(11, 29, 36, 0.04)`
- **xl**: `0 20px 25px rgba(11, 29, 36, 0.1), 0 8px 10px rgba(11, 29, 36, 0.04)`

### Spacing Scale

Based on 4px base unit:
- 0.5: 2px
- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 5: 20px
- 6: 24px
- 8: 32px
- 10: 40px
- 12: 48px
- 16: 64px
- 20: 80px
- 24: 96px
- 32: 128px

### Whitespace Philosophy

**Generous but purposeful**:
- Section spacing: 80-120px vertical
- Component spacing: 24-48px
- Element spacing: 8-16px
- Breathing room over density
- Hierarchy through space, not just size

## Coastline Constellation Motif

### Concept

An original graphic system representing the connection between Nord-Ouest's coast and diaspora destinations.

**Visual elements**:
- Dots representing cities (Port-de-Paix, Miami, Montreal, New York, Paris, Boston)
- Fine connecting lines suggesting migration paths
- Subtle, background-layer decorative element
- Not a literal map—abstracted, stylized

### Usage

- **Hero background**: Subtle overlay, ~10% opacity
- **Section dividers**: Horizontal slice of pattern
- **Loading states**: Animated dots "connecting"
- **Share cards**: Background element for social images
- **404/empty states**: Contextual decoration

### Implementation

- **Format**: Inline SVG for flexibility
- **Accessibility**: `aria-hidden="true"` (decorative only)
- **Colors**: Uses brand palette (Deep Lagoon, Sea Green tints)
- **Performance**: Lightweight, cacheable
- **Variants**: Horizontal, vertical, circular compositions

### Design Guidelines

- Never obscures content
- Maximum 20% opacity
- Works in light and dark mode
- Scales responsively
- Optional (can be disabled for performance)

## Wordmark & Identity

### Working Brand Name: "Diaspora4Bellefleur"

Original typographic treatment, not a logo likeness.

**Requirements**:
- Typographic only (Fraunces + custom spacing)
- No candidate photos, flags, or party symbols
- Light, dark, and monochrome variants
- Favicon set (16x16, 32x32, 180x180, 512x512)
- SVG for scalability

**Variants**:
- **Full**: "Diaspora4Bellefleur" with spacing
- **Short**: "D4B" monogram for mobile
- **Lockup**: With tagline "Nord-Ouest 2027"

### Favicon

Simple, recognizable at small sizes:
- "D4B" monogram
- Deep Lagoon background
- Coral accent
- Multiple sizes for various contexts

## Component Library

### Button

**Variants**:
- Primary (Coral): High-contrast, dominant action
- Secondary (Deep Lagoon): Lower priority actions
- Tertiary (text-only): Lowest priority actions
- Ghost (outline): Alternate secondary option

**States**: Default, Hover, Active, Focus, Disabled, Loading

**Sizes**: Small (36px), Medium (44px), Large (52px)

**Accessibility**: 44px minimum tap target, visible focus ring

### Input Fields

**Types**: Text, Email, Tel, Number, Textarea, Select

**States**: Default, Focus, Error, Disabled, Success

**Features**:
- Clear labels (no placeholder-only)
- Error messages below field
- Success indicators when appropriate
- Visible focus rings

### Selection Controls

- **Checkbox**: Multi-select options
- **Radio**: Single-select options (styled as chips for better mobile UX)
- **Toggle**: Binary on/off states

**Accessibility**: Large tap targets, keyboard navigation, clear checked states

### Cards

**Variants**:
- Default: Basic container
- Interactive: Hover states, clickable
- Featured: Highlighted content

**Features**: Consistent padding, optional image, header, footer

### Badges

**Types**: Status, Info, Count, Verification

**Colors**: Semantic (success, warning, error, info, neutral)

**Size**: Compact, space-efficient

### Tabs

Horizontal navigation between related views.

**Accessibility**: Arrow key navigation, clear active state

### Accordion

Collapsible content sections.

**Accessibility**: Keyboard control, ARIA attributes, smooth animation

### Modal

Overlay dialogs for focused tasks.

**Accessibility**: Focus trap, ESC to close, backdrop click to close, ARIA labels

### Toast

Temporary notifications (success, error, info).

**Accessibility**: Announced to screen readers, dismissible, auto-dismiss option

### Progress Bar

Visual feedback for multi-step processes or loading.

**Variants**: Determinate (known progress), Indeterminate (unknown duration)

### Tooltip

Contextual help on hover/focus.

**Accessibility**: Keyboard accessible, ARIA descriptions

### Image Placeholder

Elegant placeholder for candidate photo.

**Features**:
- Coastline constellation background
- "Photo pending approval" label
- Maintains aspect ratio
- Matches design aesthetic

### Section Header

Consistent page section headings.

**Features**:
- Fraunces display type
- Optional description
- Optional CTA
- Coastline divider option

### Timeline

Chronological events display.

**Accessibility**: Clear hierarchy, semantic markup

### Table

Data presentation with responsive behavior.

**Mobile strategy**: Horizontal scroll or card transformation

## Accessibility Requirements

### WCAG 2.2 Level AA Compliance

**Visual**:
- Color contrast ratios documented and verified
- No color-only information
- Text resizable to 200% without loss

**Interaction**:
- All functionality keyboard accessible
- Visible focus indicators (3px outline, brand colors)
- Tap targets minimum 44x44px

**Content**:
- Semantic HTML structure
- ARIA labels where needed
- Alt text for images (empty for decorative)
- Skip links for main content

**Motion**:
- Respect `prefers-reduced-motion`
- No autoplay media
- Pausable animations

### Testing Requirements

- Automated: Lighthouse accessibility score 100
- Manual: Keyboard navigation testing
- Screen reader: VoiceOver (Safari) and NVDA (Firefox) testing
- Color blindness: Sim test for common types

## Performance Budget

### Lighthouse Targets (Mobile)

- **Performance**: 90+
- **Accessibility**: 100
- **Best Practices**: 95+
- **SEO**: 95+

### Asset Budgets

- **Fonts**: < 100KB total (subset WOFF2)
- **CSS**: < 50KB (purged Tailwind)
- **JS (first page)**: < 150KB
- **Images**: WebP, lazy loaded, responsive

### Loading Strategy

1. Critical CSS inline
2. Fonts preloaded
3. Images lazy loaded
4. Code splitting by route
5. CDN for static assets

## Dark Mode

Complete dark mode support:

**Palette adjustments**:
- Background: Ink variations
- Text: Sand Paper variations
- Brand colors: Slightly desaturated versions
- Contrast: Still meets WCAG AA

**Toggle**: User preference, persisted, respects `prefers-color-scheme`

## Motion Tokens

### Duration

- **fast**: 120ms - Micro-interactions
- **base**: 200ms - Standard transitions
- **slow**: 300ms - Complex transitions

### Easing

- **ease-out**: `cubic-bezier(0.2, 0, 0, 1)` - One easing for all

### Usage

- Hover states: fast
- Focus rings: fast
- Dropdown menus: base
- Modals: slow
- Page transitions: slow

**Disabled when**: `prefers-reduced-motion: reduce`

## Design System Documentation Page

### Route: `/[locale]/design-system`

**Purpose**: Living documentation for designers and developers

**Sections**:
1. Color palette with contrast ratios
2. Typography scale with examples
3. Component library with all variants
4. Spacing scale visualization
5. Motion examples (pausable)
6. Accessibility features
7. Code examples

**Testing strings**: Longest French and Creole phrases to verify layout

## Visual Regression Testing

### Playwright Baselines

**Viewports**:
- Mobile: 360px width
- Tablet: 768px width
- Desktop: 1280px width

**Captured screens**:
- All component variants
- Key pages (home, about, contribute)
- Light and dark mode
- All locales

**Storage**: `docs/design-review/` (git-tracked for review)

**CI integration**: Fail build on visual regressions

## Brand Guidelines Summary

### Do's

✅ Use brand colors consistently  
✅ Maintain generous whitespace  
✅ Test all color contrast  
✅ Include affiliation disclosure  
✅ Design complete without candidate photo  
✅ Respect reduced motion preferences  
✅ One primary CTA per page  
✅ Self-host and subset fonts  
✅ Test at 360px on slow connection  
✅ Document accessibility features

### Don'ts

❌ No stock photo tokenism  
❌ No autoplay video  
❌ No fake urgency or scarcity  
❌ No countdown timers (unless verified election date)  
❌ No arbitrary spacing/colors outside token system  
❌ No more than two type families  
❌ No candidate photos without approval  
❌ No campaign logo/branding copying  
❌ No hidden affiliation disclosure  
❌ No tap targets below 44px

---

**Design Philosophy**: Every design decision serves the mission—connecting diaspora members with serious, transparent representation for Nord-Ouest. The visual identity should feel distinctive, trustworthy, and respectfully optimistic about Haiti's democratic future.
