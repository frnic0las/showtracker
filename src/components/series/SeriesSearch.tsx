'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { SeriesSearchSheet } from '@/components/series/SeriesSearchSheet';

interface SeriesSearchProps {
  /** TMDB ids the user already tracks, passed through for dedup display. */
  trackedIds: number[];
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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

/**
 * Header entry point for adding a series: an iOS-style "+" button that opens
 * the search sheet. Owns the sheet's open state.
 */
export function SeriesSearch({ trackedIds }: SeriesSearchProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Add series"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center text-accent"
      >
        <PlusIcon className="h-7 w-7" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add series">
        <SeriesSearchSheet trackedIds={trackedIds} />
      </Sheet>
    </>
  );
}
