# Incident Response Runbook

## Overview

This runbook provides step-by-step procedures for responding to security incidents, operational failures, and data breaches. As a high-profile political platform, rapid response is critical.

---

## 🚨 Severity Levels

### SEV-1: Critical (Immediate Response)
- **Examples**: Data breach, payment system down, site defaced, DDoS attack
- **Response Time**: < 15 minutes
- **Escalation**: All hands, notify legal counsel
- **Communication**: Hourly updates

### SEV-2: High (Urgent Response)
- **Examples**: Admin account compromised, database degraded, payment errors
- **Response Time**: < 1 hour
- **Escalation**: On-call engineer + lead
- **Communication**: Every 2 hours

### SEV-3: Medium (Standard Response)
- **Examples**: Email delivery failures, slow performance, minor bugs
- **Response Time**: < 4 hours
- **Escalation**: Assigned engineer
- **Communication**: Daily updates

### SEV-4: Low (Scheduled Response)
- **Examples**: Non-critical bugs, feature requests, documentation updates
- **Response Time**: < 2 business days
- **Escalation**: None
- **Communication**: As needed

---

## 📋 Incident Response Phases

### 1. Detection & Triage (0-15 minutes)
### 2. Containment (15-60 minutes)
### 3. Investigation (1-24 hours)
### 4. Remediation (24-72 hours)
### 5. Recovery (72+ hours)
### 6. Post-Incident Review (1 week after)

---

## 🔒 Security Incidents

### Data Breach (SEV-1)

**Detection:**
- Unauthorized data export detected
- PII reveal rate limit exceeded
- Suspicious database queries
- External report of leaked data

**Immediate Actions (0-15 min):**
1. ✅ **Activate Kill Switch**
   ```bash
   # Via admin console
   Navigate to: /admin/launch-control
   Click: "Activate Kill Switch"
   Reason: "Data breach detected - [incident ID]"
   ```

2. ✅ **Isolate Compromised Account**
   ```bash
   # Revoke all sessions
   Navigate to: /admin/users
   Select compromised user
   Click: "Revoke All Sessions"
   
   # Suspend account
   Click: "Suspend Account"
   Reason: "Suspected compromise"
   ```

3. ✅ **Enable Read-Only Mode**
   ```sql
   -- Database-level (if needed)
   REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM app_user;
   ```

4. ✅ **Snapshot Evidence**
   ```bash
   # Capture audit logs
   npm run export:audit-log -- --start=$(date -u -d '24 hours ago' +%Y-%m-%d) --output=evidence/
   
   # Capture database state
   pg_dump -Fc DATABASE_URL > evidence/db-snapshot-$(date +%s).dump
   ```

**Containment (15-60 min):**
1. ✅ **Identify Scope**
   - Query audit log for compromised user's actions
   - Identify all PII reveals in last 24 hours
   - Check for data exports
   - Review API access patterns

2. ✅ **Rotate Secrets**
   ```bash
   # Generate new secrets
   openssl rand -hex 32  # New SESSION_SECRET
   openssl rand -hex 32  # New admin API keys
   
   # Update in Vercel
   vercel secrets add session-secret [NEW_VALUE]
   
   # Trigger deployment
   vercel --prod
   ```

3. ✅ **Block Attack Vectors**
   - Add IP to WAF blocklist
   - Disable compromised API keys
   - Revoke OAuth tokens
   - Enable 2FA for all admin accounts

**Investigation (1-24 hours):**
1. ✅ **Determine Impact**
   ```sql
   -- Count affected records
   SELECT COUNT(*) FROM "PIIReveal"
   WHERE "adminId" = '[COMPROMISED_USER_ID]'
   AND "createdAt" >= NOW() - INTERVAL '24 hours';
   
   -- Identify exposed donors
   SELECT DISTINCT "entityId" FROM "PIIReveal"
   WHERE "adminId" = '[COMPROMISED_USER_ID]'
   AND "entityType" = 'Contribution';
   ```

2. ✅ **Root Cause Analysis**
   - Review authentication logs
   - Check for credential stuffing
   - Analyze access patterns
   - Check for software vulnerabilities

3. ✅ **Document Timeline**
   - First suspicious activity
   - Detection time
   - Response actions taken
   - Evidence collected

**Remediation (24-72 hours):**
1. ✅ **Patch Vulnerabilities**
   - Update dependencies
   - Fix identified security flaws
   - Strengthen authentication
   - Add detection rules

2. ✅ **Restore Service**
   - Verify no ongoing compromise
   - Disable kill switch
   - Re-enable normal operations
   - Monitor closely for 48 hours

3. ✅ **Legal Notification (if required)**
   - Consult legal counsel
   - Determine notification requirements
   - Prepare donor notification (see template below)

**Recovery (72+ hours):**
1. ✅ **Enhanced Monitoring**
   - Add alerting for similar patterns
   - Review all admin accounts
   - Audit access controls
   - Increase log retention

2. ✅ **Post-Incident Review**
   - What happened
   - What worked
   - What didn't work
   - Action items

---

### Compromised Admin Account (SEV-2)

**Detection:**
- Multiple failed login attempts
- Login from unusual location
- Unusual activity patterns
- Admin reports compromise

**Immediate Actions:**
1. ✅ **Suspend Account**
2. ✅ **Revoke All Sessions**
3. ✅ **Force Password Reset**
4. ✅ **Review Recent Actions**

**Containment:**
1. ✅ **Audit All Actions**
   ```sql
   SELECT * FROM "TamperEvidentAuditLog"
   WHERE "actorId" = '[COMPROMISED_USER_ID]'
   AND "createdAt" >= NOW() - INTERVAL '7 days'
   ORDER BY "createdAt" DESC;
   ```

2. ✅ **Check for Backdoors**
   - Review user creation
   - Check for new API keys
   - Verify no config changes

3. ✅ **Notify Other Admins**
   - Send security alert
   - Recommend password changes
   - Require MFA re-enrollment

**Remediation:**
1. ✅ **Strengthen Authentication**
   - Enforce MFA for all admins
   - Reduce session duration
   - Add geofencing (if applicable)

2. ✅ **Re-verify User**
   - Video call with known identity
   - Verify from trusted device
   - New strong password
   - New MFA device

---

## 💳 Payment System Incidents

### Payment Processor Down (SEV-1)

**Detection:**
- Stripe/PayPal API errors
- Webhook failures
- Donor reports payment failures

**Immediate Actions:**
1. ✅ **Verify Outage**
   ```bash
   # Check Stripe status
   curl https://status.stripe.com/api/v2/status.json
   
   # Check our connectivity
   curl https://api.stripe.com/v1/charges \
     -u $STRIPE_SECRET_KEY:
   ```

2. ✅ **Enable Banner**
   - Display: "We're experiencing technical difficulties with payments. Please try again in a few minutes."
   - Collect emails for follow-up

3. ✅ **Monitor Status**
   - Subscribe to provider status page
   - Check every 5 minutes
   - Update banner with ETA

**Containment:**
1. ✅ **Switch to Backup Provider (if available)**
   - Update `PAYMENT_PROVIDER` env var
   - Deploy updated config
   - Test with $1 donation

2. ✅ **Queue Failed Attempts**
   - Store payment intents
   - Retry when service restores
   - Send confirmation emails

**Recovery:**
1. ✅ **Process Queued Payments**
2. ✅ **Send Apology + Receipt**
3. ✅ **Review Failure Logs**

---

### Fraudulent Donations (SEV-2)

**Detection:**
- High-risk score triggers
- Multiple cards from same IP
- Chargebacks received
- Suspicious patterns

**Immediate Actions:**
1. ✅ **Review Flagged Transactions**
   ```sql
   SELECT * FROM "ComplianceCheck"
   WHERE "result" = 'REVIEW'
   AND "createdAt" >= NOW() - INTERVAL '24 hours';
   ```

2. ✅ **Hold Suspicious Funds**
   - Mark as UNDER_REVIEW
   - Don't transfer to recipient
   - Contact payment processor

3. ✅ **Investigate Pattern**
   - Check donor fingerprints
   - Review IP addresses
   - Look for card testing
   - Check for velocity attacks

**Containment:**
1. ✅ **Block Fraud Sources**
   - Add IPs to blocklist
   - Block compromised cards
   - Add email domains to filter

2. ✅ **Strengthen Fraud Detection**
   - Lower risk score threshold
   - Add velocity rules
   - Require email verification

**Remediation:**
1. ✅ **Refund Fraudulent Donations**
2. ✅ **Report to Processor**
3. ✅ **Update Rules**

---

## 🌐 Operational Incidents

### Database Outage (SEV-1)

**Detection:**
- Database connection timeouts
- Site returns 500 errors
- Monitoring alerts

**Immediate Actions:**
1. ✅ **Verify Outage**
   ```bash
   # Test connection
   psql $DATABASE_URL -c "SELECT 1;"
   
   # Check provider status
   # Supabase: https://status.supabase.com
   ```

2. ✅ **Enable Static Fallback**
   - Serve cached public pages
   - Display maintenance banner
   - Disable donation forms

3. ✅ **Alert Users**
   - Update status page
   - Post to social media
   - Send email to recent visitors

**Containment:**
1. ✅ **Switch to Replica (if available)**
   ```bash
   # Update DATABASE_URL to replica
   vercel env add DATABASE_URL [REPLICA_URL] production
   vercel --prod
   ```

2. ✅ **Restore from Backup**
   - See BACKUP_RESTORE.md
   - Calculate data loss (RPO)
   - Estimate restore time (RTO)

**Recovery:**
1. ✅ **Verify Data Integrity**
   - Run audit log verification
   - Check hash chain
   - Verify ledger balances

2. ✅ **Resume Operations**
   - Disable kill switch
   - Monitor closely
   - Process queued jobs

---

### DDoS Attack (SEV-1)

**Detection:**
- Sudden traffic spike
- Site slow or unresponsive
- Vercel billing alerts

**Immediate Actions:**
1. ✅ **Enable Vercel DDoS Protection**
   - Contact Vercel support
   - Enable Enterprise DDoS mitigation
   - Add rate limiting

2. ✅ **Block Attack Sources**
   ```bash
   # Add to Vercel Firewall
   vercel firewall add --ip [ATTACK_IP] --action deny
   ```

3. ✅ **Enable Cloudflare (if not already)**
   - Point DNS to Cloudflare
   - Enable "I'm Under Attack" mode
   - Cache aggressively

**Containment:**
1. ✅ **Analyze Attack Pattern**
   - Layer 7 (application) or Layer 3/4 (network)?
   - Bot or distributed?
   - Targeting specific endpoints?

2. ✅ **Harden Endpoints**
   - Add CAPTCHAs to forms
   - Increase rate limits
   - Require authentication

**Recovery:**
1. ✅ **Gradual Restore**
   - Keep protections enabled
   - Monitor for 48 hours
   - Document attack patterns

---

## 📧 Donor Notification Templates

### Data Breach Notification

**Subject:** Important Security Notice - Diaspora4Bellefleur

**Body:**
```
Dear [Donor Name],

We are writing to inform you of a security incident that may have affected your personal information.

WHAT HAPPENED:
On [DATE], we detected unauthorized access to our system. Our investigation revealed that [DESCRIPTION OF BREACH].

INFORMATION AFFECTED:
The following information may have been accessed:
- Name
- Email address
- Contribution amount and date
- [OTHER FIELDS]

Your payment card information was NOT accessed, as we do not store complete card numbers.

WHAT WE'RE DOING:
- We immediately secured our systems
- We've enhanced our security measures
- We're working with cybersecurity experts
- We've notified law enforcement

WHAT YOU SHOULD DO:
1. Monitor your financial accounts for unusual activity
2. Be cautious of phishing emails claiming to be from us
3. Consider placing a fraud alert on your credit report
4. Contact us with any questions: [SUPPORT EMAIL]

We sincerely apologize for this incident and any concern it may cause. The security of your information is our highest priority.

For more information, visit: [INCIDENT PAGE URL]

Sincerely,
[NAME]
[TITLE]
Diaspora4Bellefleur

---
This is a required notification under [APPLICABLE LAW].
Incident ID: [INCIDENT-ID]
Date: [DATE]
```

### Payment Failure Apology

**Subject:** We're Sorry - Payment Issue Resolved

**Body:**
```
Dear [Donor Name],

We wanted to reach out about the payment issue you experienced on [DATE].

WHAT HAPPENED:
Our payment processor experienced a temporary outage that prevented contributions from processing correctly. This was not an issue with your payment method.

YOUR CONTRIBUTION:
[IF PROCESSED]: Your contribution of $[AMOUNT] was successfully processed once service was restored. Your receipt is attached.

[IF FAILED]: Unfortunately, we were unable to process your contribution. If you'd still like to contribute, please visit: [CONTRIBUTION LINK]

We sincerely apologize for any inconvenience this caused. We've implemented additional monitoring to prevent similar issues.

Thank you for your support and patience.

Sincerely,
[NAME]
Diaspora4Bellefleur

Questions? Contact: [SUPPORT EMAIL]
```

---

## 🔍 Post-Incident Review Template

**Incident ID:** [UNIQUE-ID]  
**Date:** [DATE]  
**Severity:** [SEV-1/2/3/4]  
**Duration:** [TIME]  

### Summary
[One-paragraph summary of what happened]

### Timeline
| Time | Event | Action Taken |
|------|-------|--------------|
| 10:23 | Alert triggered | Engineer paged |
| 10:30 | Kill switch activated | Donations disabled |
| ... | ... | ... |

### Impact
- **Users Affected:** [NUMBER]
- **Donations Lost:** [NUMBER]
- **Downtime:** [DURATION]
- **Data Compromised:** [YES/NO - DETAILS]

### Root Cause
[Detailed explanation of the underlying cause]

### What Worked
- [Action that helped]
- [Process that was effective]

### What Didn't Work
- [Gap in response]
- [Tool/process failure]

### Action Items
| Item | Owner | Due Date | Priority |
|------|-------|----------|----------|
| [Task] | [Name] | [Date] | [High/Med/Low] |

### Lessons Learned
[Key takeaways for future incidents]

---

## 📞 Contact Information

### Emergency Contacts

**Technical Lead**
- Name: [NAME]
- Phone: [PHONE]
- Email: [EMAIL]
- Backup: [BACKUP NAME]

**Legal Counsel**
- Firm: [LAW FIRM]
- Attorney: [NAME]
- Phone: [PHONE]
- Email: [EMAIL]

**Payment Processor Support**
- Stripe: https://support.stripe.com (Priority support)
- Phone: [STRIPE PHONE]

**Hosting Provider**
- Vercel Support: https://vercel.com/support
- Email: support@vercel.com
- Emergency: [ENTERPRISE PHONE if applicable]

**Database Provider**
- Supabase Support: https://supabase.com/dashboard/support
- Email: support@supabase.com

### External Resources

**Cybersecurity**
- FBI IC3: https://www.ic3.gov
- Secret Service: [LOCAL OFFICE]

**Election Law**
- Haiti CEP: [CONTACT]
- Legal Counsel: [PRIMARY ATTORNEY]

---

## 🔗 Related Documentation

- [STRIDE Threat Model](./STRIDE_THREAT_MODEL.md)
- [Security Checklist](./SECURITY_CHECKLIST.md)
- [Backup & Restore Procedures](./BACKUP_RESTORE.md)
- [Secret Rotation](./SECRET_ROTATION.md)
