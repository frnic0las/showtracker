/**
 * Read-side query functions for the Profile page's stats summary. Reads go
 * through the RLS-scoped client (`createClient`) so a user only ever counts
 * their own `user_series` / `user_episodes` / `user_movies` rows.
 */

import { createClient } from '@/lib/supabase/server';
import type { UserStats } from '@/types/stats';

/**
 * Returns the current user's tracked series count, total episodes watched,
 * and total movies watched. Each count is a head-only query against its
 * table, run in parallel since the three counts are independent.
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();

  const [seriesResult, episodesResult, moviesResult] = await Promise.all([
    supabase
      .from('user_series')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('user_episodes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('user_movies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('watched', true),
  ]);

  if (seriesResult.error) {
    throw new Error(`Could not load your stats: ${seriesResult.error.message}`);
  }
  if (episodesResult.error) {
    throw new Error(`Could not load your stats: ${episodesResult.error.message}`);
  }
  if (moviesResult.error) {
    throw new Error(`Could not load your stats: ${moviesResult.error.message}`);
  }

  return {
    seriesCount: seriesResult.count ?? 0,
    episodesWatched: episodesResult.count ?? 0,
    moviesWatched: moviesResult.count ?? 0,
  };
}
