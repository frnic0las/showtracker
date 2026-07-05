import { MovieCard } from '@/components/movies/MovieCard';
import type { UserMovie } from '@/types/movies';

interface MoviesListProps {
  watched: UserMovie[];
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

/**
 * The Movies page body: a "Watched" poster grid followed by a "Watchlist"
 * poster grid. Each section is omitted when it has no movies; the page renders
 * the empty state instead when the user has no movies at all.
 */
export function MoviesList({ watched, watchlist }: MoviesListProps) {
  return (
    <div className="pb-6">
      {watched.length > 0 ? <MovieSection title="Watched" movies={watched} /> : null}
      {watchlist.length > 0 ? <MovieSection title="Watchlist" movies={watchlist} /> : null}
    </div>
  );
}
