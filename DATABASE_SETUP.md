# Database Setup Guide

## Problem

Your Vercel deployment is failing because:
1. No migrations exist in `prisma/migrations/` directory
2. The build tries to run `prisma migrate deploy` but there's nothing to deploy
3. The database has no tables

## Solution Overview

You need to:
1. Create the initial migration locally
2. Push migrations to GitHub
3. Run migrations manually on production database (one-time)
4. Future deployments will auto-apply new migrations

## Step 1: Set Up Local Environment

Create a `.env.local` file with your **direct** (non-pooled) database URL:

```bash
# Use the DIRECT connection (WITHOUT -pooler) for local development
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-blue-feather-a8pzlphk.eastus2.azure.neon.tech/neondb?sslmode=require"

# Other required variables
ENCRYPTION_KEY="your-32-char-minimum-encryption-key-here-make-it-secure"
SESSION_SECRET="your-session-secret-here"
SITE_URL="http://localhost:3000"
SUPPORT_EMAIL="support@example.com"
ENABLE_DONATIONS="false"
```

**Important**: Use the direct connection URL, not the pooled one!

## Step 2: Create Initial Migration

```bash
# This creates the migration files but doesn't apply them yet
npx prisma migrate dev --name init
```

This will:
- Create `prisma/migrations/` directory
- Generate SQL files for all your tables
- Apply the migration to your database (if you're using a dev database)

## Step 3: Commit and Push Migrations

```bash
git add prisma/migrations
git commit -m "feat: Add initial database migration"
git push
```

## Step 4: Configure Vercel Environment Variables

In Vercel dashboard, set these environment variables:

### For Production Environment:

```
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-blue-feather-a8pzlphk-pooler.eastus2.azure.neon.tech/neondb?sslmode=require
DATABASE_URL_DIRECT=postgresql://neondb_owner:PASSWORD@ep-blue-feather-a8pzlphk.eastus2.azure.neon.tech/neondb?sslmode=require
ENCRYPTION_KEY=your-encryption-key
SESSION_SECRET=your-session-secret
SITE_URL=https://your-domain.vercel.app
SUPPORT_EMAIL=support@yourdomain.com
ENABLE_DONATIONS=false
# ... other variables from .env.example
```

**Key differences**:
- `DATABASE_URL` (with `-pooler`): Used by the application at runtime
- `DATABASE_URL_DIRECT` (without `-pooler`): Used for migrations

## Step 5: Run Initial Migration on Production

You have two options:

### Option A: Run Locally Against Production DB (Recommended)

```bash
# Export the direct connection URL
export DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-blue-feather-a8pzlphk.eastus2.azure.neon.tech/neondb?sslmode=require"

# Deploy migrations
npx prisma migrate deploy

# Seed the database (optional)
npx prisma db seed
```

### Option B: Use Neon's SQL Editor

1. Go to Neon dashboard
2. Open SQL Editor
3. Copy the SQL from `prisma/migrations/TIMESTAMP_init/migration.sql`
4. Run it manually

## Step 6: Redeploy on Vercel

Once migrations are in the database, Vercel builds will work because:
- `prisma generate` creates the Prisma Client
- No migration deployment needed (already done)
- App can connect via pooled connection

## Future Migrations

When you add new models or change the schema:

```bash
# Create migration
npx prisma migrate dev --name add_new_feature

# Push to GitHub
git add prisma/migrations
git commit -m "feat: Add new feature migration"
git push

# Apply to production (before deploying code)
export DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-blue-feather-a8pzlphk.eastus2.azure.neon.tech/neondb?sslmode=require"
npx prisma migrate deploy
```

## Troubleshooting

### "No migration found in prisma/migrations"

**Cause**: No migrations exist yet
**Fix**: Follow Step 2 to create initial migration

### "The table X does not exist in the current database"

**Cause**: Migrations haven't been applied to the database
**Fix**: Follow Step 5 to run migrations on production

### "Timed out trying to acquire a postgres advisory lock"

**Cause**: Using pooled connection for migrations
**Fix**: Use `DATABASE_URL_DIRECT` (without `-pooler`)

### "P1002: The database server was reached but timed out"

**Cause**: Connection issues or database under load
**Fix**: 
- Check Neon dashboard for database status
- Try again in a few minutes
- Verify connection string is correct

## Quick Start (TL;DR)

If you just want to get unblocked now:

```bash
# 1. Create .env.local with DATABASE_URL (direct connection)
# 2. Run this:
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "feat: Initial migration"
git push

# 3. Then run against production:
export DATABASE_URL="your-direct-production-url"
npx prisma migrate deploy

# 4. Redeploy on Vercel
```

## Why This Approach?

- **Pooled connections** (`-pooler`) are great for app performance but don't work for migrations
- **Direct connections** work for migrations but don't scale well for app traffic
- **Solution**: Use direct for migrations, pooled for runtime
- **Build process**: Just generate Prisma Client, don't run migrations (already done)
