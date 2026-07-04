import { NextResponse } from 'next/server';
import { getSeasonDetails } from '@/lib/tmdb/client';
import { isNumericParam, requireAuthError, tmdbErrorResponse } from '@/lib/tmdb/route-auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; n: string }> },
): Promise<NextResponse> {
  const authError = await requireAuthError();
  if (authError) return authError;

  const { id, n } = await params;

  if (!isNumericParam(id) || !isNumericParam(n)) {
    return NextResponse.json({ error: 'Invalid series id or season number' }, { status: 400 });
  }

  try {
    const season = await getSeasonDetails(id, n);
    return NextResponse.json(season);
  } catch (error) {
    return tmdbErrorResponse(error);
  }
}
