import { NavigationTracker } from '@/components/NavigationTracker';
import { TimezoneSync } from '@/components/TimezoneSync';
import { BottomNav } from '@/components/ui/BottomNav';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[430px] flex-1 flex-col bg-bg-primary">
      <main className="flex-1 pb-[calc(49px+env(safe-area-inset-bottom))]">{children}</main>
      <NavigationTracker />
      <TimezoneSync />
      <BottomNav />
    </div>
  );
}
