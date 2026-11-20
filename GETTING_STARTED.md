# Getting Started Guide

This guide will help you set up the Diaspora4Bellefleur platform locally.

## Prerequisites

Make sure you have these installed:

- **Node.js 20+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **npm 10+** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd jeanbellfleur

# Install dependencies
npm install
```

This will install all required packages including Next.js, React, Prisma, and testing frameworks.

## Step 2: Database Setup

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE diaspora4bellefleur;

# Create user (optional)
CREATE USER diaspora_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE diaspora4bellefleur TO diaspora_user;

# Exit
\q
```

### Configure Environment

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://diaspora_user:your_password@localhost:5432/diaspora4bellefleur?schema=public"
SITE_URL="http://localhost:3000"
SUPPORT_EMAIL="your-email@example.com"
ENABLE_DONATIONS="false"
ENCRYPTION_KEY="generate-a-secure-32-character-key-here"
SESSION_SECRET="generate-another-secure-key-here"
```

**Generate secure keys:**
```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Run Migrations and Seed Data

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate:dev

# Seed initial data (candidate config, compliance rules, sample content)
npm run db:seed
```

You should see:
```
✅ Created candidate config: Jean Fritznel Bellefleur
✅ Created compliance rule: Allowed Countries
✅ Created compliance rule: Contribution Amount Limits
✅ Created content: candidate-bio
🎉 Seeding complete!
```

## Step 3: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

You should be redirected to [http://localhost:3000/ht](http://localhost:3000/ht) (Haitian Creole, default locale).

## Step 4: Verify Installation

### Check All Locales

- **Haitian Creole**: http://localhost:3000/ht
- **French**: http://localhost:3000/fr
- **English**: http://localhost:3000/en

### View Database

```bash
# Open Prisma Studio (database GUI)
npm run db:studio
```

This opens a browser at [http://localhost:5555](http://localhost:5555) where you can:
- View candidate configuration
- Browse compliance rules
- See sample content
- Inspect database schema

## Step 5: Run Tests

### All Tests (CI Pipeline)

```bash
npm run ci
```

This runs the complete CI pipeline:
1. Format check
2. Lint
3. TypeScript check
4. Unit tests
5. Integration tests
6. Production build
7. Smoke tests

### Individual Test Suites

```bash
# Unit tests (watch mode)
npm run test:watch

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Production smoke tests
npm run test:smoke
```

## Project Structure Overview

```
jeanbellfleur/
├── .kiro/steering/         # Project steering documents
│   ├── product.md          # Product vision
│   ├── tech.md             # Technical architecture
│   ├── rules.md            # Non-negotiable rules (READ THIS!)
│   └── structure.md        # Code conventions
│
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── [locale]/       # Internationalized routes
│   │   │   ├── layout.tsx  # Root layout
│   │   │   └── page.tsx    # Home page
│   │   └── api/            # API routes
│   │
│   ├── components/
│   │   ├── client/         # Client Components ("use client")
│   │   └── server/         # Server Components (default)
│   │
│   ├── lib/
│   │   ├── config/         # Configuration loaders
│   │   ├── db/             # Database utilities
│   │   ├── payments/       # Payment adapters
│   │   ├── validation/     # Zod schemas
│   │   └── utils/          # Utilities
│   │
│   └── i18n/
│       ├── messages/       # Translation files (ht, fr, en)
│       ├── config.ts
│       └── routing.ts
│
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts             # Seed data
│
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # Playwright E2E tests
│
├── .env.example            # Environment template
├── README.md               # Project overview
├── ARCHITECTURE.md         # Architecture documentation
└── package.json            # Dependencies and scripts
```

## Common Development Tasks

### Add a Translation

Edit `src/i18n/messages/{locale}.json`:

```json
{
  "newSection": {
    "title": "New Section Title",
    "description": "New section description"
  }
}
```

Use in components:
```tsx
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('newSection')
  return <h1>{t('title')}</h1>
}
```

### Update Candidate Configuration

Option 1: Via Prisma Studio
```bash
npm run db:studio
# Navigate to CandidateConfig table
# Edit the record
```

Option 2: Via Database
```bash
psql diaspora4bellefleur
UPDATE "CandidateConfig" SET "candidacyStatus" = 'REGISTERED_PRELIMINARY' WHERE slug = 'bellefleur';
```

### Add a Database Field

1. Edit `prisma/schema.prisma`
2. Create migration: `npm run db:migrate:dev`
3. Name the migration (e.g., "add_field_name")
4. Update TypeScript types: `npm run db:generate`

### Run Code Quality Checks

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint
npm run lint

# Type check
npm run typecheck
```

## Important Reminders

### 🚨 10 Non-Negotiable Rules

Before building features, **READ** `.kiro/steering/rules.md`. Key highlights:

1. **Honest Affiliation** - Always show real relationship to campaign
2. **Verified Status** - Only say "running" if status verified
3. **No Fabrication** - Every fact needs a source
4. **No Unapproved Assets** - Use placeholders for photos/logos
5. **Money Gate** - Donations OFF by default
6. **Privacy First** - Minimal data collection
7. **Database Config** - All limits in database, not code
8. **Server/Client Boundary** - No function props from Server to Client
9. **No Private Data** - Public facts only
10. **No Copying** - No campaign designs or branding

### 🎯 Key Principles

- **Never hard-code** candidate name, office, department, or dates
- **Always** use `getCandidateConfig()` for candidate data
- **Server Components** by default, Client Components only when needed
- **Type safety** everywhere - no `any` types
- **Compliance first** - when in doubt, be more restrictive

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Verify connection string
psql "postgresql://user:password@localhost:5432/diaspora4bellefleur"
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Migration Issues

```bash
# Reset database (⚠️ loses all data)
npm run db:migrate:reset

# Re-seed
npm run db:seed
```

### TypeScript Errors After Schema Changes

```bash
# Regenerate Prisma client
npm run db:generate

# Restart TypeScript server in your IDE
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## Next Steps

1. **Read Steering Documents** - Familiarize yourself with `.kiro/steering/`
2. **Explore Codebase** - Understand the structure
3. **Run Tests** - Make sure everything works
4. **Build Features** - Follow the steering rules and conventions

## Getting Help

- **Documentation**: See `README.md`, `ARCHITECTURE.md`, and `.kiro/steering/`
- **Database Schema**: Run `npm run db:studio`
- **Issues**: Check existing GitHub issues or create new one

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Prisma Documentation](https://www.prisma.io/docs)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
