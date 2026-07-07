'use client';

import { useEffect, useRef, useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  /** Defaults to "Mark watched". */
  confirmLabel?: string;
  /** Defaults to "Cancel". */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Disables both buttons and dims the card while an action runs. */
  pending?: boolean;
}

/**
 * Centered iOS-style `alertdialog`, extracted from the confirm mode of
 * `SeriesActionSheet`: a 270px card that fades and scales in over a black/40
 * backdrop, locks body scroll while open, and cancels on Escape. Confirm is
 * non-destructive here — rendered in `text-accent` rather than red.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Mark watched',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  pending = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

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

  // Lock body scroll and wire Escape-to-cancel while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancelRef.current();
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
        </div>
        <div className="flex border-t border-separator">
          <button
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
            className="min-h-[44px] flex-1 border-l border-separator text-[17px] font-semibold text-accent disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
