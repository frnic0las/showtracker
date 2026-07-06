'use client';

import { useRouter } from 'next/navigation';
import { hasInternalHistory } from '@/lib/navigation';

/**
 * Translucent 44×44 back button overlaid on the detail hero. Returns to
 * wherever the user opened the series from (the To-watch grid, Upcoming list,
 * or search), or falls back to the Series tab when the detail page is the entry
 * point — a shared link, bookmark, or PWA deeplink — so back never exits the app.
 */
export function DetailBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (hasInternalHistory()) {
      router.back();
    } else {
      router.push('/series');
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Back"
      className="absolute left-3 top-2 z-[3] flex h-11 w-11 items-center justify-center rounded-full bg-bg-primary/55 text-text-primary backdrop-blur-md"
    >
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
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );
}
