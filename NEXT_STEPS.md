# Next Steps - Upgrade to Next.js 15

## ✅ What's Already Done

- [x] Updated `package.json` with latest versions
- [x] Removed deprecated `crypto` package
- [x] Created ESLint 9 flat config (`eslint.config.mjs`)
- [x] Updated Node.js requirement to v20
- [x] Created comprehensive upgrade guide
- [x] Created compatibility checker script
- [x] Added `.nvmrc` file for Node version management
- [x] Added missing script aliases for CI

## 🚀 What You Need to Do Now

### Step 1: Install Dependencies (5 minutes)

```bash
# Clean install to avoid conflicts
rm -rf node_modules package-lock.json .next

# Install updated packages
npm install

# Regenerate Prisma client for v6
npx prisma generate
```

**Expected output:**
- No errors during installation
- Prisma client generated successfully
- `node_modules` folder created

### Step 2: Check for Breaking Changes (2 minutes)

```bash
# Run the compatibility checker
npm run upgrade:check
```

**What to look for:**
- ❌ **Errors** (red) - Must fix before deploying
- ⚠️ **Warnings** (yellow) - Should review and fix
- ℹ️ **Info** (blue) - Optional improvements

**Common issues you might see:**
1. Dynamic route params need `await`
2. `fetch()` calls need explicit caching
3. `cookies()` or `headers()` need `await`

### Step 3: Fix Breaking Changes (15-30 minutes)

Run through each error reported by the checker. The most common fixes:

#### Fix 1: Dynamic Route Params

**Find files with:** `src/app/[locale]/...` pattern

**Change from:**
```typescript
export default function Page({ params }: { params: { locale: string } }) {
  return <div>{params.locale}</div>
}
```

**Change to:**
```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <div>{locale}</div>
}
```

#### Fix 2: Async Request APIs

**Change from:**
```typescript
const cookieStore = cookies()
const headersList = headers()
```

**Change to:**
```typescript
const cookieStore = await cookies()
const headersList = await headers()
```

#### Fix 3: Fetch Caching

**Review all `fetch()` calls and add caching strategy:**

```typescript
// For static data (cached forever)
fetch(url, { cache: 'force-cache' })

// For ISR (revalidate periodically)
fetch(url, { next: { revalidate: 3600 } }) // 1 hour

// For dynamic data (no cache)
fetch(url, { cache: 'no-store' })
```

### Step 4: Test Locally (10 minutes)

```bash
# Type check
npm run type-check
# Should show no errors

# Build
npm run build
# Should complete successfully

# Run dev server
npm run dev
# Visit http://localhost:3000 and test all pages
```

**Test these pages:**
- [ ] Home page
- [ ] About page
- [ ] Contribute page (if donations enabled)
- [ ] Privacy page
- [ ] All locale switcher options (ht, fr, en)

### Step 5: Run Tests (5 minutes)

```bash
# Unit tests
npm run test:unit

# Integration tests (requires DB)
npm run test:integration

# E2E tests (takes longer)
npm run test:e2e
```

**All tests should pass.** If any fail, review the error messages and fix.

### Step 6: Commit Changes (2 minutes)

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "chore: upgrade to Next.js 15, React 19, and resolve security vulnerabilities

- Upgrade Next.js 14.0.4 → 15.1.6 (security fix)
- Upgrade React 18 → 19
- Upgrade ESLint 8 → 9
- Upgrade Prisma 5 → 6
- Remove deprecated crypto package
- Update Node.js requirement to v20
- Create ESLint 9 flat config
- Add upgrade compatibility checker

Breaking changes addressed:
- [List any specific changes you made]

See UPGRADE_GUIDE.md for full details."

# Push to trigger Vercel deployment
git push origin main
```

### Step 7: Monitor Deployment (10 minutes)

1. Go to your Vercel dashboard
2. Watch the build logs
3. **Expected behavior:**
   - Vercel detects Next.js 15
   - Uses Node.js 20 automatically
   - Build completes successfully
   - All deprecation warnings resolved ✅

4. **After deployment:**
   - Visit your production site
   - Test all main pages
   - Check browser console (should be no errors)
   - Test contribution flow (if enabled)

## 🎯 Success Criteria

You'll know the upgrade is successful when:

- ✅ No errors during `npm install`
- ✅ `npm run upgrade:check` shows 0 errors
- ✅ `npm run type-check` passes
- ✅ `npm run build` succeeds
- ✅ All tests pass
- ✅ Dev server runs without warnings
- ✅ Vercel build completes successfully
- ✅ **No deprecation warnings in Vercel logs** (main goal!)
- ✅ Production site loads and functions correctly

## ⚠️ Troubleshooting

### Issue: Type errors after install

**Solution:**
```bash
# Clear TypeScript cache
rm -rf .next
npx tsc --build --clean
npm run type-check
```

### Issue: Prisma errors

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# If schema changed, create migration
npm run db:migrate:dev -- --name upgrade-prisma-6
```

### Issue: ESLint errors

**Solution:**
The old `.eslintrc.json` file can coexist with the new `eslint.config.mjs`. If you see conflicts:

```bash
# Remove old config (after verifying new one works)
rm .eslintrc.json

# Run lint again
npm run lint
```

### Issue: Build fails in Vercel

**Rollback steps:**
```bash
# Revert the commit
git revert HEAD

# Push to redeploy previous version
git push origin main
```

## 📚 Reference Documents

- **`UPGRADE_SUMMARY.md`** - Quick reference of what changed
- **`UPGRADE_GUIDE.md`** - Detailed migration instructions
- **`package.json`** - Updated dependencies
- **`eslint.config.mjs`** - New ESLint configuration
- **`.nvmrc`** - Node version specification

## 🆘 Need Help?

If you encounter issues:

1. Check the upgrade guide: `UPGRADE_GUIDE.md`
2. Run the compatibility checker: `npm run upgrade:check`
3. Check error messages in:
   - Terminal output
   - Browser console
   - Vercel build logs
4. Search for similar issues:
   - [Next.js GitHub Issues](https://github.com/vercel/next.js/issues)
   - [Next.js Discussions](https://github.com/vercel/next.js/discussions)

## 🎉 What You'll Gain

After successful upgrade:

- ✅ **Security**: Critical Next.js vulnerability patched
- ✅ **Performance**: ~20% faster builds with Turbopack improvements
- ✅ **No warnings**: Clean Vercel build logs
- ✅ **Better DX**: Improved TypeScript support and error messages
- ✅ **Future-proof**: Latest stable versions
- ✅ **New features**: Access to React 19 and Next.js 15 capabilities

## ⏱️ Estimated Timeline

- **Step 1-2**: 7 minutes (install + check)
- **Step 3**: 15-30 minutes (fix breaking changes)
- **Step 4-5**: 15 minutes (test locally)
- **Step 6-7**: 12 minutes (commit + deploy)

**Total: ~45-60 minutes** (depending on breaking changes found)

---

**Ready to start?** Begin with Step 1! 🚀
