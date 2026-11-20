# Architecture Documentation

## Overview

Diaspora4Bellefleur is a **compliance-first**, **isolated**, **multilingual** platform for supporting Jean Fritznel Bellefleur's Senate candidacy in Haiti's Nord-Ouest department.

## Core Design Principles

### 1. Isolation
- **Separate infrastructure**: Own database, payment accounts, domain
- **No cross-references**: No links to other campaigns or candidates
- **Independent codebase**: Not a multi-tenant system

### 2. Configuration Over Code
- **Database-driven**: Candidate info, compliance rules, content all in database
- **No hard-coding**: Names, dates, limits come from `CandidateConfig` table
- **Feature flags**: Donations, features controlled via environment

### 3. Compliance by Design
- **10 Non-Negotiable Rules** (see `.kiro/steering/rules.md`)
- **Verification workflow**: Content must be sourced before publishing
- **Privacy-first**: Minimal data collection, no PII exposure
- **Audit trail**: All changes logged in `AuditLog` table

### 4. Server-First Architecture
- **Server Components**: Default for all pages and layouts
- **Client Components**: Only when interactivity required (buttons, forms)
- **Server Actions**: All mutations through type-safe server actions
- **No function props**: Never pass handlers from Server to Client Components

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ ht (HT)  │  │ fr (FR)  │  │ en (EN)  │                 │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │
└───────┼─────────────┼─────────────┼───────────────────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
    ┌─────────────────▼──────────────────┐
    │      Next.js App Router            │
    │  (React 19 Server Components)      │
    │                                    │
    │  ┌──────────────────────────────┐ │
    │  │  [locale]/                   │ │
    │  │    ├─ page.tsx    (Server)   │ │
    │  │    ├─ layout.tsx  (Server)   │ │
    │  │    └─ contribute/ (Gated)    │ │
    │  └──────────────────────────────┘ │
    │                                    │
    │  ┌──────────────────────────────┐ │
    │  │  actions/                    │ │
    │  │    └─ contributions.ts       │ │
    │  │       (Server Actions)       │ │
    │  └──────────────────────────────┘ │
    │                                    │
    │  ┌──────────────────────────────┐ │
    │  │  api/                        │ │
    │  │    └─ webhooks/              │ │
    │  │       └─ [provider]/         │ │
    │  └──────────────────────────────┘ │
    └────────────┬───────────────────────┘
                 │
    ┌────────────▼────────────┐
    │   Business Logic Layer  │
    │                         │
    │  ├─ lib/config/         │
    │  │   └─ candidate.ts    │◄────── Single Source of Truth
    │  │                      │
    │  ├─ lib/validation/     │
    │  │   ├─ schemas.ts      │◄────── Zod Validation
    │  │   └─ rules.ts        │
    │  │                      │
    │  ├─ lib/payments/       │
    │  │   ├─ adapter.ts      │◄────── Provider Abstraction
    │  │   ├─ stripe.ts       │
    │  │   └─ test-provider.ts│
    │  │                      │
    │  └─ lib/db/             │
    │      ├─ prisma.ts       │
    │      └─ queries.ts      │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │   PostgreSQL Database   │
    │                         │
    │  ┌─────────────────────┐│
    │  │ CandidateConfig     ││◄────── Single candidate record
    │  └─────────────────────┘│
    │  ┌─────────────────────┐│
    │  │ Content             ││◄────── Sourced, verified content
    │  └─────────────────────┘│
    │  ┌─────────────────────┐│
    │  │ Contribution        ││◄────── Encrypted donor data
    │  └─────────────────────┘│
    │  ┌─────────────────────┐│
    │  │ ComplianceRule      ││◄────── Database-driven limits
    │  └─────────────────────┘│
    │  ┌─────────────────────┐│
    │  │ AuditLog            ││◄────── Change tracking
    │  └─────────────────────┘│
    └─────────────────────────┘
```

## Data Flow

### 1. Read Flow (Server Components)
```
User Request
    ↓
[locale]/page.tsx (Server Component)
    ↓
getCandidateConfig() → Database Query
    ↓
Render with Data
    ↓
HTML Response (no client JS needed)
```

### 2. Write Flow (Server Actions)
```
User Interaction
    ↓
Client Component (onClick handler)
    ↓
Server Action (app/actions/*.ts)
    ↓
Validation (Zod schemas)
    ↓
Business Rules (lib/validation/rules.ts)
    ↓
Database Mutation (Prisma)
    ↓
Audit Log
    ↓
Response
```

### 3. Payment Flow
```
User initiates contribution
    ↓
Server Action validates amount/eligibility
    ↓
Payment Provider Adapter
    ↓
Create Payment Intent
    ↓
Client Component renders payment form
    ↓
User completes payment
    ↓
Webhook received
    ↓
Contribution record created
    ↓
Receipt generated
```

## Database Schema

### Key Design Decisions

1. **Single CandidateConfig Record**: One row, identified by `slug: 'bellefleur'`
2. **Versioned Content**: `status` field controls publication workflow
3. **Encrypted Contributions**: Donor PII encrypted at rest
4. **Flexible Compliance**: JSON `config` field allows rule variations
5. **Audit Trail**: Every change logged with actor and timestamp

### Critical Fields

**CandidateConfig**:
- `candidacyStatus`: UNVERIFIED | REGISTERED_PRELIMINARY | ON_FINAL_LIST | NOT_ON_FINAL_LIST
- `affiliationStatus`: INDEPENDENT | AUTHORIZED | COORDINATED
- All dates, names, departments (never hard-coded)

**Content**:
- `status`: DRAFT | NEEDS_REVIEW | PUBLISHED | ARCHIVED
- `source`: Required for PUBLISHED status
- Multilingual fields: `titleHt`, `bodyHt`, etc.

**Contribution**:
- `paymentStatus`: PENDING | PROCESSING | COMPLETED | FAILED | REFUNDED
- `complianceChecked`: Boolean flag
- `donorOptInPublic`: Explicit consent for recognition

## Internationalization (i18n)

### Language Priority
1. **Haitian Creole (ht)** - Primary, default locale
2. **French (fr)** - Secondary
3. **English (en)** - Tertiary

### Implementation
- `next-intl` for server-side i18n
- Route structure: `/[locale]/path`
- Message files: `src/i18n/messages/{locale}.json`
- Automatic locale detection and redirect

### Translation Strategy
Not just translation - **cultural adaptation**:
- Department-specific terminology
- Diaspora-relevant framing
- Respect for Haitian political culture

## Security Architecture

### 1. Server-Side Validation
- All inputs validated with Zod schemas
- Business rules enforced before database writes
- No trust of client-side data

### 2. Database Security
- Encrypted sensitive fields (donor PII)
- No PCI data storage (handled by payment provider)
- Prepared statements (Prisma prevents SQL injection)

### 3. HTTP Security
- Security headers (CSP, X-Frame-Options, etc.)
- HTTPS only in production
- CSRF protection via Server Actions

### 4. Payment Security
- PCI-DSS compliant providers only
- Test mode enforced in non-production
- Webhook signature verification

### 5. Privacy
- Minimal data collection
- No public donor lists by default
- GDPR compliance for EU donors
- Right to deletion

## Compliance System

### Three-Layer Approach

1. **Hard Rules** (Code-enforced)
   - Server/Client boundary
   - No fabricated content
   - Required affiliation disclosure

2. **Soft Rules** (Database-configured)
   - Contribution limits
   - Country restrictions
   - Fundraising periods
   - Eligibility checks

3. **Review Rules** (Workflow-enforced)
   - Content verification
   - Source citations
   - Status changes
   - Audit trail

### Compliance Rule Engine

Rules stored in `ComplianceRule` table with:
- `ruleType`: Type of rule (AMOUNT_LIMIT, COUNTRY_RESTRICTION, etc.)
- `effectiveFrom`/`effectiveTo`: Date ranges
- `isActive`: Enable/disable without deletion
- `config`: Flexible JSON configuration

## Testing Strategy

### 1. Unit Tests (Vitest)
- Utility functions (currency, dates, etc.)
- Validation schemas
- Business logic
- **Target**: 80%+ coverage

### 2. Integration Tests (Vitest + Test DB)
- Server Actions
- Database queries
- Payment adapter
- Compliance rules
- **Target**: Critical paths covered

### 3. E2E Tests (Playwright)
- User flows (view, navigate, etc.)
- Multi-locale support
- Error states
- **Target**: Happy paths + critical errors

### 4. Smoke Tests (Playwright + Production Build)
- Page loads
- Security headers
- No console errors
- Feature flags respected
- **Runs**: Before every deploy

## CI/CD Pipeline

```
Push/PR
  ↓
Install Dependencies
  ↓
Format Check (Prettier)
  ↓
Lint (ESLint)
  ↓
Type Check (TypeScript)
  ↓
Unit Tests (Vitest)
  ↓
Integration Tests (Vitest + Postgres)
  ↓
Production Build (Next.js)
  ↓
Smoke Tests (Playwright)
  ↓
✅ Ready to Deploy
```

## Payment Provider Abstraction

### Interface (`PaymentProvider`)
```typescript
interface PaymentProvider {
  createPaymentIntent(amount, currency, metadata)
  confirmPayment(intentId)
  handleWebhook(payload, signature)
  refund(chargeId, amount?)
  isTestMode()
}
```

### Implementations
- `StripeProvider`: Stripe integration (primary)
- `TestPaymentProvider`: Development/testing
- Future: PayPal, other providers

### Benefits
- Easy provider switching
- Test mode for development
- Unified API for application code
- Provider-specific code isolated

## Environment Configuration

### Required (Production)
```
DATABASE_URL=postgresql://...
SITE_URL=https://example.com
SUPPORT_EMAIL=support@example.com
PAYMENT_PROVIDER_API_KEY=pk_live_...
PAYMENT_PROVIDER_SECRET=sk_live_...
ENCRYPTION_KEY=...
SESSION_SECRET=...
```

### Optional
```
ENABLE_DONATIONS=false  # Feature flag
ALLOWED_COUNTRIES=US,CA,FR
LOG_LEVEL=info
```

## Deployment Considerations

### Vercel (Recommended)
- Automatic HTTPS
- Edge network
- Preview deployments
- Environment secrets
- Automatic migrations via `prisma migrate deploy`

### Alternative: Any Node.js Host
- Requires Node 20+
- PostgreSQL 14+
- Environment variables
- Manual migration runs

### Database
- Managed PostgreSQL preferred (Neon, Supabase, AWS RDS)
- Point-in-time recovery
- Daily encrypted backups
- Connection pooling for scale

## Monitoring & Observability

### Essential Metrics
- Error rate
- Response times
- Contribution success rate
- Database query performance
- Payment webhook delivery

### Recommended Tools
- **Error Tracking**: Sentry
- **Performance**: Vercel Analytics or similar
- **Uptime**: UptimeRobot
- **Database**: Built-in provider monitoring

## Scalability

### Phase 1 (Launch - 0-1000 users/day)
- Single region
- Vercel serverless functions
- Managed PostgreSQL
- CDN for static assets

### Phase 2 (Growth - 1000-10000 users/day)
- Connection pooling (PgBouncer)
- Redis for caching
- Database read replicas

### Phase 3 (High Traffic - 10000+ users/day)
- Multi-region edge functions
- Advanced caching (Redis + edge)
- Database sharding (if needed)

## Future Considerations

### Potential Features
- Volunteer coordination
- Event ticketing
- Matching contributions
- Impact reports
- SMS notifications

### Technical Debt Prevention
- Regular dependency updates
- Security audits
- Performance monitoring
- Load testing before elections
- Disaster recovery drills

## References

- Product Vision: `.kiro/steering/product.md`
- Non-Negotiable Rules: `.kiro/steering/rules.md`
- Technical Stack: `.kiro/steering/tech.md`
- Code Conventions: `.kiro/steering/structure.md`
