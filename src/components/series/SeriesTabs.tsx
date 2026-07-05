'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

interface SeriesTabsProps {
  toWatch: ReactNode;
  upcoming: ReactNode;
}

type SeriesTab = 'toWatch' | 'upcoming';

/**
 * Owns the "To watch" / "Upcoming" sub-tab state for the Series page and
 * renders the pre-rendered content for whichever tab is active.
 */
export function SeriesTabs({ toWatch, upcoming }: SeriesTabsProps) {
  const [tab, setTab] = useState<SeriesTab>('toWatch');

  return (
    <>
      <SegmentedControl
        options={[
          { value: 'toWatch', label: 'To watch' },
          { value: 'upcoming', label: 'Upcoming' },
        ]}
        value={tab}
        onChange={setTab}
        aria-label="Series view"
      />
      {tab === 'toWatch' ? toWatch : upcoming}
    </>
  );
}
