/**
 * Presentation helpers for the series detail view. Air-date math lives in
 * `@/lib/dates` (shared with the Upcoming list); this module only formats the
 * labels the detail UI renders.
 */

import { daysUntil, formatIsoDate } from '@/lib/dates';

/** Formats a `YYYY-MM-DD` string as e.g. `Feb 7, 2025` (UTC, no zone shift). */
function formatDate(dateStr: string): string {
  return formatIsoDate(dateStr);
}

/**
 * Air-date label for an episode row. Future episodes are flagged `upcoming` so
 * the row can tint the date `accent-orange`; the nearest ones get a friendly
 * "Airs today / tomorrow" label instead of a bare date.
 */
export function formatEpisodeAirDate(airDate: string | null): {
  label: string;
  upcoming: boolean;
} {
  if (!airDate) {
    return { label: 'TBA', upcoming: false };
  }
  const days = daysUntil(airDate);
  if (days <= 0) {
    return { label: formatDate(airDate), upcoming: false };
  }
  if (days === 1) {
    return { label: 'Airs tomorrow', upcoming: true };
  }
  return { label: formatDate(airDate), upcoming: true };
}

/** Air-date caption for the continue-watching card, e.g. `Aired Feb 7, 2025`. */
export function formatContinueAirDate(airDate: string | null): string {
  if (!airDate) {
    return 'Air date TBA';
  }
  return daysUntil(airDate) > 0 ? `Airs ${formatDate(airDate)}` : `Aired ${formatDate(airDate)}`;
}

/**
 * Maps a raw TMDB series status to its display label and whether it counts as
 * "returning" (still airing) — the hero tints returning shows `accent-orange`
 * and leaves ended/canceled ones in `text-secondary`. Returns `null` when the
 * cache has no status, so the hero can drop the segment entirely.
 */
export function formatSeriesStatus(
  status: string | null,
): { label: string; returning: boolean } | null {
  if (!status) {
    return null;
  }
  if (status === 'Returning Series') {
    return { label: 'Returning', returning: true };
  }
  return { label: status, returning: false };
}

/** Pluralizes the season count for the hero metadata line. */
export function formatSeasonCount(count: number): string {
  return `${count} season${count === 1 ? '' : 's'}`;
}

/** Short episode label for captions and banners, e.g. `S2 E3`. */
export function formatEpisodeShort(seasonNumber: number, episodeNumber: number): string {
  return `S${seasonNumber} E${episodeNumber}`;
}
