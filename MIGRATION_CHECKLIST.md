# Migration Checklist - Next.js 15 Upgrade

Print this page and check off items as you complete them.

## Pre-Migration

- [ ] Backup current codebase (already in git, but verify)
- [ ] Verify Node.js version: `node --version` (should be v20+)
- [ ] Verify git status is clean: `git status`
- [ ] Create feature branch (optional): `git checkout -b upgrade/nextjs-15`

## Installation Phase

- [ ] Remove old dependencies: `rm -rf node_modules package-lock.json .next`
- [ ] Install new dependencies: `npm install`
- [ ] Regenerate Prisma client: `npx prisma generate`
- [ ] Verify no installation errors in terminal
- [ ] Check `node_modules` folder exists

## Code Scanning Phase

- [ ] Run compatibility checker: `npm run upgrade:check`
- [ ] Document number of errors found: _____ errors
- [ ] Document number of warnings found: _____ warnings
- [ ] Take screenshot or copy output for reference

## Code Migration Phase

For each error found by the checker:

### Dynamic Routes (if applicable)
- [ ] Find all files in `src/app/[locale]/` with params
- [ ] Update function signature to use `Promise<{ ... }>`
- [ ] Add `async` keyword to component
- [ ] Add `await params` in function body
- [ ] Test each updated page

### Async APIs (if applicable)
- [ ] Find all `cookies()` calls
- [ ] Add `await` before `cookies()`
- [ ] Find all `headers()` calls
- [ ] Add `await` before `headers()`
- [ ] Test each updated API route

### Fetch Caching (if applicable)
- [ ] Find all `fetch()` calls
- [ ] Add caching strategy to each:
  - [ ] Static data: `{ cache: 'force-cache' }`
  - [ ] ISR data: `{ next: { revalidate: N } }`
  - [ ] Dynamic data: `{ cache: 'no-store' }`
- [ ] Document decisions for each fetch call

### Metadata Functions (if applicable)
- [ ] Find all `generateMetadata` functions
- [ ] Update params to `Promise<{ ... }>`
- [ ] Add `await params` in function body
- [ ] Test metadata generation

### Crypto Imports (if applicable)
- [ ] Find all `import crypto from 'crypto'`
- [ ] Replace with `import { ... } from 'node:crypto'`
- [ ] Update usage in code
- [ ] Test crypto functionality

## Testing Phase

### Type Checking
- [ ] Run: `npm run type-check`
- [ ] Result: ✅ No errors / ❌ Errors found (fix before continuing)
- [ ] Fix all TypeScript errors
- [ ] Re-run type check until clean

### Build Testing
- [ ] Run: `npm run build`
- [ ] Result: ✅ Success / ❌ Failed (fix before continuing)
- [ ] Note build time: _____ seconds
- [ ] Check for any warnings in output

### Dev Server Testing
- [ ] Run: `npm run dev`
- [ ] Result: ✅ Started / ❌ Failed
- [ ] Open: http://localhost:3000
- [ ] Test home page loads
- [ ] Test about page loads
- [ ] Test contribute page (if enabled)
- [ ] Test privacy page loads
- [ ] Test all language variants (ht, fr, en)
- [ ] Check browser console for errors
- [ ] Stop dev server: Ctrl+C

### Unit Tests
- [ ] Run: `npm run test:unit`
- [ ] Result: ✅ All pass / ❌ Some failed
- [ ] Number of tests: _____ passed / _____ total
- [ ] Fix any failing tests

### Integration Tests (if database available)
- [ ] Run: `npm run test:integration`
- [ ] Result: ✅ All pass / ❌ Some failed
- [ ] Fix any failing tests

### E2E Tests (optional, takes time)
- [ ] Run: `npm run test:e2e`
- [ ] Result: ✅ All pass / ❌ Some failed
- [ ] Fix any failing tests

## Pre-Deployment Phase

### Final Verification
- [ ] Run compatibility check again: `npm run upgrade:check`
- [ ] Verify 0 errors (warnings ok)
- [ ] Review all changes: `git diff`
- [ ] Verify `.nvmrc` exists with content: `20`
- [ ] Verify `eslint.config.mjs` exists
- [ ] Review `package.json` changes

### Documentation
- [ ] Update CHANGELOG.md (if you maintain one)
- [ ] Document any project-specific changes made
- [ ] Note any deviations from upgrade guide

## Deployment Phase

### Commit Changes
- [ ] Stage files: `git add .`
- [ ] Review staged changes: `git status`
- [ ] Commit with message (see NEXT_STEPS.md for template)
- [ ] Verify commit: `git log -1`

### Push to Repository
- [ ] Push to remote: `git push origin main`
- [ ] Verify push succeeded
- [ ] Note commit SHA: _________________

### Monitor Vercel Deployment
- [ ] Open Vercel dashboard
- [ ] Find latest deployment
- [ ] Watch build logs
- [ ] Verify "Building..." shows Next.js 15.x
- [ ] Verify Node.js 20 is being used
- [ ] Wait for "Deployment Ready" status
- [ ] Note deployment URL: _________________

### Production Testing
- [ ] Visit production URL
- [ ] Test home page loads
- [ ] Test about page
- [ ] Test contribute page (if enabled)
- [ ] Test privacy page
- [ ] Test language switcher
- [ ] Open browser console (F12)
- [ ] Verify no JavaScript errors
- [ ] Test one contribution flow (if enabled)
- [ ] Check page load times (should be similar or faster)

### Build Log Verification
- [ ] Open Vercel build logs
- [ ] Verify: ✅ No "deprecated" warnings
- [ ] Verify: ✅ No security vulnerability warnings
- [ ] Verify: ✅ No ESLint 8 warnings
- [ ] Verify: ✅ No crypto package warnings
- [ ] Screenshot clean build log for records

## Post-Deployment Phase

### Monitoring (First 24 Hours)
- [ ] Hour 1: Check error tracking (Sentry/etc)
- [ ] Hour 6: Check error tracking again
- [ ] Hour 24: Final error tracking check
- [ ] Monitor for any user reports
- [ ] Check analytics for anomalies

### Performance Comparison
- [ ] Run Lighthouse on production
- [ ] Performance score: _____
- [ ] Accessibility score: _____
- [ ] Compare to pre-upgrade baseline
- [ ] Document any improvements

### Cleanup (Optional)
- [ ] Remove `.eslintrc.json` if no longer needed
- [ ] Archive old `package-lock.json` if saved
- [ ] Update team documentation
- [ ] Notify team of changes

## Rollback Plan (If Needed)

If critical issues arise:

- [ ] Revert commit: `git revert HEAD`
- [ ] Push revert: `git push origin main`
- [ ] Verify Vercel redeploys previous version
- [ ] Confirm site is working
- [ ] Document what went wrong
- [ ] Create issue to track problem

## Sign-Off

**Migration completed by:** _________________

**Date:** _________________

**Total time taken:** _____ minutes

**Issues encountered:** _________________

**Notes for next time:** 

_____________________________________________

_____________________________________________

_____________________________________________

## Success Indicators ✅

All these should be true:

- [ ] ✅ Build completes with no errors
- [ ] ✅ No deprecation warnings in logs
- [ ] ✅ All tests passing
- [ ] ✅ Production site loads correctly
- [ ] ✅ No JavaScript console errors
- [ ] ✅ All features working as expected
- [ ] ✅ Team notified of changes

---

**Congratulations! Migration complete!** 🎉

Keep this checklist for future reference or similar upgrades.
