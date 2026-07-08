'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addMovie } from '@/actions/movies';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchBar } from '@/components/ui/SearchBar';
import { isFutureDate } from '@/lib/dates';
import { posterUrl } from '@/lib/tmdb/images';
import type { TmdbSearchResponse } from '@/lib/tmdb/types';
import type { MovieAddStatus, MovieSearchResult } from '@/types/movies';

interface MoviesSearchSheetProps {
  /** TMDB ids the user already added, so results render as "Added". */
  addedIds: number[];
}

type SearchStatus = 'idle' | 'loading' | 'error' | 'empty' | 'results';

/**
 * Search UI for the add-movie sheet: a debounced search bar that queries the
 * TMDB proxy for movies and renders tappable results. Each result can be
 * added to the watchlist or marked watched directly; already-added movies
 * show a non-interactive "Added" state.
 */
export function MoviesSearchSheet({ addedIds }: MoviesSearchSheetProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [added, setAdded] = useState<Set<number>>(() => new Set(addedIds));
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<MovieSearchResult | null>(null);
  const controller = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (query: string) => {
    controller.current?.abort();
    setAddError(null);

    if (!query) {
      setResults([]);
      setStatus('idle');
      return;
    }

    const ctrl = new AbortController();
    controller.current = ctrl;
    setStatus('loading');

    try {
      const response = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(query)}&type=movie&page=1`,
        { signal: ctrl.signal },
      );
      if (!response.ok) throw new Error('Search request failed');

      const data = (await response.json()) as TmdbSearchResponse;
      if (ctrl.signal.aborted) return;

      const mapped: MovieSearchResult[] = data.results.map((item) => ({
        tmdbId: item.id,
        title: item.title ?? item.name ?? 'Untitled',
        posterPath: item.poster_path,
        year: item.release_date ? item.release_date.slice(0, 4) : null,
        releaseDate: item.release_date ?? null,
      }));

      setResults(mapped);
      setStatus(mapped.length > 0 ? 'results' : 'empty');
    } catch {
      if (ctrl.signal.aborted) return;
      setStatus('error');
    }
  }, []);

  async function handleAdd(item: MovieSearchResult, addStatus: MovieAddStatus) {
    if (added.has(item.tmdbId) || pendingId !== null) return;

    setAddError(null);
    setPendingId(item.tmdbId);
    const result = await addMovie(item.tmdbId, addStatus);
    setPendingId(null);

    if (result.ok) {
      setAdded((prev) => new Set(prev).add(item.tmdbId));
      // Refresh the underlying movies list so the new row appears once the
      // sheet is dismissed.
      router.refresh();
    } else {
      setAddError(result.error);
    }
  }

  // Adding a movie straight to Watched confirms first when its release date is
  // strictly in the future; the Watchlist path never prompts.
  function handleWatchedAdd(item: MovieSearchResult) {
    if (added.has(item.tmdbId) || pendingId !== null) return;
    if (isFutureDate(item.releaseDate)) {
      setAddError(null);
      setConfirmItem(item);
      return;
    }
    handleAdd(item, 'watched');
  }

  function handleConfirmWatched() {
    const item = confirmItem;
    setConfirmItem(null);
    if (item) handleAdd(item, 'watched');
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 pb-2 pt-1">
        <SearchBar placeholder="Search movies" onSearch={runSearch} autoFocus />
      </div>

      {addError ? (
        <p className="px-4 pb-2 text-[13px] text-accent-red">{addError}</p>
      ) : null}

      {status === 'loading' ? (
        <p className="px-4 py-10 text-center text-[15px] text-text-secondary">Searching…</p>
      ) : null}

      {status === 'error' ? (
        <p className="px-4 py-10 text-center text-[15px] text-text-secondary">
          Could not search right now. Please try again.
        </p>
      ) : null}

      {status === 'empty' ? (
        <p className="px-4 py-10 text-center text-[15px] text-text-secondary">
          No movies found.
        </p>
      ) : null}

      {status === 'results' ? (
        <ul className="pb-[calc(16px+env(safe-area-inset-bottom))]">
          {results.map((item) => {
            const isAdded = added.has(item.tmdbId);
            const isPending = pendingId === item.tmdbId;
            const poster = posterUrl(item.posterPath, 'w185');

            return (
              <li key={item.tmdbId}>
                <div className="flex w-full items-center gap-3 px-4 py-2 text-left">
                  {poster ? (
                    <Image
                      src={poster}
                      alt=""
                      width={60}
                      height={90}
                      className="shrink-0 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="h-[90px] w-[60px] shrink-0 rounded-sm bg-bg-secondary" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-semibold text-text-primary">
                      {item.title}
                    </p>
                    {item.year ? (
                      <p className="text-[13px] text-text-secondary">{item.year}</p>
                    ) : null}
                  </div>

                  {isAdded ? (
                    <span className="shrink-0 text-[15px] font-semibold text-accent-green">
                      Added
                    </span>
                  ) : isPending ? (
                    <span className="shrink-0 text-[15px] text-text-secondary">Adding…</span>
                  ) : (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleAdd(item, 'watchlist')}
                        disabled={pendingId !== null}
                        className="min-h-11 rounded-full border border-accent px-4 text-[13px] font-semibold text-accent"
                      >
                        Watchlist
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWatchedAdd(item)}
                        disabled={pendingId !== null}
                        className="min-h-11 rounded-full bg-accent-green px-4 text-[13px] font-semibold text-white"
                      >
                        Watched
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <ConfirmDialog
        open={confirmItem !== null}
        title="Not released yet"
        message="This movie hasn't been released yet. Mark it as watched anyway?"
        confirmLabel="Mark watched"
        onConfirm={handleConfirmWatched}
        onCancel={() => setConfirmItem(null)}
      />
    </div>
  );
}
