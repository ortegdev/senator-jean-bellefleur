# Non-Negotiable Rules

These rules MUST be obeyed by every feature, task, and implementation in this project.

## 1. Honesty About Affiliation

The site ALWAYS shows its real relationship to the campaign. This is configurable but defaults to: **"independent supporter initiative, not authorized by or affiliated with the candidate, his campaign or any party"**.

- **NEVER** imply official status unless the configured status is "AUTHORIZED"
- The affiliation statement must be visible on every donation-related page
- Any change to affiliation status requires explicit configuration update

## 2. Candidacy Status Verification

Candidacy status is a **verified field** with these possible values:
- `UNVERIFIED` - Default, no verification yet
- `REGISTERED_PRELIMINARY` - Registered with preliminary candidate list
- `ON_FINAL_LIST` - Confirmed on final ballot
- `NOT_ON_FINAL_LIST` - Not on final ballot

**Copy NEVER says the candidate "is running" or "is the candidate" unless:**
- Status is `REGISTERED_PRELIMINARY` or later
- Evidence is recorded in the system

## 3. No Fabricated Content

**ZERO TOLERANCE** for fabricated:
- Quotes
- Facts
- Statistics  
- Testimonials
- Endorsements

**Every factual claim** about the candidate must carry a source in the content data.

Unverified material stays in `NEEDS_REVIEW` state and is **NEVER** shown publicly.

## 4. Visual Assets

- **NO** candidate photos, logos, or party symbols unless an approved asset is configured
- Use clearly marked **placeholders** instead
- Never copy any real campaign's logo, lettering, layout, or palette

## 5. Money Features Launch Gate

All donation/contribution features sit behind a launch gate (controlled via config).

**Default state: donations OFF**

Must be explicitly enabled before any money can be collected.

## 6. Donor Privacy

- Collect **minimum** donor data required
- **NEVER** log credit card data (PCI-DSS compliance)
- **NEVER** expose donor identities publicly by default
- Donors must explicitly opt-in to public recognition

## 7. Compliance Configuration

All compliance rules live in **database config**, NOT code:
- Contribution limits (min, max, cumulative)
- Eligibility requirements
- Allowed countries
- Election dates
- Fundraising periods

This allows updates without code changes and maintains audit trail.

## 8. Server/Client Boundary (Next.js)

**CRITICAL React/Next.js rule:**

- **NEVER** pass functions (`onClick` or any handler) from a Server Component to a Client Component
- Put event handlers inside small `"use client"` components
- **NEVER** add `"use client"` to whole pages as a shortcut
- Keep Server Components as server components for performance and security

## 9. No Private-Person Data

**NEVER** ingest, store, or display private-person data about the candidate or anyone else:
- ❌ Home addresses
- ❌ Phone numbers
- ❌ Family/relatives information
- ❌ Data-broker records
- ❌ Any non-public personal information

✅ **Only public, sourced facts**

## 10. No Campaign Copying

**NEVER** copy from any real campaign:
- ❌ Logos
- ❌ Typography/lettering
- ❌ Layout designs
- ❌ Color palettes

This prevents:
- Copyright infringement
- Trademark violations
- Voter confusion
- Legal liability

---

## Enforcement

Every PR, feature, and content addition must be reviewed against these rules. When in doubt, choose the more restrictive interpretation.
