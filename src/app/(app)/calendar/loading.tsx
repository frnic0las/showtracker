import { CalendarStaticChrome } from '@/components/calendar/CalendarStaticChrome';

const SKELETON_ROWS = [
  { caption: 'w-[70%]', subcaption: 'w-[45%]' },
  { caption: 'w-[60%]', subcaption: 'w-[55%]' },
  { caption: 'w-[75%]', subcaption: 'w-[40%]' },
  { caption: 'w-[65%]', subcaption: 'w-[50%]' },
];

/**
 * Route-level loading skeleton for the Calendar page: static chrome plus a
 * skeleton episode-row card.
 */
export default function CalendarLoading() {
  return (
    <CalendarStaticChrome>
      <div className="mx-4 mt-4 overflow-hidden rounded-md border border-separator bg-bg-elevated">
        {SKELETON_ROWS.map((row, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-2">
            <div className="h-[78px] w-[52px] shrink-0 animate-pulse rounded-sm bg-bg-secondary" />
            <div className="min-w-0 flex-1">
              <div className={`h-3.5 animate-pulse rounded bg-bg-secondary ${row.caption}`} />
              <div
                className={`mt-2 h-3 animate-pulse rounded bg-bg-secondary ${row.subcaption}`}
              />
            </div>
          </div>
        ))}
      </div>
    </CalendarStaticChrome>
  );
}
