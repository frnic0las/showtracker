'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSeriesStatus } from '@/actions/series';

interface StoppedBannerProps {
  tmdbSeriesId: number;
  /** Short label for the paused episode, e.g. `S2 E3`, or `null` when finished. */
  pausedLabel: string | null;
}

function StopGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/**
 * Replaces the continue-watching card when a series is `stopped`, making the
 * paused state legible without opening the `•••` menu. The inline Resume button
 * flips the series back to `watching` via `updateSeriesStatus`; on failure the
 * error is surfaced beneath the banner and the tree is refreshed to resync.
 */
export function StoppedBanner({ tmdbSeriesId, pausedLabel }: StoppedBannerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleResume() {
    setError(null);
    startTransition(async () => {
      const result = await updateSeriesStatus(tmdbSeriesId, 'watching');
      if (!result.ok) {
        setError(result.error);
        router.refresh();
      }
    });
  }

  return (
    <div className="m-4">
      <div className="flex items-center gap-3 rounded-md bg-bg-secondary p-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-text-secondary/[.18] text-text-secondary">
          <StopGlyph />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-text-primary">You stopped watching</p>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            {pausedLabel ? `Paused on ${pausedLabel}. ` : ''}Resume any time.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResume}
          disabled={isPending}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent/[.14] px-4 text-[15px] font-semibold text-accent disabled:opacity-50"
        >
          <PlayGlyph />
          Resume
        </button>
      </div>
      {error ? <p className="mt-2 px-1 text-[13px] text-accent-red">{error}</p> : null}
    </div>
  );
}
