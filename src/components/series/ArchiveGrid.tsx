import { SeriesPosterCard } from '@/components/series/SeriesPosterCard';
import type { SeriesWithProgress } from '@/types/series';

interface ArchiveGridProps {
  items: SeriesWithProgress[];
  variant: 'completed' | 'stopped';
}

function CheckBadge() {
  return (
    <span className="absolute right-1.5 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent-green text-white shadow">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 12.5l5 5L20 6" />
      </svg>
    </span>
  );
}

/**
 * Three-column poster grid for the archive's completed or stopped group.
 * Completed cards carry a green check badge and a green "Completed" subcaption;
 * stopped cards are dimmed and show where the user left off. Both reuse
 * `SeriesPosterCard`, which links each poster to the series detail page.
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
              subcaption="✓ Completed"
              subcaptionClassName="font-semibold text-accent-green"
              badgeSlot={<CheckBadge />}
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
