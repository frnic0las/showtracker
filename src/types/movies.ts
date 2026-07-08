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
  /** Full `YYYY-MM-DD` release date; a strictly-future date confirms before marking watched. */
  releaseDate: string | null;
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
  /** Full `YYYY-MM-DD` release date; a strictly-future date confirms before marking watched. */
  releaseDate: string | null;
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
 * How a movie section is ordered, carried in the `?sort=` query param. The two
 * timeline keys are section-specific so a value is self-describing regardless
 * of page: `added_*` is a watchlist order (by `created_at`), `watched_*` a
 * watched order (by `watched_at`); `title_asc` / `year_desc` are shared.
 * `added_desc` reproduces today's default order.
 */
export type MovieSort =
  | 'added_desc'
  | 'added_asc'
  | 'watched_desc'
  | 'watched_asc'
  | 'title_asc'
  | 'year_desc';

/** Movie surface a sort control belongs to; each names its own timeline keys. */
export type MovieSection = 'watchlist' | 'watched';

/** The default watchlist order — newest added first, matching legacy behavior. */
export const DEFAULT_MOVIE_SORT: MovieSort = 'added_desc';

/** Every valid sort key across both sections, in menu order. */
const MOVIE_SORTS: readonly MovieSort[] = [
  'added_desc',
  'added_asc',
  'watched_desc',
  'watched_asc',
  'title_asc',
  'year_desc',
];

/**
 * The ordered keys each section offers plus its default. Derived from
 * `MOVIE_SORTS` so ordering lives in one place. A section only ever exposes its
 * own timeline keys, so a `?sort=` value from the other section is treated as
 * unknown.
 */
export const SECTION_SORTS: Record<MovieSection, { keys: readonly MovieSort[]; default: MovieSort }> = {
  watchlist: {
    keys: MOVIE_SORTS.filter((key) => key !== 'watched_desc' && key !== 'watched_asc'),
    default: DEFAULT_MOVIE_SORT,
  },
  watched: {
    keys: MOVIE_SORTS.filter((key) => key !== 'added_desc' && key !== 'added_asc'),
    default: 'watched_desc',
  },
};

/**
 * Narrows an untrusted `?sort=` value to a `MovieSort` valid for `section`,
 * falling back to that section's default on anything unknown — including a key
 * that belongs to the other section.
 */
export function parseMovieSort(value: string | undefined, section: MovieSection = 'watchlist'): MovieSort {
  const { keys, default: fallback } = SECTION_SORTS[section];
  return keys.includes(value as MovieSort) ? (value as MovieSort) : fallback;
}
