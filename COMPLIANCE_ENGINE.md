# Compliance Engine Documentation

## Overview

A fully configurable, database-driven compliance engine that enforces legal rules for campaign contributions. **CRITICAL**: All legal rules are stored in the database and never hard-coded in the application.

## Core Principles

1. **Database-Driven Rules**: Every legal rule is configurable in the database
2. **Dual Approval**: All rule changes require two independent approvals
3. **Complete Audit Trail**: Every change is logged with attribution
4. **Legal Basis Required**: Every rule must reference its legal basis
5. **Version History**: Complete history of all rule changes
6. **Role-Based Access**: Only COMPLIANCE role can manage rules

## Architecture

### Database Models

#### ComplianceRule
Main rule record with current active configuration:
- `name`: Human-readable name
- `description`: Detailed description
- `ruleType`: Type of rule (enum)
- `config`: JSON configuration (rule-specific)
- `legalBasisReference`: Required legal justification
- `effectiveFrom`/`effectiveTo`: Date range
- `isActive`: Currently enforced
- **Relation**: `versions` - Change history

#### ComplianceRuleVersion
Complete change history with approval workflow:
- `version`: Sequential version number
- `status`: DRAFT → PENDING_FIRST_APPROVAL → PENDING_SECOND_APPROVAL → APPROVED → ACTIVE
- `createdBy`/`createdByEmail`: Rule creator
- `approvedBy`/`approvedByEmail`: First approver
- `secondApprovedBy`/`secondApprovedByEmail`: Second approver
- `activatedBy`/`activatedAt`: When made live

#### ComplianceCheck
One record per donation attempt:
- Donor identification (email, fingerprint, IP)
- Transaction details
- Attestations captured
- **Result**: ALLOW, REVIEW, or DENY
- **Reasons**: Machine-readable codes
- **Rules applied**: Snapshot of which rules evaluated
- Review workflow fields

#### EligibilityAttestation
Versioned attestation text (counsel-approved):
- Localized text (ht, fr, en)
- Legal basis
- Version number
- Active status

#### SanctionsScreening
Sanctions check log:
- Provider used
- Match score
- Status (CLEAR, POTENTIAL_MATCH, MATCH, ERROR)

#### DonorBlocklist
Permanently blocked donors

### Rule Types

#### 1. AMOUNT_LIMIT
Enforces min/max per transaction.

**Config:**
```json
{
  "minCents": 500,
  "maxCents": 1000
}
```

**Results:**
- DENY: `AMOUNT_BELOW_MINIMUM` or `AMOUNT_ABOVE_MAXIMUM`

#### 2. CUMULATIVE_CAP
Enforces maximum total per donor per election cycle.

**Config:**
```json
{
  "capCents": 1000,
  "cycleType": "election"
}
```

**Detection Mechanisms:**
1. Email normalization (removes dots from Gmail, +tags from all)
2. Payment method fingerprint (card fingerprint from provider)
3. Device fingerprint (optional client-side signals)

**Results:**
- DENY: `CUMULATIVE_CAP_EXCEEDED`

#### 3. COUNTRY_RESTRICTION
Allow/deny list for countries.

**Config:**
```json
{
  "mode": "denylist",
  "countries": ["KP", "IR", "SY", "CU"]
}
```

**Results:**
- DENY: `COUNTRY_DENIED` (declared country in denylist)
- REVIEW: `IP_COUNTRY_DENIED` (IP country in denylist but declared differs)

#### 4. ELIGIBILITY_CHECK
Requires specific attestations.

**Config:**
```json
{
  "requiredAttestations": [
    "ageConfirm",
    "legalConfirm",
    "foreignAgentConfirm"
  ]
}
```

**Results:**
- DENY: `MISSING_ATTESTATIONS`

#### 5. FUNDRAISING_PERIOD
Enforces start/end dates.

**Config:**
```json
{
  "startDate": "2027-01-01",
  "endDate": "2027-11-30"
}
```

**Results:**
- DENY: `FUNDRAISING_NOT_STARTED` or `FUNDRAISING_ENDED`

#### 6. SANCTIONS_SCREENING
Screens against OFAC and international sanctions lists.

**Config:**
```json
{
  "enabled": true,
  "provider": "stub"
}
```

**Providers:**
- `stub`: Test provider (always CLEAR unless test pattern in name)
- `chainalysis`: Chainalysis KYT (placeholder)
- `dowjones`: Dow Jones Risk & Compliance (placeholder)
- `complyadvantage`: ComplyAdvantage (placeholder)

**Results:**
- DENY: `SANCTIONS_MATCH`
- REVIEW: `SANCTIONS_POTENTIAL_MATCH`, `SANCTIONS_SCREENING_ERROR`

#### 7. PROHIBITED_SOURCE
Blocks/flags prohibited payment methods.

**Config:**
```json
{
  "blockCorporateCards": true,
  "blockPrepaidCards": true,
  "flagCountryMismatch": true
}
```

**Results:**
- DENY: `CORPORATE_CARD_PROHIBITED`, `PREPAID_CARD_PROHIBITED`
- REVIEW: `CARD_COUNTRY_MISMATCH`

#### 8. PRE_CAMPAIGN_BLOCK
Blocks contributions before official campaign start (if counsel requires).

**Config:**
```json
{
  "enabled": false,
  "campaignStartDate": "2027-01-01"
}
```

**Results:**
- DENY: `PRE_CAMPAIGN_PERIOD`

## Usage

### Checking Compliance

```typescript
import { checkCompliance, type DonationAttempt } from '@/lib/compliance/engine'

const attempt: DonationAttempt = {
  donorEmail: 'donor@example.com',
  donorFirstName: 'Jane',
  donorLastName: 'Donor',
  declaredCountry: 'US',
  amountCents: 700,
  currency: 'USD',
  attestations: {
    ageConfirm: { version: 1, text: '...', timestamp: new Date() },
    legalConfirm: { version: 1, text: '...', timestamp: new Date() },
    foreignAgentConfirm: { version: 1, text: '...', timestamp: new Date() },
  },
  paymentMethodType: 'card',
  cardType: 'credit',
  cardCountry: 'US',
  ipAddress: '8.8.8.8',
  ipCountry: 'US',
}

const result = await checkCompliance(attempt)

if (result.result === 'ALLOW') {
  // Proceed with payment
} else if (result.result === 'REVIEW') {
  // Queue for manual review
} else {
  // DENY - show reasons to user
  console.log(result.reasons)
}
```

### Managing Rules

```typescript
import {
  createRule,
  submitForApproval,
  firstApproval,
  secondApproval,
  activateRule,
} from '@/lib/compliance/rules-management'

// 1. Create new rule (DRAFT)
const result = await createRule({
  name: 'Updated Amount Limits',
  description: 'New limits per counsel guidance',
  ruleType: 'AMOUNT_LIMIT',
  config: { minCents: 500, maxCents: 1500 },
  legalBasisReference: 'Counsel opinion dated 2027-01-15',
  effectiveFrom: new Date('2027-02-01'),
  createdBy: userId1,
  createdByEmail: email1,
}, 'COMPLIANCE')

const ruleId = result.ruleId

// 2. Submit for approval
await submitForApproval(ruleId, userId1, email1, 'COMPLIANCE')

// 3. First approval (different user)
await firstApproval(ruleId, userId2, email2, 'COMPLIANCE')

// 4. Second approval (third user)
await secondApproval(ruleId, userId3, email3, 'COMPLIANCE')

// 5. Activate (make live)
await activateRule(ruleId, userId3, email3, 'COMPLIANCE')
```

### Manual Review Queue

```typescript
import {
  getPendingReviews,
  assignReview,
  completeReview,
} from '@/lib/compliance/manual-review'

// Get pending items
const pending = await getPendingReviews()

// Assign to reviewer
await assignReview(checkId, reviewerId, reviewerEmail, 'COMPLIANCE')

// Complete review
await completeReview({
  checkId,
  decision: 'APPROVE', // or DENY_PERMANENTLY, DENY_THIS_TIME, ESCALATE
  notes: 'Reviewed documentation, donor is eligible',
  reviewerId,
  reviewerEmail,
}, 'COMPLIANCE')
```

## Split Payment Detection

The engine detects attempts to bypass cumulative caps through:

### 1. Email Normalization
```typescript
// All normalized to same identifier:
'test@example.com'
'test+tag@example.com'      → 'test@example.com'
'test.user@gmail.com'       → 'testuser@gmail.com'
't.e.s.t+tag@gmail.com'     → 'test@gmail.com'
```

### 2. Payment Method Fingerprint
Stripe example: Same card generates same fingerprint
```typescript
// Same card used with different emails detected
attempt1: { email: 'first@example.com', cardFp: 'fp_abc123' }
attempt2: { email: 'second@example.com', cardFp: 'fp_abc123' }
// → Detected as same donor
```

### 3. Device Fingerprint (Optional)
Client-side signals (canvas, WebGL, screen, etc.)
```typescript
// Same device with different emails/cards
attempt1: { email: 'first@example.com', deviceFp: 'dev_xyz789' }
attempt2: { email: 'second@example.com', deviceFp: 'dev_xyz789' }
// → Flagged for review
```

### Donor Fingerprint
Combines all signals into single hash:
```typescript
fingerprint = SHA256(emailNormalized :: paymentMethodFp :: deviceFp)
```

Cumulative total calculated across all attempts with matching:
- Email normalized
- OR donor fingerprint
- OR payment method fingerprint

## Audit Trail

Every action is logged in `AuditLog`:

### Logged Actions
- `COMPLIANCE_RULE_CREATED`
- `COMPLIANCE_RULE_SUBMITTED`
- `COMPLIANCE_RULE_FIRST_APPROVED`
- `COMPLIANCE_RULE_SECOND_APPROVED`
- `COMPLIANCE_RULE_REJECTED`
- `COMPLIANCE_RULE_ACTIVATED`
- `COMPLIANCE_REVIEW_ASSIGNED`
- `COMPLIANCE_REVIEW_COMPLETED`
- `COMPLIANCE_REVIEW_ESCALATED`

### Log Fields
- `action`: What happened
- `entityType`/`entityId`: What was changed
- `changes`: JSON of old→new values
- `userId`/`userEmail`: Who did it
- `ipAddress`: Where from
- `reason`: Why (for rejections, escalations)
- `createdAt`: When

### Querying Audit Trail
```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    entityType: 'ComplianceRule',
    entityId: ruleId,
  },
  orderBy: { createdAt: 'desc' },
})
```

## Test Console

Admin interface at `/admin/compliance/test-console`

### Features
- Simulate donation attempts
- Test against active rules
- See which rules would trigger
- Preset test scenarios:
  - Valid contribution
  - Amount too low/high
  - Corporate card
  - Sanctioned country
  - Country mismatch
  - Sanctions match

### Test Patterns
Stub sanctions provider recognizes test patterns:
- Name includes `SANCTIONS_MATCH` → MATCH result
- Name includes `SANCTIONS_POTENTIAL` → POTENTIAL_MATCH result
- Name includes `SANCTIONS_ERROR` → ERROR result

## Manual Review Queue

### Workflow States
1. **PENDING**: Flagged by engine, awaiting assignment
2. **IN_REVIEW**: Assigned to reviewer
3. **RESOLVED**: Review complete

### Review Decisions
- **APPROVE**: Allow the contribution to proceed
- **DENY_THIS_TIME**: Deny but allow future attempts
- **DENY_PERMANENTLY**: Block donor permanently
- **ESCALATE**: Send to legal/compliance officer

### Reviewer Actions
```typescript
// View donor history
const history = await getDonorHistory(emailNormalized)
// - All previous attempts
// - Total contributed
// - Patterns across attempts

// Complete review
await completeReview({
  checkId,
  decision: 'DENY_PERMANENTLY',
  notes: 'Suspicious pattern detected across 5 attempts with different emails',
  reviewerId,
  reviewerEmail,
}, 'COMPLIANCE')
```

## Default Rules (Seed Data)

Seed creates 7 rules in DRAFT state:

1. **Transaction Amount Limits**: $5-$10
2. **Per-Donor Cumulative Cap**: $10 total
3. **Country Restrictions**: Deny KP, IR, SY, CU
4. **Required Eligibility Attestations**: Age, legal, foreign agent
5. **Sanctions List Screening**: Enabled (stub provider)
6. **Prohibited Payment Sources**: Block corporate/prepaid, flag mismatches
7. **Pre-Campaign Block**: Disabled by default

All require dual approval before activation.

## Testing

### Unit Tests
Location: `tests/unit/compliance/engine.test.ts`

Covers:
- Amount limits (min, max)
- Cumulative caps
- Split payment detection (email normalization, card fingerprint)
- Country restrictions
- Eligibility attestations
- Prohibited sources
- Sanctions screening
- Donor blocklist

### Integration Tests
Test dual approval workflow:
- Rule creation
- Submit → First approval → Second approval → Activation
- Rejection flow
- Audit logging

### E2E Tests
Test console in browser:
- Load preset scenarios
- Verify results displayed
- Check reason codes

## API Endpoints

### POST /api/compliance/test
Simulates compliance check (test console).

**Body:**
```json
{
  "donorEmail": "test@example.com",
  "donorFirstName": "Test",
  "donorLastName": "Donor",
  "declaredCountry": "US",
  "amountCents": 700,
  "cardType": "credit",
  "cardCountry": "US"
}
```

**Response:**
```json
{
  "result": "ALLOW",
  "reasons": [],
  "reasonDetails": {},
  "checkId": "clxxx...",
  "requiresReview": false
}
```

## Role Requirements

### COMPLIANCE Role
Can:
- Create rules (DRAFT)
- Submit rules for approval
- Approve rules (if not creator or first approver)
- Activate approved rules
- Assign manual reviews
- Complete reviews
- Escalate reviews
- View all checks and audit logs

Cannot:
- Approve own rules
- Bypass dual approval
- Delete audit logs

### OWNER Role
Same permissions as COMPLIANCE (for system administration).

## Security Considerations

### Data Privacy
- Email addresses normalized but original preserved
- IP addresses stored for fraud detection
- Card data never stored (only fingerprints)
- Payment method details from provider only

### PCI Compliance
- Never touch actual card numbers
- Only store BIN (first 6 digits) and provider fingerprint
- All card handling via provider-hosted fields

### GDPR Considerations
- Right to deletion: Anonymize checks
- Data retention: Document in privacy policy
- Cross-border transfers: Note if IP geolocation used

## Future Enhancements

### Not Implemented
1. **Real IP geolocation** - Stub returns null
2. **Real BIN database** - Stub returns 'unknown'
3. **Production sanctions providers** - Only stub implemented
4. **Device fingerprinting** - Client-side collection not built
5. **Machine learning** - Fraud pattern detection

### Integration Points
- Stripe card fingerprints
- MaxMind/IPinfo for IP geolocation
- Chainalysis/Dow Jones for sanctions
- FingerprintJS for device signals

## Deployment Checklist

Before going live:

1. ☐ Activate all required rules (dual approval)
2. ☐ Configure legal basis references
3. ☐ Review and update attestation text
4. ☐ Set correct date ranges (fundraising period, pre-campaign)
5. ☐ Configure sanctions provider (or keep stub)
6. ☐ Test console with real scenarios
7. ☐ Train COMPLIANCE staff on manual review
8. ☐ Document escalation procedures
9. ☐ Set up monitoring/alerts for review queue
10. ☐ Legal counsel final review

## Files Created

### Core Engine
- `src/lib/compliance/engine.ts` - Main compliance checking
- `src/lib/compliance/utils.ts` - Email normalization, formatting
- `src/lib/compliance/fingerprint.ts` - Donor fingerprinting
- `src/lib/compliance/sanctions.ts` - Sanctions screening
- `src/lib/compliance/rules-management.ts` - Rule CRUD with dual approval
- `src/lib/compliance/manual-review.ts` - Review queue management

### UI Components
- `src/app/admin/compliance/test-console/page.tsx` - Test console page
- `src/components/compliance/TestConsoleClient.tsx` - Test console UI

### API
- `src/app/api/compliance/test/route.ts` - Test endpoint

### Database
- `prisma/schema.prisma` - Extended with compliance models
- `prisma/seed-compliance.ts` - Default rules and attestations

### Tests
- `tests/unit/compliance/engine.test.ts` - Comprehensive unit tests

### Documentation
- `COMPLIANCE_ENGINE.md` - This file

---

**CRITICAL REMINDER**: All legal rules are database-driven. Never hard-code compliance logic in application code.
