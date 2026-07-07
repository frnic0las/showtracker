import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArchiveGrid } from '@/components/series/ArchiveGrid';
import { CenteredState } from '@/components/ui/CenteredState';
import { getUserSeriesWithProgress } from '@/lib/series/queries';
import { createClient } from '@/lib/supabase/server';
import type { SeriesWithProgress } from '@/types/series';

function ChevronLeftIcon() {
  return (
    <svg
      width="12"
      height="20"
      viewBox="0 0 12 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 2L3 10l6 8" />
    </svg>
  );
}

function ArchiveBoxIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

interface ArchiveSectionProps {
  title: string;
  items: SeriesWithProgress[];
  variant: 'completed' | 'stopped';
}

function ArchiveSection({ title, items, variant }: ArchiveSectionProps) {
  return (
    <section>
      <div className="flex items-baseline gap-2 px-4 pt-5 pb-2">
        <h2 className="text-[20px] font-semibold tracking-tight text-text-primary">{title}</h2>
        <span className="text-[15px] font-semibold text-text-secondary tabular-nums">
          · {items.length}
        </span>
      </div>
      <ArchiveGrid items={items} variant={variant} />
    </section>
  );
}

/**
 * Series archive: a lightweight, browse-only sub-page listing the user's
 * completed and stopped series (issue #72, design #67). Completed leads as the
 * rewarding "finished" shelf, Stopped follows as the set-aside pile; a section
 * renders only when it has entries, and an empty archive shows a single
 * centered state. Entered from the "Stopped & completed" link on the To Watch
 * tab, so the nav bar backs straight to `/series`. Server Component — the only
 * interactivity is `Link` navigation to each series' detail page.
 */
export default async function SeriesArchivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const series = await getUserSeriesWithProgress(user.id);

  // "Completed" is computed, never stored (consistent with #65 / #66): a
  // fully-watched show that has Ended or been Canceled. A fully-watched
  // Returning Series is only "caught up", so it stays out of the archive.
  const completed = series.filter(
    (item) =>
      item.status === 'watching' &&
      item.unwatchedCount === 0 &&
      item.totalEpisodes > 0 &&
      (item.tmdbStatus === 'Ended' || item.tmdbStatus === 'Canceled'),
  );
  const stopped = series.filter((item) => item.status === 'stopped');

  return (
    <div>
      <header className="relative flex h-11 items-center justify-center border-b border-separator bg-bg-primary/80 backdrop-blur-xl">
        <Link
          href="/series"
          className="absolute left-2 inline-flex h-11 items-center gap-0.5 px-2 text-[17px] text-accent"
        >
          <ChevronLeftIcon />
          Series
        </Link>
        <h1 className="text-[17px] font-semibold text-text-primary">Archive</h1>
      </header>

      {completed.length === 0 && stopped.length === 0 ? (
        <CenteredState
          icon={<ArchiveBoxIcon />}
          title="Nothing archived yet"
          description="Series you finish or stop watching will collect here."
        />
      ) : (
        <>
          {completed.length > 0 ? (
            <ArchiveSection title="Completed" items={completed} variant="completed" />
          ) : null}
          {stopped.length > 0 ? (
            <ArchiveSection title="Stopped" items={stopped} variant="stopped" />
          ) : null}
        </>
      )}
    </div>
  );
}
