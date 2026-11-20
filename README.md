# Diaspora4Bellefleur

A transparent, multilingual platform enabling the Haitian diaspora to learn about Jean Fritznel Bellefleur's candidacy for Senator of the Nord-Ouest department.

## 🎯 Project Status: Foundation + Design System Complete

**Foundation (Prompt 1):** ✅ Complete  
**Design System (Prompt 2):** ✅ Complete  
**Features (Prompt 3+):** ⏳ Ready to build

## 🎨 Design System: Dignified Optimism, Sea and Salt

A complete visual identity featuring:
- Original color palette with verified WCAG 2.2 AA contrast
- Fraunces (display) + Inter (body) typography with diacritics
- Coastline constellation motif (Port-de-Paix → diaspora cities)
- 14+ accessible components (44px tap targets, keyboard nav)
- Mobile-first responsive (360px baseline)
- Motion that respects user preferences

**View the system:** Visit `/[locale]/design-system` after starting dev server

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS with custom design tokens
- **Internationalization**: next-intl (Haitian Creole, French, English)
- **Validation**: Zod
- **Testing**: Vitest, Playwright, Testing Library

### Key Principles

1. **Server-First**: Maximize Server Components for performance and security
2. **Type Safety**: Strict TypeScript throughout
3. **Configuration Over Code**: Database-driven rules and limits
4. **Isolation**: Separate from any other campaign sites
5. **Compliance**: Built-in guardrails for election law and privacy

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm 10+

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd jeanbellfleur
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/diaspora4bellefleur"
SITE_URL="http://localhost:3000"
SUPPORT_EMAIL="your-email@example.com"
ENABLE_DONATIONS="false"
```

### 3. Database Setup

```bash
# Run migrations
npm run db:migrate:dev

# Seed initial data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit:
- Home: [http://localhost:3000](http://localhost:3000)
- Design System: [http://localhost:3000/en/design-system](http://localhost:3000/en/design-system)

## 🧪 Testing

```bash
# All tests (CI pipeline)
npm run ci

# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Visual regression
npm run test:visual
```

## 📁 Project Structure

```
/
├── .kiro/steering/         # Project rules and documentation
│   ├── product.md          # Product vision
│   ├── tech.md             # Technical architecture
│   ├── rules.md            # Non-negotiable rules (READ THIS!)
│   ├── structure.md        # Code conventions
│   └── design-direction.md # Design system philosophy
│
├── src/
│   ├── app/
│   │   ├── [locale]/       # Internationalized routes
│   │   │   ├── page.tsx    # Home page
│   │   │   ├── design-system/  # Design docs
│   │   │   └── layout.tsx  # Nav + Footer
│   │   └── globals.css     # Base styles + motion tokens
│   │
│   ├── components/
│   │   ├── brand/          # Wordmark, AffiliationBadge
│   │   ├── design/         # CoastlineConstellation
│   │   ├── layout/         # Navigation, Footer
│   │   └── ui/             # Reusable components
│   │
│   ├── lib/
│   │   ├── config/         # Configuration loaders
│   │   ├── db/             # Database utilities
│   │   ├── design/         # Color system, motion tokens
│   │   ├── payments/       # Payment adapters
│   │   ├── validation/     # Zod schemas
│   │   └── utils/          # Utilities
│   │
│   └── i18n/
│       └── messages/       # Translations (ht, fr, en)
│
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
│
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # Playwright E2E tests
│
├── docs/design-review/     # Visual regression baselines
│
├── ARCHITECTURE.md         # Technical deep-dive
├── DESIGN_SYSTEM.md        # Design implementation
├── GETTING_STARTED.md      # Developer setup guide
└── README.md               # This file
```

## 🔒 Non-Negotiable Rules

See `.kiro/steering/rules.md` for complete rules. Key highlights:

1. **Honest Affiliation**: Always disclose relationship to campaign
2. **Verified Status**: Only use "running" language if status verified
3. **No Fabrication**: Every fact must have a source
4. **Visual Assets**: No unapproved photos/logos
5. **Money Gate**: Donations off by default
6. **Privacy First**: Minimum data collection
7. **Database Config**: All compliance rules in database
8. **Server/Client Boundary**: No function props from Server to Client
9. **No Private Data**: Only public, sourced information
10. **No Copying**: No campaign designs or branding

## 🌍 Internationalization

The platform supports three languages:

- **Haitian Creole (ht)** - Primary, default
- **French (fr)** - Secondary  
- **English (en)** - Tertiary

Routes: `/ht/`, `/fr/`, `/en/`

## 🎨 Design System Highlights

### Color Palette
- Deep Lagoon (#0F3D4A) - Anchor
- Coral (#C8432B) - Primary action
- Sand Paper (#FAF6EE) - Background
- Ink (#0B1D24) - Text
- Sea Green (#1F8A70) - Success
- Salt Gold (#EFB93F) - Warning

All pairings verified WCAG 2.2 AA compliant.

### Typography
- Fraunces (display): Headings, brand voice
- Inter (body/UI): Body text, UI elements
- Fluid scale: 17-18px base (mobile-desktop)
- Diacritic support: è ò à â ê î ô û ç œ

### Coastline Constellation
Original motif representing migration from Port-de-Paix to diaspora cities (Miami, New York, Montreal, Paris, Boston). Used throughout as subtle background element.

### Components
14+ accessible components including Button, Card, Input, Badge, and specialized components like ImagePlaceholder (for pending photos) and AffiliationBadge (designed disclosure).

## 📊 Key Features

### Implemented (Foundation + Design)
- ✅ Multilingual support (ht, fr, en)
- ✅ Database schema with candidate config
- ✅ Type-safe configuration system
- ✅ Payment provider abstraction
- ✅ Complete design system
- ✅ Component library (14+ components)
- ✅ Visual regression testing
- ✅ Accessibility compliance (WCAG 2.2 AA)

### Planned (Future Prompts)
- ⏳ Candidate profile pages
- ⏳ Contribution flow (gated by config)
- ⏳ Content management
- ⏳ Email subscriptions
- ⏳ Admin dashboard

## 🗄️ Database

### Candidate Configuration

Single source of truth at `CandidateConfig` table. **Never hard-code**:
- Candidate name
- Office
- Department
- Election dates
- Contribution limits

All values must come from `getCandidateConfig()`.

### Key Models

- `CandidateConfig` - Campaign configuration
- `Content` - Sourced, versioned content
- `Contribution` - Encrypted donor data
- `ComplianceRule` - Database-driven limits
- `AuditLog` - Change tracking

## 🔧 Configuration

### Feature Flags

- `ENABLE_DONATIONS` - Turn on/off contribution features (default: false)

### Compliance

- `ALLOWED_COUNTRIES` - Comma-separated country codes (default: US,CA,FR)
- Min/max contribution amounts in database config

## 📜 Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - Lint code
- `npm run typecheck` - TypeScript check
- `npm run format` - Format with Prettier
- `npm run db:migrate:dev` - Run database migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio
- `npm run ci` - Full CI pipeline
- `npm run test:visual` - Visual regression tests

## 🤝 Contributing

See `.kiro/steering/` for:
- `product.md` - Product vision
- `tech.md` - Technical architecture
- `rules.md` - Non-negotiable rules
- `structure.md` - Code conventions
- `design-direction.md` - Design philosophy

Every contribution must comply with the rules in `.kiro/steering/rules.md`.

## 📄 Documentation

- **Getting Started**: `GETTING_STARTED.md`
- **Architecture**: `ARCHITECTURE.md`
- **Design System**: `DESIGN_SYSTEM.md`
- **Steering Rules**: `.kiro/steering/rules.md`
- **Component Library**: `src/components/ui/README.md`

## ⚠️ Disclaimer

This is an independent supporter initiative, **not authorized by or affiliated with Jean Fritznel Bellefleur, his campaign or any party**.

Candidacy status is currently UNVERIFIED. Information will be updated as verification is obtained.

## 📈 Roadmap

### ✅ Phase 0: Foundation (Complete)
- Core infrastructure
- Database schema
- Testing setup
- CI/CD pipeline

### ✅ Phase 1: Design System (Complete)
- Color system with accessibility
- Typography with diacritics
- Component library
- Visual regression testing
- Design documentation

### ⏳ Phase 2: Content (Next)
- Candidate profile
- Department information
- FAQ section
- Content management

### ⏳ Phase 3: Contributions (Gated)
- Contribution form
- Payment integration
- Compliance checking
- Receipt generation

### ⏳ Phase 4: Administration
- Admin authentication
- Config editor
- Content management interface
- Audit log viewer

## 🔐 Security

- Environment secrets separated
- Security headers configured
- Input validation with Zod
- Payment abstraction for PCI compliance
- SQL injection prevention (Prisma)
- HTTPS enforced in production

## 📞 Support

For development questions, see documentation in:
- `GETTING_STARTED.md`
- `ARCHITECTURE.md`
- `.kiro/steering/`

---

**Foundation Status**: ✅ Complete  
**Design System Status**: ✅ Complete  
**Ready for**: Feature development following established patterns and rules
# senator-jean-bellefleur
