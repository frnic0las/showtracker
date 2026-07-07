'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeSeries, updateSeriesStatus } from '@/actions/series';

type UserStatus = 'watching' | 'stopped' | 'watchlist';

interface SeriesActionSheetProps {
  tmdbSeriesId: number;
  title: string;
  status: UserStatus;
  /** Whether every episode is watched — a computed state with no stored status. */
  completed: boolean;
  /** Short label for the next unwatched episode, e.g. `S2 E3`, for the caption. */
  nextLabel?: string;
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function StopIcon() {
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
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
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
 * The primary status transition offered for the current state. A finished
 * series (`completed`) has no reversible transition — only Remove — so it
 * returns `null`.
 */
function primaryAction(
  status: UserStatus,
  completed: boolean,
): { label: string; target: UserStatus; icon: 'stop' | 'play' } | null {
  // An explicit user status wins over the computed `completed` state, so a
  // stopped/watchlisted series still offers Resume/Start even when finished.
  if (status === 'stopped') return { label: 'Resume watching', target: 'watching', icon: 'play' };
  if (status === 'watchlist') return { label: 'Start watching', target: 'watching', icon: 'play' };
  // status === 'watching': nothing to stop once every episode is watched.
  if (completed) return null;
  return { label: 'Stop watching', target: 'stopped', icon: 'stop' };
}

function statusCaption(status: UserStatus, completed: boolean, nextLabel?: string): string {
  if (completed) return 'Finished · completed';
  if (status === 'watchlist') return 'In your watchlist';
  if (status === 'stopped') return nextLabel ? `Paused on ${nextLabel} · stopped` : 'Stopped';
  return nextLabel ? `You're on ${nextLabel} · watching` : 'Watching';
}

/**
 * The hero's `•••` more button and its contextual action sheet, plus the
 * destructive Remove confirmation alert — one client island driving every
 * status transition for the series detail page. Stop / Resume / Start apply
 * immediately via `updateSeriesStatus`; Remove is guarded by a centered alert
 * before `removeSeries`, then navigates back to the series list. On any error
 * the overlay stays open and surfaces the message — no optimistic updates.
 */
export function SeriesActionSheet({
  tmdbSeriesId,
  title,
  status,
  completed,
  nextLabel,
}: SeriesActionSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'sheet' | 'confirm'>('sheet');
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [confirmShown, setConfirmShown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onCloseRef = useRef(() => setOpen(false));

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

  function openSheet() {
    setError(null);
    setMode('sheet');
    setOpen(true);
  }

  function close() {
    if (isPending) return;
    setOpen(false);
  }

  function handlePrimary(target: UserStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateSeriesStatus(tmdbSeriesId, target);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeSeries(tmdbSeriesId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push('/series');
    });
  }

  const primary = primaryAction(status, completed);

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label="More actions"
        aria-haspopup="menu"
        className="absolute right-3 top-2 z-[3] flex h-11 w-11 items-center justify-center rounded-full bg-bg-primary/55 text-text-primary backdrop-blur-md"
      >
        <MoreIcon />
      </button>

      {mounted ? (
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
                  {statusCaption(status, completed, nextLabel)}
                </div>

                {primary ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handlePrimary(primary.target)}
                    disabled={isPending}
                    className="flex min-h-[57px] w-full items-center justify-center gap-2 text-[20px] font-semibold text-accent disabled:opacity-50"
                  >
                    {primary.icon === 'stop' ? <StopIcon /> : <PlayIcon />}
                    {primary.label}
                  </button>
                ) : null}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setMode('confirm')}
                  disabled={isPending}
                  className="flex min-h-[57px] w-full items-center justify-center gap-2 border-t border-separator text-[20px] text-accent-red disabled:opacity-50"
                >
                  <TrashIcon />
                  Remove from library
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
                  This deletes the series and all your watch progress. This can&rsquo;t be undone.
                </p>
                {error ? (
                  <p className="mt-2 text-[13px] leading-snug text-accent-red">{error}</p>
                ) : null}
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
      ) : null}
    </>
  );
}
