#!/bin/bash

# Production Migration Script
# This script applies migrations to the production database using a direct connection
# (not the pooled connection, which doesn't work for migrations)

set -e

echo "🔄 Running production migrations..."

# Use the direct connection URL for migrations (not the pooled one)
# Vercel should have DATABASE_URL_DIRECT set to the non-pooled connection
if [ -z "$DATABASE_URL_DIRECT" ]; then
  echo "❌ ERROR: DATABASE_URL_DIRECT is not set"
  echo "ℹ️  Set DATABASE_URL_DIRECT to your direct (non-pooled) Neon connection string"
  echo "ℹ️  Example: postgresql://user:pass@host.neon.tech/db?sslmode=require"
  echo "ℹ️  (without -pooler in the hostname)"
  exit 1
fi

# Export DATABASE_URL for Prisma to use
export DATABASE_URL="$DATABASE_URL_DIRECT"

# Run migrations
npx prisma migrate deploy

echo "✅ Migrations completed successfully"
