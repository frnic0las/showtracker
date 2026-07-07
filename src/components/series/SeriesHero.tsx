import Image from 'next/image';
import { DetailBackButton } from '@/components/series/DetailBackButton';
import { SeriesActionSheet } from '@/components/series/SeriesActionSheet';
import { formatSeasonCount, formatSeriesStatus } from '@/lib/series/format';
import { posterUrl } from '@/lib/tmdb/images';

interface SeriesHeroProps {
  tmdbSeriesId: number;
  title: string;
  backdropPath: string | null;
  status: string | null;
  seasonCount: number;
  /**
   * The current user's tracking status, or `null` when they don't track the
   * series — drives the more-menu and Stopped pill, both hidden when `null`.
   */
  userStatus: 'watching' | 'stopped' | 'watchlist' | null;
  /** Whether every episode is watched — a computed state with no stored status. */
  completed: boolean;
  /** Short label for the next/paused episode, e.g. `S2 E3`, for the menu caption. */
  nextLabel?: string;
}

function StatusDot() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function StoppedGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}

/**
 * Backdrop hero for the series detail page: full-bleed TMDB backdrop under a
 * bottom-up gradient, a translucent back button, the title, and a metadata line
 * (season count · airing status). The status segment is tinted `accent-orange`
 * for returning shows and dropped entirely when the cache has no status. A
 * `•••` more button mirrors the back button top-right; when the user has
 * `stopped` the series, a muted "Stopped" pill replaces the airing status.
 */
export function SeriesHero({
  tmdbSeriesId,
  title,
  backdropPath,
  status,
  seasonCount,
  userStatus,
  completed,
  nextLabel,
}: SeriesHeroProps) {
  const backdrop = posterUrl(backdropPath, 'w780');
  const statusInfo = formatSeriesStatus(status);
  const stopped = userStatus === 'stopped';

  return (
    <div className="relative flex h-[220px] items-end overflow-hidden bg-bg-secondary">
      {backdrop ? (
        <Image src={backdrop} alt="" fill sizes="430px" className="object-cover" priority />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
      <DetailBackButton />
      {userStatus ? (
        <SeriesActionSheet
          tmdbSeriesId={tmdbSeriesId}
          title={title}
          status={userStatus}
          completed={completed}
          nextLabel={nextLabel}
        />
      ) : null}
      <div className="relative z-[2] w-full px-4 pb-4">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-text-secondary">
          <span>{formatSeasonCount(seasonCount)}</span>
          {stopped ? (
            <>
              <span className="opacity-50">·</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-bg-secondary px-2 py-0.5 text-[12px] font-semibold text-text-secondary">
                <StoppedGlyph />
                Stopped
              </span>
            </>
          ) : statusInfo ? (
            <>
              <span className="opacity-50">·</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${statusInfo.returning ? 'text-accent-orange' : 'text-text-secondary'}`}
              >
                <StatusDot />
                {statusInfo.label}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
