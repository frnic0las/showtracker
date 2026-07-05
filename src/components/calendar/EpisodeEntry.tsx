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

// Shared row chrome: flex layout, padding, and the inset top separator on
// every row after the first. Poster is 52×78 (w185) to match the analogous
// UpcomingView list rows; see docs/DESIGN_SYSTEM.md for the list-thumbnail size.
const ROW_CLASS =
  'relative flex items-center gap-3 px-3 py-2 [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:left-[76px] [&:not(:first-child)]:before:right-0 [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:h-px [&:not(:first-child)]:before:bg-separator';

/**
 * Single calendar row: poster + series title + episode label, linking to the
 * series detail page.
 *
 * `upcoming` rows are a single Link (chevron included) so the whole row — and
 * the chevron affordance — navigates. `catchup` rows instead wrap only the
 * poster + text in the Link and render the interactive `WatchToggle` as a
 * sibling, avoiding invalid `<button>`-inside-`<a>` markup.
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

  const body = (
    <>
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
    </>
  );

  if (variant === 'upcoming') {
    return (
      <Link href={`/series/${tmdbId}`} className={ROW_CLASS}>
        {body}
        <div className="shrink-0 text-text-tertiary">
          <ChevronIcon />
        </div>
      </Link>
    );
  }

  return (
    <div className={ROW_CLASS}>
      <Link href={`/series/${tmdbId}`} className="flex min-w-0 flex-1 items-center gap-3">
        {body}
      </Link>
      <WatchToggle
        tmdbSeriesId={tmdbId}
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
        watched={false}
      />
    </div>
  );
}
