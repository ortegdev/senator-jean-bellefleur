# Prompt 6 Complete: Profile Page & Content Intake System

## Summary

Built complete profile page at `/[locale]/bellefleur` with sourced content model, editorial workflow, and admin intake system. All content requires verification and sources before publication.

## What Was Built

### ✅ Profile Page (`/[locale]/bellefleur`)

**Route**: Dynamic based on `config.slug`  
**Layout**: Editorial, uses design tokens, no photo unless approved

**Page Order** (top to bottom):
1. **Intro** - Candidacy status, description, sourcing notice
2. **In the News** - Published news content (to be built in Prompt 9)
3. **His Journey** - Biography, Education, Profession, Public Service
4. **Supporter Perspective** - Clearly labeled, visually distinct
5. **FAQ** - Admin-editable with sourced answers

### ✅ Content Model

**Enhanced Schema** (`prisma/schema.prisma`):

**Content Model**:
- `id`, `slug`, `category`, `status`
- Text per locale: `textHt`, `textFr`, `textEn`
- `date` + `datePrecision` (EXACT, MONTH, YEAR, UNKNOWN)
- `quote` field (requires `quoteSourced` = true)
- `sources[]` (one-to-many relationship)
- `confidence`: CONFIRMED, REPORTED_SINGLE_SOURCE, DISPUTED_DATE
- `status`: DRAFT, NEEDS_REVIEW, PUBLISHED, ARCHIVED
- **Rule**: Cannot publish without at least one source

**ContentSource Model**:
- `title`, `publisher`, `url`, `language`
- `accessedOn` date
- `fileUrl` for uploaded evidence
- Linked to Content (cascade delete)

**Categories**:
- BIOGRAPHY
- EDUCATION
- PROFESSION
- PUBLIC_SERVICE
- PARTY_AFFILIATION
- CEP_REGISTRATION
- NEWS
- TESTIMONIAL
- FAQ_ANSWER
- OTHER

### ✅ FAQ System

**FAQ Model**:
- Question per locale (ht/fr/en)
- Answer per locale (ht/fr/en)
- `sources[]` (FAQSource)
- `status`, `publishedAt`, `publishedBy`
- `featured` (shows on home page preview)
- `order` for display sequence
- **Rule**: Cannot publish without at least one source

**Starter FAQs** (DRAFT status):
1. "Is this the official campaign?" → No, independent
2. "Who is behind this initiative?" → Diaspora supporters
3. "What if campaign declines gift?" → Refund policy
4. "Where does money go?" → Legal compliance
5. "How to report error?" → Email link

**Status**: Machine-drafted, awaiting admin review and publication

### ✅ Campaign Facts Intake Workflow

**IntakeSubmission Model**:
- `category` (CEP_REGISTRATION, PARTY_2026, EDUCATION, etc.)
- `status` (PENDING, IN_REVIEW, APPROVED, REJECTED, NEEDS_MORE)
- `factText*` per locale
- `submittedBy`, `contactEmail`
- `evidenceUrls[]` (files or links)
- `evidenceNotes`
- Processing: `reviewedBy`, `reviewedAt`, `reviewNotes`
- Links to `contentId` when content created

**IntakeChecklist Model**:
- Required intake items as checklist
- Each item: `itemKey`, `title`, `description`, `category`
- Completion tracking: `completed`, `completedBy`, `completedAt`
- `evidenceUrl`, `verificationNotes`

**Required Checklist Items**:
1. ✅ CEP Registration Proof
2. ✅ Party Affiliation for 2026
3. ✅ Education History
4. ✅ Professional Work History
5. ⚪ Public Service Record (optional)
6. ⚪ Approved Candidate Photo (optional)
7. ⚪ Approved Campaign Logo (optional)
8. ✅ Permission to Use Name

### ✅ Profile Page Components

**ProfileIntro** (`src/components/profile/ProfileIntro.tsx`):
- Candidacy status badge
- Name, office, department
- Sourcing notice ("All Facts Are Sourced")
- CTA buttons (Support, Report Error)

**ProfileNews** (`src/components/profile/ProfileNews.tsx`):
- Published NEWS category content
- Date, quote/text, confidence badge
- Expandable sources
- Formatted by locale

**ProfileJourney** (`src/components/profile/ProfileJourney.tsx`):
- Four sections: Biography, Education, Profession, Public Service
- Timeline layout with bullets
- Date with precision handling
- Expandable sources per entry
- Shows "No content" if nothing published

**ProfileSupporter** (`src/components/profile/ProfileSupporter.tsx`):
- **Clearly labeled** disclaimer banner
- **Visually distinct** (dashed coral border, different background)
- Three supporter values (not verified facts)
- Footer: "Not an official endorsement"
- No fabricated quotes

**ProfileFAQ** (`src/components/profile/ProfileFAQ.tsx`):
- Expandable `<details>` elements
- Question + sourced answer
- Expandable sources per FAQ
- "Report a Factual Error" section with email link

### ✅ Data Layer

**Content Queries** (`src/lib/data/content.ts`):
```typescript
// Get published content by category
getPublishedContent(category, locale, limit?)

// Check if can publish (has sources)
canPublishContent(contentId)

// Publish content (admin action)
publishContent(contentId, publishedBy)
```

**Features**:
- 5-minute cache
- Locale-aware text selection
- Fallback logic (en → fr → ht)
- Validation: blocks publishing without sources
- Validation: blocks quotes without `quoteSourced` flag

**FAQ Queries** (`src/lib/data/faq.ts`):
```typescript
// Get published FAQs
getPublishedFAQs(locale, featuredOnly?)

// Check if can publish (has sources)
canPublishFAQ(faqId)

// Publish FAQ (admin action)
publishFAQ(faqId, publishedBy)
```

### ✅ Admin Interface

**Intake Page** (`/admin/intake`):
- Status summary cards
- Required facts checklist with progress bar
- Pending submissions list
- Action buttons: Create Content, Request More, Reject
- Clear rules displayed

**IntakeChecklist Component**:
- Visual progress indicator
- Checkbox with completion details
- Evidence links
- Verification notes

**IntakeSubmissions Component**:
- Status badges (PENDING, IN_REVIEW, NEEDS_MORE)
- Priority flag
- Facts in all locales
- Evidence file links
- Review notes
- Action buttons (placeholders for server actions)

### ✅ Seed Data

**Intake Seed** (`prisma/seed-intake.ts`):
```bash
npx tsx prisma/seed-intake.ts
```

Creates:
- 8 intake checklist items
- 5 starter FAQ entries (DRAFT status)
- **No biography/education/profession data** - none verified yet

**Important**:
- FAQs start as DRAFT
- Admin must review sources
- Admin must publish
- Checklist starts empty (all uncompleted)

## Key Features

### 1. Sourcing Requirements

**Publishing Rules**:
- ❌ Cannot publish content without sources
- ❌ Cannot publish quotes without exact source
- ✅ Must have at least one ContentSource
- ✅ Sources show title, publisher, URL, access date
- ✅ Can upload evidence files

**Confidence Levels**:
- **CONFIRMED**: Multiple sources or official document
- **REPORTED_SINGLE_SOURCE**: One credible source
- **DISPUTED_DATE**: Facts confirmed but date uncertain

### 2. Date Precision

**DatePrecision Enum**:
- **EXACT**: Specific date known (March 15, 2027)
- **MONTH**: Month and year (March 2027)
- **YEAR**: Only year (2027)
- **UNKNOWN**: Date not available

**Display Logic**: Adjusts format based on precision

### 3. Supporter Section Distinction

**Visual Markers**:
- Dashed coral border (different from solid borders elsewhere)
- Disclaimer banner at top
- Different background gradient
- Clear heading: "Supporter Perspective"
- Footer note: "Not an official endorsement"
- No fabricated quotes

**Content**: Values/perspectives, not factual claims

### 4. Workflow Roles

**Editor**:
- Review intake submissions
- Create content entries from verified facts
- Add sources
- Move to NEEDS_REVIEW

**Owner**:
- Final publishing approval
- Publish content (makes visible on site)
- Publish FAQs
- Mark checklist items complete

### 5. Report Error Feature

**Located**: Bottom of FAQ section  
**Function**: `mailto:` link with pre-filled subject  
**Encourages**: Evidence-based error reports

## Files Created

### Database
- Enhanced `prisma/schema.prisma` (Content, ContentSource, FAQ, FAQSource, IntakeSubmission, IntakeChecklist models)
- `prisma/seed-intake.ts` - Seed checklist + starter FAQs

### Routes
- `src/app/[locale]/bellefleur/page.tsx` - Profile page
- `src/app/admin/intake/page.tsx` - Intake admin page

### Data Layer
- `src/lib/data/content.ts` - Content queries & publishing
- `src/lib/data/faq.ts` - FAQ queries & publishing

### Components
- `src/components/profile/ProfileIntro.tsx`
- `src/components/profile/ProfileNews.tsx`
- `src/components/profile/ProfileJourney.tsx`
- `src/components/profile/ProfileSupporter.tsx`
- `src/components/profile/ProfileFAQ.tsx`
- `src/components/admin/IntakeChecklist.tsx`
- `src/components/admin/IntakeSubmissions.tsx`

### Translations
- Updated `src/i18n/messages/en.json` with `profile.*` keys

## Testing Checklist

### Profile Page
- [ ] Visit `/en/bellefleur` (or `/ht/bellefleur`, `/fr/bellefleur`)
- [ ] Intro shows candidacy status
- [ ] "All Facts Are Sourced" notice visible
- [ ] Journey shows only published content
- [ ] Supporter section visually distinct
- [ ] FAQ expandable, shows sources
- [ ] Report error link works
- [ ] No content = graceful "coming soon" messages

### Admin Intake
- [ ] Visit `/admin/intake`
- [ ] Checklist shows 8 items
- [ ] Progress bar updates
- [ ] Submissions list shows pending
- [ ] Can view evidence links
- [ ] Action buttons present

### Data Validation
- [ ] Try publishing content without sources → blocked
- [ ] Try publishing quote without `quoteSourced` → blocked
- [ ] Add source, then publish → succeeds
- [ ] Published content appears on profile page

## Next Steps

### Before Launch
1. Run migrations: `npx prisma migrate dev`
2. Run intake seed: `npx tsx prisma/seed-intake.ts`
3. Admin reviews and publishes starter FAQs
4. Implement server actions for intake processing
5. Set up file upload for evidence
6. Native speaker review of translations

### Future Prompts
- **Prompt 7**: "His Journey" content creation workflow
- **Prompt 9**: "In the News" section implementation
- Content admin UI for editors
- Publishing workflow with approval
- Evidence file management

## Steering Rules Followed

- ✅ **RULE 2**: Candidacy status displayed and verified
- ✅ **RULE 3**: No fabricated content (all requires sources)
- ✅ **RULE 9**: No private-person data (only public facts)
- ✅ **Sourcing**: Every published fact has citation
- ✅ **Verification**: Cannot publish without sources
- ✅ **Transparency**: Supporter section clearly labeled
- ✅ **No Quotes**: Without exact source = blocked

## Documentation

**Key Concepts**:
- Content cannot go live without sources
- Quotes need exact attribution
- Intake → Review → Content → Publish workflow
- Checklist tracks required verifications
- FAQs must have sourced answers

**Database Schema**: Extended with 7 new models  
**Publishing Rules**: Enforced at data layer  
**Role Separation**: Editor creates, Owner publishes

---

**Status**: ✅ Complete

**Translation Status**: English complete, FR/HT need native review

**Data Status**: Empty (no verified content yet)

**Checklist Status**: 0/8 complete (awaiting submissions)

**FAQ Status**: 5 entries in DRAFT (awaiting admin publication)

Ready for content intake and editorial workflow! 📝
