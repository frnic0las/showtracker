'use client';

import { useEffect } from 'react';
import { CenteredState } from '@/components/ui/CenteredState';

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
 * Route-level error state for the Profile page: static header plus a centered
 * retry state. Rendered when a Supabase query in the page throws.
 */
export default function ProfileError({
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
      <header className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <h1 className="text-[34px] font-bold tracking-tight text-text-primary">Profile</h1>
      </header>

      <CenteredState
        icon={<AlertIcon />}
        title="Couldn't load your profile"
        description="Something went wrong reaching the server. Check your connection and try again."
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
