import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/profile/LogoutButton';
import { StatsSummary } from '@/components/profile/StatsSummary';
import { TmdbAttribution } from '@/components/profile/TmdbAttribution';
import { getUserStats } from '@/lib/stats/queries';
import { createClient } from '@/lib/supabase/server';
import pkg from '../../../../package.json';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const stats = await getUserStats(user.id);

  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <h1 className="text-[34px] font-bold tracking-tight text-text-primary">Profile</h1>
      </header>

      <div className="flex flex-col gap-6 pt-2">
        <StatsSummary stats={stats} />

        <div className="px-4">
          <h2 className="pb-2 pl-1 text-[13px] uppercase tracking-wide text-text-secondary">
            Account
          </h2>
          <div className="overflow-hidden rounded-md bg-bg-elevated">
            <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-2">
              <span className="text-[17px] text-text-primary">Email</span>
              <span className="truncate text-[15px] text-text-secondary">{user.email}</span>
            </div>
            <div className="ml-4 border-b border-separator" />
            <LogoutButton />
          </div>
        </div>

        <div className="px-4">
          <h2 className="pb-2 pl-1 text-[13px] uppercase tracking-wide text-text-secondary">
            About
          </h2>
          <div className="overflow-hidden rounded-md bg-bg-elevated">
            <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-2">
              <span className="text-[17px] text-text-primary">Version</span>
              <span className="text-[15px] text-text-secondary">{pkg.version}</span>
            </div>
            <div className="ml-4 border-b border-separator" />
            <TmdbAttribution />
          </div>
        </div>
      </div>
    </div>
  );
}
