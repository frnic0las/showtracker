'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getSeriesDetails, TmdbApiError } from '@/lib/tmdb/client';
import type { AddSeriesResult } from '@/types/series';

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
