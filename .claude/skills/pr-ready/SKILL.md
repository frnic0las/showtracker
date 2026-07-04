---
name: pr-ready
description: Pre-merge checklist to verify a branch is ready for PR. Use before opening or approving a pull request.
---

## Checklist

### Code Quality

- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm lint` passes with no warnings
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` — all tests pass

### Architecture

- [ ] Server Components used by default, `'use client'` only where needed
- [ ] No business logic in Route Handlers — extracted to lib functions
- [ ] Supabase errors handled (`const { data, error } = ...`)
- [ ] RLS policies exist for any new tables

### Security

- [ ] No server env vars exposed to client (`TMDB_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] User input validated before use
- [ ] RLS policies tested (user A cannot see user B's data)

### Design System

- [ ] UI matches `docs/DESIGN_SYSTEM.md`
- [ ] Dark/light mode works
- [ ] Touch targets ≥ 44px
- [ ] No hardcoded colors/spacing — Tailwind tokens only

### Git Hygiene

- [ ] Branch named correctly: `feature/<issue>-desc` or `fix/<issue>-desc`
- [ ] Commits follow convention: `feat(scope): description`
- [ ] No unrelated changes in the diff
- [ ] PR description references the issue: `Closes #<number>`
