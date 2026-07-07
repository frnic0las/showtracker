'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MovieSort } from '@/types/movies';

interface MovieSortMenuProps {
  /** Which surface the control labels — changes the two timeline labels. */
  section: 'watchlist' | 'watched';
  /** The currently active order, reflected in the trigger label and the checked item. */
  active: MovieSort;
  /** Number of movies in the section; the control is hidden when there's nothing to sort. */
  count: number;
}

/** The menu order, top → bottom. Labels for the two timeline keys depend on the section. */
const SORT_KEYS: readonly MovieSort[] = ['added_desc', 'added_asc', 'title_asc', 'year_desc'];

const LABELS: Record<'watchlist' | 'watched', Record<MovieSort, string>> = {
  watchlist: {
    added_desc: 'Recently added',
    added_asc: 'Oldest added',
    title_asc: 'Title (A–Z)',
    year_desc: 'Release year',
  },
  watched: {
    added_desc: 'Recently watched',
    added_asc: 'Oldest watched',
    title_asc: 'Title (A–Z)',
    year_desc: 'Release year',
  },
};

function ChevronUpDownIcon() {
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 6L6 3.5 8.5 6" />
      <path d="M3.5 10L6 12.5 8.5 10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/**
 * The iOS-style pull-down sort control for a movie section. A trailing button
 * in the section header shows the active order; tapping it opens a translucent
 * UIMenu of the four orderings, the active one checked. Selecting an option is
 * a plain navigation — each item is a `<Link>` that sets the `?sort=` query
 * param, so the page re-renders server-side with the new order. Only the
 * open/close of the menu is client state. Renders nothing when there's a
 * single movie or fewer (nothing to sort).
 */
export function MovieSortMenu({ section, active, count }: MovieSortMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const labels = LABELS[section];

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Drive the enter/exit transition: mount immediately on open then flip
  // `shown` next frame; on close, animate out before unmounting.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = setTimeout(() => setMounted(false), 150);
    return () => clearTimeout(timer);
  }, [open]);

  if (count <= 1) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-[44px] items-center gap-1 pl-2 pr-0.5 text-[15px] font-medium text-accent ${
          open ? 'opacity-50' : ''
        }`}
      >
        {labels[active]}
        <ChevronUpDownIcon />
      </button>

      {mounted ? (
        <>
          <button
            type="button"
            aria-label="Close sort menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className={`fixed inset-0 z-40 cursor-default bg-black/[0.04] transition-opacity duration-150 ${
              shown ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            role="menu"
            aria-label="Sort by"
            className={`absolute right-0 top-full z-50 mt-1 w-[232px] origin-top-right overflow-hidden rounded-[13px] bg-bg-elevated/85 shadow-[0_12px_32px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition duration-150 ease-out ${
              shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            {SORT_KEYS.map((key) => {
              const selected = key === active;
              return (
                <Link
                  key={key}
                  href={{ query: { sort: key } }}
                  scroll={false}
                  replace
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-[44px] items-center justify-between gap-3 px-3.5 text-[17px] text-text-primary [&:not(:first-child)]:border-t [&:not(:first-child)]:border-separator ${
                    selected ? 'font-semibold' : ''
                  }`}
                >
                  {labels[key]}
                  {selected ? (
                    <span className="text-accent">
                      <CheckIcon />
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
