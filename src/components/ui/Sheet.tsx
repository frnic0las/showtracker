'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * iOS-style bottom sheet modal. Rises from the bottom with a spring-eased
 * slide, dims the backdrop, and closes on backdrop tap or Escape. Children are
 * mounted only while open (plus the closing animation), so consumers get fresh
 * state each time the sheet is opened.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keep the latest `onClose` in a ref so the keydown effect can depend only on
  // `open` — parents commonly pass a fresh inline callback each render, which
  // would otherwise re-run the effect (tearing down/re-adding listeners).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  // Lock body scroll, wire Escape-to-close, and trap Tab focus within the
  // sheet while open so focus can't escape to the page behind it.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[90%] w-full max-w-[430px] flex-col rounded-t-lg bg-bg-elevated transition-transform duration-300 ease-out ${
          shown ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center pt-2">
          <div className="h-[5px] w-9 rounded-full bg-text-tertiary" />
        </div>
        {title ? (
          <h2 className="px-4 pb-1 pt-3 text-center text-[17px] font-semibold text-text-primary">
            {title}
          </h2>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
