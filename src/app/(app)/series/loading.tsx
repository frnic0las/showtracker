import { SeriesStaticChrome } from '@/components/series/SeriesStaticChrome';

const SKELETON_ITEMS = [
  { caption: 'w-[80%]', subcaption: 'w-[50%]' },
  { caption: 'w-[70%]', subcaption: 'w-[55%]' },
  { caption: 'w-[85%]', subcaption: 'w-[45%]' },
  { caption: 'w-[60%]', subcaption: 'w-[50%]' },
  { caption: 'w-[75%]', subcaption: 'w-[40%]' },
  { caption: 'w-[65%]', subcaption: 'w-[55%]' },
];

/**
 * Route-level loading skeleton for the Series page: static chrome plus a
 * skeleton poster grid under the "Continue watching" title.
 */
export default function SeriesLoading() {
  return (
    <SeriesStaticChrome>
      <h2 className="px-4 pt-4 pb-2 text-[20px] font-semibold tracking-tight text-text-primary">
        Continue watching
      </h2>

      <div className="grid grid-cols-3 gap-x-3 gap-y-4 px-4">
        {SKELETON_ITEMS.map((item, index) => (
          <div key={index}>
            <div className="aspect-[2/3] animate-pulse rounded-md bg-bg-secondary" />
            <div className={`mt-2 h-3 animate-pulse rounded bg-bg-secondary ${item.caption}`} />
            <div className={`mt-1 h-3 animate-pulse rounded bg-bg-secondary ${item.subcaption}`} />
          </div>
        ))}
      </div>
    </SeriesStaticChrome>
  );
}
