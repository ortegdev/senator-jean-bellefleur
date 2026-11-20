# Donation Experience Implementation

## Overview

Complete 3-step donation flow following research-backed UX principles, mobile-first design (360px), and launch gate enforcement. Built according to 10 core rules for conversion optimization and user trust.

## Routes

### Main Route
- **`/[locale]/contribute`** - Main contribution page
  - Shows different content based on launch mode
  - Server-side mode checking for security

## Launch Mode Behavior

### INFO_ONLY Mode (Default)
- Shows `InfoOnlyPanel` component
- Read-only information about the initiative
- Links to learn more about candidate and issues
- No data collection

### WAITLIST Mode
- Shows `WaitlistForm` component
- Collects email and/or WhatsApp with explicit consent
- Server-side validation via `/api/waitlist/signup`
- Success confirmation screen

### DONATIONS_LIVE Mode
- Shows `ContributeFlow` component
- Full 3-step donation process:
  1. **Amount Step** - Preset buttons ($5, $7, $10) + custom input
  2. **Details Step** - Personal info, commune, language, eligibility attestations
  3. **Payment Step** - Wallet buttons + card fields (placeholder for provider integration)
- Success page with share module and roots prompt

## 10 Research-Backed Rules Implemented

### 1. Value First
- Short, specific value proposition above form
- NO "skip to form" button (tests showed it reduced giving)
- Config-driven messaging

### 2. Three Large Preset Buttons
- Primary control: $5, $7, $10 (configurable)
- Custom amount as secondary option
- Large tap targets (48px+ height)

### 3. Exactly 3 Steps
- Amount → Details → Payment
- Progress indicator with back navigation
- Clear visual hierarchy

### 4. Wallet Buttons Before Card Fields
- Apple Pay and Google Pay prominently placed
- Card fields below divider
- Provider-hosted card fields (never touch card data)

### 5. Minimal Friction
- Fewest fields possible
- Grouped related fields (first/last name)
- Selects and chips over typing (commune, language)
- 48px input height for mobile
- Correct input modes and autocomplete
- Inline validation with focus management
- No account required

### 6. No Dark Patterns
- No fake urgency or countdown timers
- No pre-checked "cover fees" (honest fee structure)
- No guilt copy
- Honest, straightforward language

### 7. No Video
- Static content only
- Fast page loads
- Reduced data usage for diaspora with limited connectivity

### 8. Reduced Header
- Logo + "Secure payment" indicator + back link
- Minimal navigation chrome
- Focus on contribution flow

### 9. Trust Row
- Secure payment note with lock icon
- Refund policy link
- Not tax-deductible notice (config text)
- Affiliation disclosure (compact badge)
- All beside/near pay button

### 10. Mobile Sticky Bottom Bar
- Summary + pay button
- Keyboard-safe positioning
- Hidden on desktop
- Clear total amount

## Field Collection

### Required Fields
- First name
- Last name
- Email address
- Country of residence
- Preferred language (ht, fr, en)
- Three eligibility attestations

### Optional Fields
- Commune of origin (select from 10 Nord-Ouest communes)
- Anonymous toggle (default: anonymous)
- Dedication message (140 chars max)

### Eligibility Attestations
1. Age confirmation (18+)
2. Legal compliance confirmation
3. Foreign agent understanding (independent initiative)

## States & Error Handling

### Amount Step States
- Invalid amount
- Out of range (below min or above max from config)
- No amount selected

### Details Step States
- Field validation errors with focus management
- Error summary at field level
- Inline validation on blur
- All attestations required

### Payment Step States
- Loading/Processing
- 3D Secure authentication modal
- Payment failed with retry option
- Kill switch activation mid-checkout (graceful 403)
- Success transition

### Success Page Features
- Restrained confirmation (no confetti per rules)
- Receipt email notice
- Share module (WhatsApp first, then Facebook/Twitter)
- Commune roots prompt (if commune selected)
- Next steps suggestions

## Component Structure

```
src/
├── app/[locale]/contribute/
│   └── page.tsx                    # Route with mode switching
├── components/contribute/
│   ├── ContributeFlow.tsx          # Main flow orchestrator
│   ├── ContributeHeader.tsx        # Reduced header
│   ├── ProgressIndicator.tsx       # 3-step progress
│   ├── InfoOnlyPanel.tsx           # INFO_ONLY mode view
│   ├── WaitlistForm.tsx            # WAITLIST mode form
│   ├── SuccessPage.tsx             # Thank you page
│   └── steps/
│       ├── AmountStep.tsx          # Step 1: Amount selection
│       ├── DetailsStep.tsx         # Step 2: Personal details
│       └── PaymentStep.tsx         # Step 3: Payment (provider integration)
```

## Translation Keys

All user-facing strings in `src/i18n/messages/en.json` under `contribute` namespace:

- `contribute.pageTitle` / `pageDescription`
- `contribute.steps.*` - Progress labels
- `contribute.infoOnly.*` - INFO_ONLY panel content
- `contribute.waitlist.*` - Waitlist form labels and messages
- `contribute.amount.*` - Amount step content
- `contribute.details.*` - Details step labels
- `contribute.payment.*` - Payment step content
- `contribute.success.*` - Success page content

## Payment Provider Integration

### Current State
The `PaymentStep` component contains **placeholder logic** for payment processing. Wallet buttons and card payment simulate the flow but do not process real payments.

### Integration Points

To integrate a real payment provider (Stripe, PayPal, etc.):

1. **Replace wallet button handlers** in `PaymentStep.tsx`:
   ```typescript
   const handleWalletPay = async (walletType: 'apple' | 'google') => {
     // Initialize provider wallet payment
     // Show provider UI
     // Handle completion
   }
   ```

2. **Replace card field placeholder** with provider-hosted fields:
   ```typescript
   // Mount provider's card element in the designated div
   // Provider handles all card data (PCI compliance)
   ```

3. **Add payment intent creation**:
   ```typescript
   // Call /api/payments/create-intent
   // Pass contribution data
   // Receive client secret
   ```

4. **Handle 3D Secure** via provider SDK

5. **Store contribution** in database after successful payment

### Server-Side Enforcement
All payment routes **MUST** call `enforcePaymentGate()` from `src/lib/launch-gate/enforcement.ts`:

```typescript
import { enforcePaymentGate } from '@/lib/launch-gate/enforcement'

export async function POST(request: NextRequest) {
  const gateResponse = await enforcePaymentGate()
  if (gateResponse) {
    return gateResponse // 403 Forbidden
  }
  
  // Process payment...
}
```

## Testing Requirements

### Playwright E2E Tests (Required)
Test at 360x640 and 390x844 viewports in ht/fr/en locales:

1. **Preset amount selection**
   - Click preset button
   - Verify selected state
   - Proceed to details

2. **Custom amount input**
   - Enter valid amount
   - Verify Continue button updates
   - Test out-of-range amounts

3. **Wallet button rendering**
   - Verify Apple Pay and Google Pay display
   - Test wallet payment flow

4. **Form validation**
   - Submit with missing required fields
   - Verify error messages
   - Test focus management

5. **Kill switch mid-checkout**
   - Start contribution flow
   - Activate kill switch server-side
   - Attempt payment
   - Verify graceful 403 error

6. **Accessibility (axe)**
   - Run axe on every step
   - Verify no violations
   - Test keyboard navigation

7. **Lighthouse mobile**
   - Score 90+ on all steps
   - Verify performance budget

### Provider-Hosted Fields
- Payment provider fields remain provider-hosted
- Never touch or store card data
- PCI-DSS compliance via provider

## Mobile Optimization

### Viewport Support
- **Base**: 360px width (budget Android devices)
- **Tested**: 360x640, 390x844, 414x896
- **Breakpoints**: Tailwind default (sm: 640px, md: 768px, lg: 1024px)

### Input Optimizations
- `inputMode="decimal"` for amount input
- `inputMode="email"` for email input
- `inputMode="tel"` for WhatsApp input
- `autoComplete` attributes on all fields
- 48px minimum tap target height

### Keyboard Safety
- Sticky bottom bar positioned above keyboard
- Spacer div prevents content hiding
- ScrollIntoView on validation errors

### Performance
- No autoplay video
- Lazy-loaded images
- Minimal JavaScript
- Server-rendered first contentful paint

## Security Considerations

### Server-Side Validation
- All form data validated on server
- Launch mode checked on every request
- Payment routes protected by `enforcePaymentGate()`

### PCI Compliance
- Card data never touches our servers
- Provider-hosted card fields only
- No card storage

### Data Privacy
- Anonymous by default
- Explicit consent for waitlist
- Minimal data collection
- GDPR considerations

### Kill Switch
- Instant shutdown capability
- Graceful error messages
- No data loss (in-flight checkouts fail cleanly)

## Future Enhancements

### Not Implemented (Deferred)
1. **Actual payment provider integration** - Placeholder only
2. **Contribution database storage** - Schema exists, not wired
3. **Receipt generation** - Mentioned in success page, not built
4. **Email sending** - Success page claims email sent, not implemented
5. **Roots map integration** - Link exists, map not built yet
6. **Optional experiment framework** - Hook mentioned, not implemented

### When Donations Go Live
Before activating DONATIONS_LIVE mode:

1. Complete payment provider integration
2. Wire up contribution storage
3. Implement receipt email sending
4. Test end-to-end with test mode
5. Complete launch checklist (legal, compliance, technical)
6. Verify candidacy status (not UNVERIFIED)
7. Update CandidateConfig with actual preset amounts if different from $5/$7/$10

## Configuration

### CandidateConfig Fields Used
- `candidateName` - Display name
- `minAmountCents` - Minimum contribution (e.g., 500 = $5.00)
- `maxAmountCents` - Maximum contribution (e.g., 1000 = $10.00)
- `affiliationStatus` - INDEPENDENT, AUTHORIZED, or COORDINATED
- `affiliationText` - Disclosure text
- `communes` - Array of 10 commune names for selector

### Environment Variables
No new environment variables required. Uses existing:
- `DATABASE_URL` - For launch gate checks
- Payment provider variables (when integrated)

## Accessibility

### WCAG 2.2 AA Compliance
- Semantic HTML structure
- ARIA labels on progress indicator
- Focus management on validation errors
- Visible focus indicators (3px outline)
- Keyboard navigation support
- Screen reader announcements

### Color Contrast
- All text meets 4.5:1 minimum
- Error states use coral with sufficient contrast
- Trust indicators use muted colors

### Mobile Considerations
- Large touch targets (48px minimum)
- No hover-only interactions
- Swipe-friendly layouts

## File Checklist

✅ Route: `src/app/[locale]/contribute/page.tsx`
✅ Main flow: `src/components/contribute/ContributeFlow.tsx`
✅ Header: `src/components/contribute/ContributeHeader.tsx`
✅ Progress: `src/components/contribute/ProgressIndicator.tsx`
✅ Info panel: `src/components/contribute/InfoOnlyPanel.tsx`
✅ Waitlist: `src/components/contribute/WaitlistForm.tsx`
✅ Success: `src/components/contribute/SuccessPage.tsx`
✅ Amount step: `src/components/contribute/steps/AmountStep.tsx`
✅ Details step: `src/components/contribute/steps/DetailsStep.tsx`
✅ Payment step: `src/components/contribute/steps/PaymentStep.tsx`
✅ Translations: `src/i18n/messages/en.json` (updated)
✅ Documentation: `DONATE_IMPLEMENTATION.md` (this file)

## Dependencies

### Existing (No New Packages)
- Next.js 15+ App Router
- React 19+
- TypeScript (strict mode)
- Tailwind CSS
- next-intl (internationalization)
- Prisma (database)
- @prisma/client

### Launch Gate Integration
- Uses existing `isDonationsLive()`, `getCurrentMode()`, `canCollectWaitlistData()`
- Uses existing `enforcePaymentGate()` for API route protection
- Uses existing `getCandidateConfig()` for configuration

### Brand Components
- Uses existing `AffiliationBadge` from `src/components/brand/`

## Next Steps

1. **Database setup** - Run migrations when ready
2. **Payment provider integration** - Replace placeholder logic in `PaymentStep.tsx`
3. **API routes** - Implement `/api/payments/create-intent` and payment webhook handlers
4. **Contribution storage** - Wire up database writes after successful payment
5. **Receipt generation** - Implement PDF receipt generation and email delivery
6. **E2E tests** - Write Playwright tests per testing requirements above
7. **French/Haitian Creole** - Translate all `contribute.*` keys in messages files
8. **Roots map** - Build interactive commune map for success page link

---

**Status**: Core UI and flow complete. Payment integration and database wiring required before going live.
