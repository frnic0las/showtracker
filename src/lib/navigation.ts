/** sessionStorage key marking that an in-app client navigation has occurred. */
export const INTERNAL_NAV_FLAG = 'st:internal-nav';

/**
 * Records that the user has navigated within the app during this tab session.
 * Guarded because sessionStorage can throw when storage is disabled.
 */
export function markInternalNavigation(): void {
  try {
    sessionStorage.setItem(INTERNAL_NAV_FLAG, '1');
  } catch {
    // Storage unavailable (private mode / disabled) — treat as no in-app history.
  }
}

/**
 * Whether an in-app navigation has happened this tab session, so a back action
 * has an in-app entry to return to instead of exiting the PWA. Fresh deeplinks,
 * shared links, and PWA launches start with no flag and fall back to a tab.
 */
export function hasInternalHistory(): boolean {
  try {
    return sessionStorage.getItem(INTERNAL_NAV_FLAG) === '1';
  } catch {
    return false;
  }
}
