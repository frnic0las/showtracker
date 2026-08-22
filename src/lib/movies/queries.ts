/**
 * Read-side query functions for the movies list and detail page. Reads go
 * through the RLS-scoped client (`createClient`) so a user only ever sees their
 * own `user_movies` rows. Cached TMDB metadata lives in `movies_cache`, which
 * `user_movies.tmdb_id` references by value only (no FK), so the two reads are
 * joined in application code rather than via a PostgREST embed. The detail
 * query is the exception — it reads TMDB live.
 */

import { createClient } from '@/lib/supabase/server';
import { getMovieDetails, TmdbApiError } from '@/lib/tmdb/client';
import {
  DEFAULT_MOVIE_SORT,
  type MovieDetail,
  type MovieSort,
  type UserMovie,
  type UserMovies,
} from '@/types/movies';

interface UserMovieRow {
  tmdb_id: number;
  watched: boolean;
  watched_at: string | null;
  created_at: string;
}

interface MovieCacheRow {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
}

interface SortableMovie {
  movie: UserMovie;
  /** The section's timeline value: `created_at` (watchlist) or `watched_at` (watched). */
  sortKey: string;
}

/**
 * Builds the comparator for a section from its active sort. The two timeline
 * orders lean on `sortKey`; `title_asc` is case-insensitive; `year_desc` puts
 * movies without a release year last. A leading "The " is intentionally not
 * stripped for the alphabetical order — kept simple per the design note.
 */
function movieComparator(sort: MovieSort): (a: SortableMovie, b: SortableMovie) => number {
  switch (sort) {
    case 'added_asc':
    case 'watched_asc':
      return (a, b) => a.sortKey.localeCompare(b.sortKey);
    case 'title_asc':
      return (a, b) => a.movie.title.localeCompare(b.movie.title, undefined, { sensitivity: 'base' });
    case 'year_desc':
      return (a, b) => {
        if (a.movie.year === b.movie.year) return 0;
        if (a.movie.year === null) return 1;
        if (b.movie.year === null) return -1;
        return b.movie.year.localeCompare(a.movie.year);
      };
    case 'added_desc':
    case 'watched_desc':
    default:
      return (a, b) => b.sortKey.localeCompare(a.sortKey);
  }
}

/** Active sort for each section; both default to newest-first (legacy order). */
interface MovieSortOptions {
  watchlist?: MovieSort;
  watched?: MovieSort;
}

/**
 * Returns the current user's movies, enriched with cached TMDB metadata and
 * split into `watched` and `watchlist`. Each section is ordered by its own
 * active sort (`sort`), both defaulting to newest-first. Movies whose cache row
 * is missing are omitted rather than rendered as blanks — `addMovie` always
 * upserts the cache first, so this only guards against inconsistent data.
 */
export async function getUserMovies(
  userId: string,
  sort: MovieSortOptions = {},
): Promise<UserMovies> {
  const supabase = await createClient();

  const { data: movieData, error: movieError } = await supabase
    .from('user_movies')
    .select('tmdb_id, watched, watched_at, created_at')
    .eq('user_id', userId)
    .overrideTypes<UserMovieRow[], { merge: false }>();

  if (movieError) {
    throw new Error(`Could not load your movies: ${movieError.message}`);
  }

  const rows = movieData ?? [];
  if (rows.length === 0) {
    return { watched: [], watchlist: [] };
  }

  const { data: cacheData, error: cacheError } = await supabase
    .from('movies_cache')
    .select('tmdb_id, title, poster_path, release_date')
    .in(
      'tmdb_id',
      rows.map((row) => row.tmdb_id),
    )
    .overrideTypes<MovieCacheRow[], { merge: false }>();

  if (cacheError) {
    throw new Error(`Could not load movie details: ${cacheError.message}`);
  }

  const cache = new Map((cacheData ?? []).map((row) => [row.tmdb_id, row]));

  const watched: SortableMovie[] = [];
  const watchlist: SortableMovie[] = [];

  for (const row of rows) {
    const meta = cache.get(row.tmdb_id);
    if (!meta) continue;

    const movie: UserMovie = {
      tmdbId: row.tmdb_id,
      title: meta.title,
      posterPath: meta.poster_path,
      year: meta.release_date ? meta.release_date.slice(0, 4) : null,
      releaseDate: meta.release_date,
      watched: row.watched,
    };

    if (row.watched) {
      // Fall back to created_at when watched_at is missing (legacy rows).
      watched.push({ movie, sortKey: row.watched_at ?? row.created_at });
    } else {
      watchlist.push({ movie, sortKey: row.created_at });
    }
  }

  watched.sort(movieComparator(sort.watched ?? DEFAULT_MOVIE_SORT));
  watchlist.sort(movieComparator(sort.watchlist ?? DEFAULT_MOVIE_SORT));

  return {
    watched: watched.map((entry) => entry.movie),
    watchlist: watchlist.map((entry) => entry.movie),
  };
}

/** How many billed cast members the detail page shows, per the design. */
const MAX_CAST = 10;

/** Crew jobs rolled up into the detail page's "Writing" row. */
const WRITING_JOBS = ['Screenplay', 'Writer', 'Story'];

interface UserMovieTrackingRow {
  watched: boolean;
  watched_at: string | null;
  created_at: string;
}

/**
 * Returns the detail view for one movie: live TMDB metadata and credits merged
 * with the current user's `user_movies` row. Deliberately bypasses
 * `movies_cache` — the page must also render movies the user does not track
 * (it exists to tell two same-titled films apart *before* one is added), which
 * are typically absent from the cache, and credits are not cached at all.
 * Returns `null` only when the movie does not exist on TMDB.
 */
export async function getMovieDetailForUser(
  userId: string,
  tmdbId: number,
): Promise<MovieDetail | null> {
  const supabase = await createClient();

  const [details, { data: tracking, error: trackingError }] = await Promise.all([
    getMovieDetails(String(tmdbId), { credits: true }).catch((error: unknown) => {
      if (error instanceof TmdbApiError && error.status === 404) {
        return null;
      }
      throw new Error('Could not load movie details from TMDB.', { cause: error });
    }),
    supabase
      .from('user_movies')
      .select('watched, watched_at, created_at')
      .eq('user_id', userId)
      .eq('tmdb_id', tmdbId)
      .maybeSingle()
      .overrideTypes<UserMovieTrackingRow, { merge: false }>(),
  ]);

  if (trackingError) {
    throw new Error(`Could not load your movie status: ${trackingError.message}`);
  }
  if (!details) {
    return null;
  }

  const crew = details.credits?.crew ?? [];
  const writers = new Set(
    crew.filter((member) => WRITING_JOBS.includes(member.job)).map((member) => member.name),
  );

  return {
    tmdbId: details.id,
    title: details.title,
    overview: details.overview || null,
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path,
    releaseDate: details.release_date || null,
    runtime: details.runtime,
    directors: crew.filter((member) => member.job === 'Director').map((member) => member.name),
    writers: [...writers],
    cast: (details.credits?.cast ?? []).slice(0, MAX_CAST).map((member) => ({
      creditId: member.credit_id,
      name: member.name,
      character: member.character || null,
      profilePath: member.profile_path,
    })),
    tracking: tracking
      ? {
          watched: tracking.watched,
          watchedAt: tracking.watched_at,
          addedAt: tracking.created_at,
        }
      : null,
  };
}
