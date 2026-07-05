/**
 * UTC date helpers for TMDB air dates, which are plain `YYYY-MM-DD` strings
 * with no time or zone. Parsing and comparing in UTC avoids an off-by-one day
 * shift near the user's local midnight. Shared by the series detail formatters
 * and the Upcoming list so the "days until air" logic lives in one place.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses a `YYYY-MM-DD` string to a UTC-midnight timestamp. */
export function parseUtcDate(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Today's date as a `YYYY-MM-DD` string in UTC. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole days from today (UTC) until `dateStr`; negative once it has aired. */
export function daysUntil(dateStr: string): number {
  return Math.round((parseUtcDate(dateStr) - parseUtcDate(todayIsoDate())) / DAY_MS);
}
