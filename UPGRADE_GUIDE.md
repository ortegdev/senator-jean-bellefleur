# Upgrade Guide: Next.js 15 & React 19

## Overview

This guide covers the upgrade from Next.js 14.0.4 → 15.1.6, React 18 → 19, and other major dependency updates to address security vulnerabilities and deprecation warnings.

## Critical Security Fix

**Next.js 14.0.4 has a known security vulnerability.** This upgrade addresses that issue immediately.

## Breaking Changes & Actions Required

### 1. Next.js 15 Breaking Changes

#### App Router Changes
- **Async Request APIs**: `cookies()`, `headers()`, and `params` are now async
- **Dynamic Routes**: Route params must be awaited

**Before:**
```typescript
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>;
}
```

**After:**
```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

#### Metadata API
**Before:**
```typescript
export async function generateMetadata({ params }) {
  const id = params.id;
  // ...
}
```

**After:**
```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ...
}
```

#### Server Actions
- Must explicitly mark functions with `'use server'`
- Return values must be serializable

#### Caching Changes
- `fetch()` requests are no longer cached by default
- Use `cache: 'force-cache'` for cached requests
- Use `next: { revalidate: <seconds> }` for ISR

**Before:**
```typescript
// Automatically cached
fetch('https://api.example.com/data')
```

**After:**
```typescript
// Must opt-in to caching
fetch('https://api.example.com/data', { cache: 'force-cache' })

// Or use ISR
fetch('https://api.example.com/data', {
  next: { revalidate: 3600 } // Revalidate every hour
})
```

### 2. React 19 Breaking Changes

#### Ref as Prop
- `ref` is now a regular prop (no more `forwardRef` needed for simple cases)

**Before:**
```typescript
import { forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

**After:**
```typescript
function Input({ ref, ...props }: Props & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

#### Context API
- `useContext` is now more streamlined
- Context.Provider is optional

#### New Features to Leverage
- **Actions**: Built-in form handling with `action` prop
- **useFormStatus**: Track form submission state
- **useOptimistic**: Optimistic UI updates
- **use**: Unwrap promises in components

### 3. ESLint 9 Migration

We've migrated from `.eslintrc.json` to the new flat config format (`eslint.config.mjs`).

**Changes:**
- Old config file: `.eslintrc.json` (can be deleted after verification)
- New config file: `eslint.config.mjs` (created)
- Added `@eslint/eslintrc` for backward compatibility

### 4. Prisma 6 Migration

#### Key Changes
- Better TypeScript support
- Improved error messages
- New `relationMode` for better constraint handling

**Action Required:**
```bash
# Update Prisma schema
npm run db:migrate:dev -- --name upgrade-prisma-6

# Regenerate client
npx prisma generate
```

### 5. TypeScript 5.7

New features available:
- Better type inference
- Improved error messages
- New utility types

### 6. Node.js 20 Requirement

The minimum Node.js version is now 20.0.0 (updated from 18.17.0).

**Why:**
- Better performance
- Required for some Next.js 15 features
- Long-term support (LTS) version

**Verify your Node version:**
```bash
node --version
# Should be v20.x.x or higher
```

**Upgrade Node if needed:**
```bash
# Using nvm
nvm install 20
nvm use 20

# Or download from nodejs.org
```

## Step-by-Step Upgrade Process

### 1. Clean Install

```bash
# Remove old dependencies
rm -rf node_modules package-lock.json .next

# Install updated dependencies
npm install

# Regenerate Prisma client
npx prisma generate
```

### 2. Update Your Code

#### A. Fix Dynamic Routes

Find all files in `src/app` with dynamic segments `[param]`:
```bash
find src/app -type f -name "page.tsx" -path "*/\[*\]/*"
```

Update each to use async params (see examples above).

#### B. Fix Metadata Generation

Find all `generateMetadata` functions:
```bash
grep -r "generateMetadata" src/app
```

Update to await params.

#### C. Fix Fetch Calls

Search for fetch calls that need caching:
```bash
grep -r "fetch(" src/
```

Add explicit caching strategy where needed.

#### D. Remove Deprecated `crypto` Package

We've removed the deprecated `crypto` package. Use Node.js built-in:

**Before:**
```typescript
import crypto from 'crypto';
```

**After:**
```typescript
import { webcrypto as crypto } from 'node:crypto';
// or for Next.js API routes
import { randomBytes, createHash } from 'node:crypto';
```

### 3. Run Type Checking

```bash
npm run type-check
```

Fix any TypeScript errors that arise from the upgrades.

### 4. Test Your Application

```bash
# Run dev server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

### 5. Update Environment Variables

No changes required for this upgrade, but verify your `.env` files are properly configured.

### 6. Deploy to Vercel

The upgrade should be transparent to Vercel, but monitor the deployment:

```bash
# Push changes
git add .
git commit -m "chore: upgrade to Next.js 15, React 19, and resolve security vulnerabilities"
git push origin main
```

**Vercel will automatically:**
- Detect Next.js 15
- Use Node.js 20
- Install updated dependencies
- Build with new versions

## Files to Update in This Project

Based on our codebase, here are the specific files that need attention:

### High Priority (Breaking Changes)

1. **Dynamic Routes** (if any exist):
   - `src/app/[locale]/[...slug]/page.tsx` (if exists)
   - Any files with `[param]` segments

2. **Metadata Functions**:
   - Check `src/app/[locale]/layout.tsx`
   - Check any page components with `generateMetadata`

3. **Data Fetching**:
   - Review all `fetch()` calls in Server Components
   - Add explicit caching where needed

### Medium Priority (Deprecations)

4. **Remove `crypto` imports**:
   - Search codebase for `import crypto from 'crypto'`
   - Replace with Node.js built-in

5. **Update `forwardRef` usage** (if any):
   - Check UI components for `forwardRef`
   - Simplify to use ref as prop where applicable

### Low Priority (Optimizations)

6. **Leverage New React 19 Features**:
   - Consider using `useFormStatus` for contribution forms
   - Consider using `useOptimistic` for UI updates
   - Consider using `action` prop for forms

## Verification Checklist

After completing the upgrade:

- [ ] `npm install` completes without errors
- [ ] `npm run type-check` passes
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts without warnings
- [ ] All pages load correctly in development
- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes
- [ ] No console errors in browser
- [ ] Deployed to Vercel successfully
- [ ] Production site functions correctly

## Rollback Plan

If issues arise in production:

### Option 1: Quick Rollback
```bash
git revert HEAD
git push origin main
```

### Option 2: Manual Rollback
Revert `package.json` to previous versions and redeploy.

## Performance Improvements

Expected improvements from this upgrade:

1. **Next.js 15**:
   - Faster builds (Turbopack improvements)
   - Better caching strategies
   - Improved bundle sizes

2. **React 19**:
   - Smaller bundle size
   - Better hydration performance
   - Improved ref handling

3. **TypeScript 5.7**:
   - Faster type checking
   - Better IntelliSense

4. **Node.js 20**:
   - Better runtime performance
   - Native fetch improvements

## Resources

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [React 19 Release Notes](https://react.dev/blog/2024/04/25/react-19)
- [ESLint 9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [Prisma 6 Upgrade Guide](https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions/upgrading-to-prisma-6)

## Support

If you encounter issues during the upgrade:

1. Check the verification checklist above
2. Review error messages in build logs
3. Consult the official documentation links
4. Check for known issues in GitHub repositories

## Deprecation Warnings Resolved

This upgrade resolves the following warnings:

✅ Next.js security vulnerability (critical)  
✅ ESLint 8 deprecation  
✅ `crypto` package deprecation  
✅ Old `glob` versions  
✅ `rimraf` v3  
✅ `tar` old version  
✅ `npmlog`, `gauge`, `are-we-there-yet` deprecations  
✅ `@humanwhocodes/config-array` and `@humanwhocodes/object-schema`  
✅ Node.js engine warning (auto-upgrade)

## Timeline

**Recommended upgrade timeline:**

- **Immediate**: Install dependencies, run type-check
- **Day 1**: Fix breaking changes, test locally
- **Day 2**: Deploy to staging, test thoroughly
- **Day 3**: Deploy to production, monitor

The upgrade is relatively straightforward since we're using Next.js App Router correctly and following modern React patterns.
