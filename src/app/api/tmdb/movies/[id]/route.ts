import { NextResponse } from 'next/server';
import { getMovieDetails } from '@/lib/tmdb/client';
import { isNumericParam, requireAuthError, tmdbErrorResponse } from '@/lib/tmdb/route-auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const authError = await requireAuthError();
  if (authError) return authError;

  const { id } = await params;

  if (!isNumericParam(id)) {
    return NextResponse.json({ error: 'Invalid movie id' }, { status: 400 });
  }

  try {
    const movie = await getMovieDetails(id);
    return NextResponse.json(movie);
  } catch (error) {
    return tmdbErrorResponse(error);
  }
}
