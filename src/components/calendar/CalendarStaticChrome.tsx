import type { ReactNode } from 'react';

interface CalendarStaticChromeProps {
  children: ReactNode;
}

/**
 * Static header shell shared by the Calendar page's `loading` and `error`
 * route states. Mirrors the live page's header so those states don't
 * visually jump. Unlike Series/Movies, Calendar has no add action.
 */
export function CalendarStaticChrome({ children }: CalendarStaticChromeProps) {
  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <h1 className="text-[34px] font-bold tracking-tight text-text-primary">Calendar</h1>
      </header>

      {children}
    </div>
  );
}
