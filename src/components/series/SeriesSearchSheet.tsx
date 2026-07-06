'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addSeries } from '@/actions/series';
import { SearchBar } from '@/components/ui/SearchBar';
import { posterUrl } from '@/lib/tmdb/images';
import type { TmdbSearchResponse } from '@/lib/tmdb/types';
import type { SeriesSearchResult } from '@/types/series';

interface SeriesSearchSheetProps {
  /** TMDB ids the user already tracks, so results render as "Added". */
  trackedIds: number[];
}

type SearchStatus = 'idle' | 'loading' | 'error' | 'empty' | 'results';

/**
 * Search UI for the add-series sheet: a debounced search bar that queries the
 * TMDB proxy for TV series and renders tappable results. Tapping a result adds
 * it to the user's list; already-tracked series show a non-interactive
 * "Added" state.
 */
export function SeriesSearchSheet({ trackedIds }: SeriesSearchSheetProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<SeriesSearchResult[]>([]);
  const [added, setAdded] = useState<Set<number>>(() => new Set(trackedIds));
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
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
        `/api/tmdb/search?q=${encodeURIComponent(query)}&type=tv&page=1`,
        { signal: ctrl.signal },
      );
      if (!response.ok) throw new Error('Search request failed');

      const data = (await response.json()) as TmdbSearchResponse;
      if (ctrl.signal.aborted) return;

      const mapped: SeriesSearchResult[] = data.results.map((item) => ({
        tmdbId: item.id,
        title: item.name ?? item.title ?? 'Untitled',
        posterPath: item.poster_path,
        year: item.first_air_date ? item.first_air_date.slice(0, 4) : null,
      }));

      setResults(mapped);
      setStatus(mapped.length > 0 ? 'results' : 'empty');
    } catch {
      if (ctrl.signal.aborted) return;
      setStatus('error');
    }
  }, []);

  async function handleAdd(item: SeriesSearchResult) {
    if (added.has(item.tmdbId) || pendingId !== null) return;

    setAddError(null);
    setPendingId(item.tmdbId);
    const result = await addSeries(item.tmdbId);
    setPendingId(null);

    if (result.ok) {
      setAdded((prev) => new Set(prev).add(item.tmdbId));
      // Refresh the underlying series list so the new row appears once the
      // sheet is dismissed.
      router.refresh();
    } else {
      setAddError(result.error);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 pb-2 pt-1">
        <SearchBar placeholder="Search series" onSearch={runSearch} autoFocus />
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
          No series found.
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
                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  disabled={isAdded || pendingId !== null}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left disabled:opacity-100"
                >
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

                  <span
                    className={`shrink-0 text-[15px] font-semibold ${
                      isAdded ? 'text-accent-green' : 'text-accent'
                    }`}
                  >
                    {isAdded ? 'Added' : isPending ? 'Adding…' : 'Add'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
