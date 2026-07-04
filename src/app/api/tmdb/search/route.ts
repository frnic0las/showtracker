import { type NextRequest, NextResponse } from 'next/server';
import { searchTmdb } from '@/lib/tmdb/client';
import { requireAuthError, tmdbErrorResponse } from '@/lib/tmdb/route-auth';
import type { TmdbSearchResponse } from '@/lib/tmdb/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authError = await requireAuthError();
  if (authError) return authError;

  const query = request.nextUrl.searchParams.get('q');
  const type = request.nextUrl.searchParams.get('type');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  if (type !== 'tv' && type !== 'movie') {
    return NextResponse.json(
      { error: 'Query parameter "type" must be "tv" or "movie"' },
      { status: 400 },
    );
  }

  try {
    const results: TmdbSearchResponse = await searchTmdb(type, query);
    return NextResponse.json(results);
  } catch (error) {
    return tmdbErrorResponse(error);
  }
}
