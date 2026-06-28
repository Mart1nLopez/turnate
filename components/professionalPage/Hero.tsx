'use client';

import Image from 'next/image';
import { Professional } from '@/types';
import { useParallax } from '@/hooks/useParallax';
import { PUBLIC_TEXT, pluralize } from '@/lib/vocabulary';
import HeroBackground from '@/components/hero/HeroBackground';
import HeroOverlay from '@/components/hero/HeroOverlay';
import HeroAvatar from '@/components/hero/HeroAvatar';
import AccentRule from '@/components/hero/AccentRule';
import HeroActions from '@/components/hero/HeroActions';

interface HeroProps {
  professional: Professional;
  slug: string;
  averageRating?: number;
  reviewCount?: number;
  servicesCount?: number;
}

export default function Hero({
  professional,
  slug,
  averageRating = 0,
  reviewCount = 0,
  servicesCount = 0,
}: HeroProps) {
  const coverImage    = professional.carrusel_images?.[0]?.url ?? null;
  const galleryImages = professional.carrusel_images ?? [];
  const parallaxRef   = useParallax(!!coverImage);

  const hasReviews  = reviewCount > 0 && averageRating > 0;
  const hasServices = servicesCount > 0;
  const hasLocation = !!professional.location;
  const hasMapUrl   = !!professional.map_embed_url;
  const hasMetadata = hasReviews || hasServices || hasLocation;

  return (
    <>
      <section
        id="hero"
        className="relative w-full min-h-[65vh] sm:min-h-[70vh] flex items-end overflow-hidden"
      >
        <HeroBackground coverUrl={coverImage} parallaxRef={parallaxRef} />
        <HeroOverlay visible={!!coverImage} />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 md:px-16 pb-10 sm:pb-14 md:pb-20 pt-28">
          <HeroAvatar
            imageUrl={professional.profile_image}
            name={professional.name}
            shape="circle"
            sizeClass="w-12 h-12 sm:w-16 sm:h-16"
          />

          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.04] mb-4 break-words turnate-animate"
            style={
              { color: 'var(--theme-text)', '--delay': '80ms' } as React.CSSProperties
            }
          >
            {professional.name}
          </h1>

          <AccentRule />

          {(hasReviews || hasServices) && (
            <p
              className="text-sm mb-1.5 turnate-animate"
              style={
                {
                  color: 'var(--theme-muted)',
                  '--delay': '160ms',
                } as React.CSSProperties
              }
            >
              {hasReviews && (
                <>
                  <span style={{ color: 'var(--theme-accent)' }}>
                    ★ {averageRating.toFixed(1)}
                  </span>
                  {' · '}
                  {reviewCount} {pluralize(reviewCount, PUBLIC_TEXT.units.review)}
                </>
              )}
              {hasReviews && hasServices && ' · '}
              {hasServices &&
                `${servicesCount} ${pluralize(servicesCount, PUBLIC_TEXT.units.service)}`}
            </p>
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
              📍 {professional.location}
              {hasMapUrl && (
                <>
                  {' · '}
                  <a
                    href="#contactos"
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
              label: PUBLIC_TEXT.hero.bookNow,
              href: `/${slug}/agendar`,
            }}
            secondary={{
              label: PUBLIC_TEXT.hero.viewServices,
              href: '#servicios',
            }}
            microcopy={PUBLIC_TEXT.hero.microcopy.professional}
            hasMetadata={hasMetadata}
          />
        </div>
      </section>

      {/* ── GALLERY ─────────────────────────────────────────────────────── */}
      {galleryImages.length > 0 && (
        <section
          className="py-16 sm:py-20 px-6"
          style={{ background: 'var(--theme-bg)' }}
          aria-label="Galería de trabajos"
        >
          <div className="max-w-6xl mx-auto">
            <div className="mb-10 sm:mb-12">
              <p
                className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
                style={{ color: 'var(--theme-accent)' }}
              >
                Galería
              </p>
              <h2
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: 'var(--theme-text)' }}
              >
                Nuestro trabajo
              </h2>
              <div
                className="w-10 h-px mt-4"
                style={{ background: 'var(--theme-accent)', opacity: 0.45 }}
                aria-hidden="true"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {galleryImages.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-2xl"
                  style={{ border: '1px solid var(--theme-border)' }}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `Trabajo ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 400px"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
