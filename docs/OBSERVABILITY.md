# Observability Guide

## Overview

Structured logging, error tracking, and uptime monitoring for the platform.

**Goals:**
- Detect and diagnose issues quickly
- Alert on payment failures and anomalies
- Maintain audit trail with PII protection
- Monitor performance and uptime

## Architecture

```
┌─────────────────────────────────────────────┐
│                                             │
│  Application                                │
│                                             │
│  ┌──────────┐    ┌─────────────┐          │
│  │  Logger  │───▶│  Structured │          │
│  │          │    │  JSON Logs  │          │
│  └──────────┘    └─────────────┘          │
│                          │                  │
│  ┌──────────┐            │                 │
│  │  Monitor │            │                 │
│  │   ing    │            │                 │
│  └──────────┘            │                 │
│       │                  │                 │
└───────┼──────────────────┼─────────────────┘
        │                  │
        │                  ▼
        │         ┌──────────────────┐
        │         │  Vercel Logs     │
        │         │  (stdout)        │
        │         └──────────────────┘
        │                  │
        │                  ▼
        │         ┌──────────────────┐
        │         │  Logtail         │
        │         │  (log aggregation)│
        │         └──────────────────┘
        │
        ▼
┌──────────────────┐
│  Sentry          │
│  (error tracking)│
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Alerts          │
│  (email/Slack)   │
└──────────────────┘
```

## Structured Logging

### Usage

```typescript
import { logger } from '@/lib/observability/logger'

// Info logging
logger.info('User signup completed', {
  userId: '123',
  email: 'user@example.com', // Will be scrubbed to [EMAIL_REDACTED]
})

// Error logging
try {
  await processPayment(data)
} catch (error) {
  logger.error('Payment processing failed', {
    error,
    contributionId: data.id,
  })
}

// Request-scoped logging
const requestLogger = logger.child(requestId)
requestLogger.info('Processing contribution', { amountCents: 5000 })
```

### Log Levels

- **debug**: Verbose debugging (development only)
- **info**: Normal operations
- **warn**: Warning conditions
- **error**: Error conditions requiring attention

**Configuration:**
```env
LOG_LEVEL=info # debug | info | warn | error
```

### PII Scrubbing

Automatically removes sensitive data from logs:

**Patterns:**
- Email addresses → `[EMAIL_REDACTED]`
- Phone numbers → `[PHONE_REDACTED]`
- Credit cards → `[CARD_REDACTED]`
- SSN → `[SSN_REDACTED]`

**Sensitive fields:**
- password, token, secret, apiKey
- cardNumber, cvv, ssn, taxId
- passportNumber, encryptionKey

**Example:**
```typescript
logger.info('User contact', {
  email: 'john@example.com',      // → [EMAIL_REDACTED]
  phone: '+509 1234 5678',        // → [PHONE_REDACTED]
  name: 'John Doe',               // → John Doe (preserved)
})
```

### Log Format

```json
{
  "timestamp": "2026-11-18T14:32:00.123Z",
  "level": "info",
  "message": "Payment completed",
  "context": {
    "contributionId": "clx123abc",
    "amountCents": 5000,
    "provider": "stripe"
  },
  "environment": "production",
  "service": "diaspora4bellefleur",
  "version": "a7c3f21",
  "requestId": "req_xyz789"
}
```

## Error Tracking

### Sentry Integration

**Setup:**
1. Create Sentry project at https://sentry.io
2. Add environment variables:
   ```env
   SENTRY_DSN=https://...@sentry.io/...
   SENTRY_ORG=your-org
   SENTRY_PROJECT=diaspora4bellefleur
   ```
3. Deploy (Sentry initializes automatically via `instrumentation.ts`)

### Usage

```typescript
import { monitoring } from '@/lib/observability/monitoring'

// Capture errors
try {
  await riskyOperation()
} catch (error) {
  monitoring.captureError(error, {
    contributionId: '123',
    userId: 'abc',
  })
}

// Track messages
monitoring.captureMessage('Unusual activity detected', 'warning', {
  pattern: 'rapid_contributions',
  count: 15,
})

// Set user context (admin users only)
monitoring.setUserContext({
  id: admin.id,
  email: admin.email,
  role: admin.role,
})

// Clear on logout
monitoring.clearUserContext()
```

### Payment Funnel Tracking

Track conversion rates and failures:

```typescript
// Step 1: User starts contribution flow
monitoring.trackPaymentFunnel({
  step: 'started',
  amountCents: 5000,
})

// Step 2: Form completed
monitoring.trackPaymentFunnel({
  step: 'form_completed',
  contributionId: 'clx123',
})

// Step 3: Payment initiated
monitoring.trackPaymentFunnel({
  step: 'payment_initiated',
  contributionId: 'clx123',
  provider: 'stripe',
})

// Step 4a: Success
monitoring.trackPaymentFunnel({
  step: 'payment_completed',
  contributionId: 'clx123',
  duration: 2300, // ms
})

// Step 4b: Failure (triggers alert)
monitoring.trackPaymentFunnel({
  step: 'payment_failed',
  contributionId: 'clx123',
  errorCode: 'card_declined',
  errorMessage: 'Insufficient funds',
  provider: 'stripe',
})
```

**Alert triggers:**
- Payment failure rate > 5% in 1 hour
- Funnel drop-off > 50% at any step
- Zero successful payments in 1 hour (during business hours)

## Uptime Monitoring

### Better Uptime

**Recommended service:** https://betteruptime.com (free tier available)

**Setup:**
1. Create account at betteruptime.com
2. Add HTTP monitor:
   - **URL**: `https://diaspora4bellefleur.com/api/health`
   - **Method**: GET
   - **Interval**: 1 minute
   - **Expected status**: 200
   - **Timeout**: 10 seconds
3. Add status page (public):
   - `https://status.diaspora4bellefleur.com`
4. Configure alerts:
   - Email: SUPPORT_EMAIL
   - SMS: On-call engineer (optional)
   - Slack: #alerts channel (optional)

**Monitors to create:**
- Homepage: `GET /` (expect 200)
- Health check: `GET /api/health` (expect 200, <500ms)
- Contribution form: `GET /[locale]/contribute` (expect 200)
- Admin login: `GET /admin/login` (expect 200)

**Alert conditions:**
- Down: 2 consecutive failures
- Slow: Response time > 5 seconds
- Degraded: Response time > 2 seconds

### Health Check Endpoint

**Implementation:**
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`
    
    const duration = Date.now() - start
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'up',
      },
      responseTime: duration,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'down',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-11-18T14:32:00.123Z",
  "checks": {
    "database": "up"
  },
  "responseTime": 45
}
```

## Alerts

### Payment Funnel Alerts

**Configured in Sentry:**

1. **Payment Failure Alert**
   - **Condition**: `payment_failed` event count > 5 in 1 hour
   - **Severity**: Medium
   - **Action**: Email to SUPPORT_EMAIL
   - **Escalation**: If > 20/hour, page on-call

2. **Zero Payments Alert**
   - **Condition**: No `payment_completed` events for 2 hours during 9am-9pm EST
   - **Severity**: High
   - **Action**: Immediate notification

3. **High Decline Rate Alert**
   - **Condition**: Decline rate > 10% (trailing 1 hour)
   - **Severity**: Medium
   - **Action**: Email to SUPPORT_EMAIL

4. **Funnel Drop-off Alert**
   - **Condition**: <50% conversion from `form_completed` to `payment_initiated`
   - **Severity**: Low
   - **Action**: Daily digest

### Uptime Alerts

**Configured in Better Uptime:**

1. **Site Down**
   - **Condition**: 2 consecutive failures
   - **Severity**: Critical
   - **Action**: Email + SMS + Slack

2. **Slow Response**
   - **Condition**: Response time > 5s
   - **Severity**: Medium
   - **Action**: Email

3. **Health Check Fail**
   - **Condition**: `/api/health` returns 503
   - **Severity**: High
   - **Action**: Email + Slack

### Error Rate Alerts

**Configured in Sentry:**

1. **Error Spike**
   - **Condition**: Error count > 50 in 5 minutes
   - **Severity**: High
   - **Action**: Email to engineering

2. **New Error Type**
   - **Condition**: First occurrence of error
   - **Severity**: Low
   - **Action**: Slack notification

3. **Recurring Error**
   - **Condition**: Same error > 100 times in 24 hours
   - **Severity**: Medium
   - **Action**: Create Jira ticket

## Log Aggregation

### Logtail Setup

**Recommended service:** https://logtail.com (Better Stack)

**Integration:**
1. Create Logtail account
2. Add source: "Vercel"
3. Copy source token
4. Add to Vercel environment:
   ```env
   LOGTAIL_SOURCE_TOKEN=...
   ```
5. Deploy (Vercel automatically sends logs to Logtail)

**No code changes needed** - Vercel integration is automatic.

### Log Queries

**Common queries in Logtail:**

```sql
-- Payment failures in last hour
level:error AND message:"Payment" AND context.step:payment_failed

-- Admin login attempts
message:"Admin login" AND context.role:OWNER

-- Slow database queries
level:warn AND message:"Slow query" AND context.duration:>1000

-- Contribution completions
level:info AND message:"Payment funnel: payment_completed"

-- Error rate by path
level:error | stats count() by context.path
```

### Retention

- **Logtail free tier**: 7 days, 1 GB/month
- **Paid tier**: 30 days, unlimited
- **Audit logs**: Backed up daily to S3, kept 7 years

## Performance Monitoring

### Metrics to Track

1. **Page load time**
   - Target: <3s (Lighthouse)
   - Alert: >5s for 5 consecutive requests

2. **API response time**
   - Target: <500ms (p95)
   - Alert: >2s (p95) for 5 minutes

3. **Database query time**
   - Target: <100ms (p95)
   - Alert: >1s (p95) for 5 minutes

4. **Payment processing time**
   - Target: <3s (end-to-end)
   - Alert: >10s or timeouts

### Web Vitals

Track Core Web Vitals automatically:

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

**Metrics:**
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

**Dashboard**: https://vercel.com/your-team/project/analytics

## Debugging Production Issues

### Step 1: Check Uptime Monitor

- Go to Better Uptime dashboard
- Check if site is responding
- Review response times

### Step 2: Check Error Tracking

- Go to Sentry dashboard
- Filter by time range
- Review recent errors
- Check breadcrumbs for context

### Step 3: Query Logs

- Go to Logtail dashboard
- Search for relevant logs by requestId or timestamp
- Filter by level (error, warn)
- Correlate with Sentry errors

### Step 4: Check Payment Provider

- Stripe Dashboard → Events
- Look for webhook failures
- Check for unusual decline patterns

### Step 5: Check Database

- Vercel Dashboard → Storage → Metrics
- Check connection pool usage
- Check slow query logs
- Verify backup status

## Security Considerations

### Log Retention

- **Application logs**: 30 days in Logtail
- **Error events**: 90 days in Sentry
- **Audit logs**: 7 years in S3 (encrypted)

### Access Control

- **Logtail**: Only admins with OWNER or COMPLIANCE role
- **Sentry**: Engineering team + on-call rotation
- **Better Uptime**: Operations team
- **S3 audit backups**: Finance + Compliance teams

### PII Protection

- All logs scrubbed before sending
- No credit card data logged
- Email addresses redacted
- Phone numbers redacted
- IP addresses logged only for audit trail (admin actions)

### Compliance

- Logs may contain donation metadata (amounts, timestamps)
- Logs do not contain payment instrument details
- Audit logs retained per Haiti election law (7 years)
- GDPR: Donors can request deletion from operational logs (not audit logs)

## Cost Estimates

### Observability Stack

**Logtail** (Better Stack):
- Free tier: 7 days, 1 GB/month → $0
- Paid: 30 days, 10 GB/month → $20/month

**Sentry**:
- Free tier: 5k errors/month → $0 (sufficient for launch)
- Paid: 50k errors/month → $26/month

**Better Uptime**:
- Free tier: 10 monitors, 1-min checks → $0
- Paid: 30 monitors, SMS alerts → $18/month

**Vercel Analytics**:
- Included with Pro plan → $0 (already paying)

**Total estimated**: $0 - $64/month depending on tier

### Optimization Tips

1. **Log sampling**: Only log 10% of info-level requests in production
2. **Error grouping**: Enable in Sentry to avoid duplicate alerts
3. **Alert throttling**: Max 1 alert per issue per hour
4. **Archive old logs**: Move audit logs to cheaper S3 storage after 90 days

## Testing Observability

### Local Testing

```bash
# Start app with observability
npm run dev

# Trigger test error
curl http://localhost:3000/api/test-error

# Check logs in terminal (should see structured JSON)

# Check Sentry (errors should appear if DSN configured)
```

### Staging Testing

```bash
# Deploy to staging
git push origin staging

# Run smoke tests
npm run test:smoke

# Check Logtail for structured logs
# Check Sentry for errors (should be none from smoke tests)
# Check Better Uptime for uptime checks
```

### Production Monitoring

```bash
# Check health endpoint
curl https://diaspora4bellefleur.com/api/health

# Expected response:
# {"status":"ok","timestamp":"...","checks":{"database":"up"},"responseTime":45}

# Check status page
open https://status.diaspora4bellefleur.com
```

## Runbook References

For specific incident responses, see:
- [Incident Response Runbook](./INCIDENT_RESPONSE.md)
- [Database Recovery](./DATABASE.md#backup-and-recovery)
- [Payment Failures](./PAYMENT_PROVIDERS.md#troubleshooting)

## External Links

- [Sentry Documentation](https://docs.sentry.io/)
- [Logtail Documentation](https://logtail.com/docs/)
- [Better Uptime Documentation](https://betteruptime.com/docs)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Web Vitals](https://web.dev/vitals/)

---

**Last Updated**: November 18, 2026
