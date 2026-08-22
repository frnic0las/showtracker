/**
 * Presentation helpers for the movie detail view. Date math lives in
 * `@/lib/dates` (shared with the series formatters); this module only formats
 * the labels the movie detail UI renders.
 */

import { formatIsoDate } from '@/lib/dates';

/**
 * Formats a runtime in minutes as `2h 46m`, or `94m` under an hour. Returns
 * `null` when `minutes` is `null` or less than 1, so callers can drop the
 * metadata segment entirely rather than print `0m`.
 */
export function formatRuntime(minutes: number | null): string | null {
  if (minutes === null || minutes < 1) {
    return null;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours < 1) {
    return `${remaining}m`;
  }
  return `${hours}h ${remaining}m`;
}

/** Formats a `YYYY-MM-DD` release date as e.g. `Mar 1, 2024` (UTC, no zone shift). */
export function formatMovieDate(dateStr: string): string {
  return formatIsoDate(dateStr);
}
