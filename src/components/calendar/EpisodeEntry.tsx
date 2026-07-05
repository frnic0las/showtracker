import Image from 'next/image';
import Link from 'next/link';
import { WatchToggle } from '@/components/ui/WatchToggle';
import { posterUrl } from '@/lib/tmdb/images';

interface EpisodeEntryProps {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  /** `catchup` shows a watch-toggle; `upcoming` shows a chevron affordance. */
  variant: 'catchup' | 'upcoming';
}

function ChevronIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Single calendar row: poster + series title + episode label, linking to the
 * series detail page. The trailing element is a sibling of the link (not
 * nested inside it) so a `catchup` row can render an interactive
 * `WatchToggle` button without invalid `<button>`-inside-`<a>` markup.
 */
export function EpisodeEntry({
  tmdbId,
  title,
  posterPath,
  seasonNumber,
  episodeNumber,
  name,
  variant,
}: EpisodeEntryProps) {
  const poster = posterUrl(posterPath, 'w185');

  return (
    <div className="relative flex items-center gap-3 px-3 py-2 [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:left-[76px] [&:not(:first-child)]:before:right-0 [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:h-px [&:not(:first-child)]:before:bg-separator">
      <Link href={`/series/${tmdbId}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-[78px] w-[52px] shrink-0 overflow-hidden rounded-sm bg-bg-secondary">
          {poster ? (
            <Image
              src={poster}
              alt=""
              width={52}
              height={78}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-text-primary">{title}</p>
          <p className="truncate text-[13px] text-text-secondary">
            S{seasonNumber} E{episodeNumber} · {name ?? 'TBA'}
          </p>
        </div>
      </Link>
      {variant === 'catchup' ? (
        <WatchToggle
          tmdbSeriesId={tmdbId}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          watched={false}
        />
      ) : (
        <div className="shrink-0 text-text-tertiary">
          <ChevronIcon />
        </div>
      )}
    </div>
  );
}
