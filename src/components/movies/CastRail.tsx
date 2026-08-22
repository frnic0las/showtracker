import Image from 'next/image';
import { posterUrl } from '@/lib/tmdb/images';
import type { MovieCastMember } from '@/types/movies';

interface CastRailProps {
  cast: MovieCastMember[];
}

/**
 * Horizontal cast rail for the movie detail page: top billed cast as
 * 64px circular avatars, deliberately cut off at the right edge so the
 * horizontal scroll is discoverable. Informational only — names are not
 * tappable, there is no person page. A missing profile photo keeps the
 * `bg-bg-secondary` circle, the same rule as a missing poster.
 */
export function CastRail({ cast }: CastRailProps) {
  return (
    <div
      role="region"
      aria-label="Cast"
      tabIndex={0}
      className="flex gap-3 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:none]"
    >
      {cast.map((member) => {
        const photo = posterUrl(member.profilePath, 'w185');
        return (
          <div key={member.creditId} className="w-[72px] shrink-0 text-center">
            <div className="mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full bg-bg-secondary">
              {photo ? (
                <Image src={photo} alt="" width={64} height={64} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <p className="truncate text-[13px] font-semibold leading-tight text-text-primary">
              {member.name}
            </p>
            {member.character ? (
              <p className="mt-0.5 truncate text-xs leading-tight text-text-secondary">
                {member.character}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
