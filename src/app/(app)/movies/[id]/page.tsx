import { notFound, redirect } from 'next/navigation';
import { CastRail } from '@/components/movies/CastRail';
import { MovieAddActions } from '@/components/movies/MovieAddActions';
import { MovieHero } from '@/components/movies/MovieHero';
import { MovieStateCard } from '@/components/movies/MovieStateCard';
import { formatMovieDate } from '@/lib/movies/format';
import { getMovieDetailForUser } from '@/lib/movies/queries';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

/**
 * Movie detail page: backdrop hero, then the one state-dependent action block
 * (add buttons when not tracked, the watchlist/watched state card otherwise),
 * followed by Overview, Cast, and Details. Data and the page shell are a
 * Server Component; the action block is a client island. Empty data is
 * dropped, never stubbed — a section with nothing to show is not rendered. A
 * thrown query bubbles to `error.tsx`; an unknown TMDB id renders the 404.
 */
export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isInteger(tmdbId) || tmdbId < 1) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const movie = await getMovieDetailForUser(user.id, tmdbId);
  if (!movie) {
    notFound();
  }

  const detailsRows: { key: string; value: string }[] = [];
  if (movie.directors.length > 0) {
    detailsRows.push({ key: 'Director', value: movie.directors.join(', ') });
  }
  if (movie.writers.length > 0) {
    detailsRows.push({ key: 'Writing', value: movie.writers.join(', ') });
  }
  if (movie.releaseDate) {
    detailsRows.push({ key: 'Release date', value: formatMovieDate(movie.releaseDate) });
  }

  return (
    <div>
      <MovieHero
        tmdbId={movie.tmdbId}
        title={movie.title}
        backdropPath={movie.backdropPath}
        posterPath={movie.posterPath}
        releaseDate={movie.releaseDate}
        runtime={movie.runtime}
        tracking={movie.tracking}
      />

      {movie.tracking === null ? (
        <MovieAddActions tmdbId={movie.tmdbId} releaseDate={movie.releaseDate} />
      ) : (
        <MovieStateCard
          tmdbId={movie.tmdbId}
          title={movie.title}
          tracking={movie.tracking}
          releaseDate={movie.releaseDate}
        />
      )}

      {movie.overview ? (
        <>
          <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
            Overview
          </h2>
          <p className="px-4 text-[15px] leading-normal text-text-primary">{movie.overview}</p>
        </>
      ) : null}

      {movie.cast.length > 0 ? (
        <>
          <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
            Cast
          </h2>
          <CastRail cast={movie.cast} />
        </>
      ) : null}

      {detailsRows.length > 0 ? (
        <>
          <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
            Details
          </h2>
          <div className="mx-4 mb-4 overflow-hidden rounded-md bg-bg-secondary">
            {detailsRows.map((row, index) => (
              <div key={row.key}>
                {index > 0 ? <div className="ml-4 border-t border-separator" /> : null}
                <div className="flex min-h-11 items-center justify-between gap-4 px-4 py-3">
                  <span className="shrink-0 text-[15px] text-text-secondary">{row.key}</span>
                  <span className="text-right text-[15px] text-text-primary">{row.value}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
