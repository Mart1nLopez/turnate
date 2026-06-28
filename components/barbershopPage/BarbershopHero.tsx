'use client';

import { BarbershopPublicProfile, TeamMember } from '@/types';
import { useParallax } from '@/hooks/useParallax';
import { PUBLIC_TEXT, pluralize } from '@/lib/vocabulary';
import HeroBackground from '@/components/hero/HeroBackground';
import HeroOverlay from '@/components/hero/HeroOverlay';
import HeroAvatar from '@/components/hero/HeroAvatar';
import AccentRule from '@/components/hero/AccentRule';
import HeroActions from '@/components/hero/HeroActions';
import StackedAvatars from '@/components/hero/StackedAvatars';

interface Props {
  barbershop: BarbershopPublicProfile;
  team: TeamMember[];
}

export default function BarbershopHero({ barbershop, team }: Props) {
  const hasCover    = !!barbershop.cover_image_url;
  const parallaxRef = useParallax(hasCover);

  const locationParts = [barbershop.city, barbershop.region].filter(Boolean);
  const locationLabel =
    locationParts.join(', ') || barbershop.address || barbershop.location || null;
  const hasLocation = !!locationLabel;
  const hasMapUrl   = !!barbershop.map_embed_url;
  const hasTeam     = team.length > 0;
  const hasMetadata = hasTeam || hasLocation;

  const avatarMembers = team.map((m) => ({
    id:       m.memberId,
    name:     m.professional.name,
    imageUrl: m.professional.profileImage,
  }));

  return (
    <section
      id="hero"
      className="relative w-full min-h-[65vh] sm:min-h-[70vh] overflow-hidden flex items-end"
    >
      <HeroBackground
        coverUrl={barbershop.cover_image_url ?? null}
        parallaxRef={parallaxRef}
      />
      <HeroOverlay visible={hasCover} />

      <div className="relative z-10 w-full px-6 sm:px-10 md:px-16 pb-10 sm:pb-14 md:pb-20 pt-28 max-w-5xl mx-auto">
        <HeroAvatar
          imageUrl={barbershop.logo_url ?? undefined}
          name={barbershop.name}
          shape="rounded"
          sizeClass="w-11 h-11 sm:w-13 sm:h-13"
        />

        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.04] mb-4 break-words turnate-animate"
          style={
            { color: 'var(--theme-text)', '--delay': '80ms' } as React.CSSProperties
          }
        >
          {barbershop.name}
        </h1>

        <AccentRule />

        {hasTeam && (
          <div
            className="flex items-center gap-3 mb-1.5 turnate-animate"
            style={
              {
                color: 'var(--theme-muted)',
                '--delay': '160ms',
              } as React.CSSProperties
            }
          >
            <p className="text-sm">
              <span style={{ color: 'var(--theme-accent)' }}>
                {team.length}
              </span>{' '}
              {pluralize(team.length, PUBLIC_TEXT.units.professional)}
            </p>

            <StackedAvatars members={avatarMembers} />

            <span
              className="hidden md:inline text-sm"
              style={{ color: 'var(--theme-muted)' }}
            >
              {team
                .slice(0, 3)
                .map((m) => m.professional.name.split(' ')[0])
                .join(', ')}
              {team.length > 3 && ` +${team.length - 3}`}
            </span>
          </div>
        )}

        {hasLocation && (
          <p
            className="text-sm turnate-animate"
            style={
              {
                color: 'var(--theme-muted)',
                '--delay': '220ms',
              } as React.CSSProperties
            }
          >
            📍 {locationLabel}
            {hasMapUrl && (
              <>
                {' · '}
                <a
                  href="#info"
                  className="transition-opacity hover:opacity-80"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  {PUBLIC_TEXT.hero.viewMap} →
                </a>
              </>
            )}
          </p>
        )}

        <HeroActions
          primary={{
            label: PUBLIC_TEXT.hero.viewProfessionals,
            href: '#equipo',
          }}
          secondary={{
            label: PUBLIC_TEXT.hero.contact,
            href: '#info',
          }}
          microcopy={PUBLIC_TEXT.hero.microcopy.barbershop}
          hasMetadata={hasMetadata}
        />
      </div>
    </section>
  );
}
