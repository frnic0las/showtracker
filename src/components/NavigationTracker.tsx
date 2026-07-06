'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { markInternalNavigation } from '@/lib/navigation';

/**
 * Records the first in-app route change so back actions know there is in-app
 * history to return to. Renders nothing; the first pathname is the entry page,
 * any later change means the user navigated within the app.
 */
export function NavigationTracker() {
  const pathname = usePathname();
  const entryPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== entryPath.current) {
      markInternalNavigation();
    }
  }, [pathname]);

  return null;
}
