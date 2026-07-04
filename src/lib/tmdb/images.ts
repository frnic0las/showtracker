/**
 * Helpers for building TMDB image URLs. TMDB serves images from a CDN at a
 * fixed base URL; only the size segment and file path vary. See the design
 * system for the recommended sizes per context.
 */

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';

/**
 * Builds a TMDB poster URL for the given path and size, or returns `null` when
 * the series/movie has no poster so callers can render a placeholder.
 */
export function posterUrl(path: string | null | undefined, size: PosterSize = 'w185'): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}
