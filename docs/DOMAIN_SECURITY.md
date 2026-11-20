# Domain Security Checklist

## Overview

Comprehensive domain security to prevent spoofing, hijacking, and email impersonation.

**Goal**: Lock down the domain (`diaspora4bellefleur.com` as example) at every layer.

## DNS Security (DNSSEC)

### What It Is

DNSSEC cryptographically signs DNS records to prevent DNS spoofing and cache poisoning attacks.

### Setup

**1. Enable DNSSEC at registrar:**
- Log in to domain registrar (Namecheap, Cloudflare, etc.)
- Navigate to DNS settings
- Enable DNSSEC
- Copy DS records

**2. Add DS records to parent zone:**
- Most registrars do this automatically
- Verify with: `dig diaspora4bellefleur.com +dnssec`

**3. Verify DNSSEC chain:**
```bash
# Check DNSSEC validation
dig diaspora4bellefleur.com A +dnssec

# Should see RRSIG records and ad flag
# ad = authenticated data (DNSSEC validated)
```

**4. Monitor DNSSEC:**
- Tool: https://dnssec-analyzer.verisignlabs.com/
- Check monthly for signature expiration

### Expected Output

```bash
$ dig diaspora4bellefleur.com +dnssec

;; flags: qr rd ra ad; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1
                      ^^
                      ad flag means DNSSEC validated

;; ANSWER SECTION:
diaspora4bellefleur.com. 300 IN A      76.76.21.21
diaspora4bellefleur.com. 300 IN RRSIG  A 13 3 300 ...
```

## Certificate Authority Authorization (CAA)

### What It Is

CAA records restrict which Certificate Authorities can issue SSL certificates for your domain.

### Setup

Add CAA records in DNS:

```dns
; Allow only Let's Encrypt (used by Vercel)
diaspora4bellefleur.com. CAA 0 issue "letsencrypt.org"

; Report violations to security email
diaspora4bellefleur.com. CAA 0 iodef "mailto:security@diaspora4bellefleur.com"

; Disallow wildcard certificates (unless needed)
diaspora4bellefleur.com. CAA 0 issuewild ";"
```

**If using Cloudflare:**
```dns
diaspora4bellefleur.com. CAA 0 issue "letsencrypt.org"
diaspora4bellefleur.com. CAA 0 issue "pki.goog"
diaspora4bellefleur.com. CAA 0 issue "digicert.com"
diaspora4bellefleur.com. CAA 0 iodef "mailto:security@diaspora4bellefleur.com"
```

### Verification

```bash
# Check CAA records
dig diaspora4bellefleur.com CAA

# Should see:
# diaspora4bellefleur.com. 300 IN CAA 0 issue "letsencrypt.org"
```

**Online checker**: https://caatest.co.uk/

### Why It Matters

Without CAA, any CA can issue a certificate for your domain (potential MITM attack vector).

## Email Security (SPF, DKIM, DMARC)

### SPF (Sender Policy Framework)

**What**: Specifies which mail servers can send email on behalf of your domain.

**Setup:**
```dns
; TXT record
diaspora4bellefleur.com. TXT "v=spf1 include:_spf.google.com include:sendgrid.net ~all"

; Breakdown:
; v=spf1              - SPF version 1
; include:_spf.google.com - Allow Google Workspace (if using)
; include:sendgrid.net    - Allow SendGrid (or your email provider)
; ~all                - Soft fail for others (log but don't reject)
```

**If using Resend:**
```dns
diaspora4bellefleur.com. TXT "v=spf1 include:amazonses.com ~all"
```

**Strict policy (recommended after testing):**
```dns
diaspora4bellefleur.com. TXT "v=spf1 include:sendgrid.net -all"
; -all = hard fail (reject unauthorized senders)
```

**Verification:**
```bash
dig diaspora4bellefleur.com TXT | grep spf1
```

### DKIM (DomainKeys Identified Mail)

**What**: Cryptographically signs emails to prove they came from your domain.

**Setup:**

1. **Generate DKIM keys** (via email provider):
   - SendGrid: Settings → Sender Authentication → Domain Authentication
   - Resend: Settings → Domains → Add Domain
   - Copy provided CNAME records

2. **Add CNAME records:**
   ```dns
   ; Example SendGrid DKIM records
   s1._domainkey.diaspora4bellefleur.com. CNAME s1.domainkey.u12345.wl.sendgrid.net.
   s2._domainkey.diaspora4bellefleur.com. CNAME s2.domainkey.u12345.wl.sendgrid.net.
   ```

3. **Verify** in email provider dashboard (usually takes 24-48 hours)

**Test DKIM:**
```bash
# Check DKIM record
dig s1._domainkey.diaspora4bellefleur.com TXT

# Send test email and check headers for DKIM-Signature
```

### DMARC (Domain-based Message Authentication, Reporting & Conformance)

**What**: Tells receiving mail servers what to do with emails that fail SPF or DKIM checks.

**Setup:**

```dns
; TXT record for _dmarc subdomain
_dmarc.diaspora4bellefleur.com. TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@diaspora4bellefleur.com; ruf=mailto:dmarc@diaspora4bellefleur.com; fo=1; adkim=r; aspf=r; pct=100; ri=86400"

; Breakdown:
; v=DMARC1                       - DMARC version 1
; p=quarantine                   - Policy: quarantine failed emails
; rua=mailto:dmarc@...          - Aggregate reports sent here
; ruf=mailto:dmarc@...          - Forensic reports sent here
; fo=1                           - Generate report if either SPF or DKIM fails
; adkim=r                        - Relaxed DKIM alignment
; aspf=r                         - Relaxed SPF alignment
; pct=100                        - Apply policy to 100% of emails
; ri=86400                       - Report interval (daily)
```

**DMARC Policy Progression:**
1. **Phase 1 (Monitoring)**: `p=none` - Monitor only, don't reject
2. **Phase 2 (Testing)**: `p=quarantine; pct=10` - Quarantine 10% of failures
3. **Phase 3 (Enforcement)**: `p=quarantine; pct=100` - Quarantine all failures
4. **Phase 4 (Strict)**: `p=reject` - Reject all failures outright

**Recommended for launch**: Phase 2 or 3

**Verification:**
```bash
dig _dmarc.diaspora4bellefleur.com TXT

# Should see DMARC record
```

**DMARC Report Tools:**
- Free: https://dmarc.postmarkapp.com/
- Paid: Valimail, dmarcian

### Email Security Summary

| Record | Purpose | Status |
|--------|---------|--------|
| SPF | Authorize mail servers | ☐ Added |
| DKIM | Cryptographic signing | ☐ Added |
| DMARC | Enforcement policy | ☐ Added |

**Test suite**: https://www.mail-tester.com/

## Registrar Security

### Registrar Lock

**What**: Prevents unauthorized domain transfers.

**Setup:**
1. Log in to domain registrar
2. Find "Domain Lock" or "Transfer Lock"
3. Enable registrar lock
4. Verify status: `whois diaspora4bellefleur.com | grep -i lock`

**Expected output:**
```
Domain Status: clientTransferProhibited
Domain Status: clientUpdateProhibited
```

### Two-Factor Authentication

**Setup:**
1. Log in to registrar account
2. Navigate to Security Settings
3. Enable 2FA (TOTP app like Authy, 1Password)
4. Save backup codes in password manager

**Recommended apps:**
- 1Password (paid, includes backup/sync)
- Authy (free, cloud backup)
- Google Authenticator (free, no backup)

### Contact Privacy

**Recommendation**: Enable WHOIS privacy protection

**Why**: Prevents public exposure of admin contact information (reduces phishing/social engineering risk)

**Setup:**
1. Registrar → Domain Settings → Privacy Protection
2. Enable WHOIS privacy (usually free or $1-2/year)

**Verify:**
```bash
whois diaspora4bellefleur.com | grep -i contact

# Should show privacy service, not personal info
```

## Subdomain Security

### Subdomain Enumeration Risk

**Concern**: Attackers can discover subdomains (e.g., `admin.`, `staging.`, `api.`) and target them.

**Mitigation:**

1. **DNS-level**:
   - Don't create unnecessary subdomains
   - Use CAA records for subdomains too
   - Enable DNSSEC

2. **Application-level**:
   - Require authentication on admin subdomains
   - Use deployment protection on non-production subdomains
   - Add `X-Robots-Tag: noindex` on preview/staging

3. **Monitoring**:
   - Monitor certificate transparency logs for new subdomains
   - Tool: https://crt.sh/?q=%.diaspora4bellefleur.com

### Recommended Subdomains

| Subdomain | Purpose | Public? | Protection |
|-----------|---------|---------|------------|
| `www.diaspora4bellefleur.com` | Main site | Yes | None (redirects to apex) |
| `admin.diaspora4bellefleur.com` | Admin console | No | Auth required |
| `api.diaspora4bellefleur.com` | API (future) | Semi | API key required |
| `status.diaspora4bellefleur.com` | Status page | Yes | Read-only |
| `*.vercel.app` | Deployments | No | Deployment protection |

## TLS/SSL Certificate Security

### Certificate Transparency Monitoring

**What**: Monitor for unauthorized certificates issued for your domain.

**Setup:**
1. Sign up for https://sslmate.com/certspotter/ (free)
2. Add domain: `diaspora4bellefleur.com`
3. Configure alerts: email + Slack
4. Review new certificate notifications

**What to watch for:**
- Certificates from unexpected CAs (CAA violation)
- Certificates for unknown subdomains
- Certificates issued shortly before yours expire (potential phishing setup)

### HSTS Preload

**What**: Browser-enforced HTTPS for your domain (prevents downgrade attacks).

**Setup:**

1. **Ensure HSTS header is set** (already done in middleware.ts):
   ```
   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
   ```

2. **Test readiness**: https://hstspreload.org/?domain=diaspora4bellefleur.com

3. **Submit to preload list**: https://hstspreload.org/
   - Once submitted, cannot be easily reversed
   - All subdomains must support HTTPS
   - Takes 2-3 months to propagate to all browsers

**When to submit**: After 3 months of stable HTTPS operation

**Warning**: HSTS preload is a one-way commitment. Ensure all subdomains will always have valid TLS certificates.

## Domain Monitoring

### Continuous Checks

**1. DNS changes:**
- Tool: https://dnsspy.io/
- Alert on: A/AAAA, MX, TXT, CAA record changes
- Frequency: Real-time

**2. Certificate issuance:**
- Tool: https://sslmate.com/certspotter/
- Alert on: New certificates
- Frequency: Real-time

**3. WHOIS changes:**
- Tool: Registrar alerts (usually built-in)
- Alert on: Registrant, nameserver, registrar changes
- Frequency: Daily

**4. Domain expiration:**
- Tool: Registrar alerts + https://domainr.com/
- Alert on: Expiration in 60, 30, 7 days
- Action: Auto-renew enabled + manual verification

### Security Contacts

| Role | Email | Responsibility |
|------|-------|----------------|
| Security | security@diaspora4bellefleur.com | Vulnerability reports |
| Postmaster | postmaster@diaspora4bellefleur.com | Email deliverability issues |
| Abuse | abuse@diaspora4bellefleur.com | Abuse/spam reports |
| Admin | admin@diaspora4bellefleur.com | General domain issues |

**Setup** (email forwarding to SUPPORT_EMAIL):
- Create aliases in email provider
- Test each alias receives email
- Publish security@ in security.txt (see below)

## Security.txt

Create a security policy file for vulnerability disclosure:

**File**: `public/.well-known/security.txt`

```
# Our security address
Contact: mailto:security@diaspora4bellefleur.com

# Our security page
Canonical: https://diaspora4bellefleur.com/.well-known/security.txt

# Preferred language
Preferred-Languages: en, fr, ht

# Encryption key for sensitive reports
Encryption: https://diaspora4bellefleur.com/.well-known/pgp-key.txt

# Acknowledgments page
Acknowledgments: https://diaspora4bellefleur.com/security/acknowledgments

# Security policy
Policy: https://diaspora4bellefleur.com/security/policy

# Signature (optional, for verification)
# Signed with PGP key: ...
```

**Verification**: https://securitytxt.org/

## Anti-Phishing Measures

### Brand Monitoring

**Monitor for:**
- Typosquatting domains (e.g., `diaspara4bellefleur.com`, `diaspora4belefleur.com`)
- Homograph attacks (e.g., using Cyrillic letters: `dіaspora4bellefleur.com`)
- Subdomain spoofing (e.g., `diaspora4bellefleur.com.evil.com`)

**Tools:**
- DNSTwist: https://github.com/elceef/dnstwist
- Google Alerts: Set up for "diaspora4bellefleur"
- Certificate Transparency: Monitor for similar domains

**Action plan:**
1. Detect suspicious domain
2. Document evidence (screenshots, WHOIS, certificates)
3. Report to registrar + CA
4. File abuse complaint
5. Legal action if necessary

### Social Media Verification

**Protect brand on social platforms:**
- Register @diaspora4bellefleur on all major platforms (even if not actively using)
- Link to official site from social bios
- Use verification badges where available (Twitter Blue, Meta Verified)

### User Education

**In FAQ and email footers:**
> Official communication from Diaspora4Bellefleur only comes from:
> - Email: @diaspora4bellefleur.com
> - Website: https://diaspora4bellefleur.com (with padlock icon)
> 
> Never trust:
> - Similar-looking domains (check spelling carefully)
> - Shortened URLs (bit.ly, etc.) claiming to be us
> - Requests for payment via direct message or unexpected email

## Checklist Summary

### Required Before Launch

- [ ] DNSSEC enabled and validated
- [ ] CAA records added (allow only Let's Encrypt)
- [ ] SPF record added and tested
- [ ] DKIM keys generated and added
- [ ] DMARC policy set (at least `p=quarantine; pct=10`)
- [ ] Registrar lock enabled
- [ ] 2FA enabled on registrar account
- [ ] WHOIS privacy enabled
- [ ] Certificate Transparency monitoring enabled
- [ ] DNS change monitoring enabled
- [ ] Security.txt file published
- [ ] Auto-renewal enabled (domain expires > 6 months from launch)

### Optional (Recommended Within 3 Months)

- [ ] DMARC enforcement (`p=quarantine; pct=100`)
- [ ] HSTS preload submission
- [ ] Typosquat domain registration (own common misspellings)
- [ ] Social media handles registered
- [ ] Brand monitoring alerts configured

### Ongoing Maintenance

- [ ] Monthly: Review DMARC reports
- [ ] Monthly: Check DNSSEC status
- [ ] Quarterly: Verify CAA records
- [ ] Quarterly: Test email deliverability
- [ ] Annually: Review domain security posture
- [ ] Annually: Audit DNS records (remove unused)

## Testing

### Full Domain Security Test

```bash
#!/bin/bash
# domain-security-check.sh

DOMAIN="diaspora4bellefleur.com"

echo "=== Domain Security Check ==="
echo ""

# DNSSEC
echo "1. DNSSEC:"
dig +short $DOMAIN A +dnssec | grep -q RRSIG && echo "✓ Enabled" || echo "✗ Disabled"
echo ""

# CAA
echo "2. CAA Records:"
dig +short $DOMAIN CAA || echo "✗ No CAA records"
echo ""

# SPF
echo "3. SPF:"
dig +short $DOMAIN TXT | grep "v=spf1" || echo "✗ No SPF record"
echo ""

# DKIM (check common selector)
echo "4. DKIM:"
dig +short s1._domainkey.$DOMAIN TXT || echo "✗ No DKIM record (s1 selector)"
echo ""

# DMARC
echo "5. DMARC:"
dig +short _dmarc.$DOMAIN TXT || echo "✗ No DMARC record"
echo ""

# Domain Lock
echo "6. Registrar Lock:"
whois $DOMAIN | grep -i "clientTransferProhibited" && echo "✓ Locked" || echo "✗ Not locked"
echo ""

# HTTPS
echo "7. HTTPS:"
curl -sI https://$DOMAIN | grep -q "HTTP/2 200" && echo "✓ Accessible" || echo "✗ Not accessible"
echo ""

# HSTS
echo "8. HSTS Header:"
curl -sI https://$DOMAIN | grep -i "strict-transport-security" || echo "✗ No HSTS header"
echo ""

# Security.txt
echo "9. Security.txt:"
curl -sI https://$DOMAIN/.well-known/security.txt | grep -q "200" && echo "✓ Present" || echo "✗ Missing"
echo ""

echo "=== Test Complete ==="
```

**Run:**
```bash
chmod +x domain-security-check.sh
./domain-security-check.sh
```

## External Resources

- [DNSSEC Analyzer](https://dnssec-analyzer.verisignlabs.com/)
- [CAA Checker](https://caatest.co.uk/)
- [MXToolbox (SPF/DKIM/DMARC)](https://mxtoolbox.com/)
- [Mail Tester](https://www.mail-tester.com/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [HSTS Preload](https://hstspreload.org/)
- [Security.txt](https://securitytxt.org/)
- [Certificate Transparency Search](https://crt.sh/)

---

**Last Updated**: November 18, 2026
