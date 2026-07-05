import { EpisodeEntry } from '@/components/calendar/EpisodeEntry';
import { CenteredState } from '@/components/ui/CenteredState';
import { daysUntil, parseUtcDate } from '@/lib/dates';
import type { UpcomingEpisode } from '@/types/series';

interface CalendarViewProps {
  catchUp: UpcomingEpisode[];
  upcoming: UpcomingEpisode[];
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}

/** Human-friendly heading for a date group: "Today", "Tomorrow", "Yesterday", or a weekday. */
function formatDayHeading(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return new Date(parseUtcDate(dateStr)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Groups already-sorted episodes by air date, preserving insertion order. */
function groupByAirDate(episodes: UpcomingEpisode[]): Map<string, UpcomingEpisode[]> {
  const groups = new Map<string, UpcomingEpisode[]>();
  for (const episode of episodes) {
    const group = groups.get(episode.airDate) ?? [];
    group.push(episode);
    groups.set(episode.airDate, group);
  }
  return groups;
}

interface EpisodeSectionProps {
  heading: string;
  episodes: UpcomingEpisode[];
  variant: 'catchup' | 'upcoming';
}

function EpisodeSection({ heading, episodes, variant }: EpisodeSectionProps) {
  const groups = groupByAirDate(episodes);

  return (
    <div>
      <h3 className="px-4 pb-2 pt-4 text-[13px] uppercase tracking-wide text-text-secondary">
        {heading}
      </h3>
      {Array.from(groups.entries()).map(([airDate, dayEpisodes]) => (
        <div key={airDate}>
          <h4 className="px-4 pb-1.5 pt-3 text-[13px] font-semibold text-text-secondary">
            {formatDayHeading(airDate)}
          </h4>
          <div className="mx-4 overflow-hidden rounded-md border border-separator bg-bg-elevated">
            {dayEpisodes.map((episode) => (
              <EpisodeEntry
                key={`${episode.tmdbId}-${episode.seasonNumber}-${episode.episodeNumber}`}
                tmdbId={episode.tmdbId}
                title={episode.title}
                posterPath={episode.posterPath}
                seasonNumber={episode.seasonNumber}
                episodeNumber={episode.episodeNumber}
                name={episode.name}
                variant={variant}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Calendar page body: a "Catch up" section of aired-but-unwatched episodes
 * followed by an "Upcoming" section of episodes yet to air, each grouped by
 * air date into rounded card lists. Renders an empty state when both sections
 * are empty.
 */
export function CalendarView({ catchUp, upcoming }: CalendarViewProps) {
  if (catchUp.length === 0 && upcoming.length === 0) {
    return (
      <CenteredState
        icon={<CalendarIcon />}
        title="You're all caught up"
        description="New episodes from the shows you're watching will show up here."
      />
    );
  }

  return (
    <div>
      {catchUp.length > 0 ? (
        <EpisodeSection heading="Catch up" episodes={catchUp} variant="catchup" />
      ) : null}
      {upcoming.length > 0 ? (
        <EpisodeSection heading="Upcoming" episodes={upcoming} variant="upcoming" />
      ) : null}
    </div>
  );
}
