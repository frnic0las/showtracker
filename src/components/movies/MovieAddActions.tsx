'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addMovie } from '@/actions/movies';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { isFutureDate } from '@/lib/dates';

interface MovieAddActionsProps {
  tmdbId: number;
  /** Full `YYYY-MM-DD` release date; a strictly-future date confirms before marking watched. */
  releaseDate: string | null;
}

function BookmarkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4h12v16l-6-4-6 4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

/**
 * The not-tracked action block on the movie detail page: Add to Watchlist and
 * Mark as Watched side by side, mirroring the same pair `MoviesSearchSheet`
 * offers for a result row. Both call `addMovie` and disable while either is
 * pending. Marking an unreleased movie watched confirms first via the shared
 * `ConfirmDialog`, matching the search sheet's guard. On success the page is
 * refreshed so it re-renders as tracked.
 */
export function MovieAddActions({ tmdbId, releaseDate }: MovieAddActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runAdd(status: 'watchlist' | 'watched') {
    setError(null);
    startTransition(async () => {
      const result = await addMovie(tmdbId, status);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleWatchlist() {
    runAdd('watchlist');
  }

  function handleWatched() {
    if (isFutureDate(releaseDate)) {
      setError(null);
      setConfirmOpen(true);
      return;
    }
    runAdd('watched');
  }

  function handleConfirmWatched() {
    setConfirmOpen(false);
    runAdd('watched');
  }

  return (
    <div>
      <div className="flex gap-3 p-4">
        <button
          type="button"
          onClick={handleWatchlist}
          disabled={isPending}
          className="flex-1 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-accent text-[15px] font-semibold text-accent disabled:opacity-50"
        >
          <BookmarkIcon />
          Add to Watchlist
        </button>
        <button
          type="button"
          onClick={handleWatched}
          disabled={isPending}
          className="flex-1 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-accent-green text-[15px] font-semibold text-white disabled:opacity-50"
        >
          <CheckIcon />
          Mark as Watched
        </button>
      </div>

      {error ? <p className="px-4 pb-2 text-[13px] text-accent-red">{error}</p> : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Not released yet"
        message="This movie hasn't been released yet. Mark it as watched anyway?"
        confirmLabel="Mark watched"
        pending={isPending}
        onConfirm={handleConfirmWatched}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
