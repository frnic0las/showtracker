/**
 * Returns `value` if set, otherwise throws. Callers pass the value via static
 * `process.env.X` access so Next.js can inline `NEXT_PUBLIC_*` vars into the
 * appropriate bundle; this helper only asserts presence.
 */
export function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}
