# Design System Library

Core design tokens and utilities for the Diaspora4Bellefleur design system.

## Files

### `colors.ts`

Complete color system with WCAG 2.2 AA verified contrast ratios.

**Exports:**
- `colors` - Full palette with shades (50-900)
- `contrastRatios` - Documented contrast ratios for transparency
- `semanticColors` - Mapped colors for component states
- `accessiblePairs` - Pre-verified color combinations

**Usage:**
```typescript
import { colors, accessiblePairs } from '@/lib/design/colors'

// Use in components
const primaryButton = accessiblePairs.primaryButton
// { bg: '#C8432B', text: '#FFFFFF', hover: '#A03522', focus: '#C8432B' }
```

### `motion.ts`

Motion design tokens with prefers-reduced-motion support.

**Exports:**
- `motion` - Duration and easing tokens
- `motionVars` - CSS custom properties
- `usePrefersReducedMotion()` - React hook

**Usage:**
```typescript
import { usePrefersReducedMotion } from '@/lib/design/motion'

function AnimatedComponent() {
  const prefersReduced = usePrefersReducedMotion()
  
  if (prefersReduced) {
    return <StaticComponent />
  }
  
  return <AnimatedComponent />
}
```

## Design Tokens in Tailwind

All tokens are available as Tailwind utilities:

```tsx
// Colors
<div className="bg-deepLagoon text-sandPaper">

// Typography
<h1 className="font-display text-4xl">

// Spacing
<section className="py-20">

// Shadows
<div className="shadow-lg">

// Border Radius
<div className="rounded-lg">

// Motion
<button className="transition-fast hover:scale-105">
```

## WCAG Compliance

All color pairings documented in `colors.ts` meet WCAG 2.2 Level AA requirements:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

Ratios are verified and documented for auditability.

## Brand Colors Quick Reference

| Color | Hex | Role |
|-------|-----|------|
| Deep Lagoon | #0F3D4A | Anchor, trust, headers |
| Coral | #C8432B | Primary action, energy |
| Sand Paper | #FAF6EE | Background, warmth |
| Ink | #0B1D24 | Primary text |
| Sea Green | #1F8A70 | Success, progress |
| Salt Gold | #EFB93F | Warning, highlight |

## Motion Tokens Quick Reference

| Token | Value | Use Case |
|-------|-------|----------|
| fast | 120ms | Hover, focus |
| base | 200ms | Transitions |
| slow | 300ms | Modals, complex |

All motion respects `prefers-reduced-motion: reduce`.
