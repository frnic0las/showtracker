'use client';

import { useEffect } from 'react';
import { DetailBackButton } from '@/components/series/DetailBackButton';
import { CenteredState } from '@/components/ui/CenteredState';

function AlertIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/**
 * Route-level error state for the movie detail page: a shortened hero over a
 * centered retry state. Rendered when the TMDB refresh or a Supabase query in
 * the page throws. The movie twin of `series/[id]/error.tsx`.
 */
export default function MovieDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <div className="relative h-[120px] overflow-hidden bg-bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
        <DetailBackButton fallbackHref="/movies" />
      </div>

      <CenteredState
        icon={<AlertIcon />}
        title="Couldn't load this movie"
        description="We couldn't reach TMDB for the movie details. Try again in a moment."
      >
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 text-[17px] font-semibold text-white"
        >
          Try again
        </button>
      </CenteredState>
    </div>
  );
}
