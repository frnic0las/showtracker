---
name: create-route
description: Scaffold a new Route Handler or Server Action with types, validation, and tests.
disable-model-invocation: true
---

Create a new API route or Server Action for: $ARGUMENTS

## If Route Handler (GET/proxy endpoint):

1. Identify the resource and HTTP methods needed
2. Create or update TypeScript interfaces in `src/types/<resource>.ts`
3. Create the Route Handler in `src/app/api/<resource>/route.ts`:
   - Import `createServerClient` from `src/lib/supabase/server`
   - Validate query params or request body
   - Check authentication (Supabase session)
   - Return typed JSON with `NextResponse.json()`
   - Handle errors with appropriate HTTP status codes
4. If it calls TMDB: use `src/lib/tmdb/client.ts`, cache the response in Supabase
5. Write tests in `src/app/api/<resource>/route.test.ts`
6. Run checks:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`

## If Server Action (mutation):

1. Create or update the action file in `src/actions/<resource>.ts`
2. Add `'use server'` directive at the top
3. Validate inputs
4. Use `createServerClient` for Supabase queries
5. Call `revalidatePath()` after mutations
6. Return typed result (not void — the client needs feedback)
7. Write tests
8. Run checks:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
