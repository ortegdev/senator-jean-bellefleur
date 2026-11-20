# Data Flow Diagram: Privacy & Data Protection

## Overview

This document maps the flow of personally identifiable information (PII) through the Diaspora4Bellefleur platform, detailing encryption points, storage locations, access controls, and data protection measures.

## Key Principles

1. **Data Minimization**: Collect only what's necessary
2. **Encryption at Rest**: All PII is encrypted in database
3. **Encryption in Transit**: HTTPS for all communications
4. **Access Control**: RBAC with audit logging
5. **PII Scrubbing**: Logs and analytics are PII-free
6. **Consent-Based**: Explicit consent for marketing communications
7. **Right to Erasure**: Self-service deletion requests

---

## Data Collection Points

### 1. Contribution Form (Public)

**Collected Data:**
- Name (required)
- Email (required)
- Country (required, for compliance)
- Payment method details (via Stripe, not stored)
- IP address (for fraud prevention)
- User agent (for fraud prevention)

**Purpose:** Process financial contribution

**Legal Basis:** Contract (necessary to complete transaction)

**Encryption:** Yes, immediately upon submission

**Flow:**
```
User Form Input
    ↓
Client-side validation
    ↓
HTTPS POST to /api/contribute
    ↓
Server-side validation
    ↓
Encrypt name & email (AES-256-GCM)
    ↓
Create blind indexes (HMAC-SHA256)
    ↓
Store in Contribution & Donor tables
    ↓
Payment processed via Stripe
    ↓
Receipt generated & emailed
```

### 2. Newsletter/Waitlist Signup (Public)

**Collected Data:**
- Email (required)
- Name (optional)
- Locale preference

**Purpose:** Send updates about candidacy

**Legal Basis:** Explicit consent (GDPR Art. 6(1)(a))

**Encryption:** Yes

**Flow:**
```
User signup form
    ↓
HTTPS POST to /api/newsletter/subscribe
    ↓
Encrypt email
    ↓
Create blind index
    ↓
Send double opt-in email
    ↓
User clicks confirmation link
    ↓
Consent recorded with timestamp & IP
    ↓
Store in Donor & Consent tables
```

### 3. "My Support" Access (Passwordless)

**Collected Data:**
- Email (to send magic link)
- IP address (session security)
- User agent (session security)

**Purpose:** Provide donor self-service portal

**Legal Basis:** Legitimate interest (access to own data)

**Encryption:** Session tokens only (no PII stored in session)

**Flow:**
```
User enters email
    ↓
HTTPS POST to /api/my-support/request-access
    ↓
Search donor by email blind index
    ↓
Generate magic link token (32-byte random)
    ↓
Store session with 30-min expiry
    ↓
Send magic link email
    ↓
User clicks link
    ↓
Token validated
    ↓
Session cookie set (secure, httpOnly, sameSite)
    ↓
Access granted to My Support page
```

### 4. Data Subject Requests (Self-Service)

**Collected Data:**
- Email (to send verification link)
- Request type (access, erasure, etc.)
- IP address (audit trail)

**Purpose:** Fulfill GDPR/CCPA data subject rights

**Legal Basis:** Legal obligation (GDPR Art. 15-20)

**Flow:**
```
User submits request
    ↓
HTTPS POST to /api/data-subject-request
    ↓
Create request with PENDING status
    ↓
Send verification email
    ↓
User clicks verification link
    ↓
Request status → IN_PROGRESS
    ↓
Admin processes request
    ↓
Data exported or anonymized
    ↓
User notified via email
```

---

## Data Storage

### Encrypted Fields (Database)

**Table: Donor**

| Field | Encryption | Searchable | Purpose |
|-------|------------|------------|---------|
| `encryptedName` | AES-256-GCM | Via blind index | Donor identification |
| `encryptedEmail` | AES-256-GCM | Via blind index | Communications |
| `emailBlindIndex` | HMAC-SHA256 | Yes (unique index) | Email lookup |
| `nameBlindIndex` | HMAC-SHA256 | Yes (index) | Name lookup |
| `country` | None | Yes | Compliance checks |
| `locale` | None | Yes | Language preference |
| `ipAddress` | None | No | Fraud prevention |

**Encryption Keys (Environment Variables):**
```
DONOR_NAME_ENCRYPTION_KEY=<32-byte hex>    # Separate key for names
DONOR_EMAIL_ENCRYPTION_KEY=<32-byte hex>   # Separate key for emails
BLIND_INDEX_KEY=<32-byte hex>              # Key for blind indexes
```

**Key Storage:**
- Development: `.env.local` (NOT committed to git)
- Staging/Production: Secret management service (AWS Secrets Manager, Vercel Env Vars, etc.)
- Rotation: Manual process, requires re-encryption of all donor data

### Non-Encrypted Fields (Database)

**Table: Contribution**

| Field | Storage | Retention | Purpose |
|-------|---------|-----------|---------|
| `amountCents` | Plaintext | 7 years | Financial record |
| `currency` | Plaintext | 7 years | Financial record |
| `status` | Plaintext | 7 years | Transaction state |
| `paymentMethod` | Plaintext | 7 years | Payment type (Card/Bank) |
| `last4` | Plaintext | 7 years | Card identifier (safe) |
| `donorId` | Foreign key | 7 years | Links to encrypted donor |

**Rationale:** Financial amounts and metadata are not PII. Last 4 digits of card are safe to store unencrypted (PCI-DSS compliant).

---

## Data Access Controls

### Role-Based Access (RBAC)

| Role | Can View Donor PII | Can Export Data | Can Delete Data | Can Set Legal Hold |
|------|-------------------|-----------------|-----------------|-------------------|
| OWNER | Yes | Yes | Yes | Yes |
| ADMIN | Yes | Yes | No | No |
| COMPLIANCE | Yes | Yes | Yes | Yes |
| VIEWER | No | No | No | No |
| PUBLIC | No | No | No | No |

### Audit Logging

All PII access is logged to `PrivacyAuditLog`:

```prisma
model PrivacyAuditLog {
  action: 'DATA_ACCESSED' | 'DATA_EXPORTED' | 'DATA_DELETED' | ...
  entityType: 'Donor' | 'Contribution' | ...
  entityId: string
  actorId: string
  actorType: 'USER' | 'SYSTEM' | 'ADMIN'
  ipAddress: string (scrubbed in production logs)
  timestamp: DateTime
}
```

**Retention:** Audit logs retained for 7 years (legal requirement).

---

## Data in Transit

### HTTPS Everywhere

- All API endpoints enforce HTTPS
- HTTP → HTTPS redirect at edge (Vercel/Cloudflare)
- TLS 1.3 minimum
- HSTS header with `max-age=31536000; includeSubDomains; preload`

### Email Communications

- Transactional emails via SendGrid/Postmark/AWS SES
- TLS encryption in transit
- DKIM/SPF/DMARC configured
- No tracking pixels or third-party scripts

### Payment Processing

- Stripe handles all credit card data (PCI-DSS Level 1)
- Card data NEVER touches our servers
- Stripe Elements (tokenization in browser)
- Webhooks verify signatures (HMAC-SHA256)

---

## Data Scrubbing (Logs & Analytics)

### Scrubbed Locations

1. **Application Logs (console, files)**
   - All `console.log()` calls go through `safeLogger`
   - PII patterns replaced: `[EMAIL_REDACTED]`, `[NAME_REDACTED]`, etc.
   - Sensitive field names replaced: `{ email: '[REDACTED]' }`

2. **Error Tracking (Sentry, etc.)**
   - `scrubErrorForTracking()` removes PII from error messages
   - `createSafeErrorContext()` scrubs context objects
   - Stack traces scrubbed

3. **Analytics (if used)**
   - No PII sent to analytics services
   - Events use anonymized IDs only
   - IP addresses not collected
   - User-agent not sent

4. **Database Query Logs**
   - Encrypted values not decrypted in logs
   - Blind index hashes logged (non-reversible)

### PII Patterns Detected

- Email addresses (regex)
- Credit card numbers (various formats)
- Phone numbers (international)
- IP addresses (IPv4/IPv6)
- Postal codes
- Street addresses
- Names (with labels: "Name: John Doe")

### Testing

```typescript
// Unit test ensures PII never in logs
it('scrubs email from log output', () => {
  const consoleLogSpy = vi.spyOn(console, 'log')
  safeLogger.log('User test@example.com submitted')
  
  expect(consoleLogSpy).not.toHaveBeenCalledWith(
    expect.stringContaining('test@example.com')
  )
  expect(consoleLogSpy).toHaveBeenCalledWith(
    expect.stringContaining('[EMAIL_REDACTED]')
  )
})
```

---

## Data Retention & Deletion

### Retention Policies

| Entity | Retention Period | Anonymizable | Deletable | Legal Basis |
|--------|-----------------|--------------|-----------|-------------|
| Contribution | 7 years | Yes | No | Haiti election law |
| Receipt | 7 years | Yes | No | Financial record |
| Consent | 7 years | No | No | Proof of consent |
| Donor | 7 years | Yes | No* | Linked to contribution |
| Newsletter Subscriber | 1 year after unsubscribe | Yes | Yes | Marketing consent |

*Deletable only after all linked contributions pass retention period

### Anonymization Process

When retention period expires and no legal hold:

1. **Donor table:**
   - `encryptedName` → `"ANONYMIZED-{timestamp}-{random}"`
   - `encryptedEmail` → `"anonymized-{id}@redacted.local"`
   - `emailBlindIndex` → `"ANON-{id}"`
   - `nameBlindIndex` → `"ANON-{id}"`
   - `isAnonymous` → `true`
   - `anonymizedAt` → `NOW()`

2. **Contribution table:** Unchanged (financial record preserved)

3. **Receipt table:** Unchanged (financial record preserved)

4. **Consent table:** Unchanged (legal proof preserved)

**Result:** Donor identity erased, but financial audit trail intact.

### Legal Holds

Prevents deletion/anonymization during:
- Active investigation
- Pending litigation
- Regulatory audit
- Chargeback dispute

**Fields:**
- `legalHold: boolean`
- `legalHoldReason: string`
- `legalHoldSetBy: string`
- `legalHoldSetAt: DateTime`

---

## Consent Management

### Unbundled Opt-Ins

Three separate consents (not bundled):

1. **EMAIL** - Email communications
2. **WHATSAPP** - WhatsApp messages
3. **PUBLIC_RECOGNITION** - Public display of name

**Default:** All `DENIED` (opt-in only)

**Essential consent:** Auto-granted for transaction processing (legal basis: contract)

### Double Opt-In Flow (Email)

```
1. User checks "Email updates" checkbox
2. Consent record created with status PENDING
3. Confirmation email sent
4. User clicks confirmation link
5. Consent status → GRANTED
6. Timestamp & IP recorded
```

### Withdrawal (GDPR Right)

```
User clicks "Unsubscribe" in email
    ↓
Link contains unsubscribe token
    ↓
HTTPS GET to /api/consent/withdraw?token=...
    ↓
Consent status → WITHDRAWN
    ↓
withdrawnAt timestamp recorded
    ↓
Confirmation page shown
```

### Region-Specific Rules

| Region | Explicit Consent Required | Double Opt-In Required | Implied Consent Allowed |
|--------|--------------------------|----------------------|------------------------|
| EU (GDPR) | Yes | Yes | No |
| Canada (CASL) | Yes | Yes | Yes (existing relationship) |
| California (CCPA) | No (opt-out model) | No | Yes |
| France | Yes | Yes | No |

---

## Data Subject Rights

### Self-Service Requests

**Supported Rights:**
1. **Access (GDPR Art. 15)** - Export all data
2. **Erasure (GDPR Art. 17)** - Request deletion
3. **Rectification (GDPR Art. 16)** - Correct errors (via support)
4. **Portability (GDPR Art. 20)** - Machine-readable export
5. **Object (GDPR Art. 21)** - Opt-out of processing

**Flow:**
```
User submits request via My Support page
    ↓
Verification email sent
    ↓
User clicks verification link (7-day expiry)
    ↓
Request verified
    ↓
Status: PENDING → IN_PROGRESS
    ↓
Admin processes (or auto-processed for simple requests)
    ↓
Data exported or anonymized
    ↓
User notified
    ↓
Status: IN_PROGRESS → COMPLETED
```

### Response Times (SLA)

- **Access:** 30 days (GDPR requirement)
- **Erasure:** 30 days (GDPR requirement)
- **Auto-processing:** Access requests auto-processed within 24 hours

---

## Consent Banner (Region-Aware)

### EU/GDPR Visitors

**Banner shows:**
- Explanation of cookies/tracking
- "Essential" cookies pre-selected (grayed out, cannot disable)
- "Marketing" cookies opt-in checkbox
- "Accept All" and "Save Preferences" buttons
- Link to Privacy Policy

**Before consent:**
- No non-essential scripts loaded
- No analytics
- No third-party cookies

### California/CCPA Visitors

**Banner shows:**
- "Do Not Sell My Personal Information" link
- Simplified opt-out model

### Detection Method

1. Geolocation by IP (server-side)
2. Fallback: Conservative (assume GDPR)
3. User can manually select region

---

## Data Mapping Summary

### PII Collected

| Data Type | Purpose | Legal Basis | Retention | Encrypted |
|-----------|---------|-------------|-----------|-----------|
| Name | Donor identification | Contract | 7 years | Yes |
| Email | Communications, receipt | Contract | 7 years | Yes |
| Country | Compliance verification | Legal obligation | 7 years | No |
| IP Address | Fraud prevention | Legitimate interest | 90 days | No |
| Payment Method | Financial record | Legal obligation | 7 years | No (Stripe) |
| Consent Records | Proof of consent | Legal obligation | 7 years | No |

### Non-PII Collected

| Data Type | Purpose | Retention |
|-----------|---------|-----------|
| Contribution Amount | Financial record | 7 years |
| Currency | Financial record | 7 years |
| Receipt Number | Financial record | 7 years |
| Refund Status | Financial record | 7 years |

---

## Security Measures

### Encryption

- **At Rest:** AES-256-GCM (authenticated encryption)
- **In Transit:** TLS 1.3
- **Keys:** Stored in secure secret management, never in code/repo

### Access Control

- **Admin panel:** Password + 2FA required
- **API:** JWT tokens with short expiry
- **Sessions:** Secure, httpOnly, sameSite cookies

### Audit Logging

- All PII access logged
- Logs retained 7 years
- Immutable (append-only)

### Penetration Testing

- Annual third-party pen test required before launch
- Findings remediated before production deployment

---

## Compliance Checklist

### GDPR (EU)

- [x] Explicit consent for marketing
- [x] Granular opt-ins (not bundled)
- [x] Double opt-in for email
- [x] Right to access (self-service)
- [x] Right to erasure (self-service)
- [x] Right to portability (JSON export)
- [x] Right to rectification (via support)
- [x] Right to object (opt-out)
- [x] Data processing agreement with processors (Stripe, email provider)
- [x] Privacy policy published
- [x] Cookie consent banner (EU visitors)
- [x] Data breach notification plan (72-hour requirement)

### CCPA/CPRA (California)

- [x] Privacy policy discloses data collection
- [x] "Do Not Sell" opt-out available
- [x] Right to know (data export)
- [x] Right to deletion
- [x] Right to correct inaccurate data
- [x] Right to limit use of sensitive personal information

### CASL (Canada)

- [x] Explicit consent for commercial emails
- [x] Double opt-in
- [x] Clear unsubscribe mechanism (one-click)
- [x] Sender identification in every email
- [x] Consent records retained 3+ years

### PIPEDA (Canada)

- [x] Consent for collection, use, disclosure
- [x] Data minimization
- [x] Access to own data
- [x] Correction of errors
- [x] Security safeguards

---

## Testing & Verification

### Automated Tests

1. **PII Scrubbing:** `tests/integration/privacy/pii-scrubbing.test.ts`
   - Emails redacted in logs ✅
   - Sensitive fields redacted ✅
   - No PII in error tracking ✅

2. **Blind Index Search:** `tests/integration/privacy/blind-index.test.ts`
   - Encrypted data not plaintext ✅
   - Search works via blind index ✅
   - Case-insensitive search works ✅
   - Gmail dot normalization works ✅

3. **Legal Holds:** Same test file
   - Legal hold prevents deletion ✅
   - Deletion allowed after release ✅

### Manual Verification

- [ ] Inspect database: No plaintext PII visible
- [ ] Review logs: No email/name patterns found
- [ ] Test My Support: Magic link works, session secure
- [ ] Test data export: Complete, machine-readable
- [ ] Test deletion: Anonymizes correctly, honors legal hold

---

## Incident Response Plan

### Data Breach Protocol

1. **Detection:** Unauthorized access to donor PII
2. **Containment:** Disable affected systems, rotate keys
3. **Assessment:** Determine scope (# of records, PII types)
4. **Notification:** 
   - GDPR: Notify supervisory authority within 72 hours
   - CCPA: Notify California AG if >500 CA residents
   - Affected donors: Email notification
5. **Remediation:** Patch vulnerability, enhance monitoring
6. **Documentation:** Full incident report for regulators

### Key Rotation Procedure

1. Generate new encryption keys
2. Read all Donor records
3. Decrypt with old keys
4. Re-encrypt with new keys
5. Update blind indexes
6. Deploy new keys to production
7. Verify: Search still works
8. Archive old keys (encrypted, for historical data)

---

## Future Enhancements

1. **Hardware Security Modules (HSM):** Store encryption keys in HSM for enhanced security
2. **Homomorphic Encryption:** Allow searches on encrypted data without decryption
3. **Blockchain Audit Trail:** Immutable consent record log
4. **Privacy-Preserving Analytics:** Differential privacy techniques
5. **Automated Key Rotation:** Scheduled re-encryption every 12 months

---

## References

- [GDPR Full Text](https://gdpr-info.eu/)
- [CCPA/CPRA (California)](https://oag.ca.gov/privacy/ccpa)
- [CASL (Canada)](https://crtc.gc.ca/eng/com500/faq500.htm)
- [PIPEDA (Canada)](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Document Version:** 1.0  
**Last Updated:** 2026-11-18  
**Reviewed By:** [To be completed by legal counsel]
