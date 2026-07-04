import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TmdbApiError } from '@/lib/tmdb/client';

/**
 * Verifies the caller has an authenticated Supabase session. Returns a 401
 * JSON response if not, or `null` when the request may proceed.
 */
export async function requireAuthError(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

/**
 * Returns `true` when `value` is a positive integer (>= 1, no leading zero).
 * TMDB resource ids and page numbers are always >= 1, so route params that fail
 * this check are rejected with a 400 rather than forwarded to TMDB.
 */
export function isNumericParam(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

/**
 * Returns `true` when `value` is a valid TMDB season number: a non-negative
 * integer (>= 0, no leading zero). Season 0 is the "Specials" season.
 */
export function isSeasonNumberParam(value: string): boolean {
  return /^(0|[1-9]\d*)$/.test(value);
}

/**
 * Maps a `TmdbApiError` (or unknown error) to a JSON response with the
 * appropriate HTTP status: TMDB 404s are forwarded as 404, everything else
 * (network failures, other non-2xx statuses) becomes a 502.
 */
export function tmdbErrorResponse(error: unknown): NextResponse {
  if (error instanceof TmdbApiError) {
    const status = error.status === 404 ? 404 : 502;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ error: 'Unexpected error while contacting TMDB' }, { status: 502 });
}
