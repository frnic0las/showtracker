'use client';

import { useEffect } from 'react';

/**
 * Registers the hand-written service worker (`public/sw.js`) so the app
 * shell can be served offline after the first visit. Renders nothing; only
 * runs the registration effect once on mount. Registration is deferred to
 * the `load` event to avoid competing with the initial page load, and is
 * skipped outside production so it does not interfere with dev HMR.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('Service worker registration failed:', error);
      });
    };

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
