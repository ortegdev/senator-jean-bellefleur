# Launch Gate System Documentation

## Overview

The Launch Gate is a safety control system that governs what the site may do at any given time. It prevents donations from being collected before legal, compliance, and operational readiness is achieved.

## Modes

The system operates in one of three modes, stored in the database and changeable only by users with OWNER role:

### INFO_ONLY (Default)
- **Safest mode**
- No payments accepted
- No data collection (email/WhatsApp)
- Content is read-only
- Use when: Not ready for any user engagement beyond information

### WAITLIST
- Email/WhatsApp signup enabled (with consent)
- No payments accepted
- Collects interested supporters for launch notification
- Use when: Ready to build interest but not accept money

### DONATIONS_LIVE
- Full functionality enabled
- Payments accepted
- All features available
- **Requires**: Complete readiness checklist
- **Requires**: Verified candidacy status (not UNVERIFIED)
- Use when: Fully ready and legally compliant

## Launch Readiness Checklist

DONATIONS_LIVE mode **cannot** be activated until all required checklist items are complete.

### Categories and Requirements

#### LEGAL_HAITI
1. **Haitian Counsel Written Opinion** (Required)
   - Controlling decree articles
   - Permitted donors
   - Contribution limits
   - Reporting requirements
   - Penalties

2. **Pre-Campaign Fundraising Confirmation** (Required)
   - Written confirmation that public fundraising is permitted before official campaign start date
   - OR documented plan to hold donations until campaign start

#### LEGAL_US
3. **US FARA/Election Counsel Opinion** (Required)
   - Foreign Agents Registration Act compliance
   - US election law compliance

#### ENTITY_TAX
4. **Entity and Tax Classification** (Required)
   - Entity formation documents
   - Tax classification confirmation

#### FINANCIAL
5. **Money Transmission Review** (Required)
   - Money transmission requirements analysis
   - State licensing review (if applicable)

6. **Sanctions Screening Procedure** (Required)
   - Documented procedure for screening donations
   - OFAC and international sanctions lists

7. **Payment Processor Approval** (Required)
   - Written approval for political fundraising
   - Terms of service compliance confirmation

8. **Recipient Account Verified** (Required)
   - Account setup and accessible
   - Test transaction successful

#### COMPLIANCE
9. **Donor Disclosures Approved** (Required)
   - Disclosure forms reviewed by counsel
   - Legally compliant for Haiti and US

10. **Privacy Notice Approved** (Required)
    - Privacy policy reviewed by counsel
    - GDPR considerations for EU donors

11. **Refund Policy Approved** (Required)
    - Refund policy reviewed by counsel
    - Clear and legally compliant

12. **Candidacy Status Verified** (Required)
    - Status must NOT be UNVERIFIED
    - Evidence document attached
    - Verified by named individual

#### TECHNICAL
13. **Operational Test Passed** (Required)
    - End-to-end test in test mode
    - Payment flow validated
    - Receipts generate correctly

### Checklist Item Fields

Each checklist item tracks:
- **Checked**: Boolean completion status
- **Checked By**: Name of person who verified
- **Checked At**: Timestamp
- **Document Reference**: Document ID or name
- **Document URL**: Link to uploaded evidence
- **Notes**: Additional context

### Updating Checklist

- Only OWNER role can update checklist items
- All updates are audit-logged with:
  - Who made the change
  - When it was made
  - What changed
  - IP address (if available)

## Kill Switch

### Purpose

Instant emergency stop that disables donations without changing the mode setting.

### Behavior

- Instantly returns functionality to WAITLIST level
- Payments return 403 Forbidden
- In-flight checkouts fail gracefully with user-friendly error
- Can be activated even if mode is DONATIONS_LIVE
- Overrides mode setting (take precedence)

### Activation

- Only OWNER role can activate/deactivate
- Requires reason (logged)
- Audit-logged with full details
- Cannot be bypassed or worked around

### Use When

- Legal issue discovered
- Compliance problem found
- Technical problem affecting payments
- Bank/processor requests stop
- Any emergency requiring immediate halt

## Server-Side Enforcement

### Payment Routes

All payment endpoints check `isDonationsLive()` before proceeding:

```typescript
// Example: /api/payments/create-intent
export async function POST(request: NextRequest) {
  const gateResponse = await enforcePaymentGate()
  if (gateResponse) {
    return gateResponse // 403 Forbidden
  }
  
  // Proceed with payment...
}
```

Returns 403 with clear message:
```json
{
  "error": "Donations are not currently available",
  "code": "DONATIONS_NOT_LIVE"
}
```

### Waitlist Routes

Waitlist signup endpoints check mode:

```typescript
export async function POST(request: NextRequest) {
  const gateResponse = await enforceWaitlistGate()
  if (gateResponse) {
    return gateResponse // 403 if INFO_ONLY
  }
  
  // Proceed with signup...
}
```

### Mode Info API

Public endpoint `/api/launch/mode` returns current capabilities:

```json
{
  "mode": "WAITLIST",
  "donationsLive": false,
  "waitlistAvailable": true
}
```

Client uses this to show/hide features.

## Affiliation Status

Controlled in CandidateConfig table:

### Status Options

- **INDEPENDENT** (default): Not affiliated with campaign
- **AUTHORIZED**: Campaign has authorized this effort
- **COORDINATED**: Coordinating with campaign

### Fields

- `affiliationStatus`: Enum value
- `affiliationText`: The text shown to users
- `affiliationAgreementRef`: Document reference (if AUTHORIZED)
- `affiliationAgreementDate`: Date of authorization (if AUTHORIZED)

### Display

All affiliation copy reads from config. The AffiliationBadge component automatically displays the configured text and status.

## Candidacy Status

Controlled in CandidateConfig table:

### Status Options

- **UNVERIFIED** (default): Not yet verified
- **REGISTERED_PRELIMINARY**: On preliminary candidate list
- **ON_FINAL_LIST**: Confirmed on final ballot
- **NOT_ON_FINAL_LIST**: Not on final ballot

### Fields

- `candidacyStatus`: Enum value
- `candidacyStatusSource`: Source of verification
- `candidacyStatusDate`: When verified
- `candidacyStatusVerifier`: Who verified
- `candidacyEvidenceUrl`: Document upload URL

### Rules

- Public wording switches based on status
- Cannot say candidate "is running" unless status is REGISTERED_PRELIMINARY or better
- DONATIONS_LIVE requires status != UNVERIFIED
- Evidence document required for verification

## Admin Interface

### Launch Control Page

Route: `/admin/launch-control`

Displays:
- Current mode with badge
- Kill switch status (if active)
- Campaign calendar with days remaining
- Candidacy status
- Affiliation status
- Complete checklist with progress
- Validation status for DONATIONS_LIVE
- Recent audit log (last 10 entries)

### Permissions

- Read-only view for all authenticated users
- Interactive controls (mode change, checklist, kill switch) for OWNER only
- All actions require authentication

## Audit Logging

All launch gate operations are logged:

### Logged Actions

- `LAUNCH_MODE_CHANGED`: Mode transitions
- `KILL_SWITCH_ACTIVATED`: Kill switch engaged
- `KILL_SWITCH_DEACTIVATED`: Kill switch disengaged
- `CHECKLIST_ITEM_UPDATED`: Checklist changes
- `CANDIDACY_STATUS_UPDATED`: Status changes
- `AFFILIATION_STATUS_UPDATED`: Affiliation changes

### Log Fields

- `action`: What happened
- `entityType`: What was changed
- `entityId`: Specific record
- `changes`: Old and new values (JSON)
- `userId`: Who did it
- `userEmail`: Email for audit trail
- `ipAddress`: Where from (if available)
- `reason`: Why (required for major changes)
- `createdAt`: When

### Retention

- Audit logs kept indefinitely
- Indexed for fast queries
- Exportable for compliance reporting

## Testing

### Required Tests

1. **Mode Enforcement**
   - Payment routes return 403 in INFO_ONLY ✅
   - Payment routes return 403 in WAITLIST ✅
   - Payment routes return 403 after kill switch ✅
   - Payment routes allow in DONATIONS_LIVE (with checklist complete) ✅

2. **Validation**
   - DONATIONS_LIVE refuses activation with UNVERIFIED candidacy ✅
   - DONATIONS_LIVE refuses activation with incomplete checklist ✅
   - DONATIONS_LIVE allows activation when all requirements met ✅

3. **Kill Switch**
   - Immediately disables payments ✅
   - Cannot be bypassed ✅
   - Audit logged ✅

4. **Permissions**
   - Only OWNER can change mode ✅
   - Only OWNER can update checklist ✅
   - Only OWNER can activate kill switch ✅

### Test Files

- `tests/integration/launch-gate.test.ts`: Core functionality
- `tests/integration/payment-routes.test.ts`: Route protection

## Common Workflows

### 1. Initial Setup → INFO_ONLY

```
1. Site deployed
2. Mode: INFO_ONLY (default)
3. No checklist items complete
4. Candidacy: UNVERIFIED
5. Result: Safe, read-only site
```

### 2. Building Interest → WAITLIST

```
1. OWNER logs in to /admin/launch-control
2. Reviews checklist (not required for WAITLIST)
3. Changes mode to WAITLIST with reason
4. Result: Email/WhatsApp signup enabled
```

### 3. Launch Donations → DONATIONS_LIVE

```
1. Complete ALL required checklist items
2. Upload candidacy evidence
3. Update candidacy status to REGISTERED_PRELIMINARY or better
4. Run operational test
5. OWNER changes mode to DONATIONS_LIVE
6. System validates checklist
7. If valid: Mode changes, payments enabled
8. If invalid: Error with specific missing items
```

### 4. Emergency Stop → Kill Switch

```
1. Problem discovered
2. OWNER activates kill switch with reason
3. Donations immediately disabled (403 on all payment routes)
4. In-flight checkouts fail gracefully
5. Mode stays DONATIONS_LIVE (for record)
6. After problem resolved: OWNER deactivates kill switch
7. Donations resume
```

## Security Considerations

### Server-Side Only

- All enforcement happens server-side
- Client cannot bypass checks
- API routes validate every request
- No client-side mode detection for security decisions

### Audit Trail

- Complete history of all changes
- Cannot be deleted or modified
- Includes IP addresses and timestamps
- Exportable for legal/compliance review

### Role-Based Access

- Clear separation: OWNER, ADMIN, VIEWER
- Principle of least privilege
- All role checks at database level
- Cannot be spoofed from client

## Documentation for Stakeholders

### For Legal Counsel

The Launch Gate ensures no donations are collected before:
- All legal opinions are in place and documented
- Candidacy status is verified with evidence
- All required disclosures and policies are approved
- You have explicitly checked off your review items

### For Finance/Compliance

The system enforces:
- All money transmission requirements reviewed
- Payment processor approval obtained
- Sanctions screening procedure documented
- Refund policy in place
- All checklist items with document references

### For Technical Team

The gate provides:
- Server-side enforcement (cannot be bypassed)
- Kill switch for emergency stops
- Audit logging for all changes
- Type-safe mode checks
- Comprehensive test coverage

---

**Bottom Line**: The Launch Gate is a multi-layered safety system that ensures no donations are collected before the site is legally, operationally, and technically ready. The kill switch provides instant emergency stop. All changes are audit-logged with attribution and reason.
