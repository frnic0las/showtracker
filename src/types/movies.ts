/**
 * Shared types for the movie search-and-add flow. These are the UI- and
 * action-facing shapes, distinct from the raw TMDB response types in
 * `@/lib/tmdb/types`.
 */

/** A single movie search result, normalized for display. */
export interface MovieSearchResult {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: string | null;
}

/** Where a movie is added to on the current user's list. */
export type MovieAddStatus = 'watched' | 'watchlist';

/** Result of the `addMovie` server action. */
export type AddMovieResult = { ok: true } | { ok: false; error: string };

/** Result of the `toggleMovieWatched` server action. */
export type ToggleMovieResult = { ok: true } | { ok: false; error: string };

/** Result of the `removeMovie` server action. */
export type RemoveMovieResult = { ok: true } | { ok: false; error: string };

/** A movie on the current user's list, enriched with cached TMDB metadata. */
export interface UserMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: string | null;
  watched: boolean;
}

/** The current user's movies split into the two list sections. */
export interface UserMovies {
  /** Watched movies, most recently watched first. */
  watched: UserMovie[];
  /** Watchlist movies, most recently added first. */
  watchlist: UserMovie[];
}

/**
 * How a movie section is ordered. Shared by both surfaces and carried in the
 * `?sort=` query param. The two timeline keys resolve to each section's own
 * date (`created_at` for the watchlist, `watched_at` for the watched archive),
 * so one enum serves both. `added_desc` reproduces today's default order.
 */
export type MovieSort = 'added_desc' | 'added_asc' | 'title_asc' | 'year_desc';

/** The default order for both sections — newest first, matching legacy behavior. */
export const DEFAULT_MOVIE_SORT: MovieSort = 'added_desc';

const MOVIE_SORTS: readonly MovieSort[] = ['added_desc', 'added_asc', 'title_asc', 'year_desc'];

/** Narrows an untrusted `?sort=` value to a `MovieSort`, falling back to the default. */
export function parseMovieSort(value: string | undefined): MovieSort {
  return MOVIE_SORTS.includes(value as MovieSort) ? (value as MovieSort) : DEFAULT_MOVIE_SORT;
}
