import Image from 'next/image';
import { SeriesSearch } from '@/components/series/SeriesSearch';
import { createClient } from '@/lib/supabase/server';
import { posterUrl } from '@/lib/tmdb/images';

interface SeriesCacheRow {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  first_air_date: string | null;
}

export default async function SeriesPage() {
  const supabase = await createClient();

  const { data: tracked, error } = await supabase
    .from('user_series')
    .select('tmdb_id, created_at')
    .order('created_at', { ascending: false });

  const trackedIds = tracked?.map((row) => row.tmdb_id) ?? [];

  // `user_series.tmdb_id` has no FK to `series_cache`, so titles/posters are
  // fetched in a second query and joined in memory.
  const cacheById = new Map<number, SeriesCacheRow>();
  if (trackedIds.length > 0) {
    const { data: cache } = await supabase
      .from('series_cache')
      .select('tmdb_id, title, poster_path, first_air_date')
      .in('tmdb_id', trackedIds);
    for (const row of (cache as SeriesCacheRow[] | null) ?? []) {
      cacheById.set(row.tmdb_id, row);
    }
  }

  return (
    <div className="px-4 pt-3">
      <header className="flex items-center justify-between pb-2">
        <h1 className="text-[34px] font-bold text-text-primary">Series</h1>
        <SeriesSearch trackedIds={trackedIds} />
      </header>

      {error ? (
        <p className="py-16 text-center text-[15px] text-text-secondary">
          Could not load your series. Please try again.
        </p>
      ) : trackedIds.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-[17px] font-semibold text-text-primary">No series yet</p>
          <p className="text-[15px] text-text-secondary">
            Tap + to search for a series to track.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-separator overflow-hidden rounded-md bg-bg-elevated">
          {tracked!.map((row) => {
            const meta = cacheById.get(row.tmdb_id);
            const poster = posterUrl(meta?.poster_path, 'w154');
            const year = meta?.first_air_date ? meta.first_air_date.slice(0, 4) : null;

            return (
              <li key={row.tmdb_id} className="flex items-center gap-3 p-3">
                {poster ? (
                  <Image
                    src={poster}
                    alt=""
                    width={46}
                    height={69}
                    className="shrink-0 rounded-sm object-cover"
                  />
                ) : (
                  <div className="h-[69px] w-[46px] shrink-0 rounded-sm bg-bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-semibold text-text-primary">
                    {meta?.title ?? 'Untitled'}
                  </p>
                  {year ? <p className="text-[13px] text-text-secondary">{year}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
