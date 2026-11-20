# Visual Regression Testing

This directory contains visual regression baseline screenshots for the design system.

## Purpose

These screenshots serve as baselines for visual regression testing across different viewports and locales. Any changes to the design system that alter the visual appearance will be caught by comparing new screenshots against these baselines.

## Viewports Tested

- **360px (Mobile)**: Budget Android devices, minimum supported width
- **768px (Tablet)**: iPad and similar tablets
- **1280px (Desktop)**: Standard laptop/desktop screens

## Pages Tested

1. **Home page** (`/[locale]/`)
   - All three locales (ht, fr, en)
   - Light mode (dark mode future)

2. **Design System** (`/[locale]/design-system`)
   - Complete documentation page
   - All component variants
   - Color palette
   - Typography samples

## Running Visual Regression Tests

### Locally

```bash
# Run all visual regression tests
npm run test:e2e -- tests/e2e/design-system.spec.ts

# Update baselines (if design intentionally changed)
npm run test:e2e -- tests/e2e/design-system.spec.ts --update-snapshots
```

### In CI

Visual regression tests run automatically on:
- Pull requests to main/develop
- Direct pushes to main

Screenshots are uploaded as artifacts for review.

## Reviewing Changes

When visual regression tests fail in CI:

1. Download the screenshot artifacts from the failed workflow
2. Compare new screenshots with baselines in this directory
3. If changes are intentional (design updates):
   - Update baselines locally
   - Commit new baselines to the PR
4. If changes are unintentional:
   - Fix the issue causing visual differences
   - Re-run tests

## Screenshot Naming Convention

```
[page-name]-[viewport].png

Examples:
- design-system-360.png
- design-system-768.png
- design-system-1280.png
- home-en-360.png
- home-ht-768.png
```

## Design System Verification

These screenshots verify:

- ✅ Color palette matches specifications
- ✅ Typography renders correctly (including diacritics)
- ✅ Component spacing and sizing
- ✅ Responsive behavior at breakpoints
- ✅ Brand consistency (wordmark, coastline motif)
- ✅ Accessibility features (focus states visible)
- ✅ Layout integrity (no overflow, proper alignment)

## Performance Baseline

Screenshots are captured after `networkidle` to ensure all assets have loaded. This helps verify:

- Font loading (no FOIT/FOUT)
- Image rendering
- CSS application
- No layout shift

## Notes

- Screenshots are git-tracked for easy diff review
- Large files (> 1MB) should be optimized
- Focus on meaningful visual changes, not pixel-perfect matching
- Mobile screenshots are most critical (360px baseline)
