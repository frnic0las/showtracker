/**
 * Read-side query functions for the series list, watch progress, and
 * the Series upcoming view. Reads go through the RLS-scoped client (`createClient`)
 * so a user only ever sees their own `user_series` / `user_episodes` rows.
 * `series_cache` / `episodes_cache` are refreshed from TMDB with the
 * service-role client when stale, since those tables are read-only for
 * authenticated users under RLS. Season 0 (specials) is excluded from every
 * progress calculation in this module.
 */

import { todayIsoDate } from '@/lib/dates';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getSeasonDetails, getSeriesDetails, TmdbApiError } from '@/lib/tmdb/client';
import type { TmdbSeasonSummary } from '@/lib/tmdb/types';
import type {
  EpisodeWithStatus,
  NextEpisode,
  SeasonProgress,
  SeriesDetail,
  SeriesWithProgress,
  UpcomingEpisode,
} from '@/types/series';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Cache freshness window keyed on the series' TMDB status, per
 * docs/DATABASE.md: an actively-airing show is refreshed far more often than
 * one that has finished, so ended series don't trigger needless TMDB calls.
 */
function staleMsForStatus(status: string | null): number {
  if (status === 'Returning Series') return 6 * HOUR_MS;
  if (status === 'Ended' || status === 'Canceled') return 7 * DAY_MS;
  return DAY_MS;
}

interface SeriesProgressRpcRow {
  tmdb_id: number;
  status: 'watching' | 'stopped' | 'watchlist';
  series_status: string | null;
  title: string;
  poster_path: string | null;
  total_episodes: number;
  unwatched_count: number;
  next_season_number: number | null;
  next_episode_number: number | null;
  next_name: string | null;
}

/**
 * Returns every series the current user is tracking, enriched with cached
 * TMDB metadata and per-series watch progress: how many episodes remain
 * unwatched, and which one is next.
 *
 * The join and aggregation run inside the `get_user_series_with_progress`
 * Postgres function (migration 002) rather than in the app: computing progress
 * client-side would transfer every episode and watched row — tens of thousands
 * after a bulk import — and PostgREST's default 1000-row cap would silently
 * truncate those reads, corrupting the counts. The RPC returns one row per
 * tracked series, already scoped to the caller by RLS.
 */
export async function getUserSeriesWithProgress(userId: string): Promise<SeriesWithProgress[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_user_series_with_progress', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Could not load your series: ${error.message}`);
  }

  const rows = (data ?? []) as SeriesProgressRpcRow[];

  return rows.map((row) => {
    const nextEpisode: NextEpisode | null =
      row.next_season_number !== null && row.next_episode_number !== null
        ? {
            seasonNumber: row.next_season_number,
            episodeNumber: row.next_episode_number,
            name: row.next_name,
          }
        : null;

    return {
      tmdbId: row.tmdb_id,
      status: row.status,
      tmdbStatus: row.series_status,
      title: row.title,
      posterPath: row.poster_path,
      unwatchedCount: row.unwatched_count,
      totalEpisodes: row.total_episodes,
      nextEpisode,
    };
  });
}

interface WatchingSeriesRow {
  tmdb_id: number;
}

interface SeriesCacheRow {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
}

interface EpisodeCacheWithAirDateRow {
  tmdb_series_id: number;
  season_number: number;
  episode_number: number;
  name: string | null;
  air_date: string;
}

/**
 * Returns already-aired-or-upcoming episodes (from today onward) for every
 * series the user has marked as `watching`, ordered by air date ascending,
 * for the Series upcoming view.
 */
export async function getUpcomingEpisodes(
  userId: string,
  today: string = todayIsoDate(),
): Promise<UpcomingEpisode[]> {
  const supabase = await createClient();

  const { data: watching, error: watchingError } = await supabase
    .from('user_series')
    .select('tmdb_id')
    .eq('user_id', userId)
    .eq('status', 'watching')
    .overrideTypes<WatchingSeriesRow[], { merge: false }>();

  if (watchingError) {
    throw new Error(`Could not load your series: ${watchingError.message}`);
  }
  if (!watching || watching.length === 0) {
    return [];
  }

  const tmdbIds = watching.map((row) => row.tmdb_id);

  const { data: seriesCache, error: seriesCacheError } = await supabase
    .from('series_cache')
    .select('tmdb_id, title, poster_path')
    .in('tmdb_id', tmdbIds)
    .overrideTypes<SeriesCacheRow[], { merge: false }>();

  if (seriesCacheError) {
    throw new Error(`Could not load series details: ${seriesCacheError.message}`);
  }

  const seriesById = new Map((seriesCache ?? []).map((row) => [row.tmdb_id, row]));

  const { data: episodes, error: episodesError } = await supabase
    .from('episodes_cache')
    .select('tmdb_series_id, season_number, episode_number, name, air_date')
    .in('tmdb_series_id', tmdbIds)
    .gt('season_number', 0)
    .gte('air_date', today)
    .order('air_date', { ascending: true })
    .overrideTypes<EpisodeCacheWithAirDateRow[], { merge: false }>();

  if (episodesError) {
    throw new Error(`Could not load upcoming episodes: ${episodesError.message}`);
  }

  const result: UpcomingEpisode[] = [];
  for (const episode of episodes ?? []) {
    const series = seriesById.get(episode.tmdb_series_id);
    if (!series) {
      continue;
    }
    result.push({
      tmdbId: episode.tmdb_series_id,
      title: series.title,
      posterPath: series.poster_path,
      seasonNumber: episode.season_number,
      episodeNumber: episode.episode_number,
      name: episode.name,
      airDate: episode.air_date,
    });
  }

  return result;
}

interface SeriesCacheFullRow {
  tmdb_id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  status: string | null;
  first_air_date: string | null;
  last_fetched_at: string;
}

interface EpisodeCacheFullRow {
  season_number: number;
  episode_number: number;
  name: string | null;
  air_date: string | null;
  still_path: string | null;
}

interface UserEpisodeWatchedRow {
  season_number: number;
  episode_number: number;
  watched_at: string;
}

/**
 * Fetches every non-special season of a series from TMDB and upserts the
 * resulting episodes into `episodes_cache` with the service-role client
 * (cache tables are read-only for authenticated users under RLS).
 *
 * Seasons are fetched independently with `Promise.allSettled`: TMDB
 * occasionally 500s or omits a season that `seasons` advertises, and one bad
 * season should not blow away the rest — every season that succeeds is cached
 * and the failures are logged. Shared by the on-demand detail refresh and the
 * add-series flow so both warm the same episode data the same way.
 */
export async function warmEpisodesCache(
  tmdbId: number,
  seasons: TmdbSeasonSummary[],
): Promise<void> {
  const seasonNumbers = seasons
    .map((season) => season.season_number)
    .filter((seasonNumber) => seasonNumber > 0);

  const settled = await Promise.allSettled(
    seasonNumbers.map((seasonNumber) => getSeasonDetails(String(tmdbId), String(seasonNumber))),
  );
  const fetchedSeasons = settled.flatMap((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      return [outcome.value];
    }
    console.warn(
      `Failed to fetch season ${seasonNumbers[index]} of series ${tmdbId}:`,
      outcome.reason,
    );
    return [];
  });

  const fetchedAt = new Date().toISOString();
  const episodeRows = fetchedSeasons.flatMap((season) =>
    season.episodes.map((episode) => ({
      tmdb_series_id: tmdbId,
      season_number: season.season_number,
      episode_number: episode.episode_number,
      name: episode.name,
      overview: episode.overview,
      air_date: episode.air_date || null,
      still_path: episode.still_path,
      runtime: episode.runtime,
      last_fetched_at: fetchedAt,
    })),
  );

  if (episodeRows.length === 0) {
    return;
  }

  const admin = createAdminClient();
  const { error: episodesCacheError } = await admin
    .from('episodes_cache')
    .upsert(episodeRows, { onConflict: 'tmdb_series_id,season_number,episode_number' });

  if (episodesCacheError) {
    throw new Error(`Could not save episode details: ${episodesCacheError.message}`);
  }
}

/**
 * Refreshes `series_cache` and `episodes_cache` for one series from TMDB,
 * fetching every non-special season in parallel. Writes with the
 * service-role client since cache tables are read-only for authenticated
 * users under RLS. Returns `false` when the series no longer exists on
 * TMDB, so the caller can treat it as not found.
 */
async function refreshSeriesCache(tmdbId: number): Promise<boolean> {
  let details;
  try {
    details = await getSeriesDetails(String(tmdbId));
  } catch (error) {
    if (error instanceof TmdbApiError && error.status === 404) {
      return false;
    }
    throw new Error('Could not reach TMDB to refresh series details.');
  }

  const admin = createAdminClient();

  const { error: seriesCacheError } = await admin.from('series_cache').upsert(
    {
      tmdb_id: details.id,
      title: details.name,
      overview: details.overview || null,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      status: details.status || null,
      total_seasons: details.number_of_seasons,
      first_air_date: details.first_air_date || null,
      last_fetched_at: new Date().toISOString(),
    },
    { onConflict: 'tmdb_id' },
  );

  if (seriesCacheError) {
    throw new Error(`Could not save series details: ${seriesCacheError.message}`);
  }

  await warmEpisodesCache(tmdbId, details.seasons);

  return true;
}

/**
 * Returns the full detail view for one series: cached metadata, the current
 * user's per-season and per-episode watch progress, and their tracking status
 * (`null` when not tracked). Refreshes the cache from TMDB first when it is
 * missing, has no episodes cached yet, or is older than the status-based
 * freshness window (see `staleMsForStatus`). Returns `null` only when the
 * series does not exist on TMDB.
 */
export async function getSeriesDetailWithProgress(
  userId: string,
  tmdbId: number,
): Promise<SeriesDetail | null> {
  const supabase = await createClient();

  const selectColumns =
    'tmdb_id, title, overview, poster_path, backdrop_path, status, first_air_date, last_fetched_at';

  const { data: initialSeriesCache, error: seriesCacheError } = await supabase
    .from('series_cache')
    .select(selectColumns)
    .eq('tmdb_id', tmdbId)
    .maybeSingle()
    .overrideTypes<SeriesCacheFullRow, { merge: false }>();

  if (seriesCacheError) {
    throw new Error(`Could not load series details: ${seriesCacheError.message}`);
  }

  let seriesCache = initialSeriesCache;

  const { count: episodeCount, error: episodeCountError } = await supabase
    .from('episodes_cache')
    .select('id', { count: 'exact', head: true })
    .eq('tmdb_series_id', tmdbId)
    .gt('season_number', 0);

  if (episodeCountError) {
    throw new Error(`Could not check cached episodes: ${episodeCountError.message}`);
  }

  const isStale =
    !seriesCache ||
    !episodeCount ||
    Date.now() - new Date(seriesCache.last_fetched_at).getTime() >
      staleMsForStatus(seriesCache.status);

  if (isStale) {
    const found = await refreshSeriesCache(tmdbId);
    if (!found) {
      return null;
    }

    const { data: refreshed, error: refreshedError } = await supabase
      .from('series_cache')
      .select(selectColumns)
      .eq('tmdb_id', tmdbId)
      .maybeSingle()
      .overrideTypes<SeriesCacheFullRow, { merge: false }>();

    if (refreshedError) {
      throw new Error(`Could not load series details: ${refreshedError.message}`);
    }
    if (!refreshed) {
      throw new Error('Series details missing after refresh.');
    }
    seriesCache = refreshed;
  }

  if (!seriesCache) {
    throw new Error('Series details missing.');
  }

  const { data: episodes, error: episodesError } = await supabase
    .from('episodes_cache')
    .select('season_number, episode_number, name, air_date, still_path')
    .eq('tmdb_series_id', tmdbId)
    .gt('season_number', 0)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })
    .overrideTypes<EpisodeCacheFullRow[], { merge: false }>();

  if (episodesError) {
    throw new Error(`Could not load episodes: ${episodesError.message}`);
  }

  const { data: userEpisodes, error: userEpisodesError } = await supabase
    .from('user_episodes')
    .select('season_number, episode_number, watched_at')
    .eq('user_id', userId)
    .eq('tmdb_series_id', tmdbId)
    .overrideTypes<UserEpisodeWatchedRow[], { merge: false }>();

  if (userEpisodesError) {
    throw new Error(`Could not load your watch history: ${userEpisodesError.message}`);
  }

  const { data: tracking, error: trackingError } = await supabase
    .from('user_series')
    .select('status')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .maybeSingle()
    .overrideTypes<{ status: 'watching' | 'stopped' | 'watchlist' }, { merge: false }>();

  if (trackingError) {
    throw new Error(`Could not load your tracking status: ${trackingError.message}`);
  }

  const watchedAtByKey = new Map(
    (userEpisodes ?? []).map((row) => [
      `${row.season_number}:${row.episode_number}`,
      row.watched_at,
    ]),
  );

  const episodesWithStatus: EpisodeWithStatus[] = (episodes ?? []).map((episode) => {
    const watchedAt =
      watchedAtByKey.get(`${episode.season_number}:${episode.episode_number}`) ?? null;
    return {
      seasonNumber: episode.season_number,
      episodeNumber: episode.episode_number,
      name: episode.name,
      airDate: episode.air_date,
      stillPath: episode.still_path,
      watched: watchedAt !== null,
      watchedAt,
    };
  });

  const seasonsProgress = new Map<number, { watchedCount: number; totalCount: number }>();
  for (const episode of episodesWithStatus) {
    const progress = seasonsProgress.get(episode.seasonNumber) ?? {
      watchedCount: 0,
      totalCount: 0,
    };
    progress.totalCount += 1;
    if (episode.watched) {
      progress.watchedCount += 1;
    }
    seasonsProgress.set(episode.seasonNumber, progress);
  }

  const seasons: SeasonProgress[] = Array.from(seasonsProgress.entries())
    .sort(([a], [b]) => a - b)
    .map(([seasonNumber, progress]) => ({
      seasonNumber,
      watchedCount: progress.watchedCount,
      totalCount: progress.totalCount,
    }));

  return {
    tmdbId: seriesCache.tmdb_id,
    title: seriesCache.title,
    overview: seriesCache.overview,
    posterPath: seriesCache.poster_path,
    backdropPath: seriesCache.backdrop_path,
    status: seriesCache.status,
    firstAirDate: seriesCache.first_air_date,
    userStatus: tracking?.status ?? null,
    seasons,
    episodes: episodesWithStatus,
  };
}
