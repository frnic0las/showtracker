import Image from 'next/image';
import { WatchToggle } from '@/components/ui/WatchToggle';
import { formatContinueAirDate } from '@/lib/series/format';
import { posterUrl } from '@/lib/tmdb/images';
import type { EpisodeWithStatus } from '@/types/series';

interface ContinueWatchingCardProps {
  tmdbSeriesId: number;
  episode: EpisodeWithStatus;
}

/**
 * The highlighted "Next up" card beneath the hero: the next unwatched episode
 * with its still, label, and air date. Marking it watched advances the card to
 * the following unwatched episode on the next render (the toggle revalidates
 * the page). Rendered only while the series has unwatched episodes.
 */
export function ContinueWatchingCard({ tmdbSeriesId, episode }: ContinueWatchingCardProps) {
  const still = posterUrl(episode.stillPath, 'w342');

  return (
    <div className="m-4 flex items-center gap-3 rounded-md border border-separator bg-bg-elevated p-3">
      <div className="relative h-[60px] w-[104px] shrink-0 overflow-hidden rounded-sm bg-bg-secondary">
        {still ? (
          <Image src={still} alt="" fill sizes="104px" className="object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-accent">Next up</p>
        <p className="mt-0.5 truncate text-[15px] font-semibold text-text-primary">
          S{episode.seasonNumber} E{episode.episodeNumber}
          {episode.name ? ` · ${episode.name}` : ''}
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">
          {formatContinueAirDate(episode.airDate)}
        </p>
      </div>
      <WatchToggle
        tmdbSeriesId={tmdbSeriesId}
        seasonNumber={episode.seasonNumber}
        episodeNumber={episode.episodeNumber}
        watched={episode.watched}
        airDate={episode.airDate}
      />
    </div>
  );
}
