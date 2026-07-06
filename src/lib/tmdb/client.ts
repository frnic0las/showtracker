import { requireEnv } from '@/lib/env';
import type {
  TmdbErrorResponse,
  TmdbFindResponse,
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

  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options);
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
  } catch (error) {
    throw new TmdbApiError('Failed to reach TMDB API', 0, { cause: error });
  }

  if (!response.ok) {
    throw new TmdbApiError(await tmdbErrorMessage(response), response.status);
  }

  return (await response.json()) as T;
}

/**
 * Extracts TMDB's own `status_message` from an error response body, falling
 * back to a generic message when the body is missing or not the expected shape.
 */
async function tmdbErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as TmdbErrorResponse;
    if (typeof body.status_message === 'string' && body.status_message.length > 0) {
      return body.status_message;
    }
  } catch {
    // Non-JSON or empty body — fall through to the generic message.
  }
  return `TMDB request failed with status ${response.status}`;
}

/** Searches TMDB for TV series or movies matching `query` on the given page. */
export async function searchTmdb(
  type: 'tv' | 'movie',
  query: string,
  page = '1',
): Promise<TmdbSearchResponse> {
  return tmdbFetch<TmdbSearchResponse>(`/search/${type}`, { query, page });
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

/**
 * Resolves an external id (e.g. a TVDB or IMDB id) to TMDB entries via the
 * `/find` endpoint. Returns empty result arrays when nothing matches — it does
 * not throw a 404 for unknown ids.
 */
export async function findByExternalId(
  externalId: string,
  source: 'tvdb_id' | 'imdb_id',
): Promise<TmdbFindResponse> {
  return tmdbFetch<TmdbFindResponse>(`/find/${externalId}`, { external_source: source });
}
