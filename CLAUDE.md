# ShowTracker — TV Series & Movies Tracker

## Project Overview

ShowTracker is a mobile-first PWA to track watched TV series (episode by episode) and movies,
with a calendar view for upcoming episodes. Inspired by TV Time, stripped to essentials.
Multi-user with authentication. Deployed on Vercel, data in Supabase.
Repository: `frnic0las/showtracker` — License: AGPL-3.0

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions, Route Handlers)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + Row Level Security)
- **External API**: TMDB v3 (The Movie Database)
- **Styling**: Tailwind CSS 4 — iOS-native aesthetic, mobile-only (375–430px)
- **Package manager**: pnpm
- **Deployment**: Vercel
- **Node**: 22+

## Code Style — STRICT

- **Language**: All code, comments, commit messages, and documentation in English
- **Indentation**: 2 spaces everywhere (TypeScript, JSON, CSS, SQL)
- **TypeScript**: Strict mode. No `any` types. Prefer `interface` over `type` for objects.
- **Components**: React Server Components by default. `'use client'` only when needed.
- **Styling**: Tailwind CSS utility classes only. No inline styles. No CSS Modules.
- **Architecture**: Next.js App Router conventions. Collocate related files.

## API Conventions

- Route Handlers (`src/app/api/`) for TMDB proxy calls and complex operations
- Server Actions for Supabase mutations (toggle watched, add to watchlist)
- Supabase client: `createServerClient()` from `@supabase/ssr` for server, `createBrowserClient()` for client
- TMDB API key in `TMDB_API_KEY` env var — NEVER exposed to client
- All TMDB calls go through Route Handlers to protect the API key

## Database Conventions

- Migrations are numbered sequentially in `supabase/migrations/`
- RPC functions: ALWAYS `DROP FUNCTION IF EXISTS` then `CREATE FUNCTION` — never bare `CREATE OR REPLACE FUNCTION`. Postgres rejects a `CREATE OR REPLACE` that changes the return type or OUT parameters (`ERROR: cannot change return type of existing function`), so a signature change fails the migration. Dropping first makes it work. See migration 007, which adds `series_status` to the return table.
- RPC functions use `language sql`, `stable`, `security invoker`, `set search_path = public`
- Unbounded aggregations (SUM, COUNT over JOINs) go in RPC functions, not PostgREST queries — the 1000-row default cap silently truncates results
- The `set_updated_at` trigger on `user_series` handles `updated_at` automatically — don't set it manually in application code

## Project Structure

```
showtracker/
├── .claude/
│   ├── agents/           # Claude Code subagents
│   │   ├── backend-dev.md
│   │   ├── frontend-dev.md
│   │   ├── ui-designer.md
│   │   ├── code-reviewer.md
│   │   ├── security-reviewer.md
│   │   └── test-writer.md
│   └── skills/
│       ├── create-component/SKILL.md
│       ├── create-route/SKILL.md
│       ├── fix-issue/SKILL.md
│       └── pr-ready/SKILL.md
├── src/
│   ├── app/
│   │   ├── (auth)/       # Login, signup (public)
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/        # Main app (authenticated)
│   │   │   ├── series/   # Series list + [id] detail
│   │   │   ├── movies/   # Movies list
│   │   │   ├── calendar/ # Upcoming episodes
│   │   │   └── profile/  # Stats + settings
│   │   ├── api/
│   │   │   ├── tmdb/     # TMDB proxy (search, details, seasons)
│   │   │   └── import/   # TV Time import endpoint
│   │   ├── layout.tsx
│   │   └── page.tsx      # Redirect to /series or /login
│   ├── components/
│   │   ├── ui/           # Button, Modal, SearchBar, BottomNav, Sheet
│   │   ├── series/       # SeriesCard, SeasonAccordion, EpisodeRow
│   │   ├── movies/       # MovieCard, MovieSearch
│   │   └── calendar/     # CalendarDay, EpisodeEntry
│   ├── hooks/            # useDebounce, useInfiniteScroll, etc.
│   ├── lib/
│   │   ├── supabase/     # Server + browser client factories
│   │   ├── tmdb/         # TMDB client, types, helpers
│   │   └── utils.ts
│   ├── actions/          # Server Actions (watch, unwatch, add series)
│   └── types/            # Shared TypeScript interfaces
├── docs/
│   ├── DESIGN_SYSTEM.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── IMPORT.md
├── scripts/
│   └── import-tvtime.ts
├── supabase/
│   └── migrations/
├── public/
│   ├── manifest.json
│   └── icons/
├── CLAUDE.md
├── README.md
├── .gitignore
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role key (server-only)
TMDB_API_KEY=                   # TMDB API v3 key (server-only)
```

## Git Workflow

- Branch naming: `feature/<issue-number>-short-description`, `fix/<issue-number>-short-description`
- Commit messages: `feat(scope): description`, `fix(scope): description`, `docs(scope): description`
- Scopes: `series`, `movies`, `calendar`, `auth`, `import`, `ui`, `db`, `api`
- Every change goes through a PR linked to a GitHub issue.
- Never commit directly to `main`.

## Commands

- **Dev server**: `pnpm dev`
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Typecheck**: `pnpm typecheck`
- **Tests**: `pnpm test`
- **Import TV Time data**: `pnpm tsx scripts/import-tvtime.ts`

## Behavioral Guidelines

### Think Before Coding

- State your assumptions explicitly before implementing. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First

- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked. No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.

### Surgical Changes

- Touch only what you must. Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken. Match existing style.
- If you notice unrelated issues, mention them — don't fix them silently.
- Remove only imports/variables/functions that YOUR changes made unused.
- The test: every changed line should trace directly to the request.

### Goal-Driven Execution

- Transform tasks into verifiable goals with success criteria.
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- For multi-step tasks, state a brief plan with verification at each step.

## Workflow

- Every GitHub issue goes through the `fix-issue` skill (`.claude/skills/fix-issue/SKILL.md`).
- Every PR goes through the `pr-ready` skill (`.claude/skills/pr-ready/SKILL.md`) before pushing.
- The skills in `.claude/skills/` are the reference for scaffolding patterns — consult them whenever they apply.

## Project Rules

- NEVER add placeholder data or mock content. Only display real data from Supabase/TMDB.
- NEVER skip error handling on API calls or Supabase queries.
- NEVER expose TMDB_API_KEY or SUPABASE_SERVICE_ROLE_KEY to the client.
- ALWAYS check the design system (`docs/DESIGN_SYSTEM.md`) before creating UI components.
- ALWAYS use RLS policies — never trust client-side auth alone.
- ALWAYS search existing code patterns before implementing something new.
- ALWAYS use Server Components unless client interactivity is required.
- ALWAYS handle loading and error states in UI components.
