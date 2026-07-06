/**
 * Route-level loading skeleton for the Profile page: static header plus a
 * centered pulse block while the stats load.
 */
export default function ProfileLoading() {
  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <h1 className="text-[34px] font-bold tracking-tight text-text-primary">Profile</h1>
      </header>

      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-bg-secondary" />
      </div>
    </div>
  );
}
