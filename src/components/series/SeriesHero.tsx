import Image from 'next/image';
import { DetailBackButton } from '@/components/series/DetailBackButton';
import { formatSeasonCount, formatSeriesStatus } from '@/lib/series/format';
import { posterUrl } from '@/lib/tmdb/images';

interface SeriesHeroProps {
  title: string;
  backdropPath: string | null;
  status: string | null;
  seasonCount: number;
}

function StatusDot() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

/**
 * Backdrop hero for the series detail page: full-bleed TMDB backdrop under a
 * bottom-up gradient, a translucent back button, the title, and a metadata line
 * (season count · airing status). The status segment is tinted `accent-orange`
 * for returning shows and dropped entirely when the cache has no status.
 */
export function SeriesHero({ title, backdropPath, status, seasonCount }: SeriesHeroProps) {
  const backdrop = posterUrl(backdropPath, 'w780');
  const statusInfo = formatSeriesStatus(status);

  return (
    <div className="relative flex h-[220px] items-end overflow-hidden bg-bg-secondary">
      {backdrop ? (
        <Image src={backdrop} alt="" fill sizes="430px" className="object-cover" priority />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
      <DetailBackButton />
      <div className="relative z-[2] w-full px-4 pb-4">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-text-secondary">
          <span>{formatSeasonCount(seasonCount)}</span>
          {statusInfo ? (
            <>
              <span className="opacity-50">·</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${statusInfo.returning ? 'text-accent-orange' : 'text-text-secondary'}`}
              >
                <StatusDot />
                {statusInfo.label}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
