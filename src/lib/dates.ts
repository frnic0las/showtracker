/**
 * Date helpers for TMDB air dates, which are plain `YYYY-MM-DD` strings with
 * no time or zone. "Today" may be supplied by the caller (typically the
 * user's local date) while air dates are always parsed as UTC midnight for
 * the day-delta math, avoiding an off-by-one shift near either midnight.
 * Shared by the series detail formatters and the Upcoming list so the "days
 * until air" logic lives in one place.
 */

export const TZ_COOKIE = 'tz';

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

/**
 * Today's date as a `YYYY-MM-DD` string in the given IANA timezone. Falls
 * back to `todayIsoDate()` (UTC) when `timeZone` is falsy or invalid.
 */
export function localTodayIsoDate(timeZone?: string): string {
  if (!timeZone) {
    return todayIsoDate();
  }

  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return todayIsoDate();
  }
}

/** Whole days from `today` until `dateStr`; negative once it has aired. */
export function daysUntil(dateStr: string, today: string = todayIsoDate()): number {
  return Math.round((parseUtcDate(dateStr) - parseUtcDate(today)) / DAY_MS);
}

/** Formats a `YYYY-MM-DD` string as e.g. `Feb 7, 2025` (UTC, no zone shift). */
export function formatIsoDate(dateStr: string): string {
  return new Date(parseUtcDate(dateStr)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Whether `date` (a `YYYY-MM-DD` string — an episode air date or a movie
 * release date) is strictly after the browser's local today, resolved via
 * `Intl.DateTimeFormat().resolvedOptions().timeZone`. Meant to be called at
 * click time inside an event handler — never during render — so the check
 * reflects the viewer's real clock without risking an SSR/hydration mismatch.
 * Returns `false` when `date` is `null` (unknown dates never block).
 */
export function isFutureDate(date: string | null): boolean {
  if (!date) {
    return false;
  }
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return daysUntil(date, localTodayIsoDate(timeZone)) > 0;
}
