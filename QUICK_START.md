# Quick Start - Get Site Working in 2 Minutes

## Current Issue

Your site is deployed but showing 404 because:**

✅ CSP is fixed  
✅ Translations are complete  
✅ Build succeeds  
✅ DATABASE_URL is configured in Vercel  
❌ **Database tables don't exist yet**

## The Only Thing Left: Create Database Tables

Your Vercel environment variables are configured, but the actual database is **empty** - no tables exist yet.

## Solution: Run This One Command

```bash
# Export your Neon database URL (get password from Neon dashboard)
export DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-blue-feather-a8pzlphk.eastus2.azure.neon.tech/neondb?sslmode=require"

# Create and apply migration in one step
npx prisma migrate dev --name init
```

**That's it!** This will:
1. Create migration files in `prisma/migrations/`
2. Apply them to your database (creates all tables)
3. Generate Prisma Client

## Then Push the Migrations

```bash
git add prisma/migrations
git commit -m "feat: Initial database migration"
git push
```

Vercel will auto-redeploy and your site will work!

## Get Your Database Password

1. Go to https://console.neon.tech
2. Select your project `ep-blue-feather-a8pzlphk`
3. Click "Connection Details"
4. Copy or reset your password

**Important**: Use the **direct** connection (WITHOUT `-pooler` in the hostname).

## Verification

After pushing, wait ~30 seconds for Vercel to redeploy, then visit:
- https://senator-jean-bellefleur.vercel.app

You should see the home page instead of 404!

## Why This Works

- Vercel already has `DATABASE_URL` configured (the pooled connection)
- But the database itself is empty - no schema, no tables
- Running `prisma migrate dev` creates the schema locally **and** applies it to the database
- Once tables exist, pages can query them successfully
- Future changes: create new migration, apply it, push code

## Troubleshooting

**"Environment variable not found: DATABASE_URL"**
→ Make sure you ran the `export DATABASE_URL=...` command first

**"Timed out acquiring advisory lock"**  
→ You're using the pooled URL. Remove `-pooler` from the hostname

**"Can't reach database server"**  
→ Check your password is correct in the DATABASE_URL

**Still getting errors after migration?**  
→ Run `npx prisma db seed` to add initial data

## What Happens Next

Once this is done:
- ✅ Site loads properly
- ✅ Pages render without errors  
- ✅ Database queries work
- ✅ You can develop locally with same database

For local development, create `.env.local` with the same DATABASE_URL so you can run the site locally.

Need help? The full DATABASE_SETUP.md has detailed explanations.
