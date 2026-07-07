function InfoIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

/**
 * A single muted advisory line that surfaces the otherwise-invisible long-press
 * gesture on the movie grids. It's chrome, not a control — the copy adapts to
 * the section (the Watched archive flips "mark it" to "mark as unwatched").
 */
export function MoviesHint({ variant }: { variant: 'watchlist' | 'watched' }) {
  const copy =
    variant === 'watched'
      ? 'Touch and hold a poster to mark as unwatched or remove.'
      : 'Touch and hold a poster to mark it or remove it.';

  return (
    <p className="mx-4 mt-1 flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary">
      <span className="text-text-tertiary">
        <InfoIcon />
      </span>
      {copy}
    </p>
  );
}
