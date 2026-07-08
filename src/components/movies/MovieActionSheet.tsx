'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { removeMovie, toggleMovieWatched } from '@/actions/movies';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { isFutureDate } from '@/lib/dates';

interface MovieActionSheetProps {
  tmdbId: number;
  title: string;
  /** Whether the movie is currently in the Watched section. */
  watched: boolean;
  /** Movie release date; a strictly-future date confirms before marking watched. */
  releaseDate: string | null;
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
 * poster checkmark); Remove is guarded by the shared `ConfirmDialog` before
 * `removeMovie` and, on success, the tile drops out of the grid on
 * revalidation — no navigation, since movies have no detail page. On any error
 * the overlay stays open and surfaces the message. Structurally the twin of
 * `SeriesActionSheet`.
 */
export function MovieActionSheet({
  tmdbId,
  title,
  watched,
  releaseDate,
  open,
  onClose,
}: MovieActionSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [watchConfirmOpen, setWatchConfirmOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Close both confirm dialogs and clear any prior error each time the sheet is
  // opened, so a reopened sheet always lands on its action list.
  useEffect(() => {
    if (open) {
      setWatchConfirmOpen(false);
      setRemoveConfirmOpen(false);
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

  function openRemoveConfirm() {
    // Close the sheet before opening the confirm so a single overlay owns the
    // body scroll lock and the Escape handler at a time — mirroring the
    // watched-confirm flow and SeriesActionSheet's remove flow.
    setError(null);
    onClose();
    setRemoveConfirmOpen(true);
  }

  function closeRemoveConfirm() {
    if (isPending) return;
    setError(null);
    setRemoveConfirmOpen(false);
  }

  function runToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleMovieWatched(tmdbId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setWatchConfirmOpen(false);
      onClose();
    });
  }

  function handleToggle() {
    // Marking an unreleased movie watched asks for confirmation first; clearing
    // the watched flag or a movie already released toggles immediately. Close
    // the sheet before opening the confirm so a single overlay owns the body
    // scroll lock and the Escape handler at a time — mirroring the remove flow
    // in SeriesActionSheet. On cancel the user lands back on the movie grid.
    if (!watched && isFutureDate(releaseDate)) {
      setError(null);
      onClose();
      setWatchConfirmOpen(true);
      return;
    }
    runToggle();
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMovie(tmdbId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRemoveConfirmOpen(false);
    });
  }

  // The sheet overlay is conditionally mounted, but both confirm dialogs are
  // always rendered so closing the sheet (before opening a confirm) does not
  // unmount the dialog with it.
  return (
    <>
      {mounted ? (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-end bg-black/40 transition-opacity duration-300 ${
            shown ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full cursor-default"
          />

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
                onClick={openRemoveConfirm}
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
        </div>
      ) : null}

      <ConfirmDialog
        open={watchConfirmOpen}
        title="Not released yet"
        message="This movie hasn't been released yet. Mark it as watched anyway?"
        confirmLabel="Mark watched"
        error={error}
        pending={isPending}
        onConfirm={runToggle}
        onCancel={() => {
          if (isPending) return;
          setError(null);
          setWatchConfirmOpen(false);
        }}
      />

      <ConfirmDialog
        open={removeConfirmOpen}
        title={`Remove “${title}”?`}
        message="This removes the movie from your list. This can’t be undone."
        confirmLabel="Remove"
        destructive
        error={error}
        pending={isPending}
        onConfirm={handleRemove}
        onCancel={closeRemoveConfirm}
      />
    </>
  );
}
