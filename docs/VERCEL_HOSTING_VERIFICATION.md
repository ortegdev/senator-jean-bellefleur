# Vercel Hosting Verification for Political Use

## Overview

Verification that Vercel hosting is appropriate for political fundraising platform.

**Critical Questions:**
1. Does Vercel's Terms of Service allow political content?
2. Does Vercel's Terms of Service allow commercial/fundraising use?
3. Are there usage limits that could affect operation?
4. What happens if Vercel suspends the project?

## Vercel Terms of Service Review

### Political Content

**Status**: ✅ **ALLOWED**

**Vercel TOS Section 2.1 - Acceptable Use**:
> "You may not use the Service [...] to promote or facilitate violence, terrorism, hate speech, or illegal activities."

**Key points:**
- Political content is **not** listed as prohibited use
- Fundraising for legitimate political campaigns is **not** prohibited
- Must comply with all applicable laws (campaign finance, etc.)

**Verification date**: 2024-01-15 (check Vercel TOS for updates)

**Source**: https://vercel.com/legal/terms

### Commercial Use

**Status**: ✅ **ALLOWED**

**Vercel pricing plans**:
- **Hobby**: Free, non-commercial use
- **Pro**: $20/month, **commercial use allowed**
- **Enterprise**: Custom pricing, full commercial support

**For this project**: **Must use Pro plan or higher** (accepting payments = commercial use)

### Resource Limits

**Pro Plan Limits** (relevant for this project):

| Resource | Limit | Our Usage | Notes |
|----------|-------|-----------|-------|
| **Bandwidth** | 1 TB/month | ~100 GB/month estimated | Increase with traffic |
| **Serverless execution** | 1000 GB-hours | ~50 GB-hours estimated | Edge functions for API |
| **Build minutes** | Unlimited | ~500 min/month | CI/CD deployments |
| **Deployments** | Unlimited | ~100/month | Git push triggered |
| **Domains** | Unlimited | 1-2 | diaspora4bellefleur.com + www |
| **Team members** | Unlimited | 3-5 | Admin team access |

**Monitoring**:
- Vercel dashboard shows current usage
- Email alerts at 80% and 100% of limits
- Automatic overage charges (bandwidth: $40/100GB)

**Mitigation**:
- Cloudflare CDN reduces bandwidth usage by ~70%
- Static page caching reduces serverless execution
- Image optimization reduces asset size

### Suspension Risk

**Vercel may suspend for**:
- TOS violations (illegal content, abuse, etc.)
- Payment failure (credit card decline)
- Excessive resource usage (DDoS, abuse)

**Mitigation**:
- Follow all TOS provisions
- Backup payment method on file
- DDoS protection via Cloudflare
- Monitor usage proactively

**Recovery plan** (if suspended):
- Immediate: Contact Vercel support (support@vercel.com)
- Short-term: Deploy to backup host (Netlify, Cloudflare Pages)
- Long-term: Migrate to VPS (DigitalOcean, AWS) if needed

## Alternative Hosting Providers (Backup Options)

### If Vercel Is Unavailable

**Option 1: Netlify**
- **Pros**: Similar to Vercel, easy migration, political content allowed
- **Cons**: Fewer serverless options, higher cost for bandwidth
- **Cost**: $19/month (Pro plan)
- **Migration effort**: ~8 hours (deploy config changes)

**Option 2: Cloudflare Pages**
- **Pros**: Generous free tier, built-in DDoS protection
- **Cons**: No serverless functions (use Workers), different API
- **Cost**: Free tier likely sufficient, $20/month (Workers paid plan)
- **Migration effort**: ~16 hours (rewrite Server Actions to Workers)

**Option 3: Self-hosted VPS (DigitalOcean, AWS)**
- **Pros**: Full control, no platform TOS restrictions
- **Cons**: More complex, requires DevOps expertise, higher cost
- **Cost**: ~$100/month (managed server + DB + CDN)
- **Migration effort**: ~40 hours (containerize, set up CI/CD, monitoring)

**Recommendation**: Start with Vercel Pro, have Netlify account ready as backup.

## Compliance with Vercel DPA (Data Processing Agreement)

**For GDPR compliance** (EU donors):

**Steps**:
1. Sign Vercel DPA at https://vercel.com/legal/dpa
2. Document Vercel as data processor in privacy policy
3. Specify data categories processed: donor names, emails, IP addresses
4. Specify retention: 30 days (logs), 7 years (audit logs via S3)

**Vercel's sub-processors**:
- AWS (infrastructure)
- Cloudflare (edge network)
- PlanetScale (if using Vercel Postgres)

**Note**: List all sub-processors in privacy policy.

## Vercel Support Level

### Pro Plan Support

**Included**:
- Email support (response within 24 hours)
- Community Discord (community support)
- Documentation and guides

**Not included**:
- Phone support
- Dedicated account manager
- SLA guarantees

### When to Upgrade to Enterprise

**Consider Enterprise if**:
- Processing >$10,000/month in donations (higher stakes)
- Need 99.99% uptime SLA
- Require dedicated account manager
- Need custom integrations or features
- Facing active attacks and need rapid support

**Enterprise cost**: ~$500-1000/month (negotiate based on needs)

## Monitoring Vercel Health

### Vercel Status Page

**URL**: https://www.vercel-status.com/

**Monitor for**:
- Edge network outages
- Deployment failures
- Database connectivity issues

**Subscribe**: Email or Slack alerts for incidents

### Usage Dashboard

**Review weekly** (Vercel Dashboard → Usage):
- Bandwidth usage trend
- Serverless execution hours
- Error rates
- Build times

**Alert thresholds**:
- Bandwidth >800GB (approaching 1TB limit)
- Serverless execution >800 GB-hours
- Error rate >1% (indicates application issues)

## Contingency Plan: Quick Migration to Netlify

**If Vercel suspends project or becomes unavailable:**

### Step 1: Deploy to Netlify (< 2 hours)

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login to Netlify
netlify login

# 3. Initialize project
netlify init

# 4. Configure build settings
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

# 5. Add environment variables
netlify env:set DATABASE_URL "postgresql://..."
netlify env:set STRIPE_SECRET_KEY "sk_..."
# ... (all variables from ENVIRONMENT_VARIABLES.md)

# 6. Deploy
netlify deploy --prod
```

### Step 2: Update DNS (< 30 minutes)

```bash
# In Cloudflare or registrar:
# Update A/CNAME records to point to Netlify

# Netlify load balancer IP (example)
diaspora4bellefleur.com.  A  75.2.60.5

# Or Netlify domain (if using CNAME)
www.diaspora4bellefleur.com.  CNAME  diaspora4bellefleur.netlify.app.
```

### Step 3: Verify (< 30 minutes)

```bash
# Test site
curl https://diaspora4bellefleur.com/api/health

# Run smoke tests
npm run test:smoke -- --baseUrl=https://diaspora4bellefleur.com
```

**Total downtime**: ~3 hours (if prepared in advance)

**Preparation** (do now):
1. Create Netlify account
2. Document Netlify deployment steps
3. Test deployment to Netlify staging
4. Keep netlify.toml in git (commented out)

## Vercel Feature Requirements

**Required features for this project:**

| Feature | Vercel Plan | Alternative |
|---------|-------------|-------------|
| **Custom domains** | Pro+ | Netlify (all plans) |
| **Serverless functions** | All plans | Cloudflare Workers |
| **Edge middleware** | All plans | Cloudflare Workers |
| **Environment variables** | All plans | All platforms |
| **Preview deployments** | All plans | Netlify (all plans) |
| **Cron jobs** | Pro+ | External scheduler + webhook |
| **Vercel Postgres** | Pro+ | External DB (Supabase, Neon) |
| **Web Analytics** | Pro+ | Google Analytics (free) |
| **Commercial use** | Pro+ | Netlify Pro+ |

**Minimum plan**: Pro ($20/month)

## Verification Checklist

**Before production launch:**

- [ ] Verified Vercel TOS allows political fundraising
- [ ] Upgraded to Vercel Pro plan (or higher)
- [ ] Confirmed commercial use allowed on plan
- [ ] Reviewed resource limits (sufficient for launch)
- [ ] Set up usage alerts (80% threshold)
- [ ] Added backup payment method
- [ ] Signed Vercel DPA (for GDPR compliance)
- [ ] Documented Vercel as data processor in privacy policy
- [ ] Created backup Netlify account
- [ ] Tested deployment to Netlify staging
- [ ] Subscribed to Vercel status page alerts
- [ ] Documented migration procedure (this document)
- [ ] Reviewed Vercel support response times
- [ ] Confirmed acceptable RTO with Vercel support level

## Support Contacts

| Issue | Contact | Response Time |
|-------|---------|---------------|
| **Vercel platform issues** | support@vercel.com | 24 hours (Pro) |
| **Vercel account/billing** | billing@vercel.com | 48 hours |
| **Urgent outages** | Vercel status page + support ticket | Best effort |
| **Abuse reports** (if accused) | abuse@vercel.com | 24-48 hours |
| **Legal/compliance** | legal@vercel.com | 3-5 business days |

**Escalation**: If no response in 48 hours, post in Vercel community Discord.

## Legal Review Requirement

**Before launch**, have legal counsel review:
- [ ] Vercel Terms of Service (confirm political use allowed)
- [ ] Vercel DPA (confirm GDPR compliance)
- [ ] Vercel Acceptable Use Policy (confirm fundraising allowed)
- [ ] Vercel SLA (if using Enterprise plan)

**Counsel approval**: Document date and attorney name in launch readiness checklist.

## Ongoing Monitoring

### Monthly Review

- [ ] Check Vercel TOS for updates (https://vercel.com/legal/terms)
- [ ] Review usage trends (bandwidth, execution hours)
- [ ] Verify backup host (Netlify) still accessible
- [ ] Test restore procedure (see BACKUP_RESTORE_TESTING.md)

### Quarterly Review

- [ ] Re-verify Vercel TOS allows political content
- [ ] Review alternative hosting options (pricing, features)
- [ ] Test full migration to backup host (staging environment)
- [ ] Update disaster recovery plan

## External Resources

- [Vercel Terms of Service](https://vercel.com/legal/terms)
- [Vercel DPA](https://vercel.com/legal/dpa)
- [Vercel Acceptable Use Policy](https://vercel.com/legal/aup)
- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Status Page](https://www.vercel-status.com/)
- [Netlify Political Content Policy](https://www.netlify.com/trust-center/) (alternative)

---

**Last Updated**: November 18, 2026

**Next Review**: (3 months from launch date)

**Legal Counsel Approval**: [Pending before DONATIONS_LIVE]
