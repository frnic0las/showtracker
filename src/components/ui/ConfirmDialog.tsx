'use client';

import { useEffect, useRef, useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  /** Action label for the confirm button, e.g. "Mark watched". */
  confirmLabel: string;
  /** Defaults to "Cancel". */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Disables both buttons and dims the card while an action runs. */
  pending?: boolean;
  /** Renders the confirm button in `text-accent-red` for irreversible actions. */
  destructive?: boolean;
  /** Inline error shown below the message when a previous confirm attempt failed. */
  error?: string | null;
}

/**
 * Centered iOS-style `alertdialog`, extracted from the confirm mode of
 * `SeriesActionSheet`: a 270px card that fades and scales in over a black/40
 * backdrop, locks body scroll while open, and cancels on Escape. Confirm is
 * `text-accent` by default, or `text-accent-red` when `destructive` is set for
 * irreversible actions. An optional `error` renders inline below the message.
 * Focus moves to the Cancel button on open, is trapped within the dialog's
 * buttons while open, and is restored to the previously focused element on
 * close.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  pending = false,
  destructive = false,
  error = null,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

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

  // Capture the previously focused element on open and move focus into the
  // dialog (the Cancel button) once it exists; restore focus on close.
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      const raf = requestAnimationFrame(() => cancelButtonRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
    previouslyFocusedRef.current?.focus?.();
    previouslyFocusedRef.current = null;
  }, [open]);

  // Lock body scroll, wire Escape-to-cancel, and trap Tab within the dialog's
  // focusable buttons while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancelRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLButtonElement>(
        'button:not([disabled])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !dialogRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialogRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 transition-opacity duration-300 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-[270px] overflow-hidden rounded-[14px] bg-bg-elevated/95 text-center backdrop-blur-xl transition duration-200 ease-out ${
          shown ? (pending ? 'scale-100 opacity-50' : 'scale-100 opacity-100') : 'scale-95 opacity-0'
        }`}
      >
        <div className="px-4 pb-[18px] pt-5">
          <p className="text-[17px] font-semibold text-text-primary">{title}</p>
          <p className="mt-1 text-[13px] leading-snug text-text-primary">{message}</p>
          {error ? <p className="mt-2 text-[13px] leading-snug text-accent-red">{error}</p> : null}
        </div>
        <div className="flex border-t border-separator">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="min-h-[44px] flex-1 text-[17px] text-accent disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`min-h-[44px] flex-1 border-l border-separator text-[17px] font-semibold disabled:opacity-50 ${
              destructive ? 'text-accent-red' : 'text-accent'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
