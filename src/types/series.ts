/**
 * Shared types for the series search-and-add flow. These are the UI- and
 * action-facing shapes, distinct from the raw TMDB response types in
 * `@/lib/tmdb/types`.
 */

/** A single TV series search result, normalized for display. */
export interface SeriesSearchResult {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year: string | null;
}

/** Result of the `addSeries` server action. */
export interface AddSeriesResult {
  ok: boolean;
  error?: string;
}
