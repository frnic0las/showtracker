import { redirect } from 'next/navigation';
import { MoviesList } from '@/components/movies/MoviesList';
import { MoviesSearch } from '@/components/movies/MoviesSearch';
import { CenteredState } from '@/components/ui/CenteredState';
import { getUserMovies } from '@/lib/movies/queries';
import { createClient } from '@/lib/supabase/server';

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

export default async function MoviesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { watched, watchlist } = await getUserMovies(user.id);
  const movieIds = [...watched, ...watchlist].map((movie) => movie.tmdbId);

  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <h1 className="text-[34px] font-bold tracking-tight text-text-primary">Movies</h1>
        <MoviesSearch addedIds={movieIds} />
      </header>

      {movieIds.length === 0 ? (
        <CenteredState
          icon={<MoviesIcon />}
          title="No movies yet"
          description="Search for a movie to add it to your watchlist or mark it watched."
        >
          <MoviesSearch addedIds={movieIds} variant="cta" />
        </CenteredState>
      ) : (
        <MoviesList watched={watched} watchlist={watchlist} />
      )}
    </div>
  );
}
