'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getMovieDetails, TmdbApiError } from '@/lib/tmdb/client';
import type { AddMovieResult, MovieAddStatus } from '@/types/movies';

/**
 * Adds a movie to the current user's list, either as watched (with
 * `watched_at` set to now) or to the watchlist, and upserts its TMDB metadata
 * into the shared `movies_cache`.
 *
 * The cache row is written with the service-role client because cache tables
 * are read-only for authenticated users under RLS. Duplicate adds are a no-op:
 * the `user_movies` upsert ignores conflicts on the `(user_id, tmdb_id)`
 * unique constraint, so it never errors and never overwrites an existing row
 * (e.g. re-adding a movie already marked watched won't reset it).
 */
export async function addMovie(tmdbId: number, status: MovieAddStatus): Promise<AddMovieResult> {
  if (!Number.isInteger(tmdbId) || tmdbId < 1) {
    return { ok: false, error: 'Invalid movie id.' };
  }
  if (status !== 'watched' && status !== 'watchlist') {
    return { ok: false, error: 'Invalid status.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'You must be signed in to add a movie.' };
  }

  // Fetch authoritative metadata from TMDB for the cache upsert. This keeps
  // the client payload minimal (just the id) and ensures cached fields are
  // complete.
  let details;
  try {
    details = await getMovieDetails(String(tmdbId));
  } catch (error) {
    if (error instanceof TmdbApiError && error.status === 404) {
      return { ok: false, error: 'Movie not found on TMDB.' };
    }
    // Rate limits (429), TMDB 5xx, and network failures all land here — log so
    // they're diagnosable in production instead of vanishing behind the
    // generic message.
    console.error('TMDB movie fetch failed:', error);
    return { ok: false, error: 'Could not reach TMDB. Please try again.' };
  }

  const admin = createAdminClient();
  const { error: cacheError } = await admin.from('movies_cache').upsert(
    {
      tmdb_id: details.id,
      title: details.title,
      overview: details.overview || null,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      release_date: details.release_date || null,
      runtime: details.runtime,
      last_fetched_at: new Date().toISOString(),
    },
    { onConflict: 'tmdb_id' },
  );

  if (cacheError) {
    return { ok: false, error: 'Could not save movie details. Please try again.' };
  }

  const { error: trackError } = await supabase.from('user_movies').upsert(
    {
      user_id: user.id,
      tmdb_id: details.id,
      watched: status === 'watched',
      watched_at: status === 'watched' ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,tmdb_id', ignoreDuplicates: true },
  );

  if (trackError) {
    return { ok: false, error: 'Could not add movie to your list. Please try again.' };
  }

  revalidatePath('/movies');
  return { ok: true };
}
