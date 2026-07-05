import Link from 'next/link';
import { CenteredState } from '@/components/ui/CenteredState';
import { PosterGrid } from '@/components/series/PosterGrid';
import { SeriesSearch } from '@/components/series/SeriesSearch';
import type { SeriesWithProgress } from '@/types/series';

interface ToWatchViewProps {
  series: SeriesWithProgress[];
  trackedIds: number[];
}

function TvIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="9"
      height="16"
      viewBox="0 0 9 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 1l6 7-6 7" />
    </svg>
  );
}

/**
 * "To watch" sub-tab: continue-watching poster grid, watchlist poster grid,
 * and a discreet link to the stopped/completed archive. Renders the
 * first-run empty state when the user tracks no series at all.
 */
export function ToWatchView({ series, trackedIds }: ToWatchViewProps) {
  if (series.length === 0) {
    return (
      <CenteredState
        icon={<TvIcon />}
        title="No series yet"
        description="Search TMDB to add the shows you're watching and track every episode."
      >
        <SeriesSearch trackedIds={trackedIds} variant="cta" />
      </CenteredState>
    );
  }

  const watching = series.filter((item) => item.status === 'watching');
  const continueWatching = watching.filter((item) => item.unwatchedCount > 0);
  const watchlist = series.filter((item) => item.status === 'watchlist');

  return (
    <div>
      {watching.length > 0 ? (
        <>
          <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
            Continue watching
          </h2>

          {continueWatching.length > 0 ? (
            <PosterGrid items={continueWatching} variant="continue" />
          ) : (
            <div className="flex flex-col items-center gap-2 px-10 pb-2 pt-7 text-center">
              <CheckCircleIcon className="h-10 w-10 text-accent-green" />
              <p className="text-[17px] font-semibold text-text-primary">
                You&apos;re all caught up
              </p>
              <p className="max-w-[240px] text-[15px] leading-snug text-text-secondary">
                No unwatched episodes on the shows you&apos;re following. New ones will show up here.
              </p>
            </div>
          )}
        </>
      ) : null}

      {watchlist.length > 0 ? (
        <>
          <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
            Watchlist <span className="font-semibold text-text-secondary">· {watchlist.length}</span>
          </h2>
          <PosterGrid items={watchlist} variant="watchlist" />
        </>
      ) : null}

      <Link
        href="/series/archive"
        className="mx-4 mt-6 mb-1 flex min-h-[44px] items-center justify-between rounded-md border border-separator bg-bg-elevated px-4 py-3 text-[15px] text-text-primary"
      >
        <span>
          Stopped &amp; completed
          <span className="mt-0.5 block text-[13px] text-text-secondary">
            Shows you finished or set aside
          </span>
        </span>
        <ChevronRightIcon className="h-4 w-2.5 shrink-0 text-text-tertiary" />
      </Link>
    </div>
  );
}
