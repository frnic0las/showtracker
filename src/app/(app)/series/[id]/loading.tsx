import { DetailBackButton } from '@/components/series/DetailBackButton';

/**
 * Route-level loading skeleton for the series detail page: the hero frame with
 * placeholder title lines and skeleton season rows, shown while the TMDB
 * refresh and Supabase progress queries resolve.
 */
export default function SeriesDetailLoading() {
  return (
    <div>
      <div className="relative flex h-[220px] items-end overflow-hidden bg-bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
        <DetailBackButton />
        <div className="relative z-[2] w-full px-4 pb-4">
          <div className="h-6 w-[55%] animate-pulse rounded bg-bg-elevated" />
          <div className="mt-2.5 h-3 w-[70%] animate-pulse rounded bg-bg-elevated" />
        </div>
      </div>

      <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
        Seasons
      </h2>

      <div className="px-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="mb-2 rounded-md bg-bg-elevated px-3 py-4">
            <div className="h-4 w-2/5 animate-pulse rounded bg-bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  );
}
