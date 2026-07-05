import { SeriesPosterCard } from '@/components/series/SeriesPosterCard';
import type { SeriesWithProgress } from '@/types/series';

interface PosterGridProps {
  items: SeriesWithProgress[];
  variant: 'continue' | 'watchlist';
}

/**
 * Three-column poster grid for either the continue-watching or watchlist
 * sections, computing each card's subcaption and badge from the variant.
 */
export function PosterGrid({ items, variant }: PosterGridProps) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-4 px-4">
      {items.map((series) => {
        const subcaption =
          variant === 'continue'
            ? series.nextEpisode
              ? `Next: S${series.nextEpisode.seasonNumber} E${series.nextEpisode.episodeNumber}`
              : 'Next episode'
            : `${series.totalEpisodes} episode${series.totalEpisodes === 1 ? '' : 's'}`;

        return (
          <SeriesPosterCard
            key={series.tmdbId}
            tmdbId={series.tmdbId}
            title={series.title}
            posterPath={series.posterPath}
            subcaption={subcaption}
            badge={variant === 'continue' ? series.unwatchedCount : undefined}
          />
        );
      })}
    </div>
  );
}
