import type { ComponentPropsWithoutRef } from 'react';

const baseClassName =
  'min-h-11 w-full rounded-md border border-separator bg-bg-secondary px-4 text-[17px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent';

/**
 * iOS-style text input. Forwards all native `<input>` props; an optional
 * `className` is appended so callers can tweak spacing without losing the base.
 */
export function Input({ className, ...props }: ComponentPropsWithoutRef<'input'>) {
  return <input className={className ? `${baseClassName} ${className}` : baseClassName} {...props} />;
}
