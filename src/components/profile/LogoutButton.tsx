'use client';

import { useState, useTransition } from 'react';
import { logout } from '@/actions/auth';

/**
 * Destructive grouped-list row that signs the user out. Redirects to
 * `/login` on success; on failure (session already gone, network error) it
 * surfaces the error inline instead.
 */
export function LogoutButton() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await logout();
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex min-h-11 w-full items-center px-4 text-left text-[17px] font-medium text-accent-red disabled:opacity-50"
      >
        {isPending ? 'Logging out…' : 'Log out'}
      </button>
      {error ? <p className="px-4 pb-3 text-[13px] text-accent-red">{error}</p> : null}
    </div>
  );
}
