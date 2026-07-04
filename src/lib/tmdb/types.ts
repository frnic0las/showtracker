/**
 * TypeScript interfaces for the subset of TMDB v3 API responses consumed by
 * this app. Only fields actually used by the route handlers are modeled.
 */

export interface TmdbSearchResultItem {
  id: number;
  name?: string;
  title?: string;
  overview: string;
  poster_path: string | null;
  first_air_date?: string;
  release_date?: string;
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbSearchResultItem[];
  total_pages: number;
  total_results: number;
}

export interface TmdbSeasonSummary {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
  air_date: string | null;
  poster_path: string | null;
  overview: string;
}

export interface TmdbSeriesDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TmdbSeasonSummary[];
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
}

export interface TmdbSeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  poster_path: string | null;
  episodes: TmdbEpisode[];
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
  status: string;
}

/** Error shape returned by TMDB on non-2xx responses. */
export interface TmdbErrorResponse {
  status_code: number;
  status_message: string;
}
