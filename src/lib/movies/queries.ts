/**
 * Read-side query functions for the movies list. Reads go through the
 * RLS-scoped client (`createClient`) so a user only ever sees their own
 * `user_movies` rows.
 */

import { createClient } from '@/lib/supabase/server';

interface UserMovieRow {
  tmdb_id: number;
}

/** Returns the TMDB ids of every movie the current user has added (watched or watchlist). */
export async function getUserMovieIds(userId: string): Promise<number[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_movies')
    .select('tmdb_id')
    .eq('user_id', userId)
    .overrideTypes<UserMovieRow[], { merge: false }>();

  if (error) {
    throw new Error(`Could not load your movies: ${error.message}`);
  }

  return (data ?? []).map((row) => row.tmdb_id);
}
