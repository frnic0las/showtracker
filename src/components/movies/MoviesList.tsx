import Link from 'next/link';
import { MovieCard } from '@/components/movies/MovieCard';
import { MoviesHint } from '@/components/movies/MoviesHint';
import type { UserMovie } from '@/types/movies';

interface MoviesListProps {
  watchlist: UserMovie[];
}

function MovieSection({ title, movies }: { title: string; movies: UserMovie[] }) {
  return (
    <section>
      <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
        {title} <span className="text-text-secondary">· {movies.length}</span>
      </h2>
      <div className="grid grid-cols-3 gap-x-3 gap-y-4 px-4">
        {movies.map((movie) => (
          <MovieCard key={movie.tmdbId} {...movie} />
        ))}
      </div>
    </section>
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
 * The Movies page body: a "Watchlist" poster grid followed by a discreet
 * "Watched" archive link. The grid is omitted when the watchlist is empty, in
 * which case a compact inline message takes its place; the page renders the
 * full-page empty state instead when the user has no movies at all.
 */
export function MoviesList({ watchlist }: MoviesListProps) {
  return (
    <div className="pb-6">
      {watchlist.length > 0 ? (
        <>
          <MovieSection title="Watchlist" movies={watchlist} />
          <MoviesHint variant="watchlist" />
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 px-10 pb-2 pt-7 text-center">
          <p className="text-[17px] font-semibold text-text-primary">Your watchlist is empty</p>
          <p className="max-w-[240px] text-[15px] text-text-secondary">
            Films you want to see will show up here.
          </p>
        </div>
      )}

      <Link
        href="/movies/archive"
        className="mx-4 mt-6 mb-1 flex min-h-[44px] items-center justify-between rounded-md border border-separator bg-bg-elevated px-4 py-3 text-[15px] text-text-primary"
      >
        <span>
          Watched
          <span className="mt-0.5 block text-[13px] text-text-secondary">
            Movies you&apos;ve seen
          </span>
        </span>
        <ChevronRightIcon className="h-4 w-2.5 shrink-0 text-text-tertiary" />
      </Link>
    </div>
  );
}
