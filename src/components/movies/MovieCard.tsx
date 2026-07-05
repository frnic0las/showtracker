'use client';

import Image from 'next/image';
import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleMovieWatched } from '@/actions/movies';
import { posterUrl } from '@/lib/tmdb/images';
import type { UserMovie } from '@/types/movies';

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
 */
export function MovieCard({ tmdbId, title, posterPath, year, watched }: UserMovie) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticWatched, setOptimisticWatched] = useOptimistic(
    watched,
    (_current, next: boolean) => next,
  );
  const poster = posterUrl(posterPath, 'w185');

  function handleToggle() {
    startTransition(async () => {
      setOptimisticWatched(!optimisticWatched);
      const result = await toggleMovieWatched(tmdbId);
      if (!result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-bg-secondary">
        {poster ? <Image src={poster} alt="" fill sizes="33vw" className="object-cover" /> : null}
        <button
          type="button"
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
    </div>
  );
}
