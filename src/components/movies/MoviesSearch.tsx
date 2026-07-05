'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { MoviesSearchSheet } from '@/components/movies/MoviesSearchSheet';

interface MoviesSearchProps {
  /** TMDB ids the user already added, passed through for dedup display. */
  addedIds: number[];
  /**
   * Visual style of the trigger: `'icon'` (default) is the header "+" button;
   * `'cta'` is a full-width pill button for empty states. Both open the same
   * search sheet.
   */
  variant?: 'icon' | 'cta';
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
 * Header entry point for adding a movie: an iOS-style "+" button that opens
 * the search sheet. Owns the sheet's open state.
 */
export function MoviesSearch({ addedIds, variant = 'icon' }: MoviesSearchProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === 'cta' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 text-[17px] font-semibold text-white"
        >
          Search for movies
        </button>
      ) : (
        <button
          type="button"
          aria-label="Add movie"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center text-accent"
        >
          <PlusIcon className="h-7 w-7" />
        </button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title="Add movie">
        <MoviesSearchSheet addedIds={addedIds} />
      </Sheet>
    </>
  );
}
