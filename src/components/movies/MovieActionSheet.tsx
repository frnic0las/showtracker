'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { removeMovie, toggleMovieWatched } from '@/actions/movies';

interface MovieActionSheetProps {
  tmdbId: number;
  title: string;
  /** Whether the movie is currently in the Watched section. */
  watched: boolean;
  open: boolean;
  onClose: () => void;
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    </svg>
  );
}

/**
 * The contextual action sheet for a movie poster, opened by long-pressing the
 * tile in `MovieCard`, plus the destructive Remove confirmation alert — one
 * client island per card. "Mark as watched / unwatched" is reversible and
 * applies immediately via `toggleMovieWatched` (the labelled twin of the
 * poster checkmark); Remove is guarded by a centered alert before `removeMovie`
 * and, on success, the tile drops out of the grid on revalidation — no
 * navigation, since movies have no detail page. On any error the overlay stays
 * open and surfaces the message. Structurally the twin of `SeriesActionSheet`.
 */
export function MovieActionSheet({ tmdbId, title, watched, open, onClose }: MovieActionSheetProps) {
  const [mode, setMode] = useState<'sheet' | 'confirm'>('sheet');
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [confirmShown, setConfirmShown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Reset to the sheet view (not the confirm alert) and clear any prior error
  // each time the overlay is opened.
  useEffect(() => {
    if (open) {
      setMode('sheet');
      setError(null);
    }
  }, [open]);

  // Drive the enter/exit transition: mount immediately on open then flip
  // `shown` on the next frame; on close, animate out before unmounting.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const timer = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

  // The confirm alert swaps in while the overlay is already open (`shown` is
  // true), so it needs its own enter trigger: flip `confirmShown` on the next
  // frame after entering confirm mode to play the fade + scale-in.
  useEffect(() => {
    if (open && mode === 'confirm') {
      const raf = requestAnimationFrame(() => setConfirmShown(true));
      return () => cancelAnimationFrame(raf);
    }
    setConfirmShown(false);
  }, [open, mode]);

  // Lock body scroll and wire Escape-to-close while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  function close() {
    if (isPending) return;
    onClose();
  }

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleMovieWatched(tmdbId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMovie(tmdbId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center bg-black/40 transition-opacity duration-300 ${
        mode === 'confirm' ? 'justify-center' : 'justify-end'
      } ${shown ? 'opacity-100' : 'opacity-0'}`}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      {mode === 'sheet' ? (
        <div
          role="menu"
          aria-label={`Actions for ${title}`}
          className={`relative w-full max-w-[430px] px-2 pb-[calc(8px+env(safe-area-inset-bottom))] transition-transform duration-300 ease-out ${
            shown ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="overflow-hidden rounded-lg bg-bg-elevated/95 backdrop-blur-xl">
            <div className="border-b border-separator px-4 pb-3 pt-3.5 text-center text-[13px] leading-snug text-text-secondary">
              <span className="font-semibold text-text-primary">{title}</span>
              <br />
              {watched ? 'Watched' : 'In your watchlist'}
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={handleToggle}
              disabled={isPending}
              className="flex min-h-[57px] w-full items-center justify-center gap-2 text-[20px] font-semibold text-accent disabled:opacity-50"
            >
              {watched ? <CircleIcon /> : <CheckIcon />}
              {watched ? 'Mark as unwatched' : 'Mark as watched'}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => setMode('confirm')}
              disabled={isPending}
              className="flex min-h-[57px] w-full items-center justify-center gap-2 border-t border-separator text-[20px] text-accent-red disabled:opacity-50"
            >
              <TrashIcon />
              Remove from movies
            </button>

            {error ? (
              <p className="border-t border-separator px-4 py-3 text-center text-[13px] text-accent-red">
                {error}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={close}
            disabled={isPending}
            className="mt-2 min-h-[57px] w-full rounded-lg bg-bg-elevated/95 text-[20px] font-semibold text-accent backdrop-blur-xl disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={`Remove ${title}?`}
          className={`relative w-[270px] overflow-hidden rounded-[14px] bg-bg-elevated/95 text-center backdrop-blur-xl transition duration-200 ease-out ${
            confirmShown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="px-4 pb-[18px] pt-5">
            <p className="text-[17px] font-semibold text-text-primary">
              Remove &ldquo;{title}&rdquo;?
            </p>
            <p className="mt-1 text-[13px] leading-snug text-text-primary">
              This removes the movie from your list. This can&rsquo;t be undone.
            </p>
            {error ? <p className="mt-2 text-[13px] leading-snug text-accent-red">{error}</p> : null}
          </div>
          <div className="flex border-t border-separator">
            <button
              type="button"
              onClick={close}
              disabled={isPending}
              className="min-h-[44px] flex-1 text-[17px] text-accent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="min-h-[44px] flex-1 border-l border-separator text-[17px] font-semibold text-accent-red disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
