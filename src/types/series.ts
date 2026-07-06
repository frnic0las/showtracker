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
export type AddSeriesResult = { ok: true } | { ok: false; error: string };

/** The next unwatched episode for a tracked series, if any. */
export interface NextEpisode {
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
}

/** A tracked series enriched with cached metadata and watch progress. */
export interface SeriesWithProgress {
  tmdbId: number;
  status: 'watching' | 'stopped' | 'watchlist';
  title: string;
  posterPath: string | null;
  unwatchedCount: number;
  totalEpisodes: number;
  nextEpisode: NextEpisode | null;
}

/** A single upcoming episode for the Series upcoming view. */
export interface UpcomingEpisode {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  airDate: string;
}

/** Watch progress for one season of a series. */
export interface SeasonProgress {
  seasonNumber: number;
  watchedCount: number;
  totalCount: number;
}

/** A single episode enriched with the current user's watch status. */
export interface EpisodeWithStatus {
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  airDate: string | null;
  stillPath: string | null;
  watched: boolean;
  watchedAt: string | null;
}

/** Full series detail view: cached metadata plus per-season and per-episode progress. */
export interface SeriesDetail {
  tmdbId: number;
  title: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  status: string | null;
  firstAirDate: string | null;
  /** The current user's tracking status, or `null` if they don't track it. */
  userStatus: 'watching' | 'stopped' | 'watchlist' | null;
  seasons: SeasonProgress[];
  episodes: EpisodeWithStatus[];
}

/** Result of the `markSeasonWatched` server action. */
export type MarkSeasonWatchedResult = { ok: true; marked: number } | { ok: false; error: string };

/** Result of the `unmarkSeasonWatched` server action. */
export type UnmarkSeasonWatchedResult =
  | { ok: true; unmarked: number }
  | { ok: false; error: string };

/**
 * Result of the `toggleEpisodeWatched` server action. `watched` reflects the
 * episode's state after the toggle.
 */
export type ToggleEpisodeWatchedResult =
  | { ok: true; watched: boolean }
  | { ok: false; error: string };
