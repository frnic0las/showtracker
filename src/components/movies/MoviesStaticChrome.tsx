import type { ReactNode } from 'react';

function PlusIcon() {
  return (
    <svg
      className="h-7 w-7"
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
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

interface MoviesStaticChromeProps {
  children: ReactNode;
}

/**
 * Static (non-interactive) header shell shared by the Movies page's `loading`
 * and `error` route states, where the real interactive `MoviesSearch` client
 * component can't be mounted. Mirrors the live chrome so those states don't
 * visually jump.
 */
export function MoviesStaticChrome({ children }: MoviesStaticChromeProps) {
  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <h1 className="text-[34px] font-bold tracking-tight text-text-primary">Movies</h1>
        <div className="flex h-11 w-11 items-center justify-center text-accent">
          <PlusIcon />
        </div>
      </header>

      {children}
    </div>
  );
}
