import { type NextRequest, NextResponse } from 'next/server';
import { refreshStaleSeries } from '@/lib/series/queries';

export const maxDuration = 60;

/**
 * Daily cron entry point (see `vercel.json`) that refreshes `series_cache`
 * for every stale, currently-airing series. Requires the `CRON_SECRET`
 * bearer token that Vercel injects on cron invocations, so this can't be
 * triggered by an unauthenticated caller.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await refreshStaleSeries();
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error refreshing cache';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
