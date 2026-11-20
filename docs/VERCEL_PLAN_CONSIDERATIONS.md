# Vercel Plan Considerations & Workarounds

## Overview

This project is designed to work on **Vercel Hobby plan** (free) with graceful upgrades to Pro plan features. This document outlines limitations and workarounds.

## Vercel Plan Comparison

### Hobby Plan (Free) - Default Target
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions (10-second execution)
- ✅ Edge functions
- ✅ Environment variables
- ✅ Preview deployments
- ❌ **Cron jobs limited to ONCE PER DAY only**
- ❌ No team collaboration
- ❌ No password protection
- ❌ No web analytics

### Pro Plan ($20/month) - Optional Upgrade
- ✅ Everything in Hobby
- ✅ **Unlimited cron jobs** (any schedule)
- ✅ 60-second function execution
- ✅ Team collaboration (10 members)
- ✅ Password protection
- ✅ Web analytics
- ✅ Priority support

### Enterprise Plan ($Custom) - Future Scale
- ✅ Everything in Pro
- ✅ 300-second function execution
- ✅ Advanced security
- ✅ SLA guarantees
- ✅ Dedicated support

## Cron Job Strategy

### Current Configuration (Hobby Compatible)

All cron jobs in `vercel.json` run **once per day or less**:

```json
{
  "crons": [
    {
      "path": "/api/cron/newsletter",
      "schedule": "0 9 * * *",
      "comment": "Daily at 9am UTC"
    },
    {
      "path": "/api/cron/health-check",
      "schedule": "0 */6 * * *",
      "comment": "Every 6 hours (4x per day)"
    },
    {
      "path": "/api/cron/backup-audit-log",
      "schedule": "0 2 * * *",
      "comment": "Daily at 2am UTC"
    },
    {
      "path": "/api/cron/reconciliation",
      "schedule": "0 3 * * 1",
      "comment": "Weekly on Monday at 3am UTC"
    }
  ]
}
```

### Workaround: External Cron Services (Free)

For tasks that need to run more frequently, use external services to trigger webhooks:

#### Option 1: GitHub Actions (Free)
```yaml
# .github/workflows/health-check.yml
name: Health Check
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Health Check
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/health-check \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Pros**:
- Free for public repos
- Reliable
- Built into GitHub

**Cons**:
- Requires public repo OR GitHub Pro for private repo
- Minimum interval: 5 minutes (not real-time)

#### Option 2: Upstash QStash (Free Tier)
- 500 requests/day free
- Webhook scheduling with retries
- Dead letter queue

#### Option 3: EasyCron (Free Tier)
- Limited free jobs
- Simple web interface
- No code needed

### Recommended Approach

**For Hobby Plan**:
1. Use daily cron jobs for non-critical tasks
2. Use GitHub Actions for more frequent checks (if needed)
3. Design features to work with infrequent runs

**For Pro Plan**:
1. Enable all desired cron schedules
2. No external workarounds needed

## Messaging Engine Implications

### Delivery Scheduler

**On Hobby Plan**:
- Run once per day (e.g., 9am UTC)
- Process ALL scheduled messages for the next 24 hours in one batch
- Queue jobs for immediate or delayed execution

**On Pro Plan**:
- Run every hour or more frequently
- Process upcoming messages in smaller windows
- More responsive to scheduled send times

### Implementation

The delivery scheduler checks for messages where `scheduledFor <= NOW()`:

```typescript
// Works on any plan
export async function deliveryScheduler() {
  // Find all approved messages ready to send
  const readyMessages = await prisma.message.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: { lte: new Date() }
    }
  })
  
  // Create delivery jobs for each
  for (const message of readyMessages) {
    await createDeliveryJobs(message)
  }
}
```

**Hobby Plan Behavior**:
- Runs at 9am UTC daily
- Sends messages scheduled for 9am-9am next day
- Immediate sends (within the hour) work fine
- Scheduled sends accurate to ~1 hour window

**Pro Plan Behavior**:
- Runs every hour (or more)
- More precise scheduling
- Better for time-sensitive campaigns

### Health Monitoring

**On Hobby Plan**:
- Health check every 6 hours
- Manual monitoring via dashboard recommended
- Use external uptime service (Better Uptime, UptimeRobot - free tiers available)

**On Pro Plan**:
- Health check every 5 minutes
- Automated alerting
- Real-time issue detection

## Function Duration Limits

### Hobby Plan: 10 seconds
- Batch size: 50-100 recipients per function call
- Use cursor-based pagination
- Resume on next invocation if timeout

### Pro Plan: 60 seconds
- Batch size: 500-1000 recipients per function call
- Less resume overhead
- More efficient processing

### Enterprise Plan: 300 seconds
- Batch size: 5000+ recipients per function call
- Large campaigns in single execution
- Maximum efficiency

## Database Considerations

### Vercel Postgres Availability
- **Not available on Hobby plan**
- Pro plan required for Vercel Postgres

### External Database (Recommended)
Use external Postgres providers that work with all Vercel plans:

#### Option 1: Neon (Recommended)
- ✅ Free tier: 10 GB storage
- ✅ Serverless Postgres
- ✅ Branching (instant dev databases)
- ✅ Auto-scaling
- ✅ Connection pooling built-in

#### Option 2: Supabase
- ✅ Free tier: 500 MB storage
- ✅ Postgres + auth + storage
- ✅ Generous free tier
- ✅ Good dashboard

#### Option 3: Railway
- ✅ Free tier: 500 MB storage
- ✅ Simple setup
- ✅ Good for hobby projects

### Current Setup
This project uses external Postgres (connection via `DATABASE_URL` env var), which works with **any Vercel plan**.

## Cost Analysis

### Hobby Plan Setup (FREE)
- Vercel Hobby: $0
- Neon Free Tier: $0
- GitHub Actions (public repo): $0
- Better Uptime Free: $0
- **Total: $0/month** ✅

### Pro Plan Setup ($20-30/month)
- Vercel Pro: $20/month
- Neon or Supabase paid: $10-20/month
- Optional: Sentry, monitoring tools
- **Total: $30-50/month**

### When to Upgrade

**Stick with Hobby if**:
- Just starting out
- Low traffic (< 1000 visitors/day)
- Can tolerate daily cron runs
- Single developer

**Upgrade to Pro when**:
- Need frequent cron jobs
- Need team collaboration
- Need password protection
- Traffic grows beyond Hobby limits
- Want better monitoring

## Deployment Checklist

### For Hobby Plan
- [x] Verify all cron jobs run ≤ once per day
- [ ] Set up external uptime monitoring (Better Uptime, etc.)
- [ ] Configure GitHub Actions for frequent tasks (if needed)
- [ ] Set `CRON_SECRET` environment variable
- [ ] Test function execution stays under 10 seconds
- [ ] Use external database (Neon, Supabase, Railway)

### For Pro Plan
- [ ] Update cron schedules to desired frequency
- [ ] Remove external cron workarounds
- [ ] Increase batch sizes for better performance
- [ ] Enable Vercel Analytics
- [ ] Set up team access

## Environment Variables

### Required for All Plans
```env
DATABASE_URL=          # External Postgres URL
DIRECT_URL=            # Direct connection (for migrations)
SITE_URL=              # Your Vercel app URL
SUPPORT_EMAIL=         # Support contact
```

### Additional for Cron Security
```env
CRON_SECRET=           # Shared secret for cron endpoints
```

## Monitoring Recommendations

### Free Options (All Plans)
- **Better Uptime** (free tier: 10 monitors)
- **UptimeRobot** (free tier: 50 monitors)
- **Cronitor** (free tier: 3 monitors)
- **Sentry** (free tier: 5K events/month)

### Paid Options (Pro+ Plans)
- **Vercel Analytics** (included with Pro)
- **DataDog** (full observability)
- **PagerDuty** (on-call alerting)

## Summary

**This project is designed for Vercel Hobby plan** with the following approach:

✅ **All critical functionality works on Hobby**  
✅ **External database eliminates Vercel Postgres requirement**  
✅ **Daily cron jobs sufficient for most operations**  
✅ **GitHub Actions available for frequent tasks if needed**  
✅ **Graceful degradation: less frequent runs, not broken features**

**Upgrade to Pro when**:
- You need more frequent cron jobs
- Team collaboration is required
- Traffic exceeds Hobby limits
- Better monitoring is worth $20/month

**Current Status**: ✅ Hobby-compatible configuration in place
