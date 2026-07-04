import { NextResponse } from 'next/server';
import { getSeriesDetails } from '@/lib/tmdb/client';
import { isNumericParam, requireAuthError, tmdbErrorResponse } from '@/lib/tmdb/route-auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const authError = await requireAuthError();
  if (authError) return authError;

  const { id } = await params;

  if (!isNumericParam(id)) {
    return NextResponse.json({ error: 'Invalid series id' }, { status: 400 });
  }

  try {
    const series = await getSeriesDetails(id);
    return NextResponse.json(series);
  } catch (error) {
    return tmdbErrorResponse(error);
  }
}
