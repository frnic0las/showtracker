import Image from 'next/image';
import Link from 'next/link';
import { CenteredState } from '@/components/ui/CenteredState';
import { posterUrl } from '@/lib/tmdb/images';
import type { UpcomingEpisode } from '@/types/series';

interface UpcomingViewProps {
  episodes: UpcomingEpisode[];
}

type BucketKey = 'today' | 'tomorrow' | 'thisWeek' | 'later';

const BUCKET_LABELS: Record<BucketKey, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This week',
  later: 'Later',
};

const DAY_MS = 24 * 60 * 60 * 1000;

function parseUtcDate(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function bucketFor(daysUntil: number): BucketKey {
  if (daysUntil === 0) return 'today';
  if (daysUntil === 1) return 'tomorrow';
  if (daysUntil <= 6) return 'thisWeek';
  return 'later';
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

/**
 * "Upcoming" sub-tab: next air dates for started series, grouped by
 * proximity (Today / Tomorrow / This week / Later) with a day countdown.
 */
export function UpcomingView({ episodes }: UpcomingViewProps) {
  if (episodes.length === 0) {
    return (
      <CenteredState
        icon={<CalendarIcon />}
        title="Nothing scheduled"
        description="None of the shows you're watching have an upcoming episode date yet."
      />
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayUtc = parseUtcDate(todayStr);

  const groups = new Map<BucketKey, { episode: UpcomingEpisode; daysUntil: number }[]>();
  for (const episode of episodes) {
    const daysUntil = Math.round((parseUtcDate(episode.airDate) - todayUtc) / DAY_MS);
    const bucket = bucketFor(daysUntil);
    const group = groups.get(bucket) ?? [];
    group.push({ episode, daysUntil });
    groups.set(bucket, group);
  }

  const orderedBuckets: BucketKey[] = ['today', 'tomorrow', 'thisWeek', 'later'];

  return (
    <div>
      {orderedBuckets.map((bucket) => {
        const items = groups.get(bucket);
        if (!items || items.length === 0) return null;

        return (
          <div key={bucket}>
            <h3 className="px-4 pb-2 pt-4 text-[13px] uppercase tracking-wide text-text-secondary">
              {BUCKET_LABELS[bucket]}
            </h3>
            <div className="mx-4 overflow-hidden rounded-md border border-separator bg-bg-elevated">
              {items.map(({ episode, daysUntil }) => {
                const poster = posterUrl(episode.posterPath, 'w185');

                return (
                  <Link
                    key={`${episode.tmdbId}-${episode.seasonNumber}-${episode.episodeNumber}`}
                    href={`/series/${episode.tmdbId}`}
                    className="relative flex items-center gap-3 px-3 py-2 [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:left-[76px] [&:not(:first-child)]:before:right-0 [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:h-px [&:not(:first-child)]:before:bg-separator"
                  >
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
                      <p className="truncate text-[17px] font-semibold text-text-primary">
                        {episode.title}
                      </p>
                      <p className="truncate text-[13px] text-text-secondary">
                        S{episode.seasonNumber} E{episode.episodeNumber} · {episode.name ?? 'TBA'}
                      </p>
                    </div>
                    <div className="min-w-[52px] shrink-0 text-center">
                      {daysUntil === 0 ? (
                        <p className="text-[15px] font-bold text-accent-orange">Today</p>
                      ) : (
                        <>
                          <p className="text-[22px] font-bold leading-none text-accent-orange">
                            {daysUntil}
                          </p>
                          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-text-secondary">
                            {daysUntil === 1 ? 'day' : 'days'}
                          </p>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
