import type { UserStats } from '@/types/stats';

interface StatsSummaryProps {
  stats: UserStats;
}

interface StatTileProps {
  value: number;
  label: string;
}

function StatTile({ value, label }: StatTileProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 rounded-md bg-bg-elevated py-4">
      <span className="text-[28px] font-bold text-text-primary">{value}</span>
      <span className="text-[13px] text-text-secondary">{label}</span>
    </div>
  );
}

/**
 * Three-tile summary of the user's tracking activity: series tracked,
 * episodes watched, and movies watched.
 */
export function StatsSummary({ stats }: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      <StatTile value={stats.seriesCount} label="Series" />
      <StatTile value={stats.episodesWatched} label="Episodes" />
      <StatTile value={stats.moviesWatched} label="Movies" />
    </div>
  );
}
