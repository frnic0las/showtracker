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
