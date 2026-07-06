'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactElement } from 'react';

interface Tab {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactElement;
}

function SeriesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function MoviesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M7 4v5" />
      <path d="M17 4v5" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.418 3.582-7 8-7s8 2.582 8 7" />
    </svg>
  );
}

const tabs: Tab[] = [
  { href: '/series', label: 'Series', icon: SeriesIcon },
  { href: '/movies', label: 'Movies', icon: MoviesIcon },
  { href: '/profile', label: 'Profile', icon: ProfileIcon },
];

/**
 * iOS-style fixed bottom tab bar with 3 tabs: Series, Movies, Profile.
 * Highlights the active tab based on the current pathname.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 h-[calc(49px+env(safe-area-inset-bottom))] border-t border-separator bg-bg-primary/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-[20px]">
      <div className="flex h-[49px] items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-1 ${
                isActive ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
