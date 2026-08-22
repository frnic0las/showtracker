import Image from 'next/image';
import { DetailBackButton } from '@/components/series/DetailBackButton';
import { MovieActionSheet } from '@/components/movies/MovieActionSheet';
import { daysUntil } from '@/lib/dates';
import { formatRuntime } from '@/lib/movies/format';
import { posterUrl } from '@/lib/tmdb/images';
import type { MovieTracking } from '@/types/movies';

interface MovieHeroProps {
  tmdbId: number;
  title: string;
  backdropPath: string | null;
  posterPath: string | null;
  /** Full `YYYY-MM-DD` release date; drives the year segment and the Unreleased pill. */
  releaseDate: string | null;
  /** Runtime in minutes. */
  runtime: number | null;
  /** `null` when the current user doesn't track the movie — hides the `•••` menu. */
  tracking: MovieTracking | null;
}

function StatusDot() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

/**
 * Backdrop hero for the movie detail page — the movie twin of `SeriesHero`:
 * full-bleed TMDB backdrop (falling back to the poster when there is no
 * backdrop) under a bottom-up gradient, a translucent back button, the title,
 * and a metadata line (year · runtime · Unreleased). The hero collapses to
 * 140px when there is neither a backdrop nor a poster instead of shipping
 * empty surface. The `•••` action sheet only renders when the current user
 * tracks the movie.
 */
export function MovieHero({
  tmdbId,
  title,
  backdropPath,
  posterPath,
  releaseDate,
  runtime,
  tracking,
}: MovieHeroProps) {
  const image = posterUrl(backdropPath ?? posterPath, 'w780');
  const year = releaseDate ? releaseDate.slice(0, 4) : null;
  const runtimeLabel = formatRuntime(runtime);
  const unreleased = releaseDate ? daysUntil(releaseDate) > 0 : false;

  return (
    <div
      className={`relative flex items-end overflow-hidden bg-bg-secondary ${
        image ? 'h-[220px]' : 'h-[140px]'
      }`}
    >
      {image ? <Image src={image} alt="" fill sizes="430px" className="object-cover" priority /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
      <DetailBackButton fallbackHref="/movies" />
      {tracking ? (
        <MovieActionSheet
          tmdbId={tmdbId}
          title={title}
          watched={tracking.watched}
          releaseDate={releaseDate}
          trigger
          redirectOnRemove
        />
      ) : null}
      <div className="relative z-[2] w-full px-4 pb-4">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-text-secondary">
          {year ? <span>{year}</span> : null}
          {runtimeLabel ? (
            <>
              {year ? <span className="opacity-50">·</span> : null}
              <span>{runtimeLabel}</span>
            </>
          ) : null}
          {unreleased ? (
            <>
              {year || runtimeLabel ? <span className="opacity-50">·</span> : null}
              <span className="inline-flex items-center gap-1 font-semibold text-accent-orange">
                <StatusDot />
                Unreleased
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
