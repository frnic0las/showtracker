import { redirect } from 'next/navigation';
import { CalendarView } from '@/components/calendar/CalendarView';
import { getCatchUpEpisodes, getUpcomingEpisodes } from '@/lib/series/queries';
import { createClient } from '@/lib/supabase/server';

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [catchUp, upcoming] = await Promise.all([
    getCatchUpEpisodes(user.id),
    getUpcomingEpisodes(user.id),
  ]);

  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <h1 className="text-[34px] font-bold tracking-tight text-text-primary">Calendar</h1>
      </header>
      <CalendarView catchUp={catchUp} upcoming={upcoming} />
    </div>
  );
}
