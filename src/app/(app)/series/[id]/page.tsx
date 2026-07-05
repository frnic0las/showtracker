import { notFound, redirect } from 'next/navigation';
import { ContinueWatchingCard } from '@/components/series/ContinueWatchingCard';
import { SeasonAccordion } from '@/components/series/SeasonAccordion';
import { SeriesHero } from '@/components/series/SeriesHero';
import { getSeriesDetailWithProgress } from '@/lib/series/queries';
import { createClient } from '@/lib/supabase/server';
import type { EpisodeWithStatus } from '@/types/series';

function FinishedIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

/**
 * Series detail page: backdrop hero, a "Next up" continue-watching card (or a
 * "finished" state once every episode is watched), and one accordion per
 * season with per-episode watch toggles. Data and the page shell are a Server
 * Component; the accordions and toggles are client islands. A thrown query
 * bubbles to `error.tsx`; an unknown series id renders the 404.
 */
export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tmdbId = Number(id);
  if (!Number.isInteger(tmdbId) || tmdbId < 1) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const detail = await getSeriesDetailWithProgress(user.id, tmdbId);
  if (!detail) {
    notFound();
  }

  const totalEpisodes = detail.episodes.length;
  const watchedEpisodes = detail.episodes.filter((episode) => episode.watched).length;
  const nextEpisode = detail.episodes.find((episode) => !episode.watched) ?? null;
  const completed = totalEpisodes > 0 && watchedEpisodes === totalEpisodes;

  // Open the season the user is currently on (or the last season once finished)
  // so the next episode is visible without a tap.
  const openSeason =
    nextEpisode?.seasonNumber ?? detail.seasons.at(-1)?.seasonNumber ?? null;

  const episodesBySeason = new Map<number, EpisodeWithStatus[]>();
  for (const episode of detail.episodes) {
    const list = episodesBySeason.get(episode.seasonNumber) ?? [];
    list.push(episode);
    episodesBySeason.set(episode.seasonNumber, list);
  }

  return (
    <div>
      <SeriesHero
        title={detail.title}
        backdropPath={detail.backdropPath}
        status={detail.status}
        seasonCount={detail.seasons.length}
      />

      {completed ? (
        <div className="flex flex-col items-center gap-2 px-10 pt-5 pb-1 text-center">
          <span className="text-accent-green">
            <FinishedIcon />
          </span>
          <p className="text-[17px] font-semibold text-text-primary">You finished this series</p>
          <p className="max-w-[240px] text-[15px] leading-snug text-text-secondary">
            All {totalEpisodes} episode{totalEpisodes === 1 ? '' : 's'} watched.
          </p>
        </div>
      ) : nextEpisode ? (
        <ContinueWatchingCard tmdbSeriesId={detail.tmdbId} episode={nextEpisode} />
      ) : null}

      <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
        Seasons
      </h2>

      <div className="px-4">
        {detail.seasons.map((season) => (
          <SeasonAccordion
            key={season.seasonNumber}
            tmdbSeriesId={detail.tmdbId}
            seasonNumber={season.seasonNumber}
            watchedCount={season.watchedCount}
            totalCount={season.totalCount}
            episodes={episodesBySeason.get(season.seasonNumber) ?? []}
            defaultOpen={season.seasonNumber === openSeason}
          />
        ))}
      </div>
    </div>
  );
}
