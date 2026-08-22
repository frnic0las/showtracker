import { DetailBackButton } from '@/components/series/DetailBackButton';

/**
 * Route-level loading skeleton for the movie detail page: the real hero frame
 * (so Back works while data loads) with placeholder title/meta bars inside
 * it — not below, or everything shifts once data lands — followed by
 * placeholder rows for the action block, overview, cast, and details.
 */
export default function MovieDetailLoading() {
  return (
    <div>
      <div className="relative flex h-[220px] items-end overflow-hidden bg-bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
        <DetailBackButton fallbackHref="/movies" />
        <div className="relative z-[2] w-full px-4 pb-4">
          <div className="h-6 w-[55%] animate-pulse rounded bg-bg-elevated" />
          <div className="mt-2.5 h-3 w-[40%] animate-pulse rounded bg-bg-elevated" />
        </div>
      </div>

      <div className="flex gap-3 p-4">
        <div className="h-11 flex-1 animate-pulse rounded-md bg-bg-secondary" />
        <div className="h-11 flex-1 animate-pulse rounded-md bg-bg-secondary" />
      </div>

      <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
        Overview
      </h2>
      <div className="flex flex-col gap-2 px-4">
        <div className="h-3.5 w-full animate-pulse rounded bg-bg-secondary" />
        <div className="h-3.5 w-full animate-pulse rounded bg-bg-secondary" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-bg-secondary" />
      </div>

      <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
        Cast
      </h2>
      <div className="flex gap-3 px-4 pb-2 pt-1">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-bg-secondary" />
        ))}
      </div>

      <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
        Details
      </h2>
      <div className="mx-4 mb-4 h-[132px] animate-pulse rounded-md bg-bg-secondary" />
    </div>
  );
}
