/**
 * Small, pure presentation helpers shared across features.
 */

/** A single rendered unit of a watch-time duration, e.g. `{ value: 27, unit: 'd' }`. */
export interface WatchTimePart {
  value: number;
  unit: 'd' | 'h' | 'm';
}

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

const UNIT_WORDS: Record<WatchTimePart['unit'], string> = {
  d: 'day',
  h: 'hour',
  m: 'minute',
};

/**
 * Splits a watch-time total (in minutes) into the largest two units to render,
 * dropping the smallest remainder. "Day" means 24 hours of screen time, not a
 * calendar day.
 *
 * - `>= 1 day`  → days + hours   (`27d 0h` keeps a zero hour so the tile doesn't reshape)
 * - `>= 1 hour` → hours + minutes
 * - `< 1 hour`  → minutes only   (`0m` for zero)
 *
 * Negative or fractional inputs are clamped and floored to whole minutes.
 */
export function watchTimeParts(minutes: number): WatchTimePart[] {
  const total = Math.max(0, Math.floor(minutes));
  const days = Math.floor(total / MINUTES_PER_DAY);
  const hours = Math.floor((total % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  const mins = total % MINUTES_PER_HOUR;

  if (days > 0) {
    return [
      { value: days, unit: 'd' },
      { value: hours, unit: 'h' },
    ];
  }
  if (hours > 0) {
    return [
      { value: hours, unit: 'h' },
      { value: mins, unit: 'm' },
    ];
  }
  return [{ value: mins, unit: 'm' }];
}

/** Compact watch-time label, e.g. `27d 6h`, `5h 12m`, `48m`, `0m`. */
export function formatWatchTime(minutes: number): string {
  return watchTimeParts(minutes)
    .map((part) => `${part.value}${part.unit}`)
    .join(' ');
}

/** Expanded watch-time phrase for screen readers, e.g. `27 days 6 hours`. */
export function formatWatchTimeLabel(minutes: number): string {
  return watchTimeParts(minutes)
    .map((part) => `${part.value} ${UNIT_WORDS[part.unit]}${part.value === 1 ? '' : 's'}`)
    .join(' ');
}
