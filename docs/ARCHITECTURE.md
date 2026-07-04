# Architecture Decisions

## ADR-001: Next.js App Router (monolith over separate frontend/backend)

Unlike Kiroku (FastAPI + React SPA), ShowTracker uses Next.js App Router as a unified full-stack framework. This eliminates the need for a separate backend deployment, simplifies auth handling (Supabase SSR middleware), and enables Server Components for fast initial loads on mobile.

Trade-off: tighter coupling between frontend and backend code. Mitigated by clear directory separation (`src/app/api/` for Route Handlers, `src/actions/` for Server Actions, `src/lib/` for shared logic).

## ADR-002: Supabase over SQLite

ShowTracker is multi-user with auth, deployed on Vercel (serverless). SQLite doesn't work in serverless — Supabase provides managed PostgreSQL with built-in auth and RLS. Free tier (500 MB, 2 projects) is sufficient for this use case.

## ADR-003: TMDB over TVDB

TVDB requires a paid API subscription. TMDB is free for non-commercial use, has better documentation, and covers both TV and movies. TV Time export uses TVDB IDs, so an import step maps TVDB → TMDB via TMDB's `/find` endpoint.

## ADR-004: TMDB cache in Supabase

TMDB rate limit is ~40 requests/10 seconds. With multiple users, hitting TMDB on every page load isn't sustainable. Cache TMDB metadata in Supabase tables (`series_cache`, `episodes_cache`, `movies_cache`) with a `last_fetched_at` timestamp for stale-while-revalidate.

Cache writes use the Supabase service role key (bypass RLS) in Route Handlers only. Cache reads go through the anon key (RLS allows authenticated SELECT).

## ADR-005: Tailwind CSS over component library

Mobile-only iOS aesthetic doesn't map well to Material UI, Mantine, or shadcn. Custom components with Tailwind utility classes give full control over the iOS look and feel. The design system (`docs/DESIGN_SYSTEM.md`) is the source of truth for tokens.

## ADR-006: PWA over native app

A PWA with `manifest.json` and a service worker lets users add the app to their home screen and get a near-native experience without App Store deployment. No push notifications needed — the calendar view handles "what's new."

## ADR-007: Episode-level tracking

Users track progress at the episode level, not the series level. A series is "completed" when all episodes of a finished series are watched (computed). This matches TV Time's UX and enables the calendar "catch-up" view (episodes aired but not watched).

## ADR-008: No i18n (for now)

Unlike Kiroku which supports 6 languages, ShowTracker starts English-only. i18n can be added later with `next-intl` if needed, but it's not worth the complexity for an initial release. All user-facing strings should still avoid being deeply embedded in components (use a constants file) to make future i18n easier.

## API Routes

### TMDB Proxy

| Route                          | Method | Description                        |
| ------------------------------ | ------ | ---------------------------------- |
| `/api/tmdb/search`             | GET    | Search series and movies           |
| `/api/tmdb/series/[id]`        | GET    | Series details + seasons overview  |
| `/api/tmdb/series/[id]/season/[n]` | GET | Season episodes list           |
| `/api/tmdb/movies/[id]`        | GET    | Movie details                      |

### Import

| Route               | Method | Description                         |
| -------------------- | ------ | ----------------------------------- |
| `/api/import/tvtime` | POST   | Upload TV Time JSON, runs migration |

### Server Actions (not API routes)

| Action                | File                    | Description                              |
| --------------------- | ----------------------- | ---------------------------------------- |
| `addSeries`           | `src/actions/series.ts` | Add a series to user's watchlist          |
| `removeSeries`        | `src/actions/series.ts` | Remove series + cascade episodes          |
| `updateSeriesStatus`  | `src/actions/series.ts` | Change status (watching/stopped/watchlist)|
| `toggleEpisodeWatched`| `src/actions/series.ts` | Mark/unmark an episode as watched         |
| `markSeasonWatched`   | `src/actions/series.ts` | Mark all episodes in a season as watched  |
| `addMovie`            | `src/actions/movies.ts` | Add movie to watchlist or mark as watched |
| `removeMovie`         | `src/actions/movies.ts` | Remove movie                              |
| `toggleMovieWatched`  | `src/actions/movies.ts` | Toggle watched status                     |
