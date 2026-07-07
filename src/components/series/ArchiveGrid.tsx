import { SeriesPosterCard } from '@/components/series/SeriesPosterCard';
import type { SeriesWithProgress } from '@/types/series';

interface ArchiveGridProps {
  items: SeriesWithProgress[];
  variant: 'completed' | 'stopped';
}

/**
 * Three-column poster grid for the archive's completed or stopped group.
 * Completed cards are plain title-only posters (the "Completed · N" section
 * header carries the label); stopped cards are dimmed and show where the user
 * left off. Both reuse `SeriesPosterCard`, which links each poster to the
 * series detail page.
 */
export function ArchiveGrid({ items, variant }: ArchiveGridProps) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-4 px-4">
      {items.map((series) => {
        if (variant === 'completed') {
          return (
            <SeriesPosterCard
              key={series.tmdbId}
              tmdbId={series.tmdbId}
              title={series.title}
              posterPath={series.posterPath}
            />
          );
        }

        const subcaption = series.nextEpisode
          ? `Stopped at S${series.nextEpisode.seasonNumber} E${series.nextEpisode.episodeNumber}`
          : 'Stopped';

        return (
          <SeriesPosterCard
            key={series.tmdbId}
            tmdbId={series.tmdbId}
            title={series.title}
            posterPath={series.posterPath}
            subcaption={subcaption}
            dimmed
          />
        );
      })}
    </div>
  );
}
