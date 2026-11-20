# Technical Architecture

## Technology Stack

### Core Framework
- **Next.js 15+** (App Router)
- **TypeScript** (strict mode)
- **React 19+**

### Styling
- **Tailwind CSS** - Utility-first styling
- **CSS Modules** - Component-scoped styles when needed

### Database
- **PostgreSQL** - Production database
- **Prisma** - Type-safe ORM and migrations

### Internationalization  
- **next-intl** - Server-side i18n for App Router

### Validation
- **Zod** - Runtime type validation

### Testing
- **Vitest** - Unit and integration tests
- **Playwright** - E2E and smoke tests
- **Testing Library** - React component testing

### Code Quality
- **ESLint** - Linting
- **Prettier** - Formatting
- **TypeScript** - Type checking

## Architecture Principles

### Server-First
- Maximize Server Components for performance and security
- Client Components only when interactivity required
- Server Actions for mutations
- Edge runtime where appropriate

### Type Safety
- Strict TypeScript throughout
- Zod schemas for runtime validation
- Prisma for type-safe database queries
- No `any` types without explicit justification

### Configuration Over Code
- Database-driven compliance rules
- Environment-based config
- Feature flags for gated functionality
- Admin UI for non-technical updates

### Payment Provider Abstraction
- Adapter interface for payment providers
- Easy swapping of providers
- Test mode support
- Webhook handling abstraction

### Security
- Environment secrets never in code
- Input validation on all external data
- CSRF protection
- Rate limiting on sensitive endpoints
- No PCI data storage

## Project Structure

```
/
├── .kiro/
│   └── steering/          # Project steering docs
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── [locale]/      # Localized routes
│   │   ├── api/           # API routes
│   │   └── actions/       # Server Actions
│   ├── components/
│   │   ├── client/        # "use client" components
│   │   └── server/        # Server Components
│   ├── lib/
│   │   ├── db/            # Database utilities
│   │   ├── payments/      # Payment adapter
│   │   ├── validation/    # Zod schemas
│   │   └── config/        # Configuration
│   ├── i18n/              # Translations
│   └── types/             # TypeScript types
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Migration history
│   └── seed.ts            # Seed data
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # Playwright tests
└── public/                # Static assets
```

## Data Model (Key Entities)

### CandidateConfig
- Single source of truth for candidate information
- All dates, names, departments from this record
- Versioned for audit trail
- Admin-editable

### Content
- Sourced, versioned content blocks
- Status: DRAFT, NEEDS_REVIEW, PUBLISHED
- Source citations required for PUBLISHED
- Multilingual support

### Contribution
- Encrypted donor information
- No card data storage
- Compliance flags
- Receipt generation

### ComplianceRules
- Database-driven limits and eligibility
- Effective date ranges
- Country restrictions
- Amount limits

## Environment Configuration

### Required Variables
```
DATABASE_URL=
PAYMENT_PROVIDER_API_KEY=
PAYMENT_PROVIDER_SECRET=
ENCRYPTION_KEY=
SESSION_SECRET=
SITE_URL=
SUPPORT_EMAIL=
```

### Optional Variables
```
ENABLE_DONATIONS=false
ALLOWED_COUNTRIES=US,CA,FR
LOG_LEVEL=info
```

## Development Workflow

### Local Development
```bash
npm install
npm run db:migrate:dev
npm run db:seed
npm run dev
```

### Testing
```bash
npm run test              # Unit tests
npm run test:integration  # Integration tests  
npm run test:e2e          # Playwright E2E
npm run test:smoke        # Production smoke test
```

### CI Pipeline
1. Install dependencies
2. Lint + TypeScript check
3. Run unit tests
4. Run integration tests
5. Build for production
6. Run smoke tests against build

### Deployment
- Vercel (recommended) or any Node.js host
- PostgreSQL instance (managed preferred)
- Environment secrets via platform
- Automatic migrations on deploy

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90
- **Core Web Vitals**: Pass all

## Security Requirements

- HTTPS only (enforce redirect)
- Security headers (CSP, HSTS, etc.)
- Input sanitization
- Rate limiting (donations, API calls)
- No sensitive data in logs
- Regular dependency updates
- Penetration testing before launch

## Monitoring & Observability

- Error tracking (Sentry or similar)
- Performance monitoring
- Donation flow analytics (privacy-respecting)
- Database query performance
- Uptime monitoring

## Compliance Considerations

### Data Privacy
- GDPR compliance for EU donors
- Clear privacy policy
- Data retention policy
- Right to deletion

### Election Law
- Contribution limits enforcement
- Donor eligibility checks
- Required disclosures
- Record retention (7 years Haiti election law)

### Financial
- PCI-DSS compliance (via provider)
- Receipt generation
- Refund handling
- Financial reporting support

## Payment Provider Integration

### Adapter Pattern
```typescript
interface PaymentProvider {
  createPaymentIntent(amount: number, metadata: object): Promise<PaymentIntent>
  confirmPayment(intentId: string): Promise<PaymentResult>
  handleWebhook(payload: unknown, signature: string): Promise<WebhookEvent>
  refund(chargeId: string, amount?: number): Promise<RefundResult>
}
```

### Supported Providers (via adapters)
- Stripe (initial)
- PayPal (future)
- Others as needed

### Test Mode
- All providers support test mode
- Test mode enforced in non-production environments
- Clear indicators in UI

## Scalability Plan

### Phase 1 (Launch)
- Single-region deployment
- Managed PostgreSQL
- CDN for static assets

### Phase 2 (Growth)
- Database connection pooling
- Redis caching layer
- Horizontal API scaling

### Phase 3 (High Traffic)
- Read replicas
- Edge functions
- Advanced caching strategies

## Disaster Recovery

- Daily database backups (encrypted)
- Point-in-time recovery capability
- Backup payment provider configuration
- Documented recovery procedures
- Regular recovery drills
