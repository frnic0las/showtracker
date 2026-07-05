import type { ReactNode } from 'react';

interface CenteredStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Optional action slot rendered below the description (e.g. a CTA button). */
  children?: ReactNode;
}

/**
 * Centered icon + title + description block used for empty, error, and
 * no-results states across the app.
 */
export function CenteredState({ icon, title, description, children }: CenteredStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-10 text-center">
      <div className="text-text-tertiary">{icon}</div>
      <p className="text-[17px] font-semibold text-text-primary">{title}</p>
      <p className="max-w-[260px] text-[15px] leading-snug text-text-secondary">{description}</p>
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
