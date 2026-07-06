'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TZ_COOKIE } from '@/lib/dates';

/**
 * Writes the browser's IANA timezone to a cookie so the server can bucket
 * air dates by the user's local date instead of Vercel's UTC clock. Renders
 * nothing; only runs the sync effect once on mount.
 */
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = document.cookie.match(new RegExp(`(?:^|; )${TZ_COOKIE}=([^;]*)`));
    const currentTz = match ? match[1] : undefined;

    if (timeZone !== currentTz) {
      document.cookie = `${TZ_COOKIE}=${timeZone}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
  }, [router]);

  return null;
}
