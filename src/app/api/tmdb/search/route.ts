import { type NextRequest, NextResponse } from 'next/server';
import { searchTmdb } from '@/lib/tmdb/client';
import { isNumericParam, requireAuthError, tmdbErrorResponse } from '@/lib/tmdb/route-auth';
import type { TmdbSearchResponse } from '@/lib/tmdb/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authError = await requireAuthError();
  if (authError) return authError;

  const query = request.nextUrl.searchParams.get('q');
  const type = request.nextUrl.searchParams.get('type');
  const page = request.nextUrl.searchParams.get('page') ?? '1';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  if (type !== 'tv' && type !== 'movie') {
    return NextResponse.json(
      { error: 'Query parameter "type" must be "tv" or "movie"' },
      { status: 400 },
    );
  }

  if (!isNumericParam(page)) {
    return NextResponse.json(
      { error: 'Query parameter "page" must be a positive integer' },
      { status: 400 },
    );
  }

  try {
    const results: TmdbSearchResponse = await searchTmdb(type, query, page);
    return NextResponse.json(results);
  } catch (error) {
    return tmdbErrorResponse(error);
  }
}
