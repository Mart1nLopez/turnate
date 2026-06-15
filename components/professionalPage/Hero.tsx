'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Professional } from '@/types';

interface HeroProps {
  professional: Professional;
  slug: string;
}

export default function Hero({ professional, slug }: HeroProps) {
  const initial       = professional.name.charAt(0).toUpperCase();
  const coverImage    = professional.carrusel_images?.[0]?.url ?? null;
  const galleryImages = professional.carrusel_images ?? [];

  return (
    <>
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative w-full min-h-[75vh] flex items-end overflow-hidden"
      >
        {/* Background */}
        {coverImage ? (
          <>
            <Image
              src={coverImage}
              alt=""
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
            {/* Overlay — derived from theme var so every theme gets correct gradient */}
            <div
              className="absolute inset-0"
              style={{ background: 'var(--pp-overlay)' }}
              aria-hidden="true"
            />
          </>
        ) : (
          /* Elegant dark fallback with ambient accent glows */
          <div className="absolute inset-0" style={{ background: 'var(--pp-bg)' }} aria-hidden="true">
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 15% 30%, var(--pp-accent-sub) 0%, transparent 52%)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 85% 75%, var(--pp-accent-sub) 0%, transparent 45%)',
                opacity: 0.55,
              }}
            />
          </div>
        )}

        {/* Content — editorial, anchored at bottom */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 md:px-16 pb-14 sm:pb-18 md:pb-24 pt-20">

          {/* Profile photo */}
          <div className="mb-6 sm:mb-7">
            {professional.profile_image ? (
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex-shrink-0"
                style={{
                  boxShadow: '0 0 0 2px var(--pp-accent-ring), 0 12px 32px rgba(0,0,0,0.55)',
                }}
              >
                <Image
                  src={professional.profile_image}
                  alt={`Foto de ${professional.name}`}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--pp-surface)',
                  boxShadow: '0 0 0 2px var(--pp-accent-ring), 0 12px 32px rgba(0,0,0,0.55)',
                }}
              >
                <span
                  className="text-2xl sm:text-3xl font-bold select-none"
                  style={{ color: 'var(--pp-accent)' }}
                >
                  {initial}
                </span>
              </div>
            )}
          </div>

          {/* Eyebrow */}
          <p
            className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
            style={{ color: 'var(--pp-accent)' }}
          >
            Profesional
          </p>

          {/* Thin accent divider */}
          <div
            className="w-10 h-px mb-5"
            style={{ background: 'var(--pp-accent)', opacity: 0.5 }}
            aria-hidden="true"
          />

          {/* Name */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.04] mb-4 break-words"
            style={{ color: 'var(--pp-text)' }}
          >
            {professional.name}
          </h1>

          {/* Bio */}
          {professional.bio && (
            <p
              className="text-base sm:text-lg leading-relaxed max-w-lg mb-9 break-words"
              style={{ color: 'var(--pp-muted)' }}
            >
              {professional.bio}
            </p>
          )}

          {/* CTA */}
          <Link
            href={`/${slug}/agendar`}
            className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{
              background:   'var(--pp-accent)',
              color:        'var(--pp-accent-fg)',
              borderRadius: 'var(--pp-radius)',
            }}
          >
            Reservar ahora
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-25"
          aria-hidden="true"
          style={{ color: 'var(--pp-text)' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ── GALLERY ─────────────────────────────────────────────────────────── */}
      {/* Only rendered when the professional has uploaded their own photos */}
      {galleryImages.length > 0 && (
        <section
          className="py-16 sm:py-20 px-6"
          style={{ background: 'var(--pp-bg)' }}
          aria-label="Galería de trabajos"
        >
          <div className="max-w-6xl mx-auto">

            {/* Section header */}
            <div className="mb-10 sm:mb-12">
              <p
                className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
                style={{ color: 'var(--pp-accent)' }}
              >
                Galería
              </p>
              <h2
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: 'var(--pp-text)' }}
              >
                Nuestro trabajo
              </h2>
              <div
                className="w-10 h-px mt-4"
                style={{ background: 'var(--pp-accent)', opacity: 0.45 }}
                aria-hidden="true"
              />
            </div>

            {/* Photo grid — 2 cols mobile, 3 cols tablet+ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {galleryImages.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-2xl"
                  style={{ border: '1px solid var(--pp-border)' }}
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
