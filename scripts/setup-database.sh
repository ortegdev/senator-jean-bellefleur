#!/bin/bash

# Database Setup Script
# This script creates and applies the initial database migration

set -e

echo "🗄️  Database Setup Script"
echo "======================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  echo ""
  echo "Please edit .env.local and set your DATABASE_URL:"
  echo "  DATABASE_URL=\"postgresql://neondb_owner:YOUR_PASSWORD@ep-blue-feather-a8pzlphk.eastus2.azure.neon.tech/neondb?sslmode=require\""
  echo ""
  echo "Get your password from: https://console.neon.tech"
  exit 1
fi

# Check if migrations already exist
if [ -d "prisma/migrations" ]; then
  echo "⚠️  Migrations directory already exists"
  echo ""
  read -p "Do you want to reset and create new migrations? (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing existing migrations..."
    rm -rf prisma/migrations
  else
    echo "ℹ️  Keeping existing migrations"
  fi
fi

echo ""
echo "1️⃣  Creating initial migration..."
npx prisma migrate dev --name init

echo ""
echo "2️⃣  Generating Prisma Client..."
npx prisma generate

echo ""
echo "3️⃣  Seeding database..."
npm run db:seed || echo "⚠️  Seeding failed or no seed file"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Commit migrations: git add prisma/migrations && git commit -m 'feat: Initial migration'"
echo "  2. Push to GitHub: git push"
echo "  3. Apply to production: see DATABASE_SETUP.md for instructions"
echo ""
