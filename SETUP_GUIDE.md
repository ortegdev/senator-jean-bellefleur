# Diaspora4Bellefleur - Setup Guide

## Prerequisites

Before you begin, ensure you have installed:

- **Node.js** 18.x or later
- **npm** 9.x or later
- **PostgreSQL** 14.x or later (running and accessible)

## Step 1: Install Dependencies

From the project root, run:

```bash
npm install
```

This will install all required packages including:
- Next.js 15 with App Router
- React 19
- TypeScript
- Prisma
- Tailwind CSS
- And all other dependencies

**Expected time**: 2-5 minutes depending on your connection

## Step 2: Set Up Environment Variables

Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Then edit `.env` and update these critical values:

### Required Changes

```env
# Update with your PostgreSQL connection string
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/diaspora4bellefleur?schema=public"

# Update with your actual site URL (keep localhost:3000 for local dev)
SITE_URL="http://localhost:3000"

# Update with a real support email
SUPPORT_EMAIL="your-email@example.com"

# Generate secure random keys (see instructions below)
ENCRYPTION_KEY="generate-a-secure-random-key-here-32-chars-minimum"
SESSION_SECRET="generate-a-secure-random-key-here"
```

### Generate Secure Keys

You can generate secure random keys with:

```bash
# For ENCRYPTION_KEY (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# For SESSION_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and paste into your `.env` file.

### Optional: Payment Provider Setup

For local development, you can leave the test values for now:

```env
PAYMENT_PROVIDER="stripe"
PAYMENT_PROVIDER_API_KEY="pk_test_..."
PAYMENT_PROVIDER_SECRET="sk_test_..."
```

**Note**: The launch gate is set to `INFO_ONLY` by default, so payment features are disabled until you're ready.

## Step 3: Create Database

Create a PostgreSQL database:

```bash
# Using psql
createdb diaspora4bellefleur

# Or using psql command line
psql -c "CREATE DATABASE diaspora4bellefleur;"
```

Verify your `DATABASE_URL` in `.env` matches your PostgreSQL setup.

## Step 4: Run Database Migrations

Apply the Prisma schema to your database:

```bash
npm run db:migrate:dev
```

This will:
- Create all database tables
- Set up relations and indexes
- Apply any pending migrations

**Expected output**: You should see migration files being applied.

## Step 5: Seed the Database

Populate the database with initial data:

```bash
npm run db:seed
```

This creates:

### Launch Gate (Default Mode: INFO_ONLY)
- ✓ Launch gate set to `INFO_ONLY` (safest mode)
- ✓ Kill switch deactivated
- ✓ All 13 readiness checklist items (unchecked)

### Default User
- **Email**: `owner@example.com`
- **Role**: `OWNER` (full permissions)
- You'll need to set up authentication later

### Sample Candidate Config
- **Candidate**: Jean Fritznel Bellefleur
- **Office**: Senator
- **Department**: Nord-Ouest
- **Status**: `UNVERIFIED` (must be verified before donations)
- **Affiliation**: `INDEPENDENT` (not affiliated with campaign)

## Step 6: Start Development Server

```bash
npm run dev
```

The site will be available at: **http://localhost:3000**

### What You'll See

1. **Home Page** (`/`)
   - Multilingual (Haitian Creole default, French, English)
   - Brand identity with coastline constellation motif
   - Dignified optimism design system

2. **Design System** (`/[locale]/design-system`)
   - Living documentation of colors, typography, components
   - Verify WCAG 2.2 AA compliance
   - Interactive component examples

3. **Admin Dashboard** (`/admin/launch-control`)
   - Current launch mode badge
   - Campaign calendar countdown
   - Candidacy status verification
   - Affiliation disclosure
   - 13-item readiness checklist
   - Launch validation status
   - Audit log (last 10 entries)

## Step 7: Verify Everything Works

### Check Database Connection

```bash
# Open Prisma Studio to browse your database
npm run db:studio
```

This opens a web UI at http://localhost:5555 where you can:
- View all tables
- Verify seed data
- Check launch gate status

### Run Tests

```bash
# Unit tests
npm run test

# Integration tests (requires running database)
npm run test:integration

# E2E tests (requires dev server running)
npm run test:e2e

# All tests
npm run ci
```

## Understanding the Launch Gate

The project starts in **INFO_ONLY mode** for safety:

- ✗ **No donations accepted** (payment routes return 403)
- ✗ **No waitlist signups** (email collection disabled)
- ✓ **Read-only content** (candidate information, design system)

### Mode Progression

```
INFO_ONLY → WAITLIST → DONATIONS_LIVE
   ↓            ↓             ↓
Read-only   + Signups   + Payments
```

### To Enable Waitlist Mode

1. Go to `/admin/launch-control`
2. Review the mode requirements
3. Change mode to `WAITLIST`
4. Now users can sign up for launch notifications

### To Enable Donations Mode

Before activating `DONATIONS_LIVE`, you **must** complete all 13 checklist items:

#### Legal Requirements (Haiti)
- [ ] Haitian counsel written opinion
- [ ] Pre-campaign fundraising confirmation

#### Legal Requirements (US)
- [ ] US FARA/election counsel opinion

#### Entity & Tax
- [ ] Entity formation and tax classification

#### Financial
- [ ] Money transmission review
- [ ] Sanctions screening procedure
- [ ] Payment processor approval
- [ ] Recipient account verified

#### Compliance
- [ ] Donor disclosures approved
- [ ] Privacy notice approved
- [ ] Refund policy approved
- [ ] Candidacy status verified (not UNVERIFIED)

#### Technical
- [ ] Operational test passed

Once all items are checked, you can activate `DONATIONS_LIVE` mode from the admin dashboard.

## Common Issues

### Database Connection Error

```
Error: P1001: Can't reach database server
```

**Solution**: 
- Verify PostgreSQL is running: `pg_isready`
- Check your `DATABASE_URL` in `.env`
- Ensure database exists: `psql -l | grep diaspora4bellefleur`

### Migration Errors

```
Error: P3006: Migration ... failed to apply cleanly
```

**Solution**:
- Reset the database: `npm run db:reset`
- This will drop all data and re-run migrations

### Port Already in Use

```
Error: Port 3000 is already in use
```

**Solution**:
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Or use a different port: `PORT=3001 npm run dev`

### TypeScript Errors

```
Error: Cannot find module '@/...'
```

**Solution**:
- Restart your IDE/TypeScript server
- Check `tsconfig.json` paths are correct
- Try: `npm run build` to verify

## Next Steps

Once your dev environment is running:

### 1. Explore the Admin Dashboard

Visit `/admin/launch-control` to:
- See current launch mode (INFO_ONLY)
- Review the 13-item readiness checklist
- Check candidacy verification status
- View affiliation disclosure settings

### 2. Review Steering Files

Read the project steering files in `.kiro/steering/`:
- `product.md` - Product vision and principles
- `tech.md` - Technical architecture and stack
- `structure.md` - Project structure conventions
- `rules.md` - 10 non-negotiable rules
- `design-direction.md` - Design system principles
- `launch-gate.md` - Launch control documentation

### 3. Test Multilingual Support

Visit the site in different locales:
- Haitian Creole (default): `/ht`
- French: `/fr`
- English: `/en`

### 4. Explore the Design System

Visit `/[locale]/design-system` to see:
- Color palette with WCAG verification
- Typography (Fraunces + Inter)
- Coastline constellation motif
- All UI components with variants
- Accessibility features

## Development Workflow

### Making Changes

1. **Edit files** in `src/`
2. **Hot reload** automatically updates the browser
3. **Check types**: `npm run type-check`
4. **Run tests**: `npm run test`

### Database Changes

1. **Edit schema**: `prisma/schema.prisma`
2. **Create migration**: `npm run db:migrate:dev`
3. **Update seed** (if needed): `prisma/seed.ts`
4. **Re-seed**: `npm run db:seed`

### Adding New Features

1. **Read steering files** to understand constraints
2. **Follow structure conventions** (Server Components default)
3. **Update design system** if adding new components
4. **Write tests** (unit + integration + e2e)
5. **Verify compliance** with 10 non-negotiable rules

## Helpful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # TypeScript validation
npm run lint             # ESLint check

# Database
npm run db:migrate:dev   # Create/apply migration
npm run db:migrate:reset # Reset database
npm run db:seed          # Seed initial data
npm run db:studio        # Open Prisma Studio UI

# Testing
npm run test             # Unit tests (Vitest)
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests (Playwright)
npm run test:smoke       # Production smoke tests
npm run test:visual      # Visual regression tests
npm run ci               # Run all checks (like CI)

# Utilities
npm run format           # Format code with Prettier
npm run clean            # Clean build artifacts
```

## Security Reminders

⚠️ **Never commit `.env` file** - It's in `.gitignore` for a reason

⚠️ **Use test mode** for payment providers during development

⚠️ **Change default credentials** before any production deployment

⚠️ **Review steering files** before adding any new features

## Getting Help

### Documentation

- **ARCHITECTURE.md** - System architecture overview
- **DESIGN_SYSTEM.md** - Design system details
- **GETTING_STARTED.md** - Quick start guide
- **PROJECT_STATUS.md** - Current project state

### Steering Files

- `.kiro/steering/product.md` - Product vision
- `.kiro/steering/tech.md` - Technology decisions
- `.kiro/steering/rules.md` - **10 non-negotiable rules** ⚠️
- `.kiro/steering/structure.md` - Code organization
- `.kiro/steering/design-direction.md` - Design principles
- `.kiro/steering/launch-gate.md` - Launch control system

### Testing

- Visit `http://localhost:3000` to see the site
- Visit `http://localhost:3000/admin/launch-control` for the dashboard
- Visit `http://localhost:5555` for Prisma Studio (when running)

---

## Summary Checklist

Before you start development:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ running
- [ ] `npm install` completed
- [ ] `.env` file created with secure keys
- [ ] Database created
- [ ] `npm run db:migrate:dev` successful
- [ ] `npm run db:seed` successful
- [ ] `npm run dev` starts without errors
- [ ] Can access `http://localhost:3000`
- [ ] Can access `/admin/launch-control`
- [ ] Tests passing: `npm run ci`
- [ ] Read steering files in `.kiro/steering/`

**You're ready to build!** 🚀

---

**Current Status**: ✅ Foundation complete, ✅ Design system ready, ✅ Launch gate operational

**Launch Mode**: INFO_ONLY (safe default, donations disabled)

**Next Feature Development**: Candidate profile pages, content management, contribution flow
