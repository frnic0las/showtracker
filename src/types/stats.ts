/**
 * Shared types for the Profile page's stats summary. Distinct from the raw
 * TMDB response types in `@/lib/tmdb/types`.
 */

/** Aggregate counts of the current user's tracked series, episodes, and movies. */
export interface UserStats {
  seriesCount: number;
  episodesWatched: number;
  moviesWatched: number;
}
