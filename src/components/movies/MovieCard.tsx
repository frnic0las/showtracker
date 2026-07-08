'use client';

import Image from 'next/image';
import { useOptimistic, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MovieActionSheet } from '@/components/movies/MovieActionSheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toggleMovieWatched } from '@/actions/movies';
import { isFutureDate } from '@/lib/dates';
import { posterUrl } from '@/lib/tmdb/images';
import type { UserMovie } from '@/types/movies';

/** How long the poster must be held before the action sheet opens. */
const LONG_PRESS_MS = 500;
/** Pointer movement (px) that cancels an in-progress long press as a scroll. */
const MOVE_SLOP = 10;

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
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
 * A single movie poster in the grid with an overlaid watched toggle. Tapping
 * the toggle flips the watched state optimistically and calls
 * `toggleMovieWatched`, which revalidates the page so the movie moves between
 * the "Watched" and "Watchlist" sections. On failure the optimistic value
 * reverts and the tree is refreshed to resync with the server.
 *
 * Touch-and-holding the poster (~500ms) opens a contextual `MovieActionSheet`
 * with the labelled watched toggle and a Remove action; the pressed tile lifts
 * above the dimmed backdrop (the iOS "peek") so it's clear which movie is being
 * acted on.
 */
export function MovieCard({ tmdbId, title, posterPath, year, releaseDate, watched }: UserMovie) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticWatched, setOptimisticWatched] = useOptimistic(
    watched,
    (_current, next: boolean) => next,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const poster = posterUrl(posterPath, 'w185');

  function applyToggle(next: boolean) {
    startTransition(async () => {
      setOptimisticWatched(next);
      const result = await toggleMovieWatched(tmdbId);
      if (!result.ok) {
        router.refresh();
      }
    });
  }

  function handleToggle() {
    if (!optimisticWatched && isFutureDate(releaseDate)) {
      setConfirmOpen(true);
      return;
    }
    applyToggle(!optimisticWatched);
  }

  function handleConfirm() {
    setConfirmOpen(false);
    applyToggle(true);
  }

  function clearPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    pressStart.current = null;
  }

  function handlePointerDown(event: React.PointerEvent) {
    // Let the watched toggle handle its own taps — a press there must not open
    // the sheet.
    if ((event.target as HTMLElement).closest('[data-movie-toggle]')) return;
    pressStart.current = { x: event.clientX, y: event.clientY };
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      navigator.vibrate?.(10);
      setSheetOpen(true);
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!pressStart.current) return;
    const dx = event.clientX - pressStart.current.x;
    const dy = event.clientY - pressStart.current.y;
    if (Math.hypot(dx, dy) > MOVE_SLOP) clearPress();
  }

  return (
    <div className="min-w-0">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={clearPress}
        onPointerCancel={clearPress}
        onContextMenu={(event) => event.preventDefault()}
        className={`relative aspect-[2/3] select-none overflow-hidden rounded-md bg-bg-secondary transition-transform duration-200 ${
          sheetOpen
            ? 'z-[9] scale-[1.06] shadow-2xl outline outline-[3px] outline-accent/70 outline-offset-2'
            : ''
        }`}
      >
        {poster ? <Image src={poster} alt="" fill sizes="33vw" className="object-cover" /> : null}
        <button
          type="button"
          data-movie-toggle
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={optimisticWatched}
          aria-label={optimisticWatched ? `Mark ${title} as unwatched` : `Mark ${title} as watched`}
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center"
        >
          <span
            data-watched={optimisticWatched ? '' : undefined}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-black/35 text-transparent shadow backdrop-blur-sm transition-[transform,background-color,border-color,color] duration-200 active:scale-90 data-[watched]:border-accent-green data-[watched]:bg-accent-green data-[watched]:text-white"
          >
            <CheckIcon />
          </span>
        </button>
      </div>
      <p className="mt-2 truncate text-[13px] font-semibold text-text-primary">{title}</p>
      {year ? <p className="truncate text-xs text-text-secondary">{year}</p> : null}

      <MovieActionSheet
        tmdbId={tmdbId}
        title={title}
        watched={optimisticWatched}
        releaseDate={releaseDate}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Not released yet"
        message="This movie hasn't been released yet. Mark it as watched anyway?"
        confirmLabel="Mark watched"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        pending={isPending}
      />
    </div>
  );
}
