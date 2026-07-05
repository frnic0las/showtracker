import { MoviesStaticChrome } from '@/components/movies/MoviesStaticChrome';

/**
 * Route-level loading skeleton for the Movies page: static chrome plus a
 * centered pulse block while the movie ids load.
 */
export default function MoviesLoading() {
  return (
    <MoviesStaticChrome>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-bg-secondary" />
      </div>
    </MoviesStaticChrome>
  );
}
