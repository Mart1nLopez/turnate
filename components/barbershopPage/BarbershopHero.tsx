import Image from 'next/image';
import { BarbershopPublicProfile } from '@/types';

interface BarbershopHeroProps {
  barbershop: BarbershopPublicProfile;
}

export default function BarbershopHero({ barbershop }: BarbershopHeroProps) {
  const initial  = barbershop.name.charAt(0).toUpperCase();
  const hasCover = !!barbershop.cover_image_url;

  return (
    <section className="relative w-full min-h-[70vh] overflow-hidden flex items-end">

      {/* ── Background ─────────────────────────────────────────────────────── */}
      {hasCover ? (
        <>
          <Image
            src={barbershop.cover_image_url!}
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          {/* Overlay starts near the top so the image never dominates */}
          <div
            className="absolute inset-0"
            style={{ background: 'var(--bb-overlay)' }}
            aria-hidden="true"
          />
        </>
      ) : (
        /* Elegant no-cover fallback with ambient accent glows */
        <div
          className="absolute inset-0"
          style={{ background: 'var(--bb-bg)' }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 15% 30%, var(--bb-accent-sub) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 85% 75%, var(--bb-accent-sub) 0%, transparent 45%)',
              opacity: 0.55,
            }}
          />
          {/* Subtle diagonal texture */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, var(--bb-accent) 0px, var(--bb-accent) 1px, transparent 1px, transparent 72px)',
            }}
          />
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full px-6 sm:px-10 md:px-16 pb-12 sm:pb-16 md:pb-20 pt-16 max-w-5xl mx-auto">

        {/* Logo / Initial badge */}
        <div className="mb-6 sm:mb-7">
          {barbershop.logo_url ? (
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden flex-shrink-0"
              style={{
                boxShadow: '0 0 0 2px var(--bb-accent-ring), 0 12px 32px rgba(0,0,0,0.5)',
              }}
            >
              <Image
                src={barbershop.logo_url}
                alt={`Logo de ${barbershop.name}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--bb-card)',
                boxShadow: '0 0 0 2px var(--bb-accent-ring), 0 12px 32px rgba(0,0,0,0.5)',
              }}
            >
              <span
                className="text-xl sm:text-2xl font-bold select-none"
                style={{ color: 'var(--bb-accent)' }}
              >
                {initial}
              </span>
            </div>
          )}
        </div>

        {/* Eyebrow label */}
        <p
          className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
          style={{ color: 'var(--bb-accent)' }}
        >
          Barbería Premium
        </p>

        {/* Thin accent divider — editorial signature */}
        <div
          className="w-10 h-px mb-5"
          style={{ background: 'var(--bb-accent)', opacity: 0.55 }}
          aria-hidden="true"
        />

        {/* Barbershop name */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.04] mb-4 break-words"
          style={{ color: 'var(--bb-text)' }}
        >
          {barbershop.name}
        </h1>

        {/* Description */}
        {barbershop.description && (
          <p
            className="text-base sm:text-lg leading-relaxed max-w-lg mb-9 break-words"
            style={{ color: 'var(--bb-muted)' }}
          >
            {barbershop.description}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="#equipo"
            className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{
              background:   'var(--bb-accent)',
              color:        'var(--bb-accent-fg)',
              borderRadius: 'var(--bb-radius)',
            }}
          >
            Ver profesionales
          </a>
          <a
            href="#info"
            className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] bg-[var(--bb-ghost-bg)] hover:bg-[var(--bb-ghost-hv)]"
            style={{
              border:       '1px solid var(--bb-ghost-br)',
              color:        'var(--bb-text)',
              borderRadius: 'var(--bb-radius)',
            }}
          >
            Información
          </a>
        </div>
      </div>

      {/* ── Scroll indicator ───────────────────────────────────────────────── */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-25"
        aria-hidden="true"
        style={{ color: 'var(--bb-text)' }}
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
  );
}
