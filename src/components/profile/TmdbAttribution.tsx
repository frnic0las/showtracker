function TmdbLogo() {
  return (
    <svg
      role="img"
      aria-label="TMDB"
      width="64"
      height="18"
      viewBox="0 0 64 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tmdb-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#90CEA1" />
          <stop offset="1" stopColor="#01B4E4" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="14"
        fill="url(#tmdb-gradient)"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
        fontSize="16"
        fontWeight="700"
      >
        TMDB
      </text>
    </svg>
  );
}

/**
 * TMDB Terms of Service attribution: the wordmark plus the required
 * "not endorsed or certified" disclaimer. Shown at the bottom of the About
 * section on the Profile page.
 */
export function TmdbAttribution() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-4 text-center">
      <TmdbLogo />
      <p className="text-[13px] text-text-secondary">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </div>
  );
}
