import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { SeriesSearch } from '@/components/series/SeriesSearch';
import { SeriesTabs } from '@/components/series/SeriesTabs';
import { ToWatchView } from '@/components/series/ToWatchView';
import { UpcomingView } from '@/components/series/UpcomingView';
import { localTodayIsoDate, TZ_COOKIE } from '@/lib/dates';
import {
  getUpcomingEpisodes,
  getUserSeriesWithProgress,
  refreshStaleSeries,
} from '@/lib/series/queries';
import { createClient } from '@/lib/supabase/server';

export default async function SeriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const today = localTodayIsoDate(cookieStore.get(TZ_COOKIE)?.value);

  const [series, upcoming] = await Promise.all([
    getUserSeriesWithProgress(user.id),
    getUpcomingEpisodes(user.id, today),
  ]);

  const trackedIds = series.map((item) => item.tmdbId);

  after(async () => {
    await refreshStaleSeries();
  });

  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <h1 className="text-[34px] font-bold tracking-tight text-text-primary">Series</h1>
        <SeriesSearch trackedIds={trackedIds} />
      </header>
      <SeriesTabs
        toWatch={<ToWatchView series={series} trackedIds={trackedIds} />}
        upcoming={<UpcomingView episodes={upcoming} today={today} />}
      />
    </div>
  );
}
