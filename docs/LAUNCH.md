# Launch Runbook

## Overview

Step-by-step procedure to safely launch the platform from INFO_ONLY/WAITLIST to DONATIONS_LIVE.

**Current State**: INFO_ONLY (default)  
**Target State**: DONATIONS_LIVE  
**Estimated Duration**: 4-6 hours  
**Required Roles**: OWNER, COMPLIANCE, ENGINEERING, LEGAL

---

## Pre-Launch Checklist

**Must be 100% complete before proceeding to Go/No-Go**

### Legal & Compliance

- [ ] Haitian legal counsel opinion received and approved
- [ ] US FARA/election counsel opinion received and approved
- [ ] Entity formation documents filed
- [ ] Tax classification confirmed
- [ ] Money transmission review complete
- [ ] Sanctions screening procedure documented
- [ ] Payment processor approval (political fundraising)
- [ ] Recipient account verified (test transaction successful)
- [ ] Donor disclosure forms approved by counsel
- [ ] Privacy notice approved by counsel
- [ ] Refund policy approved by counsel

**Owner**: [Legal Counsel Name]  
**Status**: ⏳ Pending

### Candidacy Verification

- [ ] Candidacy status verified (NOT UNVERIFIED)
- [ ] Evidence document uploaded and accessible
- [ ] Status verified by: [Name], on [Date]
- [ ] Status set in database: `candidacyStatus != 'UNVERIFIED'`

**Owner**: [Compliance Lead Name]  
**Status**: ⏳ Pending

### Technical Readiness

- [ ] Production build passes (`npm run build`)
- [ ] Smoke tests pass (all routes 200, no console errors)
- [ ] Visual regression baseline approved
- [ ] Lighthouse scores meet targets (90/100/95/95 mobile)
- [ ] Load test passes (500 checkouts/min, p95 <2s)
- [ ] Accessibility audit complete (WCAG 2.2 AA, zero blockers)
- [ ] Database backups verified (last 24 hours)
- [ ] Monitoring configured (Sentry, Logtail, Better Uptime)
- [ ] Domain security complete (DNSSEC, CAA, SPF/DKIM/DMARC)
- [ ] WAF configured (Cloudflare rules active)

**Owner**: [Engineering Lead Name]  
**Status**: ⏳ Pending

### Content Quality

- [ ] Pre-launch content audit passes (zero violations)
- [ ] All legal pages approved by counsel
- [ ] No placeholder text in production
- [ ] No NEEDS_REVIEW content publicly visible
- [ ] All translations complete (ht, fr, en)
- [ ] No unsourced factual claims
- [ ] Affiliation disclosure visible on all pages
- [ ] Candidacy wording matches status
- [ ] All imagery approved

**Owner**: [Content Lead Name]  
**Status**: ⏳ Pending

### Design Quality

- [ ] Design QA complete (DESIGN_QA.md approved)
- [ ] Zero BLOCKER issues
- [ ] All HIGH issues resolved or documented
- [ ] Site looks complete without candidate photo
- [ ] No campaign identity copying violations

**Owner**: [Design Lead Name]  
**Status**: ⏳ Pending

### Operational Test

- [ ] End-to-end test in test mode (full donation flow)
- [ ] Receipt generation works
- [ ] Refund process tested
- [ ] Email delivery confirmed
- [ ] Webhook handling verified
- [ ] Admin dashboard accessible

**Owner**: [Engineering Lead Name]  
**Status**: ⏳ Pending

### Team Readiness

- [ ] Launch team identified and available
- [ ] Emergency contacts updated
- [ ] Incident response runbook reviewed
- [ ] Kill switch procedure confirmed
- [ ] Rollback plan documented
- [ ] 72-hour monitoring rotation assigned

**Owner**: [Project Owner Name]  
**Status**: ⏳ Pending

---

## Go/No-Go Meeting

**Date**: [TBD]  
**Time**: [TBD]  
**Location**: [Video conference link]  
**Duration**: 60 minutes

### Attendees (Required)

- [ ] Project Owner
- [ ] Legal Counsel
- [ ] Engineering Lead
- [ ] Compliance Lead
- [ ] Design Lead
- [ ] Content Lead
- [ ] Finance Lead

### Agenda

1. **Checklist Review** (15 min)
   - Each owner reports on their section
   - Any incomplete items flagged
   - Decision: Complete or defer

2. **Risk Assessment** (15 min)
   - Known issues and mitigations
   - Technical risks
   - Legal/compliance risks
   - Reputational risks

3. **Launch Timeline** (10 min)
   - Proposed launch time
   - Key milestones
   - Monitoring plan

4. **Go/No-Go Decision** (10 min)
   - Formal vote by each attendee
   - Unanimous GO required to proceed
   - Any NO-GO must include specific blocker and timeline to resolve

5. **Final Preparations** (10 min)
   - Assign roles for launch execution
   - Confirm communication plan
   - Schedule post-launch debrief

### Decision

**Outcome**: ⬜ GO | ⬜ NO-GO  
**Rationale**: [Document reasons]  
**Next Steps**: [If NO-GO, list blockers and timeline]

---

## Launch Execution

### T-60 minutes: Pre-Launch Verification

**Owner**: Engineering Lead

```bash
# 1. Verify production environment
vercel env ls --environment=production

# 2. Verify database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"

# 3. Verify payment provider (test mode)
curl https://api.stripe.com/v1/balance \
  -u $STRIPE_SECRET_KEY:

# 4. Verify monitoring
curl https://diaspora4bellefleur.com/api/health

# 5. Check latest backup
# (Via Vercel dashboard or provider console)
```

**Checklist:**
- [ ] All environment variables set
- [ ] Database accessible
- [ ] Payment provider responding
- [ ] Monitoring active
- [ ] Backup <24 hours old

### T-30 minutes: Announce Maintenance Window

**Owner**: Project Owner

**Message** (post to status page, social media, email waitlist):

> We're preparing to launch donation functionality. The site may be briefly unavailable during final setup. We expect to be fully operational within 30 minutes. Thank you for your patience and support!

### T-15 minutes: Database Migration (if needed)

**Owner**: Engineering Lead

```bash
# 1. Backup current database
# (Automatic via provider, verify completion)

# 2. Run any pending migrations
npm run db:migrate:deploy

# 3. Verify migration success
npx prisma db push --accept-data-loss=false
```

**Checklist:**
- [ ] Backup confirmed
- [ ] Migrations applied
- [ ] No data loss
- [ ] Schema matches expected

### T-10 minutes: Update Launch Gate

**Owner**: OWNER role user (via admin interface)

**Steps:**

1. Log in to `/admin/launch-control`
2. Review checklist (all items checked)
3. Verify candidacy status != UNVERIFIED
4. Change mode from WAITLIST to DONATIONS_LIVE
5. Confirm change
6. Verify mode updated

**Database verification:**
```sql
SELECT mode, updatedAt FROM "LaunchGate" ORDER BY updatedAt DESC LIMIT 1;
-- Should show: DONATIONS_LIVE, <current timestamp>
```

**Checklist:**
- [ ] Mode changed to DONATIONS_LIVE
- [ ] Change audit-logged
- [ ] No errors in logs

### T-5 minutes: Switch to Production Payment Keys

**Owner**: Engineering Lead

**CRITICAL**: This enables real money transactions

```bash
# 1. Update environment variables in Vercel
vercel env add STRIPE_SECRET_KEY production
# Enter: sk_live_... (PRODUCTION KEY, NOT TEST)

vercel env add STRIPE_PUBLISHABLE_KEY production
# Enter: pk_live_... (PRODUCTION KEY, NOT TEST)

# 2. Redeploy to apply new keys
vercel --prod

# 3. Verify deployment
vercel ls --prod
```

**Verification:**
```bash
# Check that production keys are active (look for sk_live_ prefix)
curl https://diaspora4bellefleur.com/api/config \
  | jq '.stripePublishableKey'
# Should start with: pk_live_
```

**Checklist:**
- [ ] Production keys set
- [ ] Deployment successful
- [ ] Keys verified
- [ ] Test mode disabled

### T-0: Launch Confirmation

**Owner**: All team members

**Smoke Test:**

1. Visit https://diaspora4bellefleur.com/en
2. Click "Contribute" button
3. Fill form with test amount ($5)
4. Verify form accessible (not blocked)
5. **DO NOT submit payment** (real money)

**Checklist:**
- [ ] Homepage loads (200)
- [ ] Contribute button visible
- [ ] Form accessible
- [ ] No console errors
- [ ] Affiliation disclosure visible

**Announcement** (post to status page, social media, email waitlist):

> 🎉 Donation functionality is now live! You can now support Jean Fritznel Bellefleur's campaign for Senator of Nord-Ouest. Every contribution, big or small, makes a difference. Thank you for being part of this movement!
> 
> [Link to contribute page]

---

## Post-Launch Monitoring (T+0 to T+72 hours)

### Immediate Monitoring (T+0 to T+4 hours)

**Owner**: Engineering Lead (primary), Project Owner (backup)

**Monitor every 15 minutes:**

1. **Uptime** (Better Uptime dashboard)
   - [ ] Site accessible
   - [ ] Response times normal (<2s)
   - [ ] No alerts

2. **Errors** (Sentry dashboard)
   - [ ] Error rate <1%
   - [ ] No payment processing errors
   - [ ] No database errors

3. **Logs** (Logtail)
   - [ ] No server errors
   - [ ] No webhook failures
   - [ ] No uncaught exceptions

4. **Payment Flow** (Stripe dashboard)
   - [ ] Payment intents creating successfully
   - [ ] Payments confirming
   - [ ] Webhooks processing
   - [ ] No unusual decline rates

5. **Database** (Vercel or provider dashboard)
   - [ ] Connection pool healthy
   - [ ] Query times normal
   - [ ] No locks or deadlocks

**Alert Thresholds (Immediate Action):**
- Error rate >5%
- Payment failure rate >10%
- Response time >5s (sustained)
- Database CPU >90%
- Any SEV-1 or SEV-2 incident

### Active Monitoring (T+4 to T+24 hours)

**Owner**: Rotating 4-hour shifts

**Monitor every 30 minutes:**
- All items from Immediate Monitoring (above)
- Contribution volume vs. expected
- Refund requests (should be rare)
- Support emails/inquiries
- Social media mentions

**Shift Schedule:**
- 00:00-04:00: [Name]
- 04:00-08:00: [Name]
- 08:00-12:00: [Name]
- 12:00-16:00: [Name]
- 16:00-20:00: [Name]
- 20:00-24:00: [Name]

### Watchful Monitoring (T+24 to T+72 hours)

**Owner**: Engineering Lead (primary)

**Monitor every 2 hours:**
- Error rate trends
- Payment success rate trends
- Performance metrics
- Contribution volume
- User feedback

---

## Rollback Procedure

**Use if**: Critical bug, payment failures >20%, data corruption, security breach

### Emergency Rollback

**Owner**: Engineering Lead (can be initiated by any team member)

**Steps:**

1. **Activate kill switch** (immediate, no approval needed)
   ```
   /admin/launch-control → Kill Switch → Activate
   Reason: [Brief description]
   ```

2. **Notify team** (Slack, email, phone)
   ```
   @channel LAUNCH ROLLBACK IN PROGRESS
   Reason: [Issue description]
   ETA: [Time to resolution]
   ```

3. **Switch back to test mode** (if payment issue)
   ```bash
   # Revert to test keys
   vercel env add STRIPE_SECRET_KEY production
   # Enter: sk_test_... (TEST KEY)
   
   vercel --prod
   ```

4. **Revert launch gate** (if kill switch insufficient)
   ```
   /admin/launch-control → Mode: WAITLIST
   Reason: [Rollback reason]
   ```

5. **Verify rollback**
   - [ ] Site accessible
   - [ ] Donations blocked
   - [ ] Test mode active (if applicable)
   - [ ] No new payment attempts

6. **Communication** (within 15 minutes)
   ```
   Status page: "We've temporarily disabled donations while we address a technical issue. Your existing contributions are safe and confirmed. We'll be back shortly."
   ```

7. **Root cause analysis**
   - Identify issue
   - Develop fix
   - Test fix in staging
   - Document incident (INCIDENT_RESPONSE.md)

8. **Re-launch decision**
   - Fix verified
   - Abbreviated go/no-go
   - Resume monitoring plan

**Rollback Checklist:**
- [ ] Kill switch activated
- [ ] Team notified
- [ ] Payment mode reverted (if needed)
- [ ] Launch gate reverted (if needed)
- [ ] Rollback verified
- [ ] Public communication sent
- [ ] Incident documented

---

## Kill Switch Procedure

**Use if**: Immediate emergency stop required (legal issue, security breach, critical bug)

### Activation

**Owner**: Any OWNER role user

**Steps:**

1. Log in to `/admin/launch-control`
2. Click "Kill Switch" button
3. Enter reason (required): [Brief description]
4. Confirm activation
5. Verify donations blocked immediately

**Effect:**
- All payment routes return 403 Forbidden
- Contribute button shows "Temporarily unavailable"
- In-flight checkouts fail gracefully with message
- Mode stays DONATIONS_LIVE (for audit trail)

**Notification:**
- Automatic alert to all team members
- Audit log entry created
- Status page updated (if configured)

### Deactivation

**Owner**: OWNER role user (after issue resolved)

**Requirements:**
- Issue identified and resolved
- Fix verified in staging
- Team consensus to resume
- Brief explanation documented

**Steps:**

1. Log in to `/admin/launch-control`
2. Review kill switch status and reason
3. Click "Deactivate Kill Switch"
4. Enter resolution notes
5. Confirm deactivation
6. Resume monitoring plan

---

## Communication Plan

### Internal Communication

**Slack channels:**
- `#launch` - Launch coordination
- `#alerts` - Monitoring alerts
- `#incidents` - Active incidents

**Key contacts:**
- Project Owner: [Name], [Phone], [Email]
- Engineering Lead: [Name], [Phone], [Email]
- Legal Counsel: [Name], [Phone], [Email]
- On-call rotation: [Link to PagerDuty or schedule]

### External Communication

**Channels:**
- Status page: https://status.diaspora4bellefleur.com
- Email: Waitlist subscribers
- Social media: Twitter, Facebook, Instagram
- Website banner: On-site notification

**Templates:**

**Launch Announcement:**
> 🎉 Great news! You can now support Jean Fritznel Bellefleur's campaign for Senator of Nord-Ouest with a secure online contribution. Every dollar helps us reach more voters and build a better future for our department.
> 
> Make your contribution today: [Link]
> 
> Thank you for being part of this movement!

**Issue Notification:**
> We're currently experiencing a technical issue with our donation system. We're working to resolve it as quickly as possible. Your patience and support mean the world to us.
> 
> Updates: [Status page link]

**Resolution Notification:**
> The issue with our donation system has been resolved. You can now contribute securely online. Thank you for your patience!
> 
> [Link to contribute]

---

## Post-Launch Debrief

**Date**: T+72 hours (3 days after launch)  
**Duration**: 60 minutes  
**Attendees**: All launch team members

### Agenda

1. **Metrics Review** (15 min)
   - Total contributions
   - Success rate
   - Average amount
   - Conversion rate
   - Error rate
   - Performance metrics

2. **What Went Well** (15 min)
   - Successes
   - Smooth processes
   - Team collaboration

3. **What Didn't Go Well** (15 min)
   - Issues encountered
   - Near-misses
   - Communication gaps

4. **Action Items** (10 min)
   - Process improvements
   - Technical debt
   - Documentation updates

5. **Next Steps** (5 min)
   - Ongoing monitoring plan
   - Feature roadmap
   - Team adjustments

### Deliverables

- [ ] Debrief notes documented
- [ ] Action items assigned
- [ ] Runbook updates made
- [ ] Lessons learned captured

---

## Appendices

### A. Emergency Contacts

| Role | Name | Phone | Email | Backup |
|------|------|-------|-------|--------|
| Project Owner | [TBD] | [TBD] | [TBD] | [TBD] |
| Engineering Lead | [TBD] | [TBD] | [TBD] | [TBD] |
| Legal Counsel | [TBD] | [TBD] | [TBD] | [TBD] |
| Compliance Lead | [TBD] | [TBD] | [TBD] | [TBD] |
| On-Call (Current) | [TBD] | [TBD] | [TBD] | - |

### B. Key URLs

- Production: https://diaspora4bellefleur.com
- Admin: https://diaspora4bellefleur.com/admin
- Status Page: https://status.diaspora4bellefleur.com
- Monitoring: [Sentry, Logtail, Better Uptime links]
- Stripe Dashboard: https://dashboard.stripe.com

### C. Credentials

**Stored in**: 1Password vault "Diaspora4Bellefleur Production"

- Vercel account
- Database admin
- Stripe account
- Email provider
- Monitoring services

### D. Launch Checklist Summary

**Total Items**: 40+  
**Completed**: ⏳  
**Remaining**: ⏳  
**Blockers**: ⏳

---

**Runbook Version**: 1.0  
**Last Updated**: [Date]  
**Next Review**: Post-launch debrief
