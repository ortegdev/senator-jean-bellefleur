# Web Application Firewall (WAF) Configuration

## Overview

WAF protection for the platform to mitigate common attacks: SQL injection, XSS, DDoS, bot traffic, and brute-force attempts.

**Options:**
1. **Cloudflare** (recommended for most features)
2. **Vercel Firewall** (native integration)
3. **AWS WAF** (if using AWS resources)

## Cloudflare WAF (Recommended)

### Why Cloudflare

- Free tier includes basic DDoS protection
- Bot management (challenge suspicious traffic)
- Rate limiting for API endpoints
- Managed rulesets for common vulnerabilities
- Global CDN for faster load times

### Setup

**1. Create Cloudflare account:**
- Sign up at https://cloudflare.com
- Add domain: `diaspora4bellefleur.com`

**2. Update nameservers at registrar:**
- Copy Cloudflare nameservers (e.g., `ava.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
- Update nameservers at domain registrar
- Wait 24-48 hours for propagation

**3. SSL/TLS settings:**
- SSL/TLS → Overview → Mode: **Full (strict)**
- SSL/TLS → Edge Certificates → Always Use HTTPS: **On**
- SSL/TLS → Edge Certificates → Minimum TLS Version: **TLS 1.2**
- SSL/TLS → Edge Certificates → Opportunistic Encryption: **On**
- SSL/TLS → Edge Certificates → TLS 1.3: **On**

**4. Configure Vercel integration:**

In Vercel project settings:
- Settings → Domains → Add domain
- Follow Cloudflare integration instructions
- Enable Cloudflare Proxy (orange cloud)

**Vercel DNS records:**
```dns
; A record
diaspora4bellefleur.com.  A  76.76.21.21  ; Proxied (orange cloud)

; CNAME for www
www.diaspora4bellefleur.com.  CNAME  cname.vercel-dns.com.  ; Proxied
```

### Managed Rules

**Security → WAF → Managed rules → Add rule:**

1. **Cloudflare Managed Ruleset**
   - Mode: **On**
   - All rules enabled
   - Protects against: OWASP Top 10, known CVEs

2. **Cloudflare OWASP Core Ruleset**
   - Mode: **On**
   - Sensitivity: **Medium**
   - Protects against: SQL injection, XSS, LFI, RFI

3. **Cloudflare Exposed Credentials Check**
   - Mode: **On**
   - Action: **Block**
   - Blocks logins with leaked credentials

### Rate Limiting

**Security → WAF → Rate limiting rules:**

**1. Admin login protection:**
```
Rule name: Limit admin login attempts
Expression: (http.request.uri.path eq "/admin/login" and http.request.method eq "POST")
Rate: 5 requests per 5 minutes
Action: Block for 1 hour
```

**2. Contribution form protection:**
```
Rule name: Limit contribution submissions
Expression: (http.request.uri.path contains "/contribute" and http.request.method eq "POST")
Rate: 10 requests per 10 minutes per IP
Action: Challenge (CAPTCHA)
```

**3. API rate limiting:**
```
Rule name: General API rate limit
Expression: (http.request.uri.path starts_with "/api/")
Rate: 100 requests per 1 minute per IP
Action: Block for 1 minute
```

**4. Global rate limit:**
```
Rule name: Aggressive request rate
Expression: (http.request.uri.path ne "/health")
Rate: 300 requests per 5 minutes per IP
Action: Challenge
```

### Custom Rules

**Security → WAF → Custom rules:**

**1. Block known bad bots:**
```yaml
Rule name: Block malicious bots
Expression: (cf.client.bot) and (not cf.verified_bot_category in {"Search Engine Crawler" "Monitor"})
Action: Block
```

**2. Geo-blocking (if required):**
```yaml
Rule name: Allow specific countries only
Expression: (ip.geoip.country ne "US" and ip.geoip.country ne "CA" and ip.geoip.country ne "HT" and ip.geoip.country ne "FR")
Action: Challenge
# Note: Only enable if legal counsel confirms compliance benefit > diaspora exclusion harm
```

**3. Block admin access from unexpected countries:**
```yaml
Rule name: Restrict admin access geography
Expression: (http.request.uri.path starts_with "/admin") and (ip.geoip.country ne "US" and ip.geoip.country ne "CA")
Action: Block
Description: Admin team only operates from US/Canada
```

**4. Protect against SQL injection:**
```yaml
Rule name: Block SQL injection attempts
Expression: (http.request.uri.query contains "UNION" or http.request.uri.query contains "SELECT" or http.request.body.raw contains "DROP TABLE")
Action: Block
```

**5. Block admin access outside business hours (optional):**
```yaml
Rule name: Admin access time restriction
Expression: (http.request.uri.path starts_with "/admin") and (http.request.timestamp.hour lt 6 or http.request.timestamp.hour gt 22)
Action: Challenge
# Note: Only enable if admin team agrees (may interfere with emergency access)
```

### Bot Management

**Security → Bots:**

- **Bot Fight Mode**: **On** (free tier)
- **Super Bot Fight Mode**: **On** (if on Pro plan)
- **Verified Bots**: **Allow** (Google, Bing, etc.)
- **Definitely automated**: **Block**
- **Likely automated**: **Challenge**

**Exceptions:**
- Allow: `/api/health` (for uptime monitoring)
- Allow: `/.well-known/` (for security.txt, etc.)

### DDoS Protection

**Security → DDoS:**

- **HTTP DDoS Attack Protection**: **On** (automatic, free)
- **Network-layer DDoS Attack Protection**: **On** (automatic, free)
- **Advanced TCP Protection**: **On** (if on Pro plan)

**Sensitivity**: **Medium** (adjust if false positives occur)

### Page Rules (Caching)

**Rules → Page Rules:**

**1. Cache everything (static assets):**
```
URL: diaspora4bellefleur.com/assets/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month
```

**2. Bypass cache (admin, API, donations):**
```
URL: diaspora4bellefleur.com/admin/*
Settings:
  - Cache Level: Bypass

URL: diaspora4bellefleur.com/api/*
Settings:
  - Cache Level: Bypass (except health check)

URL: diaspora4bellefleur.com/*/contribute*
Settings:
  - Cache Level: Bypass
```

**3. Cache API health check:**
```
URL: diaspora4bellefleur.com/api/health
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 minute
```

### Security Headers

**Already set in middleware.ts**, but can add as backup in Cloudflare:

**Transform Rules → Modify Response Header:**

```yaml
Rule name: Security headers backup
Expression: (http.request.uri.path ne "/admin")
Actions:
  - Set X-Frame-Options: DENY
  - Set X-Content-Type-Options: nosniff
  - Set Referrer-Policy: strict-origin-when-cross-origin
```

### Analytics and Logging

**Analytics → Security:**
- Review blocked requests
- Identify false positives
- Adjust rules as needed

**Logs → Logpush** (Pro plan):
- Push WAF logs to external service (Logtail, S3)
- Filter: `EdgeFirewallAction` = "block" or "challenge"

### Testing WAF Rules

```bash
# Test rate limiting (should block after threshold)
for i in {1..10}; do
  curl -X POST https://diaspora4bellefleur.com/admin/login \
    -d "email=test@example.com&password=test"
done
# Expected: First 5 succeed, rest blocked with 429

# Test SQL injection detection (should be blocked)
curl "https://diaspora4bellefleur.com/api/search?q=1' UNION SELECT * FROM users--"
# Expected: 403 Forbidden

# Test bot challenge (should get challenged)
curl -A "BadBot/1.0" https://diaspora4bellefleur.com/
# Expected: Challenge page or 403
```

## Vercel Firewall (Alternative/Additional)

### Vercel WAF Features

**Available on Enterprise plan only:**
- DDoS protection (included)
- Attack Challenge Mode
- IP blocking
- Geo-blocking
- Rate limiting (limited)

**Setup:**
- Vercel Dashboard → Project → Settings → Firewall
- Configure rules via dashboard

**Limitations:**
- Less granular than Cloudflare
- Higher cost (Enterprise plan required)
- No managed rulesets

**Recommendation**: Use Cloudflare for comprehensive WAF, Vercel for deployment-level protection.

## AWS WAF (If Using AWS Resources)

### When to Use

- If hosting media/backups on S3
- If using CloudFront CDN instead of Cloudflare
- If already using AWS infrastructure

### Setup

**1. Create Web ACL:**
```bash
aws wafv2 create-web-acl \
  --name diaspora4bellefleur-waf \
  --scope CLOUDFRONT \
  --default-action Block={} \
  --rules file://waf-rules.json \
  --region us-east-1
```

**2. Attach to CloudFront distribution:**
```bash
aws cloudfront update-distribution \
  --id E1234567890 \
  --web-acl-arn arn:aws:wafv2:...
```

**3. Managed rule groups:**
- AWSManagedRulesCommonRuleSet (OWASP Top 10)
- AWSManagedRulesKnownBadInputsRuleSet (known attack patterns)
- AWSManagedRulesBotControlRuleSet (bot protection)
- AWSManagedRulesAnonymousIpList (Tor, proxies, VPNs)

**Cost**: $5/month + $1/million requests

## Monitoring and Alerting

### Cloudflare Alerts

**Notifications → Destinations:**
- Add email: SUPPORT_EMAIL
- Add webhook: Slack #alerts channel (optional)

**Notifications → Add:**

1. **DDoS attack detected**
   - Alert on: HTTP DDoS attack
   - Severity: High
   - Destination: Email + Slack

2. **Unusual traffic spike**
   - Alert on: Traffic increase >300% from baseline
   - Severity: Medium
   - Destination: Email

3. **Many requests blocked**
   - Alert on: >100 requests blocked in 5 minutes
   - Severity: Medium
   - Destination: Email

4. **Origin server down**
   - Alert on: All origin servers unhealthy
   - Severity: Critical
   - Destination: Email + Slack + SMS

### Log Analysis

**Weekly review (in Cloudflare Analytics):**
- Top blocked countries (verify expected)
- Top blocked IPs (check for false positives)
- Top blocked URIs (identify attack targets)
- Bot traffic patterns
- Rate limit triggers

**Action items:**
- Whitelist legitimate IPs if needed
- Adjust rate limits if too strict
- Document attack patterns
- Report persistent attackers to abuse@hosting-provider.com

## False Positive Handling

### Identifying False Positives

**Symptoms:**
- Legitimate users report 403 errors
- Forms don't submit
- Login failures for valid credentials
- Slow page loads (excessive challenges)

**Diagnosis:**
1. Check Cloudflare Security Events
2. Filter by user's IP address
3. Identify triggered rule
4. Review request details

### Allowlisting

**Security → WAF → Custom rules → Create exception:**

```yaml
Rule name: Allowlist trusted IPs
Expression: (ip.src in {1.2.3.4 5.6.7.8})
Action: Skip (all WAF rules)
Description: Office IPs, admin team
```

**Or per-rule exceptions:**

```yaml
Rule name: Exception for admin form
Expression: (http.request.uri.path eq "/admin/settings" and ip.src in {1.2.3.4})
Action: Skip (rate limiting only)
```

### Testing After Changes

```bash
# Test from allowlisted IP
curl -X POST https://diaspora4bellefleur.com/admin/login \
  --data "..." \
  -H "X-Forwarded-For: 1.2.3.4"

# Should succeed even if rate limit reached
```

## Performance Impact

### Expected Performance Gains

- **CDN caching**: 30-50% faster load times globally
- **DDoS mitigation**: Site stays up during attacks
- **Bot blocking**: Reduced server load, lower costs

### Potential Issues

- **Challenge pages**: May frustrate legitimate users (tune bot sensitivity)
- **Rate limiting**: May block legitimate heavy users (adjust thresholds)
- **Geo-blocking**: May exclude diaspora members (avoid unless legally required)

### Optimization

1. **Cache static assets aggressively**
   - Images, CSS, JS cached at edge
   - Reduces origin requests by 70-80%

2. **Smart tiered caching**
   - Frequently accessed pages cached briefly (1-5 minutes)
   - Rare pages fetch from origin

3. **Argo Smart Routing** (Cloudflare Pro):
   - Optimizes routing to origin
   - 30% faster on average

## Security Posture Levels

### Level 1: Launch (Minimum Viable Security)

- ✅ Cloudflare Managed Rules (On)
- ✅ Rate limiting (admin, contribution forms)
- ✅ Bot Fight Mode (On)
- ✅ HTTPS enforcement
- ✅ DDoS protection (automatic)

**Effort**: 2 hours setup  
**Cost**: $0 (free tier)

### Level 2: Production (Recommended)

- ✅ All Level 1 protections
- ✅ Custom WAF rules (SQL injection, XSS)
- ✅ Admin geo-restrictions
- ✅ Enhanced bot management
- ✅ Security event monitoring
- ✅ Cloudflare Pro plan features

**Effort**: +4 hours setup, 1 hour/week monitoring  
**Cost**: $20/month (Cloudflare Pro)

### Level 3: High-Profile Target (Maximum Security)

- ✅ All Level 2 protections
- ✅ Advanced DDoS protection
- ✅ Magic Transit (network-layer protection)
- ✅ Custom rate limiting per user role
- ✅ 24/7 security monitoring
- ✅ Cloudflare Business or Enterprise plan

**Effort**: +8 hours setup, dedicated security engineer  
**Cost**: $200+/month (Cloudflare Business) or custom (Enterprise)

**Recommendation for launch**: Start with Level 1, upgrade to Level 2 after first successful donation, Level 3 only if under active attack.

## Incident Response

### If Site Is Under Attack

**1. Enable "I'm Under Attack" mode:**
- Cloudflare → Security → Settings
- Enable "I'm Under Attack Mode"
- All visitors get JS challenge page
- Blocks most automated attacks immediately

**2. Review Security Events:**
- Identify attack vector (DDoS, bot flood, vulnerability scan)
- Find attacker IPs/countries
- Check targeted endpoints

**3. Apply targeted blocks:**
- Block attacker IP ranges
- Block attacker countries (temporary)
- Increase rate limits on attacked endpoints

**4. Notify hosting provider:**
- If attack overwhelms WAF, contact Vercel support
- May need to scale infrastructure

**5. Document and review:**
- Export security event logs
- Create incident report (see INCIDENT_RESPONSE.md)
- Adjust WAF rules to prevent recurrence

### If WAF Blocks Legitimate Users

**1. Immediate mitigation:**
- Add user's IP to allowlist temporarily
- Or: Lower WAF sensitivity temporarily

**2. Root cause analysis:**
- Review triggered rule
- Check if rule too strict
- Verify user behavior is legitimate

**3. Permanent fix:**
- Adjust rule threshold
- Add exception for specific path
- Or: Change rule action from Block to Challenge

## Compliance Considerations

### GDPR (EU Donors)

- Cloudflare acts as data processor
- Sign Cloudflare DPA: https://www.cloudflare.com/cloudflare-customer-dpa/
- Log retention: 7 days (free tier), 30 days (Pro+)
- User IP addresses logged (necessary for security)

### Campaign Finance Law (Haiti)

- WAF logs may contain donor IP addresses
- Retain WAF logs per audit requirements
- Export logs monthly to S3 for long-term storage

### Accessibility

- Ensure challenge pages are accessible
- Test with screen readers
- Provide alternative contact method if blocked (email, phone)

## Cost Summary

| Service | Free Tier | Pro Tier | Business Tier |
|---------|-----------|----------|---------------|
| **Cloudflare** | $0 | $20/mo | $200/mo |
| Features (Free) | Basic DDoS, 5 rules | Advanced DDoS, 125 rules | Custom rules, 24/7 support |
| **Vercel Firewall** | Included (basic) | Included | Enterprise only |
| **AWS WAF** | N/A | ~$20/mo | ~$50/mo |

**Recommendation**: Start with Cloudflare Free, upgrade to Pro after first $500 in donations.

## External Resources

- [Cloudflare WAF Docs](https://developers.cloudflare.com/waf/)
- [Vercel Firewall Docs](https://vercel.com/docs/security/vercel-firewall)
- [AWS WAF Docs](https://docs.aws.amazon.com/waf/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Security Center](https://dash.cloudflare.com/?to=/:account/security-center)

---

**Last Updated**: November 18, 2026
