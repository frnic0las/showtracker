---
name: create-component
description: Scaffold a new React component with proper structure, types, and Tailwind styling. Use when creating any new UI component.
---

## Steps

1. Read `docs/DESIGN_SYSTEM.md` to load current tokens and patterns
2. Determine if this is a Server or Client component
3. Create the component file in the appropriate directory:
   - `src/components/ui/` for generic UI (Button, Modal, Sheet, etc.)
   - `src/components/series/` for series-specific components
   - `src/components/movies/` for movie-specific components
   - `src/components/calendar/` for calendar-specific components
4. Define the component's props interface in the same file (or `src/types/` if shared)
5. Implement the component with Tailwind classes matching the design system
6. Add `'use client'` directive ONLY if the component uses hooks, event handlers, or browser APIs
7. Handle loading, error, and empty states if the component displays data
8. Verify touch targets are ≥ 44px for interactive elements
9. Test dark/light mode appearance

## Template

```tsx
// src/components/{domain}/{ComponentName}.tsx
interface {ComponentName}Props {
  // Define props
}

export function {ComponentName}({ ...props }: {ComponentName}Props) {
  return (
    // Use Tailwind classes from design system
  )
}
```
