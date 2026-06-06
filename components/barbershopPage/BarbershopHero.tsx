import Image from 'next/image';
import { BarbershopPublicProfile } from '@/types';

interface BarbershopHeroProps {
  barbershop: BarbershopPublicProfile;
}

export default function BarbershopHero({ barbershop }: BarbershopHeroProps) {
  const initial  = barbershop.name.charAt(0).toUpperCase();
  const hasCover = !!barbershop.cover_image_url;

  return (
    <section className="relative w-full min-h-[100dvh] overflow-hidden flex items-end">

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
          {/* Gradient overlay — theme-derived; dark themes go to ~opaque at bottom */}
          <div
            className="absolute inset-0"
            style={{ background: 'var(--bb-overlay)' }}
            aria-hidden="true"
          />
        </>
      ) : (
        /* Elegant fallback — uses theme bg + subtle accent glows */
        <div
          className="absolute inset-0"
          style={{ background: 'var(--bb-bg)' }}
          aria-hidden="true"
        >
          {/* Top-left accent glow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 20% 25%, var(--bb-accent-sub) 0%, transparent 55%)',
            }}
          />
          {/* Bottom-right accent glow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 80% 80%, var(--bb-accent-sub) 0%, transparent 45%)',
              opacity: 0.6,
            }}
          />
          {/* Very faint diagonal texture */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, var(--bb-accent) 0px, var(--bb-accent) 1px, transparent 1px, transparent 72px)',
            }}
          />
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full px-6 sm:px-10 md:px-16 pb-16 sm:pb-20 md:pb-28 max-w-5xl mx-auto">

        {/* Logo / Initial badge */}
        <div className="mb-6 sm:mb-8">
          {barbershop.logo_url ? (
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0"
              style={{
                boxShadow: '0 0 0 2px var(--bb-accent-ring), 0 16px 40px rgba(0,0,0,0.5)',
              }}
            >
              <Image
                src={barbershop.logo_url}
                alt={`Logo de ${barbershop.name}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          ) : (
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background:  'var(--bb-card)',
                boxShadow:   '0 0 0 2px var(--bb-accent-ring), 0 16px 40px rgba(0,0,0,0.5)',
              }}
            >
              <span
                className="text-2xl sm:text-3xl font-bold select-none"
                style={{ color: 'var(--bb-accent)' }}
              >
                {initial}
              </span>
            </div>
          )}
        </div>

        {/* Eyebrow label */}
        <p
          className="text-xs font-semibold tracking-[0.22em] uppercase mb-3"
          style={{ color: 'var(--bb-accent)' }}
        >
          Barbería Premium
        </p>

        {/* Barbershop name */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.04] mb-5 break-words"
          style={{ color: 'var(--bb-text)' }}
        >
          {barbershop.name}
        </h1>

        {/* Description */}
        {barbershop.description && (
          <p
            className="text-base sm:text-lg leading-relaxed max-w-xl mb-10 break-words"
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
              background:    'var(--bb-accent)',
              color:         'var(--bb-accent-fg)',
              borderRadius:  'var(--bb-radius)',
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-30"
        aria-hidden="true"
        style={{ color: 'var(--bb-text)' }}
      >
        <svg
          width="18"
          height="18"
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
