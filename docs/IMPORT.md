# TV Time Import Strategy

## Source Data

TV Time export provides two JSON files:

- `tvtime-series-*.json`: 226 series with embedded seasons/episodes (11,705 episodes, 7,245 watched)
- `tvtime-movies-*.json`: 219 movies (194 watched, 25 watchlist)

## Key Problem: TVDB → TMDB ID Mapping

TV Time uses TVDB IDs. ShowTracker uses TMDB. TMDB provides a `/find/{external_id}` endpoint that accepts `external_source=tvdb_id` or `external_source=imdb_id`.

### Strategy

1. **Movies**: 217/219 have IMDB IDs → use `/find/{imdb_id}?external_source=imdb_id`
2. **Movies without IMDB**: 2 movies → use `/find/{tvdb_id}?external_source=tvdb_id`
3. **Series**: 0 IMDB IDs → all 226 use `/find/{tvdb_id}?external_source=tvdb_id`

Total API calls: ~228. At TMDB's rate limit (~40 req/10 sec), this takes ~60 seconds.

## Status Mapping

| TV Time Status    | Count | ShowTracker Status |
| ----------------- | ----- | ------------------ |
| `up_to_date`      | 130   | `watching`         |
| `continuing`      | 14    | `watching`         |
| `stopped`         | 58    | `stopped`          |
| `not_started_yet` | 24    | `watchlist`        |

## Import Script Flow (`scripts/import-tvtime.ts`)

```
1. Read tvtime-series-*.json and tvtime-movies-*.json from disk
2. For each series/movie, call TMDB /find to get TMDB ID
   - Store mapping in tvdb_tmdb_mapping table for reference
   - If no match found, log and skip (user can add manually later)
   - Rate limit: max 4 requests/second with retry on 429
3. For each matched series:
   a. Upsert into series_cache (fetch full details from TMDB /tv/{id})
   b. For each season, fetch episodes from TMDB /tv/{id}/season/{n}
   c. Upsert episodes into episodes_cache
   d. Insert user_series row with mapped status
   e. For each watched episode, insert user_episodes row with original watched_at
4. For each matched movie:
   a. Upsert into movies_cache (fetch details from TMDB /movie/{id})
   b. Insert user_movies row with watched status and original watched_at
5. Print summary: matched, skipped, total episodes imported
```

## Special Episodes (Season 0)

TV Time exports ~1,780 "special" episodes (season 0). TMDB handles specials differently — some series have a Season 0, others don't. Import strategy:

- Skip season 0 episodes during import
- Users who want specials can track them manually after import

## Handling Failures

- Script is idempotent: uses `ON CONFLICT DO NOTHING` for all inserts
- Progress is logged per series/movie
- Failed mappings are collected and printed at the end
- Can be re-run safely after fixing issues

## Environment Setup for Import

```bash
# .env.local must have:
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # Service role to bypass RLS during import
TMDB_API_KEY=...

# Run:
pnpm tsx scripts/import-tvtime.ts ./data/tvtime-series.json ./data/tvtime-movies.json
```
