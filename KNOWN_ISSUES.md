# Known Issues - Post-Upgrade

## TypeScript Errors (Prisma 6 Stricter Types)

After upgrading to Prisma 6, there are TypeScript type errors due to stricter type checking for JSON fields.

### Issue: JsonValue vs InputJsonValue

**Location**: `prisma/seed-compliance.ts` and other files

**Error**:
```
error TS2322: Type 'JsonValue' is not assignable to type 'JsonNull | InputJsonValue'.
```

**Cause**: Prisma 6 has stricter types for JSON fields. The `config` field in seed files needs type casting.

**Fix**: Cast JSON values explicitly:
```typescript
// Before
config: rule.config,

// After
config: rule.config as Prisma.InputJsonValue,
```

### Temporary Solution (For Build)

To get the build working immediately while we fix type issues, you can:

**Option 1: Add type assertions (recommended)**
Fix each error by adding proper type assertions.

**Option 2: Temporarily disable strict checking for specific files**
Add `// @ts-nocheck` at the top of problematic seed files.

**Option 3: Skip type check in build (NOT recommended for production)**
Only use this temporarily:
```json
// package.json
{
  "scripts": {
    "build": "npm run check:whatsapp && next build",
    "build:skip-check": "npm run check:whatsapp && SKIP_TYPE_CHECK=1 next build"
  }
}
```

Then in `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === '1',
  },
  // ... rest of config
}
```

## Other Minor Issues

### Unused Variables

Several scripts have unused variables:
- `scripts/check-boundaries.ts`
- `scripts/check-translations.ts`
- `scripts/check-whatsapp-violations.ts`
- `scripts/verify-journey-sources.ts`

**Fix**: Remove unused variables or prefix with underscore:
```typescript
// Before
const unused = something

// After
const _unused = something  // or just remove it
```

### Possible Undefined Objects

Some scripts need null checks:
- `scripts/check-boundaries.ts`
- `scripts/check-upgrade-compatibility.ts`
- `scripts/verify-journey-sources.ts`

**Fix**: Add proper null checks or use optional chaining:
```typescript
// Before
const value = obj.property

// After
const value = obj?.property ?? defaultValue
```

## Priority Order

1. **High Priority**: Fix Prisma JSON type errors (affects seed data)
2. **Medium Priority**: Fix unused variables (cleanup)
3. **Low Priority**: Fix potential undefined checks (defensive coding)

## Quick Fix Script

We can create a script to fix the most common issues:

```bash
# Fix unused variables by prefixing with underscore
find scripts -name "*.ts" -exec sed -i '' 's/const \([a-z][a-zA-Z0-9]*\) =/const _\1 =/g' {} \;

# This is a simplified example - manual review recommended
```

## Recommendation

For immediate deployment:
1. Add `// @ts-nocheck` to seed files temporarily
2. Deploy to fix security vulnerability
3. Create follow-up PR to fix type errors properly
4. Remove `@ts-nocheck` once types are fixed

## Timeline

- **Now**: Deploy with temporary type check bypass (Option 2)
- **Day 1-2**: Fix Prisma JSON types properly
- **Day 3-4**: Clean up unused variables and add null checks
- **Day 5**: Remove temporary bypasses, full type safety restored

---

**Note**: These issues don't affect runtime behavior - they're compile-time type checking issues from Prisma 6's improved type safety. The application will run correctly even with these warnings.
