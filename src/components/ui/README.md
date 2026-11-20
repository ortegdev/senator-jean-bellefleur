# UI Component Library

Reusable UI components following the Diaspora4Bellefleur design system.

## Components

### Button
Primary interaction component with variants and states.

**Variants:** primary, secondary, tertiary, ghost  
**Sizes:** sm (36px), md (44px), lg (52px)  
**States:** default, hover, active, focus, disabled, loading

```tsx
import { Button } from '@/components/ui/Button'

<Button variant="primary" size="lg" loading={isLoading}>
  Primary Action
</Button>
```

**Accessibility:**
- Minimum 44px tap target
- Visible focus ring (3px)
- Loading state announced to screen readers

### Card
Container component for content grouping.

**Variants:** default, interactive, featured  
**Padding:** none, sm, md, lg

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'

<Card variant="featured" padding="lg">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Badge
Compact labels for status or categories.

**Variants:** success, warning, error, info, neutral  
**Sizes:** sm, md

```tsx
import { Badge } from '@/components/ui/Badge'

<Badge variant="success">Active</Badge>
<Badge variant="warning" size="sm">Pending</Badge>
```

### Input
Form input with accessible labels and error handling.

```tsx
import { Input } from '@/components/ui/Input'

<Input
  label="Email Address"
  type="email"
  required
  error="Invalid email format"
  helperText="We'll never share your email"
/>
```

**Features:**
- Always has visible label (no placeholder-only)
- Error messages associated via ARIA
- 44px minimum height
- Clear focus states

### SectionHeader
Consistent section headings with optional divider.

```tsx
import { SectionHeader } from '@/components/ui/SectionHeader'

<SectionHeader
  title="About the Candidate"
  description="Learn more about the candidacy"
  showDivider
  action={<Button>View All</Button>}
/>
```

### ImagePlaceholder
Elegant placeholder for candidate photos (RULE 6).

```tsx
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'

<ImagePlaceholder
  label="Photo pending approval"
  aspectRatio="4:3"
  size="lg"
/>
```

### ProgressBar
Visual feedback for processes.

**Variants:** determinate, indeterminate

```tsx
import { ProgressBar } from '@/components/ui/ProgressBar'

<ProgressBar
  value={75}
  variant="determinate"
  label="Upload Progress"
  showPercentage
  color="seaGreen"
/>
```

## Component Patterns

### Server Components (Default)
```tsx
// No "use client" directive
import { getCandidateConfig } from '@/lib/config/candidate'

export async function CandidateInfo() {
  const config = await getCandidateConfig()
  return <div>{config.candidateName}</div>
}
```

### Client Components (Interactive)
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function InteractiveForm() {
  const [value, setValue] = useState('')
  
  return (
    <Button onClick={() => setValue('clicked')}>
      Click Me
    </Button>
  )
}
```

## Accessibility Standards

All components meet WCAG 2.2 Level AA:

✅ Keyboard navigation  
✅ Screen reader support  
✅ Focus indicators (3px)  
✅ ARIA labels  
✅ Semantic HTML  
✅ Color contrast verified  
✅ Touch targets 44px minimum  

## Design System Integration

All components use design tokens from `tailwind.config.ts`:

- Colors: Brand palette
- Typography: Fraunces (display) + Inter (body)
- Spacing: Base-4 scale
- Border radius: xs to xl
- Shadows: sm to xl
- Motion: Respects prefers-reduced-motion

## Testing

Components are tested in:
- Unit tests (Vitest)
- E2E tests (Playwright)
- Visual regression (screenshots at 360/768/1280px)

See `/tests` directory for examples.
