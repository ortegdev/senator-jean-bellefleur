# STRIDE Threat Model - Diaspora4Bellefleur

## Overview

This document analyzes security threats to the Diaspora4Bellefleur platform using the STRIDE methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).

As a high-profile political fundraising platform, we face heightened risks from:
- Political opponents
- Foreign state actors
- Cybercriminals
- Hacktivists
- Disgruntled insiders

---

## System Architecture

```
┌─────────────┐
│   Donors    │
│  (Public)   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────┐
│    Vercel Edge Network              │
│  - CDN/Static Caching               │
│  - DDoS Protection                  │
│  - WAF (Firewall)                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│    Next.js Application              │
│  - Server Components                │
│  - API Routes                       │
│  - Server Actions                   │
└──────┬──────────────────────────────┘
       │
       ├─────────────┬─────────────┬─────────────┐
       ▼             ▼             ▼             ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│PostgreSQL │ │  Stripe   │ │  Email    │ │  Logging  │
│ Database  │ │  Payment  │ │  Service  │ │  Service  │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
```

---

## STRIDE Analysis by Component

### 1. Public Website (Donor-Facing)

#### S - Spoofing

**Threat:** Attacker creates fake domain to phish donors

**Impact:** HIGH
- Stolen donor credentials
- Fraudulent donations
- Brand damage

**Mitigations:**
- ✅ Domain registrar lock enabled
- ✅ 2FA on domain registrar account
- ✅ HTTPS with valid certificate (Let's Encrypt via Vercel)
- ✅ HSTS preload submitted
- ✅ Trademark monitoring service
- ✅ CAA DNS records restrict certificate issuance
- ✅ Brand protection monitoring
- ⚠️ **Remaining Risk:** Homograph attacks (diasp0ra4bellefleur.com)

**Additional Controls Needed:**
- Monitor typosquatting domains
- Set up alerts for similar domain registrations
- Education campaign for donors on URL verification

---

#### T - Tampering

**Threat:** Attacker modifies page content (XSS, injection)

**Impact:** CRITICAL
- Display fake donation amounts
- Redirect payments to attacker
- Inject malicious scripts

**Mitigations:**
- ✅ Strict CSP with nonces (no unsafe-inline)
- ✅ All user input sanitized
- ✅ React auto-escaping
- ✅ No dangerouslySetInnerHTML usage
- ✅ Subresource Integrity (SRI) for CDN assets
- ✅ Vercel build hash verification
- ⚠️ **Remaining Risk:** Supply chain attacks (compromised npm package)

**Additional Controls Needed:**
- npm audit in CI/CD pipeline (automated)
- Dependabot security updates
- Lock file verification
- Regular dependency updates

---

#### R - Repudiation

**Threat:** Donor denies making contribution

**Impact:** MEDIUM
- Legal disputes
- Refund fraud
- Campaign finance reporting issues

**Mitigations:**
- ✅ Tamper-evident audit log (hash-chained)
- ✅ Email confirmation sent immediately
- ✅ Receipt with transaction ID
- ✅ IP address logged (with consent)
- ✅ Browser fingerprint captured
- ✅ Email verification for donations
- ⚠️ **Remaining Risk:** Shared computer/account

**Additional Controls Needed:**
- Video confirmation for large donations ($500+)
- Two-factor confirmation option
- Dispute resolution process documented

---

#### I - Information Disclosure

**Threat:** Unauthorized access to donor PII

**Impact:** CRITICAL
- GDPR violations
- Donor privacy breach
- Campaign finance law violations
- Political targeting/harassment

**Mitigations:**
- ✅ Field-level encryption (AES-256) for PII
- ✅ Separate encryption key from database password
- ✅ TLS 1.3 in transit
- ✅ Admin PII reveal requires reason + rate limited (50/day)
- ✅ All PII access audit-logged
- ✅ Database backups encrypted
- ✅ No PII in logs (scrubbed)
- ⚠️ **Remaining Risk:** Privileged user abuse

**Additional Controls Needed:**
- Data Loss Prevention (DLP) monitoring
- Anomaly detection on PII access patterns
- Quarterly access reviews
- Just-in-time (JIT) admin access

---

#### D - Denial of Service

**Threat:** DDoS attack prevents donations

**Impact:** HIGH
- Lost revenue during campaign push
- Brand damage
- Donor frustration

**Mitigations:**
- ✅ Vercel Edge Network (global CDN)
- ✅ Static-first architecture (survives DB outage)
- ✅ Aggressive caching of public pages
- ✅ Rate limiting on API endpoints
- ✅ WAF rules (Vercel Firewall)
- ✅ Cloudflare as backup (documented)
- ⚠️ **Remaining Risk:** Layer 7 attacks (targeted endpoints)

**Additional Controls Needed:**
- CAPTCHA on donation form (Turnstile)
- Queue-based architecture for critical paths
- Auto-scaling enabled
- DDoS response playbook

---

#### E - Elevation of Privilege

**Threat:** Anonymous user gains admin access

**Impact:** CRITICAL
- Full system compromise
- Data exfiltration
- Financial fraud

**Mitigations:**
- ✅ Separate admin authentication
- ✅ MFA required for privileged roles (OWNER, COMPLIANCE, FINANCE)
- ✅ Session timeout (30 minutes for admins)
- ✅ No direct admin registration (invitation-only)
- ✅ Dual approval for privileged role changes
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ CSRF protection
- ⚠️ **Remaining Risk:** Session hijacking

**Additional Controls Needed:**
- IP-based session binding
- Anomaly detection (unusual admin actions)
- Privileged Access Management (PAM) system
- Admin session recording

---

### 2. Admin Console

#### S - Spoofing

**Threat:** Attacker impersonates admin user

**Impact:** CRITICAL
- Unauthorized access to donor data
- Configuration changes
- Fund diversion

**Mitigations:**
- ✅ MFA required for OWNER, COMPLIANCE, FINANCE roles
- ✅ Email verification on login from new device
- ✅ Failed login lockout (5 attempts → 15 min lockout)
- ✅ Session tied to IP + User-Agent
- ✅ Audit log of all admin actions
- ⚠️ **Remaining Risk:** Phishing of MFA codes

**Additional Controls Needed:**
- Hardware security keys (YubiKey)
- Geofencing for high-risk actions
- Behavioral biometrics
- Admin training on phishing

---

#### T - Tampering

**Threat:** Attacker modifies audit log or compliance rules

**Impact:** CRITICAL
- Cover tracks of fraud
- Circumvent compliance checks
- Legal violations

**Mitigations:**
- ✅ Hash-chained audit log (tamper detection)
- ✅ Sequence numbers (gap detection)
- ✅ Off-system backup (S3, immutable)
- ✅ Dual approval for compliance rule changes
- ✅ Database-level immutability (append-only ledger)
- ⚠️ **Remaining Risk:** Database admin bypass

**Additional Controls Needed:**
- Separate audit log database (write-only from app)
- Cryptographic signatures on critical records
- Regular hash chain verification (automated)
- Real-time replication to external system

---

#### R - Repudiation

**Threat:** Admin denies performing action

**Impact:** HIGH
- Accountability gap
- Internal fraud
- Compliance violations

**Mitigations:**
- ✅ Every action logged with actor ID, email, role
- ✅ IP address and user-agent logged
- ✅ Reason required for sensitive actions
- ✅ Tamper-evident audit log
- ✅ Session replay possible (actions + timestamps)
- ⚠️ **Remaining Risk:** Shared admin accounts

**Additional Controls Needed:**
- Video audit for high-risk actions ($10k+ transfers)
- Eliminate shared accounts
- Admin action requires second person witness
- Digital signatures on critical transactions

---

#### I - Information Disclosure

**Threat:** Insider exfiltrates donor data

**Impact:** CRITICAL
- Targeted donor harassment
- Competitive intelligence leak
- GDPR violations

**Mitigations:**
- ✅ PII reveal requires stated reason
- ✅ Rate limited (50 reveals per admin per day)
- ✅ All reveals audit-logged
- ✅ Export requires reason + role check
- ✅ Data exports audit-logged with record count
- ✅ No bulk export without approval
- ⚠️ **Remaining Risk:** Screen capture, photography

**Additional Controls Needed:**
- Watermarks on sensitive data views
- Screenshot detection (browser extension)
- DLP monitoring on admin devices
- Data access reviews (quarterly)
- Anomaly detection on export patterns

---

#### D - Denial of Service

**Threat:** Attacker locks out all admin accounts

**Impact:** HIGH
- Cannot respond to incidents
- Cannot process refunds
- Operations paralyzed

**Mitigations:**
- ✅ Account lockout threshold (5 failed attempts)
- ✅ Emergency "break glass" account (offline)
- ✅ Multiple admin accounts with different credentials
- ✅ Database-level admin access possible
- ⚠️ **Remaining Risk:** Simultaneous lockout of all admins

**Additional Controls Needed:**
- Break-glass procedure documented
- Offline recovery keys in secure location
- Out-of-band unlock mechanism (phone verification)
- Separate recovery admin account

---

#### E - Elevation of Privilege

**Threat:** Low-privilege admin escalates to OWNER

**Impact:** CRITICAL
- Bypass dual approval
- Access all data
- Modify compliance rules

**Mitigations:**
- ✅ RBAC enforced server-side (not client-side)
- ✅ Permission checks on every API call
- ✅ Role changes require dual approval
- ✅ Cannot change own role
- ✅ Cannot approve own actions
- ✅ All privilege changes audit-logged
- ⚠️ **Remaining Risk:** Database-level role change

**Additional Controls Needed:**
- Database-level RBAC (PostgreSQL roles)
- Separate database user per role
- Immutable role assignments (require db admin to change)
- Regular privilege audits

---

### 3. Payment Processing

#### S - Spoofing

**Threat:** Fake payment confirmation emails

**Impact:** MEDIUM
- Donor confusion
- Brand damage
- Lost trust

**Mitigations:**
- ✅ DKIM, SPF, DMARC on email domain
- ✅ Consistent email template with branding
- ✅ Receipt includes transaction ID (verifiable)
- ✅ Link to verify payment on site
- ⚠️ **Remaining Risk:** Domain spoofing (similar domain)

**Additional Controls Needed:**
- BIMI (Brand Indicators for Message Identification)
- Email authentication training for donors
- Report phishing link in emails

---

#### T - Tampering

**Threat:** Modify donation amount or recipient

**Impact:** CRITICAL
- Funds diverted to attacker
- Campaign finance violations
- Financial fraud

**Mitigations:**
- ✅ Immutable ledger (append-only)
- ✅ Webhook signature verification
- ✅ Idempotent transaction processing
- ✅ Dual approval for recipient changes
- ✅ Transfer requests require two approvers
- ✅ Amount limits enforced
- ⚠️ **Remaining Risk:** Compromised payment processor account

**Additional Controls Needed:**
- Real-time reconciliation with processor
- Anomaly detection on transfers
- Daily balance verification
- Automated alerts for large transactions

---

#### R - Repudiation

**Threat:** Donor disputes legitimate charge

**Impact:** MEDIUM
- Chargeback fees
- Processor risk score increase
- Account suspension risk

**Mitigations:**
- ✅ Clear descriptor on credit card statement
- ✅ Email receipt with full details
- ✅ Attestations captured (checkbox acknowledgments)
- ✅ IP + device fingerprint logged
- ✅ Double opt-in for contributions
- ⚠️ **Remaining Risk:** Friendly fraud

**Additional Controls Needed:**
- Compelling evidence package for disputes
- Video confirmation for large donations
- Phone verification for first-time donors
- Fraud scoring (Stripe Radar)

---

#### I - Information Disclosure

**Threat:** Payment card data leaked

**Impact:** CRITICAL
- PCI-DSS violations
- Processor termination
- Legal liability

**Mitigations:**
- ✅ No card data stored (Stripe handles)
- ✅ PCI-DSS SAQ-A compliance (card data never touches servers)
- ✅ Stripe Elements (client-side tokenization)
- ✅ Card last 4 + brand stored only (not full PAN)
- ✅ TLS 1.3 in transit
- ⚠️ **Remaining Risk:** None (no card data stored)

**Additional Controls Needed:**
- Regular PCI compliance audits
- Penetration testing
- Security training for developers

---

#### D - Denial of Service

**Threat:** Payment processor outage prevents donations

**Impact:** HIGH
- Lost revenue during critical period
- Donor frustration

**Mitigations:**
- ✅ Multiple payment providers supported (Stripe primary, PayPal backup)
- ✅ Graceful degradation (collect email, retry later)
- ✅ Queue failed payment intents
- ✅ Status page shows payment issues
- ⚠️ **Remaining Risk:** All processors down simultaneously

**Additional Controls Needed:**
- Offline payment option (check, bank transfer)
- Multiple Stripe accounts (US + EU)
- Real-time processor status monitoring
- Fallback to manual processing

---

#### E - Elevation of Privilege

**Threat:** Attacker gains access to Stripe dashboard

**Impact:** CRITICAL
- Refund all donations
- Change payout account
- Access donor data

**Mitigations:**
- ✅ Separate Stripe account (not personal)
- ✅ 2FA required on Stripe account
- ✅ Restricted API keys (minimal permissions)
- ✅ Separate keys per environment
- ✅ Key rotation quarterly
- ✅ Webhook signature verification
- ⚠️ **Remaining Risk:** Stripe account compromise

**Additional Controls Needed:**
- IP whitelist for Stripe dashboard access
- Hardware security key for Stripe 2FA
- Audit Stripe actions monthly
- Separate banking account for payouts

---

### 4. Database

#### S - Spoofing

**Threat:** Attacker impersonates application to database

**Impact:** CRITICAL
- Direct data access
- Bypass application logic

**Mitigations:**
- ✅ Connection string in environment secrets
- ✅ Strong password (32+ characters)
- ✅ Certificate-based authentication
- ✅ IP whitelist (Vercel + admin IPs only)
- ⚠️ **Remaining Risk:** Compromised application server

**Additional Controls Needed:**
- Separate database user per application role
- Query-level audit logging
- Connection pooling with authentication

---

#### T - Tampering

**Threat:** Direct database modification bypassing audit log

**Impact:** CRITICAL
- Untracked changes
- Data corruption
- Cover fraud tracks

**Mitigations:**
- ✅ Database users have minimal permissions
- ✅ No direct UPDATE/DELETE from application (Prisma)
- ✅ Triggers for critical tables (audit all changes)
- ✅ Point-in-time recovery enabled
- ✅ Daily backups retained 90 days
- ⚠️ **Remaining Risk:** Database superuser access

**Additional Controls Needed:**
- Immutable append-only tables for critical data
- Database audit logging enabled
- Separate audit database
- Real-time replication to read-only replica

---

#### I - Information Disclosure

**Threat:** Database backup leaked

**Impact:** CRITICAL
- All donor data exposed
- Complete system compromise

**Mitigations:**
- ✅ Backups encrypted at rest (AES-256)
- ✅ Separate encryption key from database password
- ✅ Backups stored in private S3 bucket
- ✅ Bucket versioning + MFA delete enabled
- ✅ Access logging on backup bucket
- ⚠️ **Remaining Risk:** Cloud account compromise

**Additional Controls Needed:**
- Cross-account backup replication
- Encryption keys in Hardware Security Module (HSM)
- Backup access requires multiple approvals
- Regular restore testing (quarterly)

---

#### D - Denial of Service

**Threat:** Database overwhelmed or corrupted

**Impact:** CRITICAL
- Complete site outage
- Data loss

**Mitigations:**
- ✅ Connection pooling (PgBouncer)
- ✅ Query timeout limits
- ✅ Read replicas for heavy queries
- ✅ Automatic failover to replica
- ✅ Point-in-time recovery (PITR)
- ⚠️ **Remaining Risk:** Data corruption

**Additional Controls Needed:**
- Database query monitoring
- Slow query alerts
- Auto-scaling read replicas
- Disaster recovery runbook tested quarterly

---

## High-Risk Scenarios

### Scenario 1: Election Day DDoS

**Likelihood:** HIGH  
**Impact:** CRITICAL

**Attack:**
Political opponent launches DDoS attack on election day to prevent donations during final fundraising push.

**Defenses:**
1. Static-first architecture (public site survives DB outage)
2. Aggressive CDN caching (99% of requests from cache)
3. Cloudflare "Under Attack" mode ready
4. Queue-based donation processing
5. Multiple payment providers

**Response:**
1. Enable Cloudflare WAF
2. Activate rate limiting
3. Add CAPTCHAs to forms
4. Notify donors via email/SMS of alternative donation methods
5. Process queued donations after attack subsides

---

### Scenario 2: Insider Data Exfiltration

**Likelihood:** MEDIUM  
**Impact:** CRITICAL

**Attack:**
Malicious admin systematically exports donor data over weeks, staying under rate limits.

**Defenses:**
1. All exports audit-logged with reason
2. Export pattern anomaly detection
3. Quarterly access reviews
4. Watermarks on data views
5. DLP monitoring

**Response:**
1. Immediately suspend suspected account
2. Review all exports by that admin
3. Identify exposed donors
4. Legal notification if required
5. Strengthen access controls

---

### Scenario 3: Supply Chain Attack

**Likelihood:** MEDIUM  
**Impact:** CRITICAL

**Attack:**
Compromised npm package injects code to exfiltrate payment data.

**Defenses:**
1. npm audit in CI (fails build on high/critical)
2. Dependabot auto-updates
3. Lock file verification
4. Subresource Integrity (SRI)
5. Content Security Policy blocks unauthorized requests

**Response:**
1. Identify malicious package
2. Immediate rollback
3. Review all recent deployments
4. Check for data exfiltration
5. Notify payment processor

---

## Threat Prioritization Matrix

| Threat | Likelihood | Impact | Risk Score | Priority |
|--------|-----------|---------|------------|----------|
| Admin account compromise | High | Critical | 9/10 | P0 |
| DDoS attack | High | High | 8/10 | P0 |
| Insider data theft | Medium | Critical | 7/10 | P1 |
| Database breach | Low | Critical | 6/10 | P1 |
| Supply chain attack | Medium | High | 6/10 | P1 |
| Payment processor outage | Medium | High | 6/10 | P1 |
| Domain spoofing | Medium | Medium | 5/10 | P2 |
| XSS injection | Low | High | 4/10 | P2 |
| Donor dispute fraud | High | Low | 4/10 | P2 |

---

## Security Roadmap

### Phase 1: Launch (Complete)
- [x] HTTPS with HSTS
- [x] CSP with nonces
- [x] MFA for admins
- [x] Field encryption
- [x] Audit logging
- [x] Backup encryption

### Phase 2: Post-Launch (Q1)
- [ ] Hardware security keys (YubiKey)
- [ ] Anomaly detection on admin actions
- [ ] Real-time audit log replication
- [ ] DLP monitoring
- [ ] CAPTCHA on donation form

### Phase 3: Maturity (Q2)
- [ ] Separate audit database
- [ ] Database-level RBAC
- [ ] Just-in-time admin access
- [ ] Quarterly penetration testing
- [ ] Bug bounty program

### Phase 4: Advanced (Q3+)
- [ ] Hardware Security Module (HSM)
- [ ] Privileged Access Management (PAM)
- [ ] Behavioral biometrics
- [ ] Security Operations Center (SOC)

---

## Testing & Validation

### Security Testing Schedule

**Weekly:**
- Automated dependency scanning
- Vulnerability scanning

**Monthly:**
- Access reviews
- Audit log verification
- Backup restore testing

**Quarterly:**
- Penetration testing
- Red team exercise
- Disaster recovery drill
- Secret rotation

**Annually:**
- Full security audit
- Compliance assessment
- Threat model review

---

## Related Documentation

- [Incident Response Runbook](./INCIDENT_RESPONSE.md)
- [Security Checklist](./SECURITY_CHECKLIST.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [Backup & Restore](./BACKUP_RESTORE.md)
