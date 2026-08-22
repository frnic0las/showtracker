'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleMovieWatched } from '@/actions/movies';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { isFutureDate } from '@/lib/dates';
import { formatMovieDate } from '@/lib/movies/format';
import type { MovieTracking } from '@/types/movies';

interface MovieStateCardProps {
  tmdbId: number;
  title: string;
  tracking: MovieTracking;
  /** Full `YYYY-MM-DD` release date; a strictly-future date confirms before marking watched. */
  releaseDate: string | null;
}

function BookmarkIcon() {
  return (
    <svg
      width="18"
      height="18"
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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

/**
 * The tracked-state action block on the movie detail page: shaped on
 * `StoppedBanner`. Watchlist state shows an inline **Watched** pill — moving
 * watchlist → watched is the forward step the page exists for; the watched
 * state is terminal and carries no inline action (un-watch and remove both
 * live one tap away in the `•••` sheet). The pill runs the same
 * `isFutureDate` guard as `MovieCard`'s toggle before calling
 * `toggleMovieWatched`. `aria-live="polite"` on the card announces the state
 * change once the pill (and its own label) disappears.
 */
export function MovieStateCard({ tmdbId, title, tracking, releaseDate }: MovieStateCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function runToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleMovieWatched(tmdbId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleMarkWatched() {
    if (isFutureDate(releaseDate)) {
      setError(null);
      setConfirmOpen(true);
      return;
    }
    runToggle();
  }

  function handleConfirm() {
    setConfirmOpen(false);
    runToggle();
  }

  const subtitle = tracking.watched
    ? tracking.watchedAt
      ? `on ${formatMovieDate(tracking.watchedAt)}`
      : null
    : `Added ${formatMovieDate(tracking.addedAt)}`;

  return (
    <div>
      <div
        aria-live="polite"
        className="m-4 flex items-center gap-3 rounded-md bg-bg-secondary p-3.5"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            tracking.watched
              ? 'bg-accent-green/[.18] text-accent-green'
              : 'bg-accent/[.18] text-accent'
          }`}
        >
          {tracking.watched ? <CheckIcon /> : <BookmarkIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-text-primary">
            {tracking.watched ? 'Watched' : 'In your watchlist'}
          </p>
          {subtitle ? <p className="mt-0.5 text-[13px] text-text-secondary">{subtitle}</p> : null}
        </div>
        {!tracking.watched ? (
          <button
            type="button"
            onClick={handleMarkWatched}
            disabled={isPending}
            aria-label={`Mark ${title} as watched`}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent/[.14] px-4 text-[15px] font-semibold text-accent disabled:opacity-50"
          >
            <CheckIcon />
            Watched
          </button>
        ) : null}
      </div>
      {error ? <p className="mx-4 mt-2 text-[13px] text-accent-red">{error}</p> : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Not released yet"
        message="This movie hasn't been released yet. Mark it as watched anyway?"
        confirmLabel="Mark watched"
        pending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
