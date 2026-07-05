import Image from 'next/image';
import Link from 'next/link';
import { posterUrl } from '@/lib/tmdb/images';

interface SeriesPosterCardProps {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  subcaption: string;
  badge?: number;
}

/**
 * A single poster grid item: series poster with an optional unwatched-count
 * badge, title, and subcaption. The whole card links to the series detail page.
 */
export function SeriesPosterCard({
  tmdbId,
  title,
  posterPath,
  subcaption,
  badge,
}: SeriesPosterCardProps) {
  const poster = posterUrl(posterPath, 'w185');

  return (
    <Link href={`/series/${tmdbId}`} className="min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-bg-secondary">
        {poster ? (
          <Image src={poster} alt="" fill sizes="33vw" className="object-cover" />
        ) : null}
        {badge && badge > 0 ? (
          <span className="absolute right-2 top-2 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white shadow">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 truncate text-[13px] font-semibold text-text-primary">{title}</p>
      <p className="truncate text-xs text-text-secondary">{subcaption}</p>
    </Link>
  );
}
