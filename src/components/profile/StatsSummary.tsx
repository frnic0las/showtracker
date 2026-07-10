import type { UserStats } from '@/types/stats';
import { formatWatchTimeLabel, watchTimeParts } from '@/lib/utils';

interface StatsSummaryProps {
  stats: UserStats;
}

interface StatTileProps {
  value: number;
  label: string;
}

function StatTile({ value, label }: StatTileProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 rounded-md bg-bg-secondary py-4">
      <span className="text-[28px] font-bold text-text-primary tabular-nums whitespace-nowrap">
        {value}
      </span>
      <span className="text-[13px] text-text-secondary">{label}</span>
    </div>
  );
}

interface TimeTileProps {
  minutes: number;
  label: string;
}

function TimeTile({ minutes, label }: TimeTileProps) {
  const parts = watchTimeParts(minutes);
  return (
    <div
      className="flex flex-col items-center justify-center gap-0.5 rounded-md bg-bg-secondary py-4"
      aria-label={`${label}: ${formatWatchTimeLabel(minutes)}`}
    >
      <span
        className="text-[28px] font-bold text-text-primary tabular-nums whitespace-nowrap"
        aria-hidden="true"
      >
        {parts.map((part, index) => (
          <span key={part.unit} className={index > 0 ? 'ml-1' : undefined}>
            {part.value}
            <span className="ml-px text-[17px] font-semibold text-text-secondary">{part.unit}</span>
          </span>
        ))}
      </span>
      <span className="text-[13px] text-text-secondary" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

/**
 * Two-row summary of the user's tracking activity: a count row (series tracked,
 * episodes watched, movies watched) above a watch-time row (series time, movies
 * time). Both rows share one tile shell so they read as a single stats block.
 */
export function StatsSummary({ stats }: StatsSummaryProps) {
  return (
    <div className="flex flex-col gap-3 px-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile value={stats.seriesCount} label="Series" />
        <StatTile value={stats.episodesWatched} label="Episodes" />
        <StatTile value={stats.moviesWatched} label="Movies" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TimeTile minutes={stats.seriesMinutes} label="Series time" />
        <TimeTile minutes={stats.moviesMinutes} label="Movies time" />
      </div>
    </div>
  );
}
