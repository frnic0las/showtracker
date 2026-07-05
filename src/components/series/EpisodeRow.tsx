import { WatchToggle } from '@/components/ui/WatchToggle';
import { formatEpisodeAirDate } from '@/lib/series/format';

interface EpisodeRowProps {
  tmdbSeriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  airDate: string | null;
  watched: boolean;
}

/**
 * A single episode within a season accordion: episode number, title (bold when
 * unwatched so the eye lands on what's left), air date (tinted `accent-orange`
 * when the episode hasn't aired yet), and the watched toggle. Inset separators
 * between sibling rows match the list style used elsewhere.
 */
export function EpisodeRow({
  tmdbSeriesId,
  seasonNumber,
  episodeNumber,
  name,
  airDate,
  watched,
}: EpisodeRowProps) {
  const air = formatEpisodeAirDate(airDate);

  return (
    <div className="relative flex items-center gap-3 px-3 py-2 [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:left-[48px] [&:not(:first-child)]:before:right-0 [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:h-px [&:not(:first-child)]:before:bg-separator">
      <span className="w-6 shrink-0 text-[13px] font-semibold tabular-nums text-text-secondary">
        E{episodeNumber}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[17px] text-text-primary ${watched ? '' : 'font-semibold'}`}
        >
          {name ?? `Episode ${episodeNumber}`}
        </p>
        <p
          className={`mt-0.5 text-[13px] ${air.upcoming ? 'text-accent-orange' : 'text-text-secondary'}`}
        >
          {air.label}
        </p>
      </div>
      <WatchToggle
        tmdbSeriesId={tmdbSeriesId}
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
        watched={watched}
      />
    </div>
  );
}
