# Quick Reference - Next.js 15 Upgrade

## 📦 What Got Upgraded

```
Next.js:  14.0.4  →  15.1.6  (🔴 Security Fix)
React:    18.2.0  →  19.0.0
ESLint:   8.57.1  →  9.18.0
Prisma:   5.7.0   →  6.6.0
Node.js:  ≥18     →  ≥20
```

## 🚀 Quick Commands

```bash
# Install
rm -rf node_modules package-lock.json .next
npm install
npx prisma generate

# Check for issues
npm run upgrade:check

# Test
npm run type-check
npm run build
npm run test

# Deploy
git add .
git commit -m "chore: upgrade to Next.js 15"
git push origin main
```

## 🔧 Common Fixes

### 1. Dynamic Routes
```typescript
// ❌ Old
function Page({ params }: { params: { id: string } }) {}

// ✅ New
async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

### 2. Async APIs
```typescript
// ❌ Old
const c = cookies()
const h = headers()

// ✅ New
const c = await cookies()
const h = await headers()
```

### 3. Fetch Caching
```typescript
// ❌ Old (no longer cached by default)
fetch(url)

// ✅ New (explicit strategy)
fetch(url, { cache: 'force-cache' })  // Static
fetch(url, { next: { revalidate: 60 } })  // ISR
fetch(url, { cache: 'no-store' })  // Dynamic
```

### 4. Crypto Import
```typescript
// ❌ Old (deprecated)
import crypto from 'crypto'

// ✅ New (built-in)
import { randomBytes, createHash } from 'node:crypto'
```

### 5. Metadata Generation
```typescript
// ❌ Old
export async function generateMetadata({ params }) {
  const id = params.id
}

// ✅ New
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
}
```

## 📁 Files to Check

```bash
# Find dynamic routes
find src/app -path "*/\[*\]/*" -name "*.tsx"

# Find metadata functions
grep -r "generateMetadata" src/app

# Find fetch calls
grep -r "fetch(" src/

# Find crypto imports
grep -r "import.*crypto" src/

# Find cookies/headers
grep -r "cookies()\|headers()" src/
```

## ✅ Success Checklist

- [ ] `npm install` - no errors
- [ ] `npm run upgrade:check` - 0 errors
- [ ] `npm run type-check` - passes
- [ ] `npm run build` - succeeds
- [ ] `npm run dev` - runs clean
- [ ] Vercel deploys successfully
- [ ] No deprecation warnings in logs

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Install fails | `rm -rf node_modules .next && npm install` |
| Type errors | `rm -rf .next && npx tsc --build --clean` |
| Prisma errors | `npx prisma generate` |
| Build fails | Check upgrade:check output |
| Need rollback | `git revert HEAD && git push` |

## 📚 Documentation

| File | Use When |
|------|----------|
| `README_UPGRADE.md` | Overview & quickstart |
| `NEXT_STEPS.md` | Step-by-step guide (start here!) |
| `MIGRATION_CHECKLIST.md` | Track progress |
| `UPGRADE_GUIDE.md` | Deep technical details |
| `UPGRADE_SUMMARY.md` | What changed summary |

## 🎯 Breaking Changes Summary

1. **Params are async** - Add `await` and `Promise<>` type
2. **Request APIs are async** - `cookies()` and `headers()` need `await`
3. **No auto-caching** - `fetch()` needs explicit strategy
4. **Crypto deprecated** - Use `node:crypto` built-in

## 📊 Impact

| Metric | Before | After |
|--------|--------|-------|
| Next.js | 14.0.4 ⚠️ | 15.1.6 ✅ |
| Build warnings | Many 😟 | None 😊 |
| Security issues | 1 critical 🔴 | 0 ✅ |
| Node requirement | 18+ | 20+ |

## 🔗 Resources

- [Next.js 15 Docs](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [React 19 Blog](https://react.dev/blog/2024/04/25/react-19)
- [ESLint 9 Migration](https://eslint.org/docs/latest/use/migrate-to-9.0.0)

## 💡 Pro Tips

1. **Run upgrade:check first** - It finds most issues automatically
2. **Fix errors one file at a time** - Don't try to fix everything at once
3. **Test locally before pushing** - Catch issues early
4. **Monitor first deployment** - Watch Vercel logs carefully
5. **Keep this reference handy** - You might need it during migration

---

**Need help?** Check `NEXT_STEPS.md` for detailed instructions.
