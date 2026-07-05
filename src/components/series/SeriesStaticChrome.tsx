import type { ReactNode } from 'react';

function PlusIcon() {
  return (
    <svg
      className="h-7 w-7"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

interface SeriesStaticChromeProps {
  children: ReactNode;
}

/**
 * Static (non-interactive) header + segmented-control shell shared by the
 * Series page's `loading` and `error` route states, where the real
 * interactive `SeriesSearch` / `SegmentedControl` client components can't be
 * mounted. Mirrors the live chrome so those states don't visually jump.
 */
export function SeriesStaticChrome({ children }: SeriesStaticChromeProps) {
  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <h1 className="text-[34px] font-bold tracking-tight text-text-primary">Series</h1>
        <div className="flex h-11 w-11 items-center justify-center text-accent">
          <PlusIcon />
        </div>
      </header>

      <div className="mx-4 mt-1 mb-2 flex gap-0.5 rounded-sm bg-bg-secondary p-0.5">
        <div className="min-h-10 flex-1 rounded-[6px] bg-bg-elevated py-2 text-center text-[13px] font-semibold text-text-primary shadow-sm">
          To watch
        </div>
        <div className="min-h-10 flex-1 rounded-[6px] py-2 text-center text-[13px] font-semibold text-text-primary">
          Upcoming
        </div>
      </div>

      {children}
    </div>
  );
}
