import { requireEnv } from '@/lib/env';
import type {
  TmdbMovieDetails,
  TmdbSearchResponse,
  TmdbSeasonDetails,
  TmdbSeriesDetails,
} from '@/lib/tmdb/types';

const TMDB_API_KEY = requireEnv(process.env.TMDB_API_KEY, 'TMDB_API_KEY');
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Error thrown by `tmdbFetch` on network failures or non-2xx TMDB responses.
 * `status` mirrors the TMDB HTTP status when available (e.g. 404 for an
 * unknown id), or 0 when the request never reached TMDB (network error).
 */
export class TmdbApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'TmdbApiError';
    this.status = status;
  }
}

/**
 * Fetches a resource from the TMDB v3 API. Reads `TMDB_API_KEY` server-side
 * only — never call this from client code. Throws `TmdbApiError` on network
 * failures or non-2xx responses.
 */
export async function tmdbFetch<T>(
  path: string,
  searchParams: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    throw new TmdbApiError('Failed to reach TMDB API', 0);
  }

  if (!response.ok) {
    throw new TmdbApiError(`TMDB request failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

/** Searches TMDB for TV series or movies matching `query`. */
export async function searchTmdb(
  type: 'tv' | 'movie',
  query: string,
): Promise<TmdbSearchResponse> {
  return tmdbFetch<TmdbSearchResponse>(`/search/${type}`, { query });
}

/** Fetches series details (including the seasons overview) for a TV show. */
export async function getSeriesDetails(id: string): Promise<TmdbSeriesDetails> {
  return tmdbFetch<TmdbSeriesDetails>(`/tv/${id}`);
}

/** Fetches a season's episode list (with air dates) for a TV show. */
export async function getSeasonDetails(
  id: string,
  seasonNumber: string,
): Promise<TmdbSeasonDetails> {
  return tmdbFetch<TmdbSeasonDetails>(`/tv/${id}/season/${seasonNumber}`);
}

/** Fetches movie details. */
export async function getMovieDetails(id: string): Promise<TmdbMovieDetails> {
  return tmdbFetch<TmdbMovieDetails>(`/movie/${id}`);
}
