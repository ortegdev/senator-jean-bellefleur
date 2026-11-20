# Project Structure & Conventions

## Directory Organization

### `/src/app` - Next.js App Router
```
app/
├── [locale]/              # Internationalized routes
│   ├── layout.tsx         # Root layout (Server Component)
│   ├── page.tsx           # Home page
│   ├── about/             # About pages
│   ├── contribute/        # Contribution flow (gated)
│   └── ...
├── api/                   # API routes
│   ├── webhooks/          # Payment webhooks
│   └── ...
└── actions/               # Server Actions
    ├── contributions.ts
    └── ...
```

### `/src/components` - React Components
```
components/
├── client/                # Client Components ("use client")
│   ├── ContributeButton.tsx
│   ├── LocaleSwitcher.tsx
│   └── ...
├── server/                # Server Components (default)
│   ├── CandidateProfile.tsx
│   ├── VerificationBadge.tsx
│   └── ...
└── ui/                    # Shared UI primitives
    ├── Button.tsx
    ├── Card.tsx
    └── ...
```

### `/src/lib` - Shared Libraries
```
lib/
├── db/
│   ├── prisma.ts          # Prisma client singleton
│   └── queries.ts         # Common queries
├── payments/
│   ├── adapter.ts         # Payment provider interface
│   ├── stripe.ts          # Stripe implementation
│   └── test.ts            # Test mode implementation
├── validation/
│   ├── schemas.ts         # Zod schemas
│   └── rules.ts           # Business rules
├── config/
│   ├── candidate.ts       # Candidate config loader
│   └── env.ts             # Environment validation
└── utils/
    ├── currency.ts
    ├── dates.ts
    └── ...
```

### `/src/i18n` - Internationalization
```
i18n/
├── messages/
│   ├── ht.json            # Haitian Creole
│   ├── fr.json            # French
│   └── en.json            # English
├── config.ts              # next-intl configuration
└── request.ts             # Server-side i18n
```

### `/prisma` - Database
```
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Migration history (git-tracked)
│   └── ...
└── seed.ts                # Seed data with candidate config
```

### `/tests` - Test Suites
```
tests/
├── unit/                  # Unit tests (Vitest)
│   ├── lib/
│   └── components/
├── integration/           # Integration tests (Vitest)
│   ├── api/
│   └── actions/
└── e2e/                   # End-to-end tests (Playwright)
    ├── home.spec.ts
    └── contribute.spec.ts
```

## Naming Conventions

### Files
- **Components**: PascalCase (`ContributeButton.tsx`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Types**: PascalCase (`CandidateConfig.ts`)
- **Server Actions**: camelCase (`contributionActions.ts`)
- **API Routes**: lowercase (`route.ts` in `/api/webhooks/stripe/route.ts`)

### Variables & Functions
- **Variables**: camelCase (`candidateConfig`, `contributionAmount`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_CONTRIBUTION_CENTS`)
- **Functions**: camelCase (`getCandidateConfig`, `validateContribution`)
- **React Components**: PascalCase (`CandidateProfile`, `ContributeButton`)
- **Types/Interfaces**: PascalCase (`CandidateConfig`, `ContributionData`)

### Database
- **Tables**: PascalCase (`CandidateConfig`, `Contribution`)
- **Columns**: camelCase (`candidateName`, `createdAt`)
- **Enums**: PascalCase (`CandidacyStatus`, `ContributionStatus`)

## Component Patterns

### Server Component (Default)
```typescript
// components/server/CandidateProfile.tsx
import { getCandidateConfig } from '@/lib/config/candidate'

export async function CandidateProfile() {
  const config = await getCandidateConfig()
  
  return (
    <div>
      <h1>{config.candidateName}</h1>
      {/* No event handlers here */}
    </div>
  )
}
```

### Client Component (Interactive)
```typescript
// components/client/ContributeButton.tsx
'use client'

import { useState } from 'react'

interface ContributeButtonProps {
  candidateName: string // Data passed from server
  onContribute: () => Promise<void> // Server Action
}

export function ContributeButton({ candidateName, onContribute }: ContributeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleClick = async () => {
    setIsLoading(true)
    await onContribute()
    setIsLoading(false)
  }
  
  return (
    <button onClick={handleClick} disabled={isLoading}>
      Support {candidateName}
    </button>
  )
}
```

### Server Action
```typescript
// app/actions/contributions.ts
'use server'

import { z } from 'zod'
import { validateContribution } from '@/lib/validation/rules'

const contributionSchema = z.object({
  amountCents: z.number().int().positive(),
  // ...
})

export async function createContribution(formData: FormData) {
  const parsed = contributionSchema.parse({
    amountCents: Number(formData.get('amount')),
  })
  
  await validateContribution(parsed)
  
  // Create contribution...
  return { success: true }
}
```

## Configuration Pattern

### Candidate Config (Single Source of Truth)
```typescript
// All candidate data comes from database, never hardcoded
import { prisma } from '@/lib/db/prisma'

export async function getCandidateConfig() {
  const config = await prisma.candidateConfig.findFirst({
    where: { slug: 'bellefleur' },
  })
  
  if (!config) {
    throw new Error('Candidate configuration not found')
  }
  
  return config
}

// Usage in components
const config = await getCandidateConfig()
const { candidateName, office, department } = config
```

### Environment Config
```typescript
// lib/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ENABLE_DONATIONS: z.string().transform(val => val === 'true').default('false'),
  SITE_URL: z.string().url(),
  // ...
})

export const env = envSchema.parse(process.env)
```

## Validation Pattern

### Zod Schemas
```typescript
// lib/validation/schemas.ts
import { z } from 'zod'

export const contributionSchema = z.object({
  amountCents: z.number().int().positive(),
  email: z.string().email(),
  country: z.string().length(2),
}).refine(
  (data) => data.amountCents >= 500,
  { message: 'Minimum contribution is $5.00' }
)

// Usage
const result = contributionSchema.safeParse(data)
if (!result.success) {
  // Handle validation errors
}
```

## Internationalization Pattern

### Message Keys
```json
// i18n/messages/en.json
{
  "candidate": {
    "name": "Jean Fritznel Bellefleur",
    "office": "Senator",
    "department": "Nord-Ouest"
  },
  "contribute": {
    "button": "Make a Contribution",
    "title": "Support {candidateName}"
  }
}
```

### Usage
```typescript
import { useTranslations } from 'next-intl'

export function ContributeSection() {
  const t = useTranslations('contribute')
  const candidate = useTranslations('candidate')
  
  return (
    <div>
      <h2>{t('title', { candidateName: candidate('name') })}</h2>
      <button>{t('button')}</button>
    </div>
  )
}
```

## Database Query Pattern

### Use Prisma Fully
```typescript
// lib/db/queries.ts
import { prisma } from './prisma'

export async function getRecentContributions(limit = 10) {
  return prisma.contribution.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    where: { status: 'COMPLETED' },
  })
}
```

## Error Handling Pattern

### Consistent Error Types
```typescript
// lib/errors.ts
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ComplianceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ComplianceError'
  }
}

// Usage
if (amountCents > config.maxAmountCents) {
  throw new ComplianceError(`Maximum contribution is $${config.maxAmountCents / 100}`)
}
```

## Testing Patterns

### Unit Tests
```typescript
// tests/unit/lib/currency.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/utils/currency'

describe('formatCurrency', () => {
  it('formats cents to dollars', () => {
    expect(formatCurrency(1500, 'USD')).toBe('$15.00')
  })
})
```

### Integration Tests
```typescript
// tests/integration/contributions.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createContribution } from '@/app/actions/contributions'

describe('createContribution', () => {
  beforeEach(async () => {
    // Seed test database
  })
  
  it('creates a valid contribution', async () => {
    // Test implementation
  })
})
```

## Git Conventions

### Branch Naming
- `feature/contribution-flow`
- `fix/date-formatting`
- `docs/readme-update`

### Commit Messages
- `feat: add contribution validation`
- `fix: correct date timezone handling`
- `docs: update architecture documentation`
- `test: add contribution flow e2e tests`

### PR Requirements
- All tests passing
- TypeScript type check passing
- Linter passing
- Description references steering rules followed
- Breaking changes documented
