'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markSeasonWatched, unmarkSeasonWatched } from '@/actions/series';
import { EpisodeRow } from '@/components/series/EpisodeRow';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { isFutureAirDate } from '@/lib/dates';
import type { EpisodeWithStatus } from '@/types/series';

interface SeasonAccordionProps {
  tmdbSeriesId: number;
  seasonNumber: number;
  watchedCount: number;
  totalCount: number;
  episodes: EpisodeWithStatus[];
  defaultOpen: boolean;
}

function CheckCircleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

function ChevronRightIcon({ open }: { open: boolean }) {
  return (
    <svg
      data-open={open ? '' : undefined}
      width="9"
      height="16"
      viewBox="0 0 9 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-2.5 shrink-0 text-text-tertiary transition-transform duration-200 data-[open]:rotate-90"
    >
      <path d="M1 1l6 7-6 7" />
    </svg>
  );
}

/**
 * Collapsible season panel: a header showing the season name, `watched/total`
 * progress (green with a check when complete), and a chevron that rotates on
 * open. The expanded body lists every episode plus a control to mark or unmark
 * the whole season at once. Defaults open for the season the user is currently
 * on so the next episode is visible without a tap.
 */
export function SeasonAccordion({
  tmdbSeriesId,
  seasonNumber,
  watchedCount,
  totalCount,
  episodes,
  defaultOpen,
}: SeasonAccordionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const complete = totalCount > 0 && watchedCount === totalCount;

  function runSeasonToggle() {
    startTransition(async () => {
      const result = complete
        ? await unmarkSeasonWatched(tmdbSeriesId, seasonNumber)
        : await markSeasonWatched(tmdbSeriesId, seasonNumber);
      if (!result.ok) {
        router.refresh();
      }
    });
  }

  function handleSeasonToggle() {
    if (
      !complete &&
      episodes.some((episode) => !episode.watched && isFutureAirDate(episode.airDate))
    ) {
      setConfirmOpen(true);
      return;
    }
    runSeasonToggle();
  }

  function handleConfirm() {
    setConfirmOpen(false);
    runSeasonToggle();
  }

  return (
    <div className="mb-2 overflow-hidden rounded-md bg-bg-elevated">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-[52px] w-full items-center gap-2 px-3 text-left"
      >
        <span className="flex-1 text-[17px] font-semibold text-text-primary">
          Season {seasonNumber}
        </span>
        <span
          className={`text-[15px] font-semibold tabular-nums ${complete ? 'text-accent-green' : 'text-text-secondary'}`}
        >
          {watchedCount}/{totalCount}
        </span>
        {complete ? (
          <span className="flex text-accent-green">
            <CheckCircleIcon />
          </span>
        ) : null}
        <ChevronRightIcon open={open} />
      </button>

      {open ? (
        <div className="border-t border-separator">
          {episodes.map((episode) => (
            <EpisodeRow
              key={episode.episodeNumber}
              tmdbSeriesId={tmdbSeriesId}
              seasonNumber={seasonNumber}
              episodeNumber={episode.episodeNumber}
              name={episode.name}
              airDate={episode.airDate}
              watched={episode.watched}
            />
          ))}
          <button
            type="button"
            onClick={handleSeasonToggle}
            disabled={isPending}
            className="relative flex min-h-[44px] w-full items-center justify-center px-3 py-2 text-[15px] font-semibold text-accent before:absolute before:left-3 before:right-3 before:top-0 before:h-px before:bg-separator disabled:opacity-50"
          >
            {complete ? 'Unmark season' : 'Mark season watched'}
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Not all aired yet"
        message="This season has episodes that haven't aired yet. Mark the whole season as watched?"
        confirmLabel="Mark season"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        pending={isPending}
      />
    </div>
  );
}
