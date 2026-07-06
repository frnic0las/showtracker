/**
 * One-shot migration of a TV Time export into ShowTracker. See `docs/IMPORT.md`.
 *
 * Usage:
 *   pnpm import:tvtime ./data/tvtime-series.json ./data/tvtime-movies.json
 *
 * The two file paths may be given in any order — each file is classified by
 * its shape. Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`,
 * `SUPABASE_SERVICE_ROLE_KEY` and `TMDB_API_KEY`. The imported data is attached
 * to `IMPORT_USER_ID` if set, otherwise to the sole existing auth user.
 *
 * The script is idempotent: user rows are inserted with ON CONFLICT DO NOTHING
 * and cache rows are upserted, so it can be re-run safely.
 *
 * Note on scope: `series_cache` and `movies_cache` are populated here, but
 * per-episode metadata (`episodes_cache`) is intentionally NOT fetched — the
 * app populates it on demand when a series is first viewed. This keeps the
 * import within TMDB's rate limit and the required time budget. Watched
 * history (`user_episodes`) is imported in full regardless.
 */
import './load-env';

import { readFileSync } from 'node:fs';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  TmdbApiError,
  findByExternalId,
  getMovieDetails,
  getSeriesDetails,
} from '@/lib/tmdb/client';
import type { TmdbMovieDetails, TmdbSeriesDetails } from '@/lib/tmdb/types';

// --- TV Time export shapes (only the fields we consume) --------------------

interface TvTimeId {
  tvdb: number | null;
  imdb: string | null;
}

interface TvTimeEpisode {
  number: number;
  is_watched: boolean;
  watched_at: string | null;
}

interface TvTimeSeason {
  number: number;
  episodes: TvTimeEpisode[];
}

interface TvTimeSeries {
  id: TvTimeId;
  title: string;
  status: string;
  seasons: TvTimeSeason[];
}

interface TvTimeMovie {
  id: TvTimeId;
  title: string;
  is_watched: boolean;
  watched_at: string | null;
}

type ShowTrackerStatus = 'watching' | 'stopped' | 'watchlist';

// --- Configuration ---------------------------------------------------------

/** TV Time watching statuses mapped to ShowTracker's three states. */
const SERIES_STATUS_MAP: Record<string, ShowTrackerStatus> = {
  up_to_date: 'watching',
  continuing: 'watching',
  stopped: 'stopped',
  not_started_yet: 'watchlist',
};

/** Minimum spacing between TMDB requests: 250ms → max 4 requests/second. */
const MIN_REQUEST_INTERVAL_MS = 250;

/** Max attempts for a single TMDB request before giving up. */
const MAX_TMDB_ATTEMPTS = 5;

// --- TMDB rate limiting + retry --------------------------------------------

let nextRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Blocks until the next request slot is free, enforcing the 4/sec ceiling. */
async function acquireRequestSlot(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextRequestAt - now);
  nextRequestAt = Math.max(now, nextRequestAt) + MIN_REQUEST_INTERVAL_MS;
  if (wait > 0) {
    await sleep(wait);
  }
}

/**
 * Runs a TMDB call under the rate limiter, retrying on 429 (rate limited),
 * network errors, and 5xx responses with linear backoff. 404 and other client
 * errors propagate immediately — the caller decides how to handle them.
 */
async function tmdbRequest<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    await acquireRequestSlot();
    try {
      return await fn();
    } catch (error) {
      const status = error instanceof TmdbApiError ? error.status : -1;
      const retryable = status === 429 || status === 0 || (status >= 500 && status < 600);
      if (!retryable || attempt >= MAX_TMDB_ATTEMPTS) {
        throw error;
      }
      const backoff = (status === 429 ? 1000 : 500) * attempt;
      console.warn(`  ⚠ ${label}: status ${status}, retry ${attempt}/${MAX_TMDB_ATTEMPTS} in ${backoff}ms`);
      await sleep(backoff);
    }
  }
}

// --- Helpers ---------------------------------------------------------------

/**
 * Normalizes a TV Time timestamp to an ISO-8601 UTC string. Episode timestamps
 * arrive as `"YYYY-MM-DD HH:MM:SS"` (space-separated, no zone); movie timestamps
 * are already ISO with a `Z`. Anything without an explicit zone is treated as
 * UTC and stamped with `Z`, so a `timestamptz` column never falls back to the
 * DB session timezone.
 */
function toIsoTimestamp(value: string): string {
  const trimmed = value.trim();
  // Already carries a zone designator (`Z` or a numeric offset) — trust it.
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)) {
    return trimmed;
  }
  const isoBody = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  return `${isoBody}Z`;
}

/** Reads and parses a JSON file, asserting it is a top-level array. */
function readJsonArray(path: string): unknown[] {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected a JSON array in ${path}`);
  }
  return parsed;
}

function isSeriesRecord(item: unknown): item is TvTimeSeries {
  return typeof item === 'object' && item !== null && 'seasons' in item;
}

function isMovieRecord(item: unknown): item is TvTimeMovie {
  return typeof item === 'object' && item !== null && 'is_watched' in item && !('seasons' in item);
}

/**
 * Classifies the two CLI-provided files into the series list and movie list by
 * inspecting the shape of their first record, so argument order does not matter.
 */
function classifyInputs(
  pathA: string,
  pathB: string,
): { series: TvTimeSeries[]; movies: TvTimeMovie[] } {
  const files = [
    { path: pathA, data: readJsonArray(pathA) },
    { path: pathB, data: readJsonArray(pathB) },
  ];

  let series: TvTimeSeries[] | null = null;
  let movies: TvTimeMovie[] | null = null;

  for (const file of files) {
    const first = file.data[0];
    if (isSeriesRecord(first)) {
      series = file.data as TvTimeSeries[];
    } else if (isMovieRecord(first)) {
      movies = file.data as TvTimeMovie[];
    } else {
      throw new Error(`Could not recognize the shape of ${file.path} as series or movies`);
    }
  }

  if (!series || !movies) {
    throw new Error('Expected one series file and one movies file');
  }
  return { series, movies };
}

// --- User resolution -------------------------------------------------------

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Resolves the auth user the imported data belongs to: `IMPORT_USER_ID` if set,
 * otherwise the sole existing user. Throws when ambiguous so we never write to
 * the wrong account.
 */
async function resolveUserId(admin: AdminClient): Promise<string> {
  const configured = process.env.IMPORT_USER_ID;
  if (configured) {
    return configured;
  }

  const { data, error } = await admin.auth.admin.listUsers();
  if (error) {
    throw new Error(`Could not list auth users: ${error.message}`);
  }
  if (data.users.length === 1) {
    return data.users[0].id;
  }
  throw new Error(
    `Set IMPORT_USER_ID: expected exactly one auth user, found ${data.users.length}.`,
  );
}

// --- Import: series --------------------------------------------------------

interface ImportSummary {
  seriesMatched: number;
  seriesUnmatched: string[];
  episodesImported: number;
  episodesSkippedSpecials: number;
  moviesMatched: number;
  moviesUnmatched: string[];
}

async function importSeries(
  admin: AdminClient,
  userId: string,
  series: TvTimeSeries[],
  summary: ImportSummary,
): Promise<void> {
  console.log(`\nImporting ${series.length} series…`);

  for (const [index, show] of series.entries()) {
    const position = `[${index + 1}/${series.length}]`;
    const tvdbId = show.id.tvdb;

    if (tvdbId === null) {
      console.warn(`${position} ${show.title}: no TVDB id, skipped`);
      summary.seriesUnmatched.push(show.title);
      continue;
    }

    let tmdbId: number | null = null;
    try {
      const found = await tmdbRequest(
        () => findByExternalId(String(tvdbId), 'tvdb_id'),
        `find tv ${tvdbId}`,
      );
      tmdbId = found.tv_results[0]?.id ?? null;
    } catch (error) {
      console.warn(`${position} ${show.title}: find failed (${describeError(error)})`);
    }

    await upsertMapping(admin, tvdbId, tmdbId, 'tv', show.title);

    if (tmdbId === null) {
      console.warn(`${position} ${show.title}: no TMDB match, skipped`);
      summary.seriesUnmatched.push(show.title);
      continue;
    }

    const cached = await cacheSeries(admin, tmdbId);
    if (!cached) {
      console.warn(`${position} ${show.title}: TMDB details unavailable, skipped`);
      summary.seriesUnmatched.push(show.title);
      continue;
    }

    const status = mapSeriesStatus(show.status);
    const { error: userSeriesError } = await admin
      .from('user_series')
      .upsert({ user_id: userId, tmdb_id: tmdbId, status }, {
        onConflict: 'user_id,tmdb_id',
        ignoreDuplicates: true,
      });
    if (userSeriesError) {
      throw new Error(`Could not insert user_series for ${show.title}: ${userSeriesError.message}`);
    }

    const episodeRows = collectWatchedEpisodes(show, userId, tmdbId, summary);
    let insertedEpisodes = 0;
    if (episodeRows.length > 0) {
      // `ignoreDuplicates` → ON CONFLICT DO NOTHING, so `.select()` returns only
      // the rows actually inserted — giving an accurate count on re-runs.
      const { data, error: episodesError } = await admin
        .from('user_episodes')
        .upsert(episodeRows, {
          onConflict: 'user_id,tmdb_series_id,season_number,episode_number',
          ignoreDuplicates: true,
        })
        .select('id');
      if (episodesError) {
        throw new Error(`Could not insert user_episodes for ${show.title}: ${episodesError.message}`);
      }
      insertedEpisodes = data?.length ?? 0;
    }

    summary.seriesMatched += 1;
    summary.episodesImported += insertedEpisodes;
    console.log(`${position} ${show.title} → tmdb ${tmdbId} (${status}, ${insertedEpisodes} new episodes)`);
  }
}

function mapSeriesStatus(tvTimeStatus: string): ShowTrackerStatus {
  const mapped = SERIES_STATUS_MAP[tvTimeStatus];
  if (!mapped) {
    console.warn(`  ⚠ unknown TV Time status "${tvTimeStatus}", defaulting to "watching"`);
    return 'watching';
  }
  return mapped;
}

interface UserEpisodeRow {
  user_id: string;
  tmdb_series_id: number;
  season_number: number;
  episode_number: number;
  watched_at: string;
}

/**
 * Builds the watched-episode rows for one series, skipping season 0 (specials)
 * and deduplicating by (season, episode) so a single upsert cannot conflict
 * with itself.
 */
function collectWatchedEpisodes(
  show: TvTimeSeries,
  userId: string,
  tmdbId: number,
  summary: ImportSummary,
): UserEpisodeRow[] {
  const rows = new Map<string, UserEpisodeRow>();

  for (const season of show.seasons) {
    for (const episode of season.episodes) {
      if (!episode.is_watched || !episode.watched_at) {
        continue;
      }
      if (season.number === 0) {
        summary.episodesSkippedSpecials += 1;
        continue;
      }
      const key = `${season.number}:${episode.number}`;
      if (!rows.has(key)) {
        rows.set(key, {
          user_id: userId,
          tmdb_series_id: tmdbId,
          season_number: season.number,
          episode_number: episode.number,
          watched_at: toIsoTimestamp(episode.watched_at),
        });
      }
    }
  }

  return [...rows.values()];
}

/**
 * Upserts a series' TMDB metadata into `series_cache`. Returns false when the
 * series no longer exists on TMDB (404).
 */
async function cacheSeries(admin: AdminClient, tmdbId: number): Promise<boolean> {
  let details: TmdbSeriesDetails;
  try {
    details = await tmdbRequest(() => getSeriesDetails(String(tmdbId)), `tv details ${tmdbId}`);
  } catch (error) {
    if (error instanceof TmdbApiError && error.status === 404) {
      return false;
    }
    throw error;
  }

  const { error } = await admin.from('series_cache').upsert(
    {
      tmdb_id: details.id,
      title: details.name,
      overview: details.overview || null,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      status: details.status || null,
      total_seasons: details.number_of_seasons,
      first_air_date: details.first_air_date || null,
      last_fetched_at: new Date().toISOString(),
    },
    { onConflict: 'tmdb_id' },
  );
  if (error) {
    throw new Error(`Could not cache series ${tmdbId}: ${error.message}`);
  }
  return true;
}

// --- Import: movies --------------------------------------------------------

async function importMovies(
  admin: AdminClient,
  userId: string,
  movies: TvTimeMovie[],
  summary: ImportSummary,
): Promise<void> {
  console.log(`\nImporting ${movies.length} movies…`);

  for (const [index, movie] of movies.entries()) {
    const position = `[${index + 1}/${movies.length}]`;

    const tmdbId = await findMovieTmdbId(movie, position);
    await upsertMapping(admin, movie.id.tvdb, tmdbId, 'movie', movie.title);

    if (tmdbId === null) {
      console.warn(`${position} ${movie.title}: no TMDB match, skipped`);
      summary.moviesUnmatched.push(movie.title);
      continue;
    }

    const cached = await cacheMovie(admin, tmdbId);
    if (!cached) {
      console.warn(`${position} ${movie.title}: TMDB details unavailable, skipped`);
      summary.moviesUnmatched.push(movie.title);
      continue;
    }

    const { error: userMovieError } = await admin.from('user_movies').upsert(
      {
        user_id: userId,
        tmdb_id: tmdbId,
        watched: movie.is_watched,
        watched_at: movie.is_watched && movie.watched_at ? toIsoTimestamp(movie.watched_at) : null,
      },
      { onConflict: 'user_id,tmdb_id', ignoreDuplicates: true },
    );
    if (userMovieError) {
      throw new Error(`Could not insert user_movies for ${movie.title}: ${userMovieError.message}`);
    }

    summary.moviesMatched += 1;
    const state = movie.is_watched ? 'watched' : 'watchlist';
    console.log(`${position} ${movie.title} → tmdb ${tmdbId} (${state})`);
  }
}

/**
 * Resolves a movie's TMDB id, preferring its IMDB id (present for all but a
 * couple of entries) and falling back to its TVDB id.
 */
async function findMovieTmdbId(movie: TvTimeMovie, position: string): Promise<number | null> {
  const lookups: Array<{ id: string; source: 'imdb_id' | 'tvdb_id' }> = [];
  if (movie.id.imdb) {
    lookups.push({ id: movie.id.imdb, source: 'imdb_id' });
  }
  if (movie.id.tvdb !== null) {
    lookups.push({ id: String(movie.id.tvdb), source: 'tvdb_id' });
  }

  for (const lookup of lookups) {
    try {
      const found = await tmdbRequest(
        () => findByExternalId(lookup.id, lookup.source),
        `find movie ${lookup.id}`,
      );
      const match = found.movie_results[0]?.id;
      if (match !== undefined) {
        return match;
      }
    } catch (error) {
      console.warn(`${position} ${movie.title}: find failed (${describeError(error)})`);
    }
  }
  return null;
}

/** Upserts a movie's TMDB metadata into `movies_cache`. Returns false on 404. */
async function cacheMovie(admin: AdminClient, tmdbId: number): Promise<boolean> {
  let details: TmdbMovieDetails;
  try {
    details = await tmdbRequest(() => getMovieDetails(String(tmdbId)), `movie details ${tmdbId}`);
  } catch (error) {
    if (error instanceof TmdbApiError && error.status === 404) {
      return false;
    }
    throw error;
  }

  const { error } = await admin.from('movies_cache').upsert(
    {
      tmdb_id: details.id,
      title: details.title,
      overview: details.overview || null,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      release_date: details.release_date || null,
      runtime: details.runtime,
      last_fetched_at: new Date().toISOString(),
    },
    { onConflict: 'tmdb_id' },
  );
  if (error) {
    throw new Error(`Could not cache movie ${tmdbId}: ${error.message}`);
  }
  return true;
}

// --- Shared DB helpers -----------------------------------------------------

/**
 * Records the TVDB → TMDB mapping for reference/debugging. `tmdbId` is null for
 * unmatched entries so failures are auditable after the run.
 */
async function upsertMapping(
  admin: AdminClient,
  tvdbId: number | null,
  tmdbId: number | null,
  mediaType: 'tv' | 'movie',
  title: string,
): Promise<void> {
  if (tvdbId === null) {
    return;
  }
  const { error } = await admin
    .from('tvdb_tmdb_mapping')
    .upsert(
      { tvdb_id: tvdbId, tmdb_id: tmdbId, media_type: mediaType, title },
      { onConflict: 'tvdb_id', ignoreDuplicates: true },
    );
  if (error) {
    throw new Error(`Could not record mapping for ${title}: ${error.message}`);
  }
}

function describeError(error: unknown): string {
  if (error instanceof TmdbApiError) {
    return `TMDB ${error.status}: ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}

// --- Entry point -----------------------------------------------------------

async function main(): Promise<void> {
  const [pathA, pathB] = process.argv.slice(2);
  if (!pathA || !pathB) {
    throw new Error(
      'Usage: pnpm import:tvtime <tvtime-series.json> <tvtime-movies.json>',
    );
  }

  const { series, movies } = classifyInputs(pathA, pathB);
  const admin = createAdminClient();
  const userId = await resolveUserId(admin);
  console.log(`Importing into user ${userId}`);

  const summary: ImportSummary = {
    seriesMatched: 0,
    seriesUnmatched: [],
    episodesImported: 0,
    episodesSkippedSpecials: 0,
    moviesMatched: 0,
    moviesUnmatched: [],
  };

  const startedAt = Date.now();
  await importSeries(admin, userId, series, summary);
  await importMovies(admin, userId, movies, summary);
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log('\n─── Summary ───────────────────────────────');
  console.log(`Series matched:     ${summary.seriesMatched}/${series.length}`);
  console.log(`Episodes imported:  ${summary.episodesImported} (${summary.episodesSkippedSpecials} specials skipped)`);
  console.log(`Movies matched:     ${summary.moviesMatched}/${movies.length}`);
  console.log(`Elapsed:            ${elapsedSec}s`);
  if (summary.seriesUnmatched.length > 0) {
    console.log(`\nUnmatched series (${summary.seriesUnmatched.length}):`);
    for (const title of summary.seriesUnmatched) {
      console.log(`  - ${title}`);
    }
  }
  if (summary.moviesUnmatched.length > 0) {
    console.log(`\nUnmatched movies (${summary.moviesUnmatched.length}):`);
    for (const title of summary.moviesUnmatched) {
      console.log(`  - ${title}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error('\nImport failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
