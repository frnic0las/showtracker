import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MovieCard } from '@/components/movies/MovieCard';
import { MoviesHint } from '@/components/movies/MoviesHint';
import { MovieSortMenu } from '@/components/movies/MovieSortMenu';
import { CenteredState } from '@/components/ui/CenteredState';
import { getUserMovies } from '@/lib/movies/queries';
import { createClient } from '@/lib/supabase/server';
import { parseMovieSort } from '@/types/movies';

function ChevronLeftIcon() {
  return (
    <svg
      width="12"
      height="20"
      viewBox="0 0 12 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 2L3 10l6 8" />
    </svg>
  );
}

function MoviesIcon() {
  return (
    <svg
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M7 4v5" />
      <path d="M17 4v5" />
    </svg>
  );
}

/**
 * Movies archive: a lightweight, browse-only sub-page listing the user's
 * watched movies (issue #73, design #68). Unlike the series archive, movies
 * only split `watched` / `watchlist` — there's no sub-grouping, so this is a
 * single "Watched" poster grid with a count; an empty archive shows a
 * centered state. Entered from the "Watched" link on the Movies tab, so the
 * nav bar backs straight to `/movies`. Server Component — the only
 * interactivity is `MovieCard`'s watched toggle (already a client component)
 * and `Link` navigation.
 */
export default async function MoviesArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const sort = parseMovieSort((await searchParams).sort, 'watched');
  const { watched } = await getUserMovies(user.id, { watched: sort });

  return (
    <div>
      <header className="relative flex h-11 items-center justify-center border-b border-separator bg-bg-primary/80 backdrop-blur-xl">
        <Link
          href="/movies"
          className="absolute left-2 inline-flex h-11 items-center gap-0.5 px-2 text-[17px] text-accent"
        >
          <ChevronLeftIcon />
          Movies
        </Link>
        <h1 className="text-[17px] font-semibold text-text-primary">Watched</h1>
      </header>

      {watched.length === 0 ? (
        <CenteredState
          icon={<MoviesIcon />}
          title="Nothing watched yet"
          description="Movies you mark as watched will collect here."
        />
      ) : (
        <section>
          <div className="flex items-center justify-between px-4 pt-5 pb-2">
            <h2 className="flex items-baseline gap-2 text-[20px] font-semibold tracking-tight text-text-primary">
              Watched
              <span className="text-[15px] font-semibold text-text-secondary tabular-nums">
                · {watched.length}
              </span>
            </h2>
            <MovieSortMenu section="watched" active={sort} count={watched.length} />
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-4 px-4">
            {watched.map((movie) => (
              <MovieCard key={movie.tmdbId} {...movie} />
            ))}
          </div>
          <MoviesHint variant="watched" />
        </section>
      )}
    </div>
  );
}
