# Data Map: PII Field Documentation

## Purpose

This document maps every field containing personally identifiable information (PII), documenting its purpose, legal basis, retention period, encryption status, and access controls.

**Last Updated:** 2026-11-18  
**Version:** 1.0

---

## PII Fields

### Donor.encryptedName

| Attribute | Value |
|-----------|-------|
| **Field Type** | String (base64-encoded ciphertext) |
| **Contains** | Donor's full name (plaintext: "John Doe") |
| **Encryption** | AES-256-GCM with separate key |
| **Purpose** | Donor identification, receipt generation, public recognition (if opted-in) |
| **Legal Basis** | Contract (necessary to complete transaction) |
| **Collected When** | Contribution form submission, newsletter signup |
| **Retention Period** | 7 years after last contribution |
| **Can Anonymize** | Yes (after retention period) |
| **Can Delete** | No (linked to financial records) |
| **Access Roles** | OWNER, ADMIN, COMPLIANCE |
| **Searchable** | Yes (via nameBlindIndex) |
| **Logged** | No (always scrubbed from logs) |
| **GDPR Category** | Identification data (Art. 4(1)) |

### Donor.encryptedEmail

| Attribute | Value |
|-----------|-------|
| **Field Type** | String (base64-encoded ciphertext) |
| **Contains** | Donor's email address (plaintext: "john@example.com") |
| **Encryption** | AES-256-GCM with separate key |
| **Purpose** | Communications, receipt delivery, account verification |
| **Legal Basis** | Contract (necessary to send receipt) |
| **Collected When** | Contribution form submission, newsletter signup |
| **Retention Period** | 7 years after last contribution |
| **Can Anonymize** | Yes (after retention period) |
| **Can Delete** | No (linked to financial records) |
| **Access Roles** | OWNER, ADMIN, COMPLIANCE |
| **Searchable** | Yes (via emailBlindIndex) |
| **Logged** | No (always scrubbed from logs) |
| **GDPR Category** | Electronic identification data (Art. 4(1)) |

### Donor.emailBlindIndex

| Attribute | Value |
|-----------|-------|
| **Field Type** | String (64-char hex hash) |
| **Contains** | HMAC-SHA256 hash of normalized email |
| **Encryption** | N/A (already hashed, non-reversible) |
| **Purpose** | Enable email search without decryption |
| **Legal Basis** | Legitimate interest (security, fraud prevention) |
| **Collected When** | Automatically generated when email is encrypted |
| **Retention Period** | Same as parent Donor record (7 years) |
| **Can Anonymize** | Yes (replaced with "ANON-{id}") |
| **Can Delete** | With parent Donor record |
| **Access Roles** | OWNER, ADMIN, COMPLIANCE, SYSTEM |
| **Searchable** | Yes (indexed, unique) |
| **Logged** | Yes (non-reversible hash, safe to log) |
| **GDPR Category** | Pseudonymized identifier |

### Donor.nameBlindIndex

| Attribute | Value |
|-----------|-------|
| **Field Type** | String (64-char hex hash) |
| **Contains** | HMAC-SHA256 hash of normalized name |
| **Encryption** | N/A (already hashed, non-reversible) |
| **Purpose** | Enable name search without decryption |
| **Legal Basis** | Legitimate interest (security, fraud prevention) |
| **Collected When** | Automatically generated when name is encrypted |
| **Retention Period** | Same as parent Donor record (7 years) |
| **Can Anonymize** | Yes (replaced with "ANON-{id}") |
| **Can Delete** | With parent Donor record |
| **Access Roles** | OWNER, ADMIN, COMPLIANCE, SYSTEM |
| **Searchable** | Yes (indexed) |
| **Logged** | Yes (non-reversible hash, safe to log) |
| **GDPR Category** | Pseudonymized identifier |

### Contribution.ipAddress

| Attribute | Value |
|-----------|-------|
| **Field Type** | String (IPv4 or IPv6 address) |
| **Contains** | IP address of donor at contribution time |
| **Encryption** | No (but scrubbed from logs) |
| **Purpose** | Fraud prevention, velocity checks, geolocation |
| **Legal Basis** | Legitimate interest (fraud prevention) |
| **Collected When** | Contribution form submission |
| **Retention Period** | 90 days (then deleted or anonymized) |
| **Can Anonymize** | Yes (set to NULL or "ANONYMIZED") |
| **Can Delete** | Yes (after 90 days) |
| **Access Roles** | OWNER, ADMIN, COMPLIANCE |
| **Searchable** | Yes (for fraud analysis) |
| **Logged** | No (always scrubbed as `[IP_REDACTED]`) |
| **GDPR Category** | Online identifier (Art. 4(1)) |
| **GDPR Recital** | Recital 30 (IP addresses are personal data) |

### Consent.ipAddress

| Attribute | Value |
|-----------|-------|
| **Field Type** | String (IPv4 or IPv6 address) |
| **Contains** | IP address when consent was granted |
| **Encryption** | No (but scrubbed from logs) |
| **Purpose** | Proof of consent, audit trail |
| **Legal Basis** | Legal obligation (proof of valid consent) |
| **Collected When** | Consent granted or withdrawn |
| **Retention Period** | 7 years (proof of consent record) |
| **Can Anonymize** | No (must preserve exact consent record) |
| **Can Delete** | No (legal proof required) |
| **Access Roles** | OWNER, COMPLIANCE |
| **Searchable** | No |
| **Logged** | No (always scrubbed) |
| **GDPR Category** | Online identifier |
| **GDPR Requirement** | Art. 7(1) - controller must be able to demonstrate consent |

### Consent.userAgent

| Attribute | Value |
|-----------|-------|
| **Field Type** | Text (HTTP User-Agent string) |
| **Contains** | Browser/device information when consent given |
| **Encryption** | No (but scrubbed from logs) |
| **Purpose** | Proof of consent, audit trail, detect automation |
| **Legal Basis** | Legal obligation (proof of valid consent) |
| **Collected When** | Consent granted or withdrawn |
| **Retention Period** | 7 years (proof of consent record) |
| **Can Anonymize** | No (must preserve exact consent record) |
| **Can Delete** | No (legal proof required) |
| **Access Roles** | OWNER, COMPLIANCE |
| **Searchable** | No |
| **Logged** | No (may contain identifiable info) |
| **GDPR Category** | Device identifier (indirect PII) |

### MySupportSession.ipAddress

| Attribute | Value |
|-----------|-------|
| **Field Type** | String (IPv4 or IPv6 address) |
| **Contains** | IP address of session |
| **Encryption** | No |
| **Purpose** | Session security, detect session hijacking |
| **Legal Basis** | Legitimate interest (security) |
| **Collected When** | Magic link verification, session activity |
| **Retention Period** | Session lifetime (max 30 minutes) + 7 days |
| **Can Anonymize** | Yes (automatically on session expiry) |
| **Can Delete** | Yes (on session cleanup) |
| **Access Roles** | OWNER, SYSTEM |
| **Searchable** | No |
| **Logged** | No |
| **GDPR Category** | Online identifier |

### DataSubjectRequest.ipAddress

| Attribute | Value |
|-----------|-------|
| **Field Type** | String (IPv4 or IPv6 address) |
| **Contains** | IP address when data subject request submitted |
| **Encryption** | No |
| **Purpose** | Audit trail, detect abuse |
| **Legal Basis** | Legal obligation (compliance audit trail) |
| **Collected When** | Data subject request submission |
| **Retention Period** | 7 years (audit requirement) |
| **Can Anonymize** | No (audit trail must be exact) |
| **Can Delete** | No (compliance record) |
| **Access Roles** | OWNER, COMPLIANCE |
| **Searchable** | No |
| **Logged** | No |
| **GDPR Category** | Online identifier |

---

## Non-PII Fields (Documented for Completeness)

### Contribution.amountCents

| Attribute | Value |
|-----------|-------|
| **Field Type** | Integer (amount in cents) |
| **Contains** | Financial contribution amount |
| **Encryption** | No (not PII) |
| **Purpose** | Financial record, compliance reporting |
| **Legal Basis** | Legal obligation (election law record retention) |
| **Retention Period** | 7 years (Haiti election law) |
| **Can Delete** | No (financial record) |
| **GDPR Category** | Not personal data |

### Contribution.currency

| Attribute | Value |
|-----------|-------|
| **Field Type** | String (ISO 4217 code: "HTG", "USD") |
| **Contains** | Currency of contribution |
| **Encryption** | No (not PII) |
| **Purpose** | Financial record |
| **Legal Basis** | Legal obligation |
| **Retention Period** | 7 years |
| **Can Delete** | No |
| **GDPR Category** | Not personal data |

### Contribution.last4

| Attribute | Value |
|-----------|-------|
| **Field Type** | String (4 digits) |
| **Contains** | Last 4 digits of payment card |
| **Encryption** | No (safe under PCI-DSS) |
| **Purpose** | Payment identification (for refunds, disputes) |
| **Legal Basis** | Contract |
| **Retention Period** | 7 years |
| **Can Delete** | No |
| **GDPR Category** | Not personal data (truncated, non-identifiable) |
| **PCI-DSS** | Compliant (only last 4 digits stored) |

### Receipt.receiptNumber

| Attribute | Value |
|-----------|-------|
| **Field Type** | String ("REC-2026-000123") |
| **Contains** | Human-readable receipt identifier |
| **Encryption** | No (not PII) |
| **Purpose** | Financial record lookup |
| **Legal Basis** | Legal obligation |
| **Retention Period** | 7 years |
| **Can Delete** | No |
| **GDPR Category** | Not personal data |

---

## Field Purpose Categories

### Financial Record (7-year retention, cannot delete)
- Contribution.amountCents
- Contribution.currency
- Contribution.last4
- Receipt.receiptNumber
- Receipt.generatedAt

### Donor Identification (7-year retention, can anonymize)
- Donor.encryptedName
- Donor.encryptedEmail
- Donor.emailBlindIndex
- Donor.nameBlindIndex

### Fraud Prevention (90-day retention, then delete)
- Contribution.ipAddress
- FraudEvent.ipAddress
- FraudEvent.deviceFingerprint

### Consent Proof (7-year retention, cannot delete/anonymize)
- Consent.ipAddress
- Consent.userAgent
- Consent.consentText
- Consent.grantedAt
- Consent.withdrawnAt

### Session Security (30-min + 7-day retention, can delete)
- MySupportSession.ipAddress
- MySupportSession.userAgent
- MySupportSession.token

### Compliance Audit (7-year retention, cannot delete)
- DataSubjectRequest.ipAddress
- DataSubjectRequest.verificationToken
- PrivacyAuditLog.ipAddress
- PrivacyAuditLog.userAgent

---

## Encryption Key Usage

### DONOR_NAME_ENCRYPTION_KEY
- **Used For:** Donor.encryptedName
- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 (100,000 iterations, SHA-256)
- **Storage:** Environment variable (production: secret manager)
- **Rotation:** Manual, requires re-encryption of all names

### DONOR_EMAIL_ENCRYPTION_KEY
- **Used For:** Donor.encryptedEmail
- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 (100,000 iterations, SHA-256)
- **Storage:** Environment variable (production: secret manager)
- **Rotation:** Manual, requires re-encryption of all emails

### BLIND_INDEX_KEY
- **Used For:** Donor.emailBlindIndex, Donor.nameBlindIndex
- **Algorithm:** HMAC-SHA256
- **Storage:** Environment variable (production: secret manager)
- **Rotation:** Manual, requires regeneration of all blind indexes

---

## Access Control Matrix

| Role | View Encrypted PII | Decrypt PII | Export Data | Delete/Anonymize | Set Legal Hold |
|------|-------------------|-------------|-------------|------------------|----------------|
| OWNER | Yes | Yes | Yes | Yes | Yes |
| ADMIN | Yes | Yes | Yes | No | No |
| COMPLIANCE | Yes | Yes | Yes | Yes | Yes |
| VIEWER | No | No | No | No | No |
| SYSTEM | Yes (blind indexes) | No | No | No | No |

---

## Data Minimization Checklist

- [x] Collect only name, email, country (minimum for transaction)
- [x] Do not collect: phone (unless donor volunteers), address, date of birth, government ID
- [x] Payment card data handled by Stripe (never touches our servers)
- [x] IP address retained only 90 days (fraud prevention, then deleted)
- [x] User agent not logged (scrubbed from application logs)
- [x] No tracking cookies beyond essential session cookies
- [x] No analytics that collect PII
- [x] No third-party scripts that access PII

---

## Legal Basis Summary (GDPR Article 6)

| Legal Basis | Fields | Purpose |
|-------------|--------|---------|
| **Contract (Art. 6(1)(b))** | Donor.encryptedName, Donor.encryptedEmail, Contribution data | Necessary to complete financial transaction and send receipt |
| **Consent (Art. 6(1)(a))** | Marketing consent records | Email/WhatsApp communications, public recognition |
| **Legal Obligation (Art. 6(1)(c))** | Financial records, consent proof, audit logs | Election law record retention (7 years), GDPR compliance |
| **Legitimate Interest (Art. 6(1)(f))** | Contribution.ipAddress (90 days), fraud detection data | Fraud prevention, security, authentication |

---

## Data Processor Agreements

| Processor | Data Shared | Purpose | Agreement |
|-----------|-------------|---------|-----------|
| **Stripe** | Name (tokenized), email, amount, card details (tokenized) | Payment processing | Stripe Data Processing Agreement |
| **SendGrid/Postmark/AWS SES** | Email, name (in email body) | Transactional emails | DPA required before use |
| **Vercel** | All database data (at rest) | Hosting, database | Vercel DPA |
| **Sentry** (if used) | Error context (PII-scrubbed) | Error tracking | Sentry DPA, PII scrubbing enabled |

---

## Retention Schedule

| Entity | Retention Period | Trigger | Action After Retention |
|--------|-----------------|---------|------------------------|
| Contribution | 7 years | Last contribution date | Cannot delete (financial record) |
| Donor | 7 years | Last contribution date | Anonymize (if no legal hold) |
| Consent | 7 years | Last status change | Cannot delete (legal proof) |
| Receipt | 7 years | Generated date | Cannot delete (financial record) |
| IP Address (Contribution) | 90 days | Contribution date | Delete or set to NULL |
| MySupportSession | 30 minutes | Last access | Auto-delete on expiry |
| DataSubjectRequest | 7 years | Request date | Cannot delete (audit trail) |

---

## Verification Checklist

Before production launch:

- [ ] All PII fields documented in this map
- [ ] Each field has defined purpose, legal basis, retention
- [ ] Encryption keys generated and stored securely
- [ ] Access controls tested (RBAC)
- [ ] PII scrubbing verified in logs
- [ ] Blind index search tested
- [ ] Legal holds tested
- [ ] Retention cleanup job tested (dry-run)
- [ ] Data export tested (complete, machine-readable)
- [ ] Anonymization tested (irreversible, preserves financial records)
- [ ] Privacy policy reviewed by counsel
- [ ] DPAs signed with all processors

---

**Document Ownership:** Legal/Compliance Team  
**Review Frequency:** Annually or when data practices change  
**Next Review:** 2027-11-18
