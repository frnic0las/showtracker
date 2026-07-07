'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleEpisodeWatched } from '@/actions/series';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { isFutureAirDate } from '@/lib/dates';

interface WatchToggleProps {
  tmdbSeriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  /** Server-truth watched state; the optimistic layer reverts to this on failure. */
  watched: boolean;
  /** Episode air date; a strictly-future date confirms before marking watched. */
  airDate: string | null;
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

/**
 * Round watched-toggle for an episode: a 28px circle inside a 44×44 touch
 * target. Filled `accent-green` when watched, 2px outline when not. Taps call
 * `toggleEpisodeWatched` and flip optimistically; the successful action
 * revalidates the page so the server truth flows back in, and on failure the
 * optimistic value reverts and the tree is refreshed to resync.
 */
export function WatchToggle({
  tmdbSeriesId,
  seasonNumber,
  episodeNumber,
  watched,
  airDate,
}: WatchToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [optimisticWatched, setOptimisticWatched] = useOptimistic(
    watched,
    (_current, next: boolean) => next,
  );

  function applyToggle(next: boolean) {
    startTransition(async () => {
      setOptimisticWatched(next);
      const result = await toggleEpisodeWatched(tmdbSeriesId, seasonNumber, episodeNumber);
      if (!result.ok) {
        // The optimistic value reverts when the transition ends (server prop is
        // unchanged); refresh to guarantee the UI matches the server.
        router.refresh();
      }
    });
  }

  function handleToggle() {
    if (!optimisticWatched && isFutureAirDate(airDate)) {
      setConfirmOpen(true);
      return;
    }
    applyToggle(!optimisticWatched);
  }

  function handleConfirm() {
    setConfirmOpen(false);
    applyToggle(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={optimisticWatched}
        aria-label={optimisticWatched ? 'Mark as unwatched' : 'Mark as watched'}
        className="-m-2 mr-[-8px] flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <span
          data-watched={optimisticWatched ? '' : undefined}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-text-tertiary text-transparent transition-[transform,background-color,border-color,color] duration-200 active:scale-90 data-[watched]:border-accent-green data-[watched]:bg-accent-green data-[watched]:text-white"
        >
          <CheckIcon />
        </span>
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Not aired yet"
        message="This episode hasn't aired yet. Mark it as watched anyway?"
        confirmLabel="Mark watched"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        pending={isPending}
      />
    </>
  );
}
