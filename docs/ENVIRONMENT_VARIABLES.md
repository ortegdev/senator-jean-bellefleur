# Environment Variables Checklist

## Overview

This document lists all required and optional environment variables for the platform, organized by category. Use this checklist when setting up new environments.

## ✅ Vercel Environment Setup

### Variable Scopes
- **Production**: Live site (donations-live mode)
- **Preview**: PR deployments (testing only)
- **Development**: Local development

### Security Notes
- ⚠️ **NEVER commit secrets to git**
- ✅ Use Vercel secret manager for sensitive values
- ✅ Rotate secrets quarterly (see rotation procedure)
- ✅ Use separate keys per environment

---

## 🔐 Database (Required)

### `DATABASE_URL`
- **Description**: PostgreSQL connection string for Prisma
- **Format**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require&pgbouncer=true`
- **Scopes**: Production, Preview, Development
- **Example**: `postgresql://user:pass@host.region.supabase.co:6543/postgres?pgbouncer=true`
- **Notes**: Use connection pooling URL (port 6543) for Vercel

### `DIRECT_URL`
- **Description**: Direct PostgreSQL connection (no pooler) for migrations
- **Format**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require`
- **Scopes**: Production, Preview, Development
- **Example**: `postgresql://user:pass@host.region.supabase.co:5432/postgres`
- **Notes**: Required for `prisma migrate deploy`, uses port 5432

---

## 💳 Payment Provider (Required for Donations)

### `STRIPE_PUBLISHABLE_KEY`
- **Description**: Stripe public key (client-side)
- **Format**: `pk_test_...` (test) or `pk_live_...` (production)
- **Scopes**: Production, Preview, Development
- **Production Value**: `pk_test_...` until launch gate enables donations
- **Notes**: Visible to clients, not sensitive

### `STRIPE_SECRET_KEY`
- **Description**: Stripe secret key (server-side)
- **Format**: `sk_test_...` (test) or `sk_live_...` (production)
- **Scopes**: Production, Preview, Development
- **Production Value**: `sk_test_...` until launch gate enables donations
- **Rotation**: Quarterly or on compromise
- **Notes**: **HIGHLY SENSITIVE** - rotate immediately if exposed

### `STRIPE_WEBHOOK_SECRET`
- **Description**: Webhook signature verification secret
- **Format**: `whsec_...`
- **Scopes**: Production, Preview, Development
- **Rotation**: When rotating Stripe keys
- **Notes**: Different per environment (each webhook endpoint)

---

## 🔒 Encryption (Required)

### `FIELD_ENCRYPTION_KEY`
- **Description**: AES-256 key for encrypting donor PII at rest
- **Format**: 64-character hex string (32 bytes)
- **Scopes**: Production, Preview, Development
- **Generation**: `openssl rand -hex 32`
- **Rotation**: Annually with re-encryption (see procedure)
- **Notes**: **CRITICAL** - loss means permanent data loss
- **Backup**: Store encrypted backup in 1Password/HashiCorp Vault

### `SESSION_SECRET`
- **Description**: Secret for signing admin session tokens
- **Format**: 64-character hex string (32 bytes)
- **Scopes**: Production, Preview, Development
- **Generation**: `openssl rand -hex 32`
- **Rotation**: Quarterly (invalidates all sessions)
- **Notes**: Rotation logs out all admins

---

## 🌐 Site Configuration (Required)

### `SITE_URL`
- **Description**: Canonical site URL (no trailing slash)
- **Format**: `https://domain.com`
- **Scopes**: Production, Preview, Development
- **Production**: `https://diaspora4bellefleur.com`
- **Preview**: `https://PROJECT-NAME-HASH.vercel.app`
- **Development**: `http://localhost:3000`
- **Notes**: Used for email links, OAuth redirects, CSP

### `SUPPORT_EMAIL`
- **Description**: Support contact email
- **Format**: `support@domain.com`
- **Scopes**: Production, Preview, Development
- **Example**: `support@diaspora4bellefleur.com`

---

## 📧 Email Service (Required for Notifications)

### `EMAIL_PROVIDER`
- **Description**: Email service provider
- **Format**: `resend` | `sendgrid` | `ses`
- **Scopes**: Production, Preview, Development
- **Recommended**: `resend` (simple, reliable)

### `RESEND_API_KEY` (if using Resend)
- **Description**: Resend API key
- **Format**: `re_...`
- **Scopes**: Production, Preview, Development
- **Rotation**: Quarterly
- **Notes**: Get from https://resend.com/api-keys

### `SENDGRID_API_KEY` (if using SendGrid)
- **Description**: SendGrid API key
- **Format**: `SG....`
- **Scopes**: Production, Preview, Development
- **Rotation**: Quarterly

---

## 🚦 Feature Flags (Optional)

### `ENABLE_DONATIONS`
- **Description**: Enable donation features (overridden by launch gate)
- **Format**: `true` | `false`
- **Scopes**: Production, Preview, Development
- **Default**: `false`
- **Production**: Controlled by launch gate in database

### `ENABLE_NEWS_SECTION`
- **Description**: Enable automated news discovery
- **Format**: `true` | `false`
- **Scopes**: Production, Preview, Development
- **Default**: `false`

### `DEPLOYMENT_PROTECTED`
- **Description**: Force deployment protection (noindex, basic auth)
- **Format**: `true` | `false`
- **Scopes**: Preview
- **Default**: `true` for preview deployments
- **Notes**: Prevents search engine indexing

---

## 📊 Observability (Recommended)

### `SENTRY_DSN`
- **Description**: Sentry error tracking DSN
- **Format**: `https://...@sentry.io/...`
- **Scopes**: Production, Preview
- **Notes**: Error tracking and performance monitoring

### `SENTRY_AUTH_TOKEN`
- **Description**: Sentry auth token for source map uploads
- **Format**: Token from Sentry
- **Scopes**: Build-time only
- **Notes**: Required for readable stack traces

### `LOGTAIL_SOURCE_TOKEN`
- **Description**: Logtail structured logging token
- **Format**: Token from Logtail
- **Scopes**: Production, Preview
- **Notes**: Alternative: Datadog, LogDNA, etc.

---

## 🔔 Alerts (Optional)

### `SLACK_WEBHOOK_URL`
- **Description**: Slack webhook for admin alerts
- **Format**: `https://hooks.slack.com/services/...`
- **Scopes**: Production
- **Notes**: High-risk transactions, system errors

### `PAGERDUTY_INTEGRATION_KEY`
- **Description**: PagerDuty integration for critical alerts
- **Format**: Integration key from PagerDuty
- **Scopes**: Production
- **Notes**: Payment failures, database down, etc.

---

## 🌍 External Services (Optional)

### `GDELT_API_KEY`
- **Description**: GDELT API key for news discovery
- **Format**: API key (if required)
- **Scopes**: Production, Preview
- **Notes**: May not be required (check GDELT docs)

---

## 🔧 Build & Deployment (Vercel Automatic)

These are automatically set by Vercel:

### `VERCEL`
- **Description**: `1` when running on Vercel
- **Automatic**: Yes

### `VERCEL_ENV`
- **Description**: `production`, `preview`, or `development`
- **Automatic**: Yes

### `VERCEL_URL`
- **Description**: Deployment URL
- **Automatic**: Yes

### `VERCEL_GIT_COMMIT_SHA`
- **Description**: Git commit hash (for tamper detection)
- **Automatic**: Yes

---

## 🔄 Secret Rotation Procedure

### Quarterly Rotation (Low Risk)
1. `SESSION_SECRET`
2. `STRIPE_WEBHOOK_SECRET`
3. `RESEND_API_KEY`

**Process:**
1. Generate new secret: `openssl rand -hex 32`
2. Update in Vercel secret manager
3. Trigger deployment
4. Verify functionality
5. Document rotation in audit log

### Annual Rotation (High Risk)
1. `FIELD_ENCRYPTION_KEY` (requires re-encryption!)

**Process:**
1. **CRITICAL**: Read full re-encryption procedure first
2. Generate new key: `openssl rand -hex 32`
3. Run migration script to re-encrypt all data
4. Update Vercel secret
5. Deploy
6. Verify all encrypted fields readable
7. Archive old key securely (for rollback)

### On Compromise (Immediate)
1. `STRIPE_SECRET_KEY`
2. `FIELD_ENCRYPTION_KEY`
3. All admin passwords

**Process:**
1. Rotate compromised secret immediately
2. Invalidate all admin sessions
3. Review access logs
4. File incident report
5. Notify affected parties if required

---

## ✅ Environment Validation

### Pre-Deployment Checklist

**Production:**
- [ ] All REQUIRED variables set
- [ ] Payment keys are TEST MODE until launch gate opens
- [ ] `SITE_URL` matches production domain
- [ ] `FIELD_ENCRYPTION_KEY` backed up securely
- [ ] `DATABASE_URL` uses connection pooling
- [ ] `DIRECT_URL` uses direct connection
- [ ] Email service configured and tested
- [ ] Error tracking enabled (Sentry)
- [ ] Secrets rotated within last 90 days

**Preview:**
- [ ] All REQUIRED variables set
- [ ] Payment keys are TEST MODE
- [ ] `DEPLOYMENT_PROTECTED=true`
- [ ] `SITE_URL` matches preview URL pattern
- [ ] Separate database from production

**Development:**
- [ ] All REQUIRED variables set in `.env.local`
- [ ] Payment keys are TEST MODE
- [ ] `SITE_URL=http://localhost:3000`
- [ ] Separate database from preview/production

---

## 🚨 Security Warnings

### ⚠️ NEVER:
- Commit secrets to git (use `.env.local`, add to `.gitignore`)
- Share production secrets via Slack/email
- Use production keys in preview/development
- Store secrets in code comments
- Copy production database to local

### ✅ ALWAYS:
- Use Vercel secret manager for sensitive values
- Use different keys per environment
- Rotate secrets on schedule
- Back up encryption keys securely
- Review access logs quarterly
- Enable 2FA on Vercel account
- Use registrar lock on domain

---

## 📝 Verification Script

```bash
#!/bin/bash
# verify-env.sh - Check all required environment variables

REQUIRED_VARS=(
  "DATABASE_URL"
  "DIRECT_URL"
  "STRIPE_PUBLISHABLE_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "FIELD_ENCRYPTION_KEY"
  "SESSION_SECRET"
  "SITE_URL"
  "SUPPORT_EMAIL"
)

MISSING=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "✅ All required environment variables are set"
  exit 0
else
  echo "❌ Missing required environment variables:"
  printf '  - %s\n' "${MISSING[@]}"
  exit 1
fi
```

Run before deployment:
```bash
chmod +x scripts/verify-env.sh
./scripts/verify-env.sh
```

---

## 📚 Related Documentation

- [Secret Rotation Procedure](./SECRET_ROTATION.md)
- [Incident Response Runbook](./INCIDENT_RESPONSE.md)
- [Database Backup & Restore](./BACKUP_RESTORE.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)
