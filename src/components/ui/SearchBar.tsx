'use client';

import { useEffect, useRef, useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  /** Called with the trimmed query after `debounceMs` of inactivity. */
  onSearch: (query: string) => void;
  debounceMs?: number;
  autoFocus?: boolean;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" opacity="0.9" />
      <path
        d="M15 9l-6 6M9 9l6 6"
        stroke="var(--bg-secondary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * iOS-style search field. Owns its input value and debounces `onSearch` by
 * `debounceMs` (300ms by default) so callers only react to settled queries.
 */
export function SearchBar({
  placeholder = 'Search',
  onSearch,
  debounceMs = 300,
  autoFocus,
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(next.trim()), debounceMs);
  }

  function clear() {
    setValue('');
    clearTimeout(timer.current);
    onSearch('');
  }

  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-bg-secondary px-3">
      <SearchIcon className="h-4 w-4 shrink-0 text-text-tertiary" />
      <input
        type="search"
        inputMode="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-11 w-full bg-transparent text-[17px] text-text-primary placeholder:text-text-tertiary focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          className="flex h-11 w-6 shrink-0 items-center justify-center text-text-tertiary"
        >
          <ClearIcon className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
