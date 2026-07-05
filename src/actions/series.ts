'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getSeriesDetails, TmdbApiError } from '@/lib/tmdb/client';
import type {
  AddSeriesResult,
  MarkSeasonWatchedResult,
  ToggleEpisodeWatchedResult,
  UnmarkSeasonWatchedResult,
} from '@/types/series';

/**
 * Resolves the current user and asserts they track `tmdbSeriesId`, returning a
 * ready-to-use Supabase client and user on success. Every episode/season
 * mutation shares this gate: it keeps a direct action call from creating orphan
 * watch records for a series the user doesn't track. On failure it returns the
 * error-shaped result the calling action can return verbatim.
 */
async function requireTrackedSeries(tmdbSeriesId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: 'You must be signed in.' };
  }

  const { data: tracked, error } = await supabase
    .from('user_series')
    .select('tmdb_id')
    .eq('user_id', user.id)
    .eq('tmdb_id', tmdbSeriesId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: 'Could not verify your series. Please try again.' };
  }
  if (!tracked) {
    return { ok: false as const, error: 'This series is not in your list.' };
  }

  return { ok: true as const, user, supabase };
}

/**
 * Adds a TV series to the current user's tracking list with status
 * `watching`, and upserts its TMDB metadata into the shared `series_cache`.
 *
 * The cache row is written with the service-role client because cache tables
 * are read-only for authenticated users under RLS. Duplicate adds are a no-op:
 * the `user_series` upsert ignores conflicts on the `(user_id, tmdb_id)`
 * unique constraint, so it never errors and never overwrites an existing row.
 */
export async function addSeries(tmdbId: number): Promise<AddSeriesResult> {
  if (!Number.isInteger(tmdbId) || tmdbId < 1) {
    return { ok: false, error: 'Invalid series id.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'You must be signed in to add a series.' };
  }

  // Fetch authoritative metadata from TMDB for the cache upsert. This keeps
  // the client payload minimal (just the id) and ensures cached fields like
  // status and season count are complete.
  let details;
  try {
    details = await getSeriesDetails(String(tmdbId));
  } catch (error) {
    if (error instanceof TmdbApiError && error.status === 404) {
      return { ok: false, error: 'Series not found on TMDB.' };
    }
    return { ok: false, error: 'Could not reach TMDB. Please try again.' };
  }

  const admin = createAdminClient();
  const { error: cacheError } = await admin.from('series_cache').upsert(
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

  if (cacheError) {
    return { ok: false, error: 'Could not save series details. Please try again.' };
  }

  const { error: trackError } = await supabase.from('user_series').upsert(
    { user_id: user.id, tmdb_id: details.id, status: 'watching' },
    { onConflict: 'user_id,tmdb_id', ignoreDuplicates: true },
  );

  if (trackError) {
    return { ok: false, error: 'Could not add series to your list. Please try again.' };
  }

  revalidatePath('/series');
  return { ok: true };
}

/**
 * Marks every cached episode of one season as watched for the current user.
 * Idempotent: the `user_episodes` upsert ignores conflicts on the
 * `(user_id, tmdb_series_id, season_number, episode_number)` unique
 * constraint, and with `ignoreDuplicates` Supabase returns only the rows it
 * actually inserted — so `marked` reflects episodes that were previously
 * unwatched, and re-running this action for an already-watched season is a
 * safe no-op.
 */
export async function markSeasonWatched(
  tmdbSeriesId: number,
  seasonNumber: number,
): Promise<MarkSeasonWatchedResult> {
  if (!Number.isInteger(tmdbSeriesId) || tmdbSeriesId < 1) {
    return { ok: false, error: 'Invalid series or season.' };
  }
  // Season 0 (specials) is excluded from the progress model.
  if (!Number.isInteger(seasonNumber) || seasonNumber < 1) {
    return { ok: false, error: 'Invalid series or season.' };
  }

  const guard = await requireTrackedSeries(tmdbSeriesId);
  if (!guard.ok) {
    return guard;
  }
  const { user, supabase } = guard;

  const { data: episodes, error: episodesError } = await supabase
    .from('episodes_cache')
    .select('episode_number')
    .eq('tmdb_series_id', tmdbSeriesId)
    .eq('season_number', seasonNumber)
    .overrideTypes<{ episode_number: number }[], { merge: false }>();

  if (episodesError) {
    return { ok: false, error: 'Could not load season episodes. Please try again.' };
  }
  if (!episodes || episodes.length === 0) {
    return { ok: true, marked: 0 };
  }

  const rows = episodes.map((episode) => ({
    user_id: user.id,
    tmdb_series_id: tmdbSeriesId,
    season_number: seasonNumber,
    episode_number: episode.episode_number,
  }));

  const { data, error } = await supabase
    .from('user_episodes')
    .upsert(rows, {
      onConflict: 'user_id,tmdb_series_id,season_number,episode_number',
      ignoreDuplicates: true,
    })
    .select('id');

  if (error) {
    return { ok: false, error: 'Could not mark season as watched. Please try again.' };
  }

  revalidatePath(`/series/${tmdbSeriesId}`);
  revalidatePath('/series');

  return { ok: true, marked: data?.length ?? 0 };
}

/**
 * Toggles the watched state of a single episode for the current user.
 * Delete-first: it attempts to remove the watch record and, if a row was
 * actually deleted, the episode is now unwatched; if nothing matched, it
 * inserts a record and the episode becomes watched. This avoids a separate
 * existence-check round-trip on the hot path (every checkbox tap). The insert
 * ignores conflicts on the `(user_id, tmdb_series_id, season_number,
 * episode_number)` unique constraint, so concurrent toggles can never create
 * duplicate rows. RLS scopes every read and write to the caller's own rows.
 */
export async function toggleEpisodeWatched(
  tmdbSeriesId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<ToggleEpisodeWatchedResult> {
  if (!Number.isInteger(tmdbSeriesId) || tmdbSeriesId < 1) {
    return { ok: false, error: 'Invalid episode.' };
  }
  // Season 0 (specials) is excluded from the progress model.
  if (!Number.isInteger(seasonNumber) || seasonNumber < 1) {
    return { ok: false, error: 'Invalid episode.' };
  }
  if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
    return { ok: false, error: 'Invalid episode.' };
  }

  const guard = await requireTrackedSeries(tmdbSeriesId);
  if (!guard.ok) {
    return guard;
  }
  const { user, supabase } = guard;

  const { data: deleted, error: deleteError } = await supabase
    .from('user_episodes')
    .delete()
    .eq('user_id', user.id)
    .eq('tmdb_series_id', tmdbSeriesId)
    .eq('season_number', seasonNumber)
    .eq('episode_number', episodeNumber)
    .select('id');

  if (deleteError) {
    return { ok: false, error: 'Could not update the episode. Please try again.' };
  }

  if (deleted && deleted.length > 0) {
    revalidatePath(`/series/${tmdbSeriesId}`);
    revalidatePath('/series');
    return { ok: true, watched: false };
  }

  const { error: insertError } = await supabase.from('user_episodes').upsert(
    {
      user_id: user.id,
      tmdb_series_id: tmdbSeriesId,
      season_number: seasonNumber,
      episode_number: episodeNumber,
    },
    {
      onConflict: 'user_id,tmdb_series_id,season_number,episode_number',
      ignoreDuplicates: true,
    },
  );

  if (insertError) {
    return { ok: false, error: 'Could not update the episode. Please try again.' };
  }

  revalidatePath(`/series/${tmdbSeriesId}`);
  revalidatePath('/series');
  return { ok: true, watched: true };
}

/**
 * Removes every watch record for one season of a series for the current user.
 * Idempotent: deleting rows that don't exist is a no-op, so re-running the
 * action for an already-unwatched season safely reports `unmarked: 0`. The
 * delete returns the rows it removed, so `unmarked` reflects episodes that were
 * previously watched. RLS scopes the delete to the caller's own rows.
 */
export async function unmarkSeasonWatched(
  tmdbSeriesId: number,
  seasonNumber: number,
): Promise<UnmarkSeasonWatchedResult> {
  if (!Number.isInteger(tmdbSeriesId) || tmdbSeriesId < 1) {
    return { ok: false, error: 'Invalid series or season.' };
  }
  // Season 0 (specials) is excluded from the progress model.
  if (!Number.isInteger(seasonNumber) || seasonNumber < 1) {
    return { ok: false, error: 'Invalid series or season.' };
  }

  const guard = await requireTrackedSeries(tmdbSeriesId);
  if (!guard.ok) {
    return guard;
  }
  const { user, supabase } = guard;

  const { data, error } = await supabase
    .from('user_episodes')
    .delete()
    .eq('user_id', user.id)
    .eq('tmdb_series_id', tmdbSeriesId)
    .eq('season_number', seasonNumber)
    .select('id');

  if (error) {
    return { ok: false, error: 'Could not unmark season as watched. Please try again.' };
  }

  revalidatePath(`/series/${tmdbSeriesId}`);
  revalidatePath('/series');

  return { ok: true, unmarked: data?.length ?? 0 };
}
