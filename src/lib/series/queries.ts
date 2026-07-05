/**
 * Read-side query functions for the series list, watch progress, and
 * calendar views. Reads go through the RLS-scoped client (`createClient`)
 * so a user only ever sees their own `user_series` / `user_episodes` rows.
 * `series_cache` / `episodes_cache` are refreshed from TMDB with the
 * service-role client when stale, since those tables are read-only for
 * authenticated users under RLS. Season 0 (specials) is excluded from every
 * progress calculation in this module.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getSeasonDetails, getSeriesDetails, TmdbApiError } from '@/lib/tmdb/client';
import type {
  EpisodeWithStatus,
  NextEpisode,
  SeasonProgress,
  SeriesDetail,
  SeriesWithProgress,
  UpcomingEpisode,
} from '@/types/series';

/** Cache rows older than this are refreshed from TMDB before being served. */
const STALE_MS = 24 * 60 * 60 * 1000;

interface UserSeriesRow {
  tmdb_id: number;
  status: 'watching' | 'stopped' | 'watchlist';
}

interface SeriesCacheRow {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
}

interface EpisodeCacheRow {
  tmdb_series_id: number;
  season_number: number;
  episode_number: number;
  name: string | null;
}

interface UserEpisodeRow {
  tmdb_series_id: number;
  season_number: number;
  episode_number: number;
}

/**
 * Returns every series the current user is tracking, enriched with cached
 * TMDB metadata and per-series watch progress: how many episodes remain
 * unwatched, and which one is next.
 */
export async function getUserSeriesWithProgress(userId: string): Promise<SeriesWithProgress[]> {
  const supabase = await createClient();

  const { data: userSeries, error: userSeriesError } = await supabase
    .from('user_series')
    .select('tmdb_id, status')
    .eq('user_id', userId)
    .overrideTypes<UserSeriesRow[], { merge: false }>();

  if (userSeriesError) {
    throw new Error(`Could not load your series: ${userSeriesError.message}`);
  }
  if (!userSeries || userSeries.length === 0) {
    return [];
  }

  const tmdbIds = userSeries.map((row) => row.tmdb_id);

  const { data: seriesCache, error: seriesCacheError } = await supabase
    .from('series_cache')
    .select('tmdb_id, title, poster_path')
    .in('tmdb_id', tmdbIds)
    .overrideTypes<SeriesCacheRow[], { merge: false }>();

  if (seriesCacheError) {
    throw new Error(`Could not load series details: ${seriesCacheError.message}`);
  }

  const { data: episodesCache, error: episodesCacheError } = await supabase
    .from('episodes_cache')
    .select('tmdb_series_id, season_number, episode_number, name')
    .in('tmdb_series_id', tmdbIds)
    .gt('season_number', 0)
    .overrideTypes<EpisodeCacheRow[], { merge: false }>();

  if (episodesCacheError) {
    throw new Error(`Could not load episode data: ${episodesCacheError.message}`);
  }

  const { data: userEpisodes, error: userEpisodesError } = await supabase
    .from('user_episodes')
    .select('tmdb_series_id, season_number, episode_number')
    .eq('user_id', userId)
    .in('tmdb_series_id', tmdbIds)
    .overrideTypes<UserEpisodeRow[], { merge: false }>();

  if (userEpisodesError) {
    throw new Error(`Could not load your watch history: ${userEpisodesError.message}`);
  }

  const seriesCacheById = new Map((seriesCache ?? []).map((row) => [row.tmdb_id, row]));

  const episodesBySeriesId = new Map<number, EpisodeCacheRow[]>();
  for (const episode of episodesCache ?? []) {
    const list = episodesBySeriesId.get(episode.tmdb_series_id);
    if (list) {
      list.push(episode);
    } else {
      episodesBySeriesId.set(episode.tmdb_series_id, [episode]);
    }
  }

  const watchedBySeriesId = new Map<number, Set<string>>();
  for (const watched of userEpisodes ?? []) {
    const key = `${watched.season_number}:${watched.episode_number}`;
    const set = watchedBySeriesId.get(watched.tmdb_series_id);
    if (set) {
      set.add(key);
    } else {
      watchedBySeriesId.set(watched.tmdb_series_id, new Set([key]));
    }
  }

  const result: SeriesWithProgress[] = [];

  for (const row of userSeries) {
    const cache = seriesCacheById.get(row.tmdb_id);
    if (!cache) {
      // Should not happen: every tracked series must have a cache row.
      continue;
    }

    const episodes = (episodesBySeriesId.get(row.tmdb_id) ?? [])
      .slice()
      .sort((a, b) =>
        a.season_number !== b.season_number
          ? a.season_number - b.season_number
          : a.episode_number - b.episode_number,
      );
    const watched = watchedBySeriesId.get(row.tmdb_id) ?? new Set<string>();

    let unwatchedCount = 0;
    let nextEpisode: NextEpisode | null = null;
    for (const episode of episodes) {
      const key = `${episode.season_number}:${episode.episode_number}`;
      if (!watched.has(key)) {
        unwatchedCount += 1;
        if (!nextEpisode) {
          nextEpisode = {
            seasonNumber: episode.season_number,
            episodeNumber: episode.episode_number,
            name: episode.name,
          };
        }
      }
    }

    result.push({
      tmdbId: row.tmdb_id,
      status: row.status,
      title: cache.title,
      posterPath: cache.poster_path,
      unwatchedCount,
      totalEpisodes: episodes.length,
      nextEpisode,
    });
  }

  return result.sort((a, b) => a.title.localeCompare(b.title));
}

interface WatchingSeriesRow {
  tmdb_id: number;
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
 * for the calendar view.
 */
export async function getUpcomingEpisodes(userId: string): Promise<UpcomingEpisode[]> {
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

  const today = new Date().toISOString().slice(0, 10);

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

  const seasonNumbers = details.seasons
    .map((season) => season.season_number)
    .filter((seasonNumber) => seasonNumber > 0);

  const seasons = await Promise.all(
    seasonNumbers.map((seasonNumber) => getSeasonDetails(String(tmdbId), String(seasonNumber))),
  );

  const fetchedAt = new Date().toISOString();
  const episodeRows = seasons.flatMap((season) =>
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

  if (episodeRows.length > 0) {
    const { error: episodesCacheError } = await admin
      .from('episodes_cache')
      .upsert(episodeRows, { onConflict: 'tmdb_series_id,season_number,episode_number' });

    if (episodesCacheError) {
      throw new Error(`Could not save episode details: ${episodesCacheError.message}`);
    }
  }

  return true;
}

/**
 * Returns the full detail view for one series: cached metadata plus the
 * current user's per-season and per-episode watch progress. Refreshes the
 * cache from TMDB first when it is missing, has no episodes cached yet, or
 * is older than `STALE_MS`. Returns `null` only when the series does not
 * exist on TMDB.
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
    Date.now() - new Date(seriesCache.last_fetched_at).getTime() > STALE_MS;

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
    seasons,
    episodes: episodesWithStatus,
  };
}
