# Blocker Fix Plan

## Status: IN PROGRESS

### B1: TypeScript Compilation Fails ✅ PARTIALLY FIXED
- [x] B4: Install @sentry/nextjs dependency
- [ ] Fix instrumentation.ts type errors
- [ ] Fix seed file type errors
- [ ] Fix component type errors

### B2: Missing Database Models ⚠️ NEEDS WORK
**Missing from schema.prisma**:
- [ ] NewsArticle (referenced in seed-news.ts)
- [ ] NewsSource (referenced in seed-news.ts)
- [ ] NewsQuery (referenced in seed-news.ts)
- [ ] Commune (referenced in seed-nord-ouest.ts)
- [ ] PressKit (referenced in seed-nord-ouest.ts)
- [ ] ReservedSlug (referenced in seed.ts)
- [ ] Chapter (referenced in seed.ts, already in schema but incomplete)
- [ ] RootsAggregate (referenced in seed.ts)
- [ ] EligibilityAttestation (referenced in seed-compliance.ts)

**Decision needed**: 
- Add these models to schema OR
- Comment out seed files until models are designed OR
- Remove seed files that reference non-existent models

**Recommendation**: Since Prompt 9 (news) was documented but models weren't added, let's add the news models now. For other models (Commune, Chapter, etc.), comment out seed files until properly designed.

### B3: Enum Mismatches ✅ FIXED
- [x] Add ELECTIONS to ContentCategory enum
- [x] RuleType already has needed values (SANCTIONS_SCREENING, PROHIBITED_SOURCE, PRE_CAMPAIGN_BLOCK)
- [x] UserRole already has COMPLIANCE

### B5-B15: Other Blockers
Will be resolved automatically once B1-B3 are fixed.

## Next Actions

1. **Add News Models** (from Prompt 9 docs):
   - NewsArticle
   - NewsSource  
   - NewsQuery
   - IngestionRun
   
2. **Fix or Remove Seed Files**:
   - seed-news.ts: Fix after adding models
   - seed-nord-ouest.ts: Comment out or add Commune/PressKit models
   - seed-journey.ts: Fix ContentCategory.ELECTIONS (already done)
   - seed-compliance.ts: Fix ComplianceRule issues
   - seed.ts: Comment out references to non-existent models

3. **Fix instrumentation.ts**:
   - Add SENTRY_DSN, VERCEL_ENV, VERCEL_GIT_COMMIT_SHA to env types
   - Fix implicit any types

4. **Run type-check** to verify all fixes

5. **Run lint --fix** to auto-fix linting issues

6. **Generate Prisma client** after schema changes

7. **Test build** to confirm no blocking errors
