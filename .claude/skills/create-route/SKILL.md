---
name: create-route
description: Scaffold a new API Route Handler or page route with proper structure. Use when adding new endpoints or pages.
---

## For Route Handlers (API)

1. Create the route file: `src/app/api/{domain}/route.ts`
2. Import and use `createServerClient` from `src/lib/supabase/server`
3. Validate input parameters (query params or request body)
4. Implement the handler function (GET, POST, PUT, DELETE)
5. Return typed JSON with `NextResponse.json()`
6. Handle errors with appropriate HTTP status codes
7. Add the route to `docs/ARCHITECTURE.md` if it's a new domain

### Template

```ts
// src/app/api/{domain}/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  // Validate, query, return
  return NextResponse.json({ data })
}
```

## For Page Routes

1. Create the page: `src/app/(app)/{path}/page.tsx`
2. Pages are Server Components by default — fetch data directly
3. Use Supabase server client for authenticated data
4. Pass data to client components via props
5. Include loading.tsx and error.tsx siblings if needed

### Template

```tsx
// src/app/(app)/{path}/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function {PageName}Page() {
  const supabase = await createServerClient()
  // Fetch data, render
}
```
